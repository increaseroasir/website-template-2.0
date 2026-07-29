/**
 * Meta Conversions API — multi-event template (Lead → Purchase).
 *
 * Lead          → action_source=website, value 0, event_source_url set, shared event_id w/ Pixel
 * QualifiedLead / Schedule / Showed / Purchase → action_source=system_generated
 *   (no event_source_url; offline path always uses a fresh event_id)
 *
 * Env:
 *   META_PIXEL_ID, META_CAPI_ACCESS_TOKEN (required to send)
 *   META_TEST_EVENT_CODE or TEST_EVENT_CODE (optional Events Manager test code)
 *   META_VALUE_QUALIFIED | META_VALUE_SCHEDULE | META_VALUE_SHOWED (defaults 75/300/600)
 *   LEAD_CURRENCY (default USD)
 */
const META_GRAPH = 'https://graph.facebook.com/v21.0';

const ALLOWED_EVENTS = {
  Lead: { action_source: 'website', defaultValue: 0 },
  QualifiedLead: { action_source: 'system_generated', defaultValue: 75 },
  Schedule: { action_source: 'system_generated', defaultValue: 300 },
  Showed: { action_source: 'system_generated', defaultValue: 600 },
  Purchase: { action_source: 'system_generated', defaultValue: null } // must pass value
};

async function sha256(value) {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return '';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  return digits;
}

/* Trim before testing (WTV-050) — see sheetsConfigured. */
export function metaCapiConfigured(env) {
  return !!(String(env.META_CAPI_ACCESS_TOKEN || '').trim() && String(env.META_PIXEL_ID || '').trim());
}

export function defaultValueForEvent(env, eventName) {
  const key = {
    Lead: 'META_VALUE_LEAD',
    QualifiedLead: 'META_VALUE_QUALIFIED',
    Schedule: 'META_VALUE_SCHEDULE',
    Showed: 'META_VALUE_SHOWED'
  }[eventName];
  if (eventName === 'Lead') {
    if (env.META_VALUE_LEAD !== undefined && env.META_VALUE_LEAD !== '') return Number(env.META_VALUE_LEAD);
    return 0;
  }
  if (key && env[key] !== undefined && env[key] !== '') return Number(env[key]);
  return ALLOWED_EVENTS[eventName]?.defaultValue;
}

/**
 * @param {object} opts — eventName, eventId?, uniqueEventId?, value?, fbp?, fbc?, originalMetaEventId?
 *   uniqueEventId:true → always mint a new UUID (offline CRM events; meta_event_id is linkage only)
 */
export async function sendMetaEvent(env, request, lead, opts = {}) {
  if (!metaCapiConfigured(env)) return { sent: false, reason: 'Meta CAPI not configured' };

  const eventName = opts.eventName || 'Lead';
  const spec = ALLOWED_EVENTS[eventName];
  if (!spec) return { sent: false, reason: 'Unsupported event_name: ' + eventName };

  const eventId = opts.uniqueEventId
    ? crypto.randomUUID()
    : (opts.eventId || lead.metaEventId || lead.submissionId || crypto.randomUUID());

  let value = opts.value;
  if (value === undefined || value === null || value === '') value = defaultValueForEvent(env, eventName);
  if (eventName === 'Purchase' && !(Number(value) > 0)) {
    return { sent: false, reason: 'Purchase requires a positive value' };
  }
  value = Number(value);
  if (!Number.isFinite(value)) value = 0;

  const phone = normalizePhone(lead.phone);
  const externalRaw = String(lead.externalId || lead.email || phone || '').trim().toLowerCase();
  const userData = {
    em: [await sha256(lead.email)].filter(Boolean),
    ph: [await sha256(phone)].filter(Boolean),
    fn: [await sha256(lead.firstName)].filter(Boolean),
    ln: [await sha256(lead.lastName && lead.lastName !== '.' ? lead.lastName : '')].filter(Boolean),
    external_id: [await sha256(externalRaw)].filter(Boolean),
    client_ip_address: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '',
    client_user_agent: request.headers.get('User-Agent') || ''
  };
  const fbp = opts.fbp || lead.fbp || '';
  const fbc = opts.fbc || lead.fbc || '';
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const custom_data = {};
  if (value > 0) {
    custom_data.value = value;
    custom_data.currency = env.LEAD_CURRENCY || 'USD';
  }
  const contentName = lead.productName || lead.campaign || lead.source || '';
  const contentCategory = lead.campaign || lead.productCategory || '';
  if (contentName) custom_data.content_name = contentName;
  if (contentCategory) custom_data.content_category = contentCategory;
  /* Linkage only — never reused as this event's event_id on offline sends */
  const originalMeta = opts.originalMetaEventId || lead.metaEventId || '';
  if (opts.uniqueEventId && originalMeta) custom_data.meta_event_id = originalMeta;

  /* opts.actionSource overrides the spec default: the booking Worker sends
     Schedule as `website` (dedupes with the browser pixel via shared event_id)
     while the GHL offline path keeps `system_generated` for phone/manual
     bookings. */
  const resolvedActionSource = opts.actionSource || spec.action_source;
  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: resolvedActionSource,
    user_data: userData
  };
  /* Website events keep event_source_url; system_generated omits it (Meta CRM pattern). */
  if (resolvedActionSource === 'website') {
    event.event_source_url = lead.pageUrl || lead.eventSourceUrl || env.CLIENT_WEBSITE_URL || '';
  }
  if (Object.keys(custom_data).length) event.custom_data = custom_data;

  const payload = { data: [event], access_token: String(env.META_CAPI_ACCESS_TOKEN || '').trim() };
  const testCode = env.META_TEST_EVENT_CODE || env.TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  const res = await fetch(META_GRAPH + '/' + String(env.META_PIXEL_ID || '').trim() + '/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  return {
    sent: res.ok && body.events_received > 0,
    status: res.status,
    events_received: body.events_received || 0,
    fbtrace_id: body.fbtrace_id || '',
    event_id: eventId,
    meta_event_id_linkage: originalMeta || undefined,
    event_name: eventName,
    action_source: spec.action_source,
    value: value > 0 ? value : 0
  };
}

/** Website Lead (value 0) — shares event_id with Pixel for dedupe. */
export async function sendLeadEvent(env, request, lead, meta = {}) {
  return sendMetaEvent(env, request, lead, {
    eventName: 'Lead',
    eventId: meta.eventId,
    fbp: meta.fbp,
    fbc: meta.fbc,
    value: 0
  });
}
