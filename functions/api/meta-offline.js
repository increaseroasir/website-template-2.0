/**
 * POST /api/meta-offline
 *
 * Called from a GHL workflow on Opportunity Stage Changed (or manual tools)
 * to fire CRM-stage Meta CAPI events: QualifiedLead | Schedule | Showed | Purchase.
 *
 * Auth: Authorization: Bearer <META_OFFLINE_WEBHOOK_SECRET>
 *   or header X-Meta-Offline-Secret: <META_OFFLINE_WEBHOOK_SECRET>
 *
 * Unknown event_name / stage → HTTP 200 + { skipped:true } (GHL retries non-2xx).
 * Each offline send mints a fresh event_id; contact.meta_event_id is linkage only.
 *
 * ONBOARDING_REQUIRED — see docs/GHL_META_OFFLINE_WORKFLOW.md
 */
import { corsHeaders, jsonResponse } from '../lib/cors.js';
import { sendMetaEvent, metaCapiConfigured } from '../lib/meta-capi.js';
import { normalizePhone } from '../lib/validate.js';

const STAGE_EVENTS = { QualifiedLead: true, Schedule: true, Showed: true, Purchase: true };

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.env, context.request) });
}

function authorized(env, request) {
  const secret = env.META_OFFLINE_WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: 'ONBOARDING_REQUIRED: META_OFFLINE_WEBHOOK_SECRET not set' };
  const bearer = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const header = (request.headers.get('X-Meta-Offline-Secret') || '').trim();
  if (bearer === secret || header === secret) return { ok: true };
  return { ok: false, error: 'Unauthorized' };
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const auth = authorized(env, request);
  if (!auth.ok) return jsonResponse({ ok: false, error: auth.error }, auth.error.startsWith('ONBOARDING') ? 503 : 401, env, request);

  if (!metaCapiConfigured(env)) {
    return jsonResponse({ ok: false, error: 'ONBOARDING_REQUIRED: META_PIXEL_ID + META_CAPI_ACCESS_TOKEN' }, 503, env, request);
  }

  let body;
  try { body = await request.json(); } catch (err) {
    return jsonResponse({ ok: false, error: 'Invalid JSON.' }, 400, env, request);
  }

  const eventName = String(body.event_name || body.eventName || body.stage || '').trim();
  if (!STAGE_EVENTS[eventName]) {
    console.warn('meta-offline skipped unknown event_name/stage:', eventName || '(empty)');
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: 'unknown_event_name',
      event_name: eventName || null,
      allowed: Object.keys(STAGE_EVENTS)
    }, 200, env, request);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const phone = normalizePhone(body.phone || body.phone_number || '');
  if (!email && phone.length < 10) {
    return jsonResponse({ ok: false, error: 'email or phone required.' }, 400, env, request);
  }

  const originalMetaEventId = String(body.meta_event_id || body.metaEventId || '').trim();
  const lead = {
    firstName: String(body.first_name || body.firstName || '').trim(),
    lastName: String(body.last_name || body.lastName || '').trim(),
    email,
    phone,
    pageUrl: String(body.event_source_url || body.eventSourceUrl || body.page_url || '').trim(),
    /* GHL resolves empty contact fields to the literal string "null" in
       webhook bodies — strip it so Meta never matches on a bogus browser ID. */
    fbp: String(body.fbp || '').trim().replace(/^null$/i, ''),
    fbc: String(body.fbc || '').trim().replace(/^null$/i, ''),
    metaEventId: originalMetaEventId,
    externalId: String(body.external_id || body.externalId || email || phone || '').trim().toLowerCase(),
    submissionId: originalMetaEventId || crypto.randomUUID(),
    productName: String(body.product_name || body.content_name || '').trim(),
    campaign: String(body.campaign || '').trim(),
    source: 'ghl-offline',
    productCategory: String(body.product_category || '').trim()
  };

  let value = body.value;
  if (value === undefined || value === null || value === '') value = body.actual_sale_value;

  try {
    const result = await sendMetaEvent(env, request, lead, {
      eventName,
      uniqueEventId: true,
      originalMetaEventId,
      value,
      fbp: lead.fbp,
      fbc: lead.fbc
    });
    if (!result.sent) {
      return jsonResponse({ ok: false, error: result.reason || 'Meta CAPI did not accept the event', meta: result }, 502, env, request);
    }
    return jsonResponse({
      ok: true,
      event_name: result.event_name,
      event_id: result.event_id,
      meta_event_id_linkage: result.meta_event_id_linkage || originalMetaEventId || null,
      action_source: result.action_source,
      value: result.value,
      contact_id: body.contact_id || body.contactId || '',
      fbtrace_id: result.fbtrace_id
    }, 200, env, request);
  } catch (err) {
    console.error('meta-offline failed:', err.message || err);
    return jsonResponse({ ok: false, error: 'Meta offline send failed.' }, 500, env, request);
  }
}
