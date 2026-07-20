import { corsHeaders, jsonResponse } from '../lib/cors.js';
import { validateLeadPayload, verifyTurnstile } from '../lib/validate.js';
import { appendLeadVault, appendMissedLead, findRecentDuplicate, sheetsConfigured, updateLeadVaultRow } from '../lib/sheets.js';
import { upsertContact, ghlConfigured } from '../lib/ghl.js';
import { sendFailureAlert } from '../lib/alert.js';
import { sendLeadEvent } from '../lib/meta-capi.js';

export async function onRequestOptions(context) { return new Response(null, { status: 204, headers: corsHeaders(context.env, context.request) }); }
export async function onRequestPost(context) {
  const env = context.env, request = context.request;
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, env, request);
  if (!sheetsConfigured(env)) return jsonResponse({ ok: false, error: 'Lead vault is not configured yet. Please call the store.' }, 503, env, request);
  let body;
  try { body = await request.json(); } catch (err) { return jsonResponse({ ok: false, error: 'Invalid JSON.' }, 400, env, request); }
  const validated = validateLeadPayload(body);
  if (!validated.ok) return jsonResponse({ ok: false, error: validated.error }, 400, env, request);
  const lead = validated.data;
  const turnstile = await verifyTurnstile(body.turnstile_token || body.turnstileToken, env, request);
  if (!turnstile.ok) return jsonResponse({ ok: false, error: turnstile.error }, 400, env, request);

  let duplicateMatch = null;
  try { duplicateMatch = await findRecentDuplicate(env, lead.email, lead.phone); } catch (err) { console.error('findRecentDuplicate failed:', err.message || err); }
  const isSentDuplicate = duplicateMatch && (duplicateMatch.status === 'SENT' || duplicateMatch.status === 'DUPLICATE' || duplicateMatch.status === 'PENDING');
  const isFailedRetry = duplicateMatch && duplicateMatch.status === 'FAILED';
  let vaultRange = '';
  try {
    const pendingAppend = await appendLeadVault(env, lead, isSentDuplicate ? 'DUPLICATE' : (isFailedRetry ? 'RETRY' : 'PENDING'), '', isSentDuplicate ? 'Duplicate email/phone within 24h' : '');
    vaultRange = pendingAppend.updates && pendingAppend.updates.updatedRange ? pendingAppend.updates.updatedRange : '';
  } catch (err) { return jsonResponse({ ok: false, error: 'We could not save your request. Please call the store.' }, 500, env, request); }

  let ghlResult = { ok: false, error: 'GHL not configured' };
  if (isSentDuplicate && !lead.productName) ghlResult = { ok: false, error: 'Skipped duplicate', retryable: false };
  else if (ghlConfigured(env)) ghlResult = await upsertContact(env, lead);
  const ghlStatus = isSentDuplicate && !lead.productName ? 'DUPLICATE' : (ghlResult.ok ? 'SENT' : 'FAILED');
  if (vaultRange) { try { await updateLeadVaultRow(env, vaultRange, lead, ghlStatus, ghlResult.contactId || '', ghlResult.error || ''); } catch (err) {} }
  if (!ghlResult.ok && ghlStatus !== 'DUPLICATE') { try { await appendMissedLead(env, lead, ghlResult.error || 'Unknown GHL error'); } catch (err) {} try { await sendFailureAlert(env, lead, ghlResult.error || 'Unknown GHL error'); } catch (err) {} }

  const shouldFireMeta = !isSentDuplicate && !isFailedRetry && ghlResult.ok;
  let metaResult = { sent: false };
  if (shouldFireMeta) { try { metaResult = await sendLeadEvent(env, request, lead, { eventId: body.meta_event_id || body.metaEventId || lead.submissionId, fbp: body.fbp || '', fbc: body.fbc || '' }); } catch (err) {} }
  return jsonResponse({ ok: true, submission_id: lead.submissionId, duplicate: !!isSentDuplicate, ghl_ok: ghlResult.ok, fire_meta: shouldFireMeta, ghl_contact_id: ghlResult.contactId || undefined, meta_capi: metaResult.sent === true, meta_event_id: shouldFireMeta ? (metaResult.event_id || body.meta_event_id || lead.submissionId) : undefined, message: isSentDuplicate ? 'We already have your info.' : 'Thank you. Your request has been received.' }, 200, env, request);
}
