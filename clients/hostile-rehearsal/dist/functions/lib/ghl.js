const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';
const CUSTOM_FIELD_CACHE_MS = 5 * 60 * 1000;
let customFieldCache = {};
function ghlHeaders(token) { return { Authorization: 'Bearer ' + token, Version: GHL_VERSION, Accept: 'application/json', 'Content-Type': 'application/json' }; }
function uniqueTags(tags) { const seen = {}; return tags.filter(tag => { if (!tag || seen[tag]) return false; seen[tag] = true; return true; }); }
function normalizeKey(key) { key = String(key || '').trim(); return key.indexOf('contact.') === 0 ? key.slice('contact.'.length) : key; }
function isMetaAttribution(lead) { const source = String(lead.utmSource || '').toLowerCase(); const medium = String(lead.utmMedium || '').toLowerCase(); return !!(lead.fbclid || lead.fbc || ['facebook','fb','meta','instagram','ig','threads'].includes(source) || ((source.includes('facebook') || source.includes('instagram') || source.includes('meta')) && (!medium || ['paid','cpc','ppc','social'].includes(medium)))); }
function sourceTagForLead(lead) { if (lead.source === 'inbound-call') return 'src-inbound-call'; return isMetaAttribution(lead) || lead.source === 'meta-lead' ? 'src-meta' : 'src-organic'; }
function baseTags(env) { return String(env.GHL_BASE_TAGS || '').split(',').map(s => s.trim()).filter(Boolean); }
function tagsForLead(env, lead) {
  let tags = [sourceTagForLead(lead)].concat(baseTags(env));
  if (lead.productSlug || (lead.productPageUrl || lead.pageUrl || '').includes('/active-inventory/')) tags.push('productlead');
  if (lead.modelInterestTag) tags.push(lead.modelInterestTag);
  if (lead.inventoryStatusTag) tags.push(lead.inventoryStatusTag);
  if (Array.isArray(lead.productGhlTags)) tags = tags.concat(lead.productGhlTags);
  if (lead.campaign) tags.push('Campaign - ' + lead.campaign);
  if (lead.formIntent) tags.push('Intent - ' + lead.formIntent);
  return uniqueTags(tags);
}
function customFieldsForLead(lead) {
  const entries = [
    ['financing_interest', lead.financingInterest], ['contact_message', lead.message], ['product_interest', lead.productName], ['product_slug', lead.productSlug], ['product_id', lead.productId], ['product_category', lead.productCategory], ['product_page_url', lead.productPageUrl], ['inventory_status', lead.inventoryStatus], ['available_quantity', typeof lead.availableQuantity === 'number' ? String(lead.availableQuantity) : ''], ['inventory_status_tag', lead.inventoryStatusTag], ['lead_source', lead.leadSource], ['campaign', lead.campaign], ['model_interest_tag', lead.modelInterestTag], ['form_intent', lead.formIntent], ['submission_timestamp', lead.timestamp], ['estimated_retail_price', lead.estimatedRetailPrice], ['our_price', lead.ourPrice], ['monthly_payment', lead.monthlyPayment], ['lead_source_page', lead.pageUrl], ['landing_page_url', lead.landingPageUrl], ['referrer_url', lead.referrerUrl], ['traffic_channel', lead.trafficChannel], ['utm_source', lead.utmSource], ['utm_medium', lead.utmMedium], ['utm_campaign', lead.utmCampaign], ['utm_content', lead.utmContent], ['utm_term', lead.utmTerm], ['fbclid', lead.fbclid], ['gclid', lead.gclid], ['msclkid', lead.msclkid]
  ];
  return entries.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, field_value]) => ({ key, field_value }));
}
function buildContactPayload(env, lead, locationId, forCreate) {
  const payload = { firstName: lead.firstName, lastName: lead.lastName || '.', email: lead.email, phone: '+1' + lead.phone, source: lead.leadSource || ((env.CLIENT_NAME || 'Dealer Website') + ' — ' + lead.source), tags: tagsForLead(env, lead) };
  if (forCreate) payload.locationId = locationId;
  payload.customFields = customFieldsForLead(lead);
  return payload;
}
async function resolveCustomFields(env, locationId, customFields) {
  if (!customFields.length) return [];
  const cacheKey = locationId;
  const cached = customFieldCache[cacheKey];
  let fields;
  if (cached && Date.now() - cached.ts < CUSTOM_FIELD_CACHE_MS) fields = cached.fields;
  else {
    const res = await fetch(GHL_BASE + '/locations/' + locationId + '/customFields', { headers: ghlHeaders(env.GHL_API_TOKEN) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('GHL custom fields lookup failed: ' + (data.message || res.status));
    fields = data.customFields || data.fields || [];
    customFieldCache[cacheKey] = { ts: Date.now(), fields };
  }
  const byKey = {};
  fields.forEach(field => { byKey[normalizeKey(field.fieldKey || field.key || field.name)] = field.id; });
  return customFields.map(field => byKey[normalizeKey(field.key)] ? { id: byKey[normalizeKey(field.key)], field_value: field.field_value } : field);
}
async function searchContact(env, locationId, lead) {
  const query = encodeURIComponent(lead.email || lead.phone || '');
  if (!query) return null;
  const res = await fetch(GHL_BASE + '/contacts/search/duplicate?locationId=' + encodeURIComponent(locationId) + '&email=' + encodeURIComponent(lead.email) + '&number=' + encodeURIComponent('+1' + lead.phone), { headers: ghlHeaders(env.GHL_API_TOKEN) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data.contact || (data.contacts && data.contacts[0]) || null;
}
export function ghlConfigured(env) { return !!(env.GHL_API_TOKEN && env.GHL_LOCATION_ID); }
export async function upsertContact(env, lead) {
  if (!ghlConfigured(env)) return { ok: false, error: 'GHL not configured' };
  const locationId = env.GHL_LOCATION_ID;
  try {
    const existing = await searchContact(env, locationId, lead);
    const payload = buildContactPayload(env, lead, locationId, !existing);
    payload.customFields = await resolveCustomFields(env, locationId, payload.customFields || []);
    const endpoint = existing && existing.id ? GHL_BASE + '/contacts/' + existing.id : GHL_BASE + '/contacts/';
    const method = existing && existing.id ? 'PUT' : 'POST';
    if (method === 'PUT') delete payload.locationId;
    const res = await fetch(endpoint, { method, headers: ghlHeaders(env.GHL_API_TOKEN), body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: data.message || data.error || 'GHL request failed' };
    return { ok: true, contactId: (data.contact && data.contact.id) || data.id || (existing && existing.id) || '' };
  } catch (err) { return { ok: false, error: err.message || String(err) }; }
}
