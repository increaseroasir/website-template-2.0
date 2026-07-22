import { googleAccessToken, requiredEnv } from './lib/google-service-account.mjs';
import { upsertContact } from '../functions/lib/ghl.js';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
const range = process.env.MISSED_LEADS_RANGE || "'Missed Leads'!A2:AI";

requiredEnv([
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
  'GHL_API_TOKEN',
  'GHL_LOCATION_ID'
]);

async function sheets(path, options = {}) {
  const token = await googleAccessToken(SHEETS_SCOPE);
  const res = await fetch(SHEETS_BASE + '/' + process.env.GOOGLE_SHEETS_ID + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error('Sheets API ' + res.status + ': ' + (data.error?.message || text));
  return data;
}

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || 'Unknown', lastName: parts.slice(1).join(' ') || '.' };
}

function leadFromRow(row) {
  const name = splitName(row[3]);
  return {
    submissionId: row[0] || '',
    source: row[2] || 'missed-lead-reimport',
    fullName: row[3] || '',
    firstName: name.firstName,
    lastName: name.lastName,
    email: row[4] || '',
    phone: String(row[5] || '').replace(/\D/g, '').slice(-10),
    financingInterest: row[6] || '',
    pageUrl: row[7] || '',
    trafficChannel: row[11] || '',
    landingPageUrl: row[12] || '',
    referrerUrl: row[13] || '',
    utmSource: row[14] || '',
    utmMedium: row[15] || '',
    utmCampaign: row[16] || '',
    utmContent: row[17] || '',
    utmTerm: row[18] || '',
    fbclid: row[19] || '',
    gclid: row[20] || '',
    msclkid: row[21] || '',
    productName: row[22] || '',
    productSlug: row[23] || '',
    productId: row[24] || '',
    productCategory: row[25] || '',
    productPageUrl: row[26] || '',
    inventoryStatus: row[27] || '',
    availableQuantity: Number(row[28] || 0),
    inventoryStatusTag: row[29] || '',
    leadSource: row[30] || '',
    campaign: row[31] || '',
    modelInterestTag: row[32] || '',
    formIntent: row[33] || '',
    timestamp: row[34] || new Date().toISOString()
  };
}

function targetCell(rowIndex, column) {
  return "'Missed Leads'!" + column + rowIndex;
}

const rows = (await sheets('/values/' + encodeURIComponent(range))).values || [];
const results = [];

for (let i = 0; i < rows.length; i++) {
  const rowNumber = i + 2;
  const row = rows[i];
  if (!row || !row.length) continue;
  const status = String(row[8] || '').toUpperCase();
  if (status && status !== 'FAILED' && status !== 'PENDING') continue;
  const lead = leadFromRow(row);
  if (!lead.phone && !lead.email) {
    results.push({ rowNumber, ok: false, error: 'No phone or email' });
    continue;
  }
  if (DRY_RUN) {
    results.push({ rowNumber, ok: true, dryRun: true, lead: lead.fullName || lead.phone || lead.email });
    continue;
  }
  const result = await upsertContact(process.env, lead);
  results.push({ rowNumber, ...result });
  await sheets('/values:batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: targetCell(rowNumber, 'I'), values: [[result.ok ? 'REIMPORTED' : 'FAILED']] },
        { range: targetCell(rowNumber, 'J'), values: [[result.contactId || '']] },
        { range: targetCell(rowNumber, 'K'), values: [[result.error || '']] }
      ]
    })
  });
}

console.log(JSON.stringify({ ok: true, dryRun: DRY_RUN, checkedRows: rows.length, results }, null, 2));
