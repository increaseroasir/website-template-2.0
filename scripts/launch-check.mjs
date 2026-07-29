import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const requiredFiles = [
  'client.config.js',
  'wrangler.toml',
  'client.fulfillment.schema.json',
  'tracking.manifest.json',
  'verification.checklist.md',
  'functions/api/lead.js',
  'functions/api/inventory.js',
  'functions/api/admin.js'
];

const requiredClientConfigValues = [
  'CLIENT_NAME',
  'CLIENT_LEGAL_NAME',
  'CLIENT_MARKET',
  'CLIENT_PHONE',
  'CLIENT_PHONE_E164',
  'CLIENT_ADDRESS',
  'CLIENT_MAP_URL',
  'CLIENT_WEBSITE_URL',
  'CLIENT_STORAGE_PREFIX',
  'META_PIXEL_ID',
  'GA4_ID',
  'CLARITY_ID'
];

const requiredWranglerValues = [
  'CLOUDFLARE_PAGES_PROJECT',
  'D1_DATABASE_NAME',
  'D1_DATABASE_ID',
  'R2_BUCKET_NAME',
  'ALLOWED_ORIGIN',
  'CLIENT_NAME',
  'CLIENT_WEBSITE_URL',
  'CLIENT_PHONE',
  'CLIENT_PHONE_E164',
  'R2_PUBLIC_BUCKET_ID'
];

const requiredSecretNames = [
  'GHL_API_TOKEN',
  'GHL_LOCATION_ID',
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
  'META_CAPI_ACCESS_TOKEN',
  'META_PIXEL_ID',
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
  'ALERT_EMAIL'
];

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(file) {
  return readFileSync(file, 'utf8');
}

function hasUnresolvedToken(text, token) {
  return text.includes('{{' + token) || text.includes('{{' + token + '}}');
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'pipe', encoding: 'utf8' });
  if (result.status !== 0) {
    fail([command + ' ' + args.join(' ') + ' failed', result.stdout, result.stderr].filter(Boolean).join('\n'));
  }
  return result;
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail('Missing required file: ' + file);
}

run('node', ['scripts/check-fulfillment-artifacts.mjs']);
run('node', ['scripts/check-template-guard.mjs']);

if (existsSync('client.config.js')) {
  const config = read('client.config.js');
  for (const token of requiredClientConfigValues) {
    if (hasUnresolvedToken(config, token)) fail('client.config.js still has unresolved token: ' + token);
  }
}

if (existsSync('wrangler.toml')) {
  const wrangler = read('wrangler.toml');
  for (const token of requiredWranglerValues) {
    if (hasUnresolvedToken(wrangler, token)) fail('wrangler.toml still has unresolved token: ' + token);
  }
  // UNCONFIGURED resolves the token, so the loop above passes. It is a legitimate
  // deliberate state (TVD), but it disables admin image upload, so say so.
  if (/R2_PUBLIC_BUCKET_ID\s*=\s*"UNCONFIGURED"/.test(wrangler)) {
    warn('R2_PUBLIC_BUCKET_ID is the UNCONFIGURED placeholder. Admin image uploads will be refused with a 503 until public access is enabled on the R2 bucket and the real bucket ID is set. Launch is possible; adding inventory photos through the admin panel is not.');
  }
}

run('node', ['scripts/scan-placeholders.mjs', '--launch']);

const missingSecrets = requiredSecretNames.filter((name) => !process.env[name]);
if (missingSecrets.length) {
  warn('These secrets are not present in the local shell. If running against Cloudflare, verify with `wrangler pages secret list`: ' + missingSecrets.join(', '));
}

async function checkUrl(baseUrl) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const urls = [
    cleanBase + '/',
    cleanBase + '/inventory.html',
    cleanBase + '/active-inventory/',
    cleanBase + '/contact.html',
    cleanBase + '/thank-you.html',
    cleanBase + '/api/inventory'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'IncreaseROASLaunchCheck/1.0' } });
      if (!res.ok) fail(url + ' returned HTTP ' + res.status);
      const text = await res.text();
      if (/\{\{[^}]+\}\}/.test(text)) fail(url + ' contains unresolved template placeholders.');
      if (url.endsWith('/api/inventory')) {
        const data = JSON.parse(text);
        if (!data.ok || !Array.isArray(data.products)) fail('/api/inventory did not return { ok: true, products: [] }.');
      }
    } catch (error) {
      fail(url + ' check failed: ' + error.message);
    }
  }
}

const liveUrlArg = process.argv.find((arg) => arg.startsWith('--url='));
const liveUrl = liveUrlArg ? liveUrlArg.slice('--url='.length) : process.env.LAUNCH_CHECK_URL;
if (liveUrl) {
  await checkUrl(liveUrl);
  run('node', ['scripts/admin-inventory-smoke.mjs', '--url=' + liveUrl]);
} else {
  warn('No --url or LAUNCH_CHECK_URL provided, so live route/API checks were skipped.');
}

if (warnings.length) {
  console.warn('\nWarnings:');
  for (const message of warnings) console.warn('- ' + message);
}

if (failures.length) {
  console.error('\nLaunch check failed:');
  for (const message of failures) console.error('- ' + message);
  process.exit(1);
}

console.log('Launch check passed.');
