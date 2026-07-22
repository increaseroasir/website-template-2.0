const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';
const createMissing = process.argv.includes('--create');

const requiredFields = [
  'product_interest',
  'product_slug',
  'product_id',
  'product_category',
  'product_page_url',
  'inventory_status',
  'available_quantity',
  'inventory_status_tag',
  'lead_source',
  'campaign',
  'model_interest_tag',
  'form_intent',
  'submission_timestamp',
  'estimated_retail_price',
  'our_price',
  'monthly_payment',
  'lead_source_page',
  'landing_page_url',
  'referrer_url',
  'traffic_channel',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'msclkid'
];

function requireEnv(name) {
  if (!process.env[name]) throw new Error('Missing required env var: ' + name);
  return process.env[name];
}

function normalizeKey(key) {
  return String(key || '').trim().replace(/^contact\./, '').toLowerCase();
}

function titleFromKey(key) {
  return key.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function headers() {
  return {
    Authorization: 'Bearer ' + requireEnv('GHL_API_TOKEN'),
    Version: GHL_VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

async function ghl(path, options = {}) {
  const res = await fetch(GHL_BASE + path, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('GHL ' + res.status + ': ' + (data.message || data.error || JSON.stringify(data)));
  return data;
}

const locationId = requireEnv('GHL_LOCATION_ID');
const data = await ghl('/locations/' + encodeURIComponent(locationId) + '/customFields');
const fields = data.customFields || data.fields || [];
const present = new Set(fields.map(field => normalizeKey(field.fieldKey || field.key || field.name)));
const missing = requiredFields.filter(field => !present.has(normalizeKey(field)));

const created = [];
if (missing.length && createMissing) {
  for (const field of missing) {
    const createdField = await ghl('/locations/' + encodeURIComponent(locationId) + '/customFields', {
      method: 'POST',
      body: JSON.stringify({
        name: titleFromKey(field),
        dataType: 'TEXT',
        placeholder: field,
        acceptedFormat: [],
        position: 0
      })
    });
    created.push(createdField.customField || createdField.field || createdField);
  }
}

if (missing.length && !createMissing) {
  console.error('Missing GHL custom fields: ' + missing.join(', '));
  console.error('Run `npm run ghl:fields:create` after setting GHL_API_TOKEN and GHL_LOCATION_ID to create them.');
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  locationId,
  requiredCount: requiredFields.length,
  existingCount: fields.length,
  missing,
  createdCount: created.length
}, null, 2));
