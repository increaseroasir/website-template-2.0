/**
 * /api/booking — native showroom-visit booking against the client's GHL calendar.
 *
 * GET  → next ~10 days of real free slots from GHL (calendar API, Version 2021-04-15).
 *        Calendar unconfigured or upstream error → { ok:true, bookable:false } so the
 *        page falls back to request-mode (never a dead end, never a lost lead).
 * POST → validate + Turnstile → upsert contact in GHL (dedupe-merge on email/phone,
 *        tags: src-*, "Intent - Showroom Visit", "Campaign - booking") → create the
 *        appointment. Appointment failure still returns ok with booked:false — the
 *        contact is captured and the store confirms by text. Leads are never dropped
 *        because a calendar write failed.
 *
 * Env: GHL_API_TOKEN + GHL_LOCATION_ID (existing secrets) + GHL_BOOKING_CALENDAR_ID
 *      (wrangler var; empty = request-mode).
 */
import { corsHeaders, jsonResponse } from '../lib/cors.js';
import { validateLeadPayload, verifyTurnstile } from '../lib/validate.js';
import { upsertContact, ghlConfigured } from '../lib/ghl.js';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const CALENDAR_VERSION = '2021-04-15'; // calendar endpoints use their own API version
const DAYS_AHEAD = 10;
const MAX_SLOTS_PER_DAY = 14;

function calHeaders(env) {
  return { Authorization: 'Bearer ' + env.GHL_API_TOKEN, Version: CALENDAR_VERSION, Accept: 'application/json', 'Content-Type': 'application/json' };
}
function bookable(env) { return ghlConfigured(env) && !!env.GHL_BOOKING_CALENDAR_ID; }

/* Raw free-slots fetch; returns [{ date, slots }] sorted, or throws. */
async function fetchFreeSlots(env, startMs, endMs) {
  const url = GHL_BASE + '/calendars/' + encodeURIComponent(env.GHL_BOOKING_CALENDAR_ID) +
    '/free-slots?startDate=' + startMs + '&endDate=' + endMs;
  const res = await fetch(url, { headers: calHeaders(env) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || ('free-slots HTTP ' + res.status));
  /* Response keys are dates ("2026-07-24": { slots: [ISO, ...] }) plus metadata. */
  return Object.entries(data)
    .filter(([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && value && Array.isArray(value.slots) && value.slots.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, slots: value.slots }));
}

/* After an appointment-create failure, decide whether the slot was simply
   taken (it vanished from free-slots) or something else broke. */
async function slotStillFree(env, slot) {
  try {
    const t = Date.parse(slot);
    if (!Number.isFinite(t)) return null;
    const days = await fetchFreeSlots(env, t - 60 * 60 * 1000, t + 24 * 60 * 60 * 1000);
    return days.some(day => day.slots.includes(slot));
  } catch (err) { return null; } // unknown — don't claim it was taken
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.env, context.request) });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!bookable(env)) return jsonResponse({ ok: true, bookable: false }, 200, env, request);

  /* 60s edge cache: dealer traffic never notices, but a bot hammering the
     page can't burn the location's GHL rate budget. */
  let cache = null, cacheKey = null;
  try {
    cache = caches.default;
    cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch (err) { /* Cache API unavailable (local dev) — fetch fresh */ }

  let response;
  try {
    const start = Date.now() + 60 * 60 * 1000; // nothing sooner than an hour out
    const end = Date.now() + DAYS_AHEAD * 24 * 60 * 60 * 1000;
    const days = (await fetchFreeSlots(env, start, end))
      .map(day => ({ date: day.date, slots: day.slots.slice(0, MAX_SLOTS_PER_DAY) }));
    response = days.length
      ? jsonResponse({ ok: true, bookable: true, days }, 200, env, request)
      : jsonResponse({ ok: true, bookable: false }, 200, env, request);
  } catch (err) {
    console.error('Booking slots fetch failed:', err.message || err);
    return jsonResponse({ ok: true, bookable: false }, 200, env, request); // fail open, never cached
  }
  try {
    if (cache && cacheKey) {
      const toCache = response.clone();
      toCache.headers.set('Cache-Control', 'public, max-age=60');
      context.waitUntil ? context.waitUntil(cache.put(cacheKey, toCache)) : await cache.put(cacheKey, toCache);
    }
  } catch (err) { /* caching is best-effort */ }
  return response;
}

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try { body = await request.json(); } catch (err) { return jsonResponse({ ok: false, error: 'Invalid JSON.' }, 400, env, request); }

  const validated = validateLeadPayload(body);
  if (!validated.ok) return jsonResponse({ ok: false, error: validated.error }, 400, env, request);
  const lead = validated.data;

  const turnstile = await verifyTurnstile(body.turnstile_token || body.turnstileToken, env, request);
  if (!turnstile.ok) return jsonResponse({ ok: false, error: turnstile.error }, 400, env, request);

  const slot = String(body.slot || '');
  const preferred = String(body.preferred_day || '');
  lead.source = lead.source || 'booking-page';
  lead.leadSource = lead.leadSource || 'booking-page';
  lead.formIntent = 'Showroom Visit';
  lead.campaign = lead.campaign || 'booking';
  if (!slot && preferred) lead.message = ('Preferred visit day: ' + preferred + '. ' + (lead.message || '')).trim();

  const contact = await upsertContact(env, lead);
  if (!contact.ok || !contact.contactId) {
    console.error('Booking contact upsert failed:', contact.error || contact.status);
    return jsonResponse({ ok: false, error: 'We could not save your request. Please call or text the store.' }, 502, env, request);
  }

  if (!slot || !bookable(env)) {
    return jsonResponse({ ok: true, booked: false, message: 'Request received — we will text you shortly to confirm your visit time.' }, 200, env, request);
  }

  try {
    const res = await fetch(GHL_BASE + '/calendars/events/appointments', {
      method: 'POST',
      headers: calHeaders(env),
      body: JSON.stringify({
        calendarId: env.GHL_BOOKING_CALENDAR_ID,
        locationId: env.GHL_LOCATION_ID,
        contactId: contact.contactId,
        startTime: slot,
        title: 'Showroom Visit — ' + (lead.firstName || 'Website') + (lead.lastName && lead.lastName !== '.' ? ' ' + lead.lastName : ''),
        appointmentStatus: 'confirmed'
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || ('appointment HTTP ' + res.status));
    return jsonResponse({ ok: true, booked: true, slot }, 200, env, request);
  } catch (err) {
    /* Contact is already captured with intent tags — nothing below can lose the lead. */
    console.error('Appointment create failed (lead captured):', err.message || err);
    const stillFree = await slotStillFree(env, slot);
    if (stillFree === false) {
      /* The slot vanished from free-slots → someone took it between page load
         and submit. Tell the visitor to pick another; resubmit merges cleanly. */
      return jsonResponse({ ok: true, booked: false, slotTaken: true }, 200, env, request);
    }
    return jsonResponse({ ok: true, booked: false, message: 'Request received — we will text you shortly to confirm your visit time.' }, 200, env, request);
  }
}
