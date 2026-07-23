const META_GRAPH = 'https://graph.facebook.com/v21.0';
async function sha256(value) { if (!value) return ''; const normalized = String(value).trim().toLowerCase(); if (!normalized) return ''; const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized)); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join(''); }
function normalizePhone(phone) { let digits = String(phone || '').replace(/\D/g, ''); if (digits.length === 10) digits = '1' + digits; return digits; }
export function metaCapiConfigured(env) { return !!(env.META_CAPI_ACCESS_TOKEN && env.META_PIXEL_ID); }
export async function sendLeadEvent(env, request, lead, meta) {
  if (!metaCapiConfigured(env)) return { sent: false, reason: 'Meta CAPI not configured' };
  const eventId = meta.eventId || lead.submissionId;
  const userData = { em: [await sha256(lead.email)].filter(Boolean), ph: [await sha256(normalizePhone(lead.phone))].filter(Boolean), client_ip_address: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '', client_user_agent: request.headers.get('User-Agent') || '' };
  if (meta.fbp) userData.fbp = meta.fbp;
  if (meta.fbc) userData.fbc = meta.fbc;
  const payload = { data: [{ event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), event_id: eventId, action_source: 'website', event_source_url: lead.pageUrl || env.CLIENT_WEBSITE_URL || '', user_data: userData, custom_data: { value: Number(env.LEAD_VALUE || 950), currency: env.LEAD_CURRENCY || 'USD', content_name: lead.productName || lead.campaign || lead.source, content_category: lead.campaign || lead.productCategory || '' } }], access_token: env.META_CAPI_ACCESS_TOKEN };
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE;
  const res = await fetch(META_GRAPH + '/' + env.META_PIXEL_ID + '/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const body = await res.json().catch(() => ({}));
  return { sent: res.ok && body.events_received > 0, status: res.status, events_received: body.events_received || 0, fbtrace_id: body.fbtrace_id || '', event_id: eventId };
}
