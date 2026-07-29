#!/usr/bin/env node
/**
 * Prove a deployment's integrations are actually wired, from inside it (WTV-047).
 *
 * A secret is NOT verified because the Cloudflare dashboard lists its key. The
 * API reports `"value": ""` for every secret_text binding, working or not, so a
 * declared key and a blank key are indistinguishable from outside. The only
 * authority is the Function itself, which is what /api/readiness reports.
 *
 * Usage:
 *   ADMIN_PASSWORD='...' node scripts/verify-runtime-secrets.mjs https://<host>
 *
 * Exit 0 only when every required integration reads present at that host.
 */

const target = process.argv[2];
const password = process.env.ADMIN_PASSWORD || '';

if (!target) {
  console.error('usage: ADMIN_PASSWORD=... node scripts/verify-runtime-secrets.mjs https://<deployment-host>');
  process.exit(2);
}
if (!password) {
  console.error('ADMIN_PASSWORD is required — /api/readiness is gated so readiness is not public.');
  process.exit(2);
}

const origin = target.replace(/\/+$/, '');
const url = origin + '/api/readiness';

let res;
let body;
try {
  res = await fetch(url, { headers: { 'x-admin-password': password } });
  body = await res.json();
} catch (err) {
  console.error(`FAIL  could not reach ${url}\n      ${err.message}`);
  process.exit(1);
}

if (res.status === 401) {
  console.error('FAIL  401 from /api/readiness — the ADMIN_PASSWORD supplied here does not match the one in that deployment.');
  process.exit(1);
}
if (!body || !Array.isArray(body.groups)) {
  console.error(`FAIL  unexpected response (HTTP ${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  process.exit(1);
}

const MARK = { present: 'ok     ', empty: 'EMPTY  ', missing: 'MISSING' };

console.log(`\nRuntime readiness — ${body.host}`);
console.log(`checked ${body.checkedAt}\n`);

for (const group of body.groups) {
  const verdict = group.ready ? 'PASS' : (group.required ? 'FAIL' : 'warn');
  console.log(`${verdict}  ${group.label}${group.required ? '' : '  (optional)'}`);
  for (const [name, state] of Object.entries(group.vars)) {
    if (state !== 'present' || !group.ready) console.log(`        ${MARK[state]}  ${name}`);
  }
}
console.log(`${body.bindings.DB === 'present' ? 'PASS' : 'FAIL'}  D1 binding (DB)`);

if (body.ok) {
  console.log('\nAll required integrations read non-empty inside this deployment.\n');
  process.exit(0);
}

console.error(`\nBLOCKED — ${body.blocking.join(', ')}`);
console.error(
  'An "EMPTY" variable is bound to the deployment but holds a blank or whitespace-only\n' +
  'value. It will look correctly configured in the Cloudflare dashboard. Re-set it with\n' +
  "  printf '%s' \"$VALUE\" | npx wrangler pages secret put NAME --project-name <project>\n" +
  'and never with `echo`, which appends a newline. Then REDEPLOY: Pages binds environment\n' +
  'variables at deploy time, so a saved value does not reach the running Function until\n' +
  'the next deployment.\n'
);
process.exit(1);
