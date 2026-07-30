import { corsHeaders, jsonResponse } from '../lib/cors.js';
import { validateLeadPayload } from '../lib/validate.js';
import { appendLeadVault, appendMissedLead, findRecentDuplicate, sheetsConfigured, updateLeadVaultRow } from '../lib/sheets.js';
import { upsertContact, ghlConfigured, ghlConfigError } from '../lib/ghl.js';
import { sendFailureAlert } from '../lib/alert.js';
import { sendLeadEvent } from '../lib/meta-capi.js';

function parseJson(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch (err) { return fallback; } }
function slugFromProductUrl(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/active-inventory\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  } catch (err) {
    const match = String(url || '').match(/\/active-inventory\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }
}
async function enrichLeadFromInventory(env, lead) {
  if (!env.DB) return lead;
  const slug = lead.productSlug || slugFromProductUrl(lead.productPageUrl || lead.pageUrl);
  if (!slug) return lead;
  try {
    const product = await env.DB.prepare('SELECT * FROM products WHERE slug = ? AND status != ?').bind(slug, 'deleted').first();
    if (!product) return lead;
    const tags = parseJson(product.ghl_tags, []);
    lead.productName = product.inventory_name || lead.productName;
    lead.productSlug = product.slug || lead.productSlug;
    lead.productId = String(product.id || lead.productId || '');
    lead.productCategory = product.category || lead.productCategory;
    lead.productPageUrl = lead.productPageUrl || ((env.CLIENT_WEBSITE_URL || '').replace(/\/$/, '') + '/active-inventory/' + encodeURIComponent(product.slug) + '/');
    lead.productImageUrl = product.primary_image || lead.productImageUrl;
    lead.inventoryStatus = product.status || lead.inventoryStatus;
    lead.availableQuantity = Number(product.quantity || lead.availableQuantity || 0);
    lead.inventoryStatusTag = tags.find(tag => /^Inventory Status -/.test(tag)) || lead.inventoryStatusTag;
    lead.modelInterestTag = 'Model Interest - ' + product.inventory_name;
    lead.productGhlTags = tags;
    lead.ourPrice = product.price ? String(product.price) : lead.ourPrice;
    lead.monthlyPayment = product.monthly_payment ? String(product.monthly_payment) : lead.monthlyPayment;
  } catch (err) {
    console.error('Inventory enrichment failed:', err.message || err);
  }
  return lead;
}

export async function onRequestOptions(context) { return new Response(null, { status: 204, headers: corsHeaders(context.env, context.request) }); }
export async function onRequestPost(context) {
  const env = context.env, request = context.request;
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, env, request);
  if (!sheetsConfigured(env)) return jsonResponse({ ok: false, error: 'Lead vault is not configured yet. Please call the store.' }, 503, env, request);
  let body;
  try { body = await request.json(); } catch (err) { return jsonResponse({ ok: false, error: 'Invalid JSON.' }, 400, env, request); }
  /* Financing funnel is phone-first (like booking): email is a nice-to-have,
     never a reason to reject a lead. All other forms require email client-side. */
  const validated = validateLeadPayload(body, { emailOptional: String(body.lead_source || '').toLowerCase().includes('financing') });
  if (!validated.ok) return jsonResponse({ ok: false, error: validated.error }, 400, env, request);
  const lead = validated.data;
  await enrichLeadFromInventory(env, lead);
  /* No captcha gate (TVD-025): spam control = honeypot + 24h dedupe. A security
     checker must never be able to block a customer lead. */

  let duplicateMatch = null;
  try { duplicateMatch = await findRecentDuplicate(env, lead.email, lead.phone); } catch (err) { console.error('findRecentDuplicate failed:', err.message || err); }
  const isSentDuplicate = duplicateMatch && (duplicateMatch.status === 'SENT' || duplicateMatch.status === 'DUPLICATE' || duplicateMatch.status === 'PENDING');
  const isFailedRetry = duplicateMatch && duplicateMatch.status === 'FAILED';
  let vaultRange = '';
  try {
    const pendingAppend = await appendLeadVault(env, lead, isSentDuplicate ? 'DUPLICATE' : (isFailedRetry ? 'RETRY' : 'PENDING'), '', isSentDuplicate ? 'Duplicate email/phone within 24h' : '');
    vaultRange = pendingAppend.updates && pendingAppend.updates.updatedRange ? pendingAppend.updates.updatedRange : '';
  } catch (err) { return jsonResponse({ ok: false, error: 'We could not save your request. Please call the store.' }, 500, env, request); }

  /* Default carries the NAMED missing variable, not a bare "not configured" —
     this string is what lands in the Lead Vault ghl_error column (WTV-045). */
  let ghlResult = { ok: false, error: ghlConfigError(env) };
  if (isSentDuplicate && !lead.productName) ghlResult = { ok: false, error: 'Skipped duplicate', retryable: false };
  else if (ghlConfigured(env)) ghlResult = await upsertContact(env, lead);
  const ghlStatus = isSentDuplicate && !lead.productName ? 'DUPLICATE' : (ghlResult.ok ? 'SENT' : 'FAILED');
  if (vaultRange) { try { await updateLeadVaultRow(env, vaultRange, lead, ghlStatus, ghlResult.contactId || '', ghlResult.error || ''); } catch (err) {} }
  if (!ghlResult.ok && ghlStatus !== 'DUPLICATE') { try { await appendMissedLead(env, lead, ghlResult.error || 'Unknown GHL error'); } catch (err) {} try { await sendFailureAlert(env, lead, ghlResult.error || 'Unknown GHL error'); } catch (err) {} }

  /* Deliberately NOT gated on ghlResult.ok: a CRM outage must not also erase the
     ad-platform conversion signal. The lead is already durable in the Lead Vault
     at this point, so Meta should learn about it whether or not GHL accepted it.
     Duplicate/retry suppression stays — that prevents double-counting one
     conversion, which is a different concern from CRM availability. */
  const shouldFireMeta = !isSentDuplicate && !isFailedRetry;
  let metaResult = { sent: false };
  if (shouldFireMeta) { try { metaResult = await sendLeadEvent(env, request, lead, { eventId: body.meta_event_id || body.metaEventId || lead.submissionId, fbp: body.fbp || '', fbc: body.fbc || '' }); } catch (err) {} }
  return jsonResponse({ ok: true, submission_id: lead.submissionId, duplicate: !!isSentDuplicate, ghl_ok: ghlResult.ok, fire_meta: shouldFireMeta, ghl_contact_id: ghlResult.contactId || undefined, meta_capi: metaResult.sent === true, meta_event_id: shouldFireMeta ? (metaResult.event_id || body.meta_event_id || lead.submissionId) : undefined, message: isSentDuplicate ? 'We already have your info.' : 'Thank you. Your request has been received.' }, 200, env, request);
}
