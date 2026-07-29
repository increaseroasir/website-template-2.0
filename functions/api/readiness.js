/**
 * Runtime readiness probe (WTV-047).
 *
 * Cloudflare will not read a secret back. Its API returns `"value": ""` for
 * EVERY secret_text binding, including ones that demonstrably work, so no
 * amount of control-plane inspection can tell a populated secret from a blank
 * one. That gap cost a day: Production declared GHL_API_TOKEN, every status
 * report said "configured", and the Function saw an empty string the whole time
 * while real leads failed their CRM handoff.
 *
 * The only component that can observe the truth is code running inside the
 * deployment. This endpoint is that code. It reports, per variable, whether the
 * runtime sees it as `missing` (not bound), `empty` (bound but blank or
 * whitespace) or `present` — and never the value, never its length, nothing
 * that narrows a guess.
 *
 * Gated on ADMIN_PASSWORD so readiness is not public reconnaissance.
 */

import { corsHeaders, jsonResponse } from '../lib/cors.js';

/* Length-independent comparison; a readiness probe should not leak the
   password one character at a time. */
function secretsMatch(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

/* missing = not bound at all. empty = bound but blank/whitespace — the exact
   state that masquerades as configured. present = usable. */
function varState(env, name) {
  const raw = env[name];
  if (raw === undefined || raw === null) return 'missing';
  return String(raw).trim() === '' ? 'empty' : 'present';
}

/* Bindings (D1, R2, KV) are objects, not strings — presence is all we can check. */
function bindingState(env, name) {
  return env[name] ? 'present' : 'missing';
}

const GROUPS = [
  { name: 'ghl', required: true, label: 'GoHighLevel CRM handoff', vars: ['GHL_API_TOKEN', 'GHL_LOCATION_ID'] },
  { name: 'lead_vault', required: true, label: 'Google Sheets Lead Vault', vars: ['GOOGLE_SHEETS_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'] },
  { name: 'meta_capi', required: true, label: 'Meta Conversions API', vars: ['META_CAPI_ACCESS_TOKEN', 'META_PIXEL_ID'] },
  { name: 'admin', required: true, label: 'Admin panel', vars: ['ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET'] },
  { name: 'cors', required: true, label: 'Form origin allow-list', vars: ['ALLOWED_ORIGIN'] },
  /* Optional: the booking page degrades to a contact form without a calendar,
     and offline conversions are a post-launch add. Reported so a silent
     downgrade is visible rather than discovered by a client. */
  { name: 'booking_calendar', required: false, label: 'Live booking slots', vars: ['GHL_BOOKING_CALENDAR_ID'] },
  { name: 'meta_offline', required: false, label: 'Offline conversions webhook', vars: ['META_OFFLINE_WEBHOOK_SECRET'] }
];

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.env, context.request) });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  /* An unset admin password cannot authenticate anything, and is itself a
     launch blocker — report that much without a credential. */
  if (String(env.ADMIN_PASSWORD || '').trim() === '') {
    return jsonResponse({
      ok: false,
      error: 'ADMIN_PASSWORD is not set in this deployment, so readiness cannot be authenticated. This is itself a launch blocker.'
    }, 503, env, request);
  }

  const supplied = request.headers.get('x-admin-password') || '';
  if (!secretsMatch(supplied.trim(), String(env.ADMIN_PASSWORD).trim())) {
    return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401, env, request);
  }

  const groups = GROUPS.map((group) => {
    const vars = {};
    for (const name of group.vars) vars[name] = varState(env, name);
    return {
      name: group.name,
      label: group.label,
      required: group.required,
      ready: group.vars.every((name) => vars[name] === 'present'),
      vars
    };
  });

  const bindings = { DB: bindingState(env, 'DB') };
  const blocking = groups.filter((g) => g.required && !g.ready).map((g) => g.name);
  if (bindings.DB !== 'present') blocking.push('d1_binding');

  return jsonResponse({
    ok: blocking.length === 0,
    /* Which deployment answered. Pages binds env vars at DEPLOY time, so a
       readiness result is only meaningful for the exact host that returned it —
       a pass on one hash says nothing about the next one. */
    host: new URL(request.url).host,
    checkedAt: new Date().toISOString(),
    blocking,
    groups,
    bindings
  }, blocking.length === 0 ? 200 : 503, env, request);
}
