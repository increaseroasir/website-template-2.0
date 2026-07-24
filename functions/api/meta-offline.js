/**
 * POST /api/meta-offline
 *
 * Called from a GHL workflow on Opportunity Stage Changed (or manual tools)
 * to fire CRM-stage Meta CAPI events: QualifiedLead | Schedule | Showed | Purchase.
 *
 * Auth: Authorization: Bearer <META_OFFLINE_WEBHOOK_SECRET>
 *   or header X-Meta-Offline-Secret: <META_OFFLINE_WEBHOOK_SECRET>
 *
 * Body (JSON):
 * {
 *   "event_name": "QualifiedLead" | "Schedule" | "Showed" | "Purchase",
 *   "value": 75,                    // required for Purchase; optional otherwise (env defaults)
 *   "email": "...",                 // and/or phone — for matching + hashing
 *   "phone": "...",
 *   "first_name": "...",
 *   "last_name": "...",
 *   "fbp": "{{contact.fbp}}",       // from GHL custom fields (persisted at lead time)
 *   "fbc": "{{contact.fbc}}",
 *   "meta_event_id": "{{contact.meta_event_id}}",  // optional; new UUID if omitted
 *   "event_source_url": "{{contact.event_source_url}}",
 *   "external_id": "{{contact.external_id}}",
 *   "contact_id": "..."             // optional audit only
 * }
 *
 * ONBOARDING_REQUIRED:
 *   - wrangler secret META_OFFLINE_WEBHOOK_SECRET
 *   - GHL custom fields: fbp, fbc, meta_event_id, event_source_url, external_id, store_pixel_id
 *   - GHL workflow → webhook to https://{{CLIENT_WEBSITE_URL}}/api/meta-offline
 *   See docs/GHL_META_OFFLINE_WORKFLOW.md
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

  const eventName = String(body.event_name || body.eventName || '').trim();
  if (!STAGE_EVENTS[eventName]) {
    return jsonResponse({ ok: false, error: 'event_name must be QualifiedLead, Schedule, Showed, or Purchase.' }, 400, env, request);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const phone = normalizePhone(body.phone || body.phone_number || '');
  if (!email && phone.length < 10) {
    return jsonResponse({ ok: false, error: 'email or phone required.' }, 400, env, request);
  }

  const lead = {
    firstName: String(body.first_name || body.firstName || '').trim(),
    lastName: String(body.last_name || body.lastName || '').trim(),
    email,
    phone,
    pageUrl: String(body.event_source_url || body.eventSourceUrl || body.page_url || env.CLIENT_WEBSITE_URL || '').trim(),
    fbp: String(body.fbp || '').trim(),
    fbc: String(body.fbc || '').trim(),
    metaEventId: String(body.meta_event_id || body.metaEventId || body.event_id || '').trim(),
    externalId: String(body.external_id || body.externalId || email || phone || '').trim().toLowerCase(),
    submissionId: String(body.meta_event_id || body.event_id || crypto.randomUUID()).trim(),
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
      eventId: lead.metaEventId || undefined,
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
