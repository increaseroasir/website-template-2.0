const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function base64UrlEncode(input) {
  const str = typeof input === 'string' ? input : String.fromCharCode.apply(null, new Uint8Array(input));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function getGoogleAccessToken(env) {
  const email = String(env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const privateKey = String(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');
  if (!email || !privateKey) throw new Error('Google Sheets credentials are not configured.');
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64UrlEncode(JSON.stringify({ iss: email, scope: SHEETS_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = header + '.' + claim;
  const key = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(privateKey), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const tokenRes = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + base64UrlEncode(signature) }) });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) throw new Error('Google token error: ' + (tokenData.error_description || tokenRes.status));
  return tokenData.access_token;
}
function leadRow(lead, ghlStatus, ghlContactId, ghlError) {
  return [lead.submissionId, new Date().toISOString(), lead.source, lead.fullName, lead.email, lead.phone, lead.financingInterest || '', lead.pageUrl || '', ghlStatus || 'PENDING', ghlContactId || '', ghlError || '', lead.trafficChannel || '', lead.landingPageUrl || '', lead.referrerUrl || '', lead.utmSource || '', lead.utmMedium || '', lead.utmCampaign || '', lead.utmContent || '', lead.utmTerm || '', lead.fbclid || '', lead.gclid || '', lead.msclkid || '', lead.productName || '', lead.productSlug || '', lead.productId || '', lead.productCategory || '', lead.productPageUrl || '', lead.inventoryStatus || '', lead.availableQuantity ? String(lead.availableQuantity) : '', lead.inventoryStatusTag || '', lead.leadSource || '', lead.campaign || '', lead.modelInterestTag || '', lead.formIntent || '', lead.timestamp || ''];
}
async function sheetsRequest(env, path, options) {
  const token = await getGoogleAccessToken(env);
  const sheetId = String(env.GOOGLE_SHEETS_ID || '').trim();
  if (!sheetId) throw new Error('GOOGLE_SHEETS_ID is ' + (env.GOOGLE_SHEETS_ID === undefined ? 'not bound to this deployment' : 'bound but empty') + '.');
  const res = await fetch(SHEETS_BASE + '/' + sheetId + path, Object.assign({}, options || {}, { headers: Object.assign({ Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, (options && options.headers) || {}) }));
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error('Sheets API ' + res.status + ': ' + (data.error && data.error.message ? data.error.message : text));
  return data;
}
/* Trim before testing (WTV-050). A whitespace-only secret is truthy, so an
   untrimmed check reports "configured" and then fails at Google with an opaque
   auth error instead of a config error — the same defect fixed in ghlConfigured. */
export function sheetsConfigured(env) { return !!(String(env.GOOGLE_SHEETS_ID || '').trim() && String(env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim() && String(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim()); }
/* Anchor table detection at A1 — never an open A:AI span (WTV-046).
   Sheets' append uses the supplied range to SEARCH FOR A TABLE, then writes
   after the last row of whichever table it finds, starting at THAT TABLE's
   first column. Given 'All Leads!A:AI' it can latch onto a stray block of data
   in the right-hand columns and align the write there: a live lead landed at
   column AF instead of A, invisible to every A:L/A:V reader downstream.
   'All Leads'!A1 pins the search to the table containing A1, so a row can only
   ever be appended starting at column A. */
async function appendAnchored(env, tab, row) {
  const result = await sheetsRequest(env, '/values/' + encodeURIComponent("'" + tab + "'!A1") + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS', { method: 'POST', body: JSON.stringify({ values: [row] }) });
  /* Trust nothing: assert the write actually landed in column A. Sheets reports
     where it wrote, and a drifted sheet is a client-data condition this code
     cannot repair — but it must never fail silently again. */
  const written = (result && result.updates && result.updates.updatedRange) || '';
  const cell = written.split('!').pop() || '';
  if (cell && !/^A\d/.test(cell)) {
    console.error('LEAD VAULT LAYOUT DRIFT: append landed at ' + written + ' instead of column A. ' +
      'A stray data block to the right of the canonical table is capturing appends; ' +
      'downstream A:L/A:V readers cannot see this row.');
  }
  return result;
}
export async function appendLeadVault(env, lead, status, contactId, error) { return appendAnchored(env, 'All Leads', leadRow(lead, status, contactId, error)); }
export async function updateLeadVaultRow(env, a1Range, lead, status, contactId, error) { return sheetsRequest(env, '/values/' + encodeURIComponent(a1Range) + '?valueInputOption=USER_ENTERED', { method: 'PUT', body: JSON.stringify({ values: [leadRow(lead, status, contactId, error)] }) }); }
export async function appendMissedLead(env, lead, error) { return appendAnchored(env, 'Missed Leads', leadRow(lead, 'FAILED', '', error)); }
function normEmail(email) { return String(email || '').trim().toLowerCase(); }
function normPhone(phone) { let digits = String(phone || '').replace(/\D/g, ''); if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1); return digits.slice(-10); }
export async function findRecentDuplicate(env, email, phone, windowMs = DUPLICATE_WINDOW_MS) {
  const targetEmail = normEmail(email), targetPhone = normPhone(phone);
  if (!targetEmail && !targetPhone) return null;
  const data = await sheetsRequest(env, '/values/' + encodeURIComponent("'All Leads'!A:V"));
  const rows = data.values || [];
  const cutoff = Date.now() - windowMs;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (!row || !row.length) continue;
    if (i === 0 && String(row[0] || '').toLowerCase() === 'submission_id') continue;
    const submittedAt = Date.parse(row[1] || '');
    if (!submittedAt || submittedAt < cutoff) continue;
    const matches = (targetEmail && normEmail(row[4] || '') === targetEmail) || (targetPhone && normPhone(row[5] || '') === targetPhone);
    if (!matches) continue;
    const status = String(row[8] || '').toUpperCase();
    if (status === 'SENT' || status === 'DUPLICATE' || status === 'PENDING') return { submittedAt: row[1], status };
    if (status === 'FAILED') return { submittedAt: row[1], status };
  }
  return null;
}
