#!/usr/bin/env node
/**
 * new-client.mjs — scaffold + validate a client build for website-template-2.0.
 * Part of the client-site-build skill. Node 18+, zero dependencies.
 * JSON to stdout, diagnostics to stderr. Non-interactive by design.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'wrangler.toml')) && (existsSync(join(dir, 'index.html')) || existsSync(join(dir, 'package.json')))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(skillRoot, '..', '..'); // legacy skills/client-site-build fallback
}
const repoRoot = findRepoRoot(skillRoot);
const clientsRoot = join(repoRoot, 'clients');
function templateSrc(name) {
  const candidates = [
    join(skillRoot, 'templates', name),
    join(skillRoot, 'assets', name),
    join(skillRoot, '..', 'dealer-site-intake', 'templates', name),
  ];
  return candidates.find(existsSync);
}

const HELP = `new-client.mjs — scaffold and validate client builds

USAGE
  node manus-skills/dealer-site-intake/scripts/new-client.mjs --init <name> [--force]
  node manus-skills/dealer-site-intake/scripts/new-client.mjs --validate <name> [--verbose] [--profile rush]
  node manus-skills/dealer-site-intake/scripts/new-client.mjs --help

MODES
  --init <name>      Create clients/<name>/ with intake.json, client.config.js,
                     tokens.env, and WIRING.md from the skill's templates.
                     Existing files are never overwritten without --force.
  --validate <name>  Check clients/<name>/ config + tokens against the template:
                     required keys, E164 phone, ISO offer date (or empty),
                     URL shapes, and which tokens would ship on defaults.
                     CRITICAL keys (name, phones, address/hours/market, GA4,
                     Meta Pixel, lead endpoint) HARD-FAIL
                     when empty — broken wiring / silent lead loss. Cosmetic
                     keys (logo, map embed, offer fields, clarity) may be
                     explicitly empty and only warn. GHL sub-account routing
                     lives in wrangler secrets: live-verify per wiring.md.

PROFILES
  --profile rush     Validate ONLY the REQUIRED intake tier (identity, phone
                     E164, address/hours/market, domain, financing, offer-or-
                     evergreen, lead endpoint, GA4, Pixel, GHL
                     location note, home hero). Everything else → warning +
                     fixList48h[] (also written into WIRING.md 48-HOUR FIX LIST).
                     Rush NEVER waives silent-lead-loss criticals or a missing
                     hero photo. See references/intake-sheet-mapping.md.

OUTPUT (stdout, JSON)
  --init      {"status":"created"|"exists","files":[...]}
  --validate  {"status":"PASS"|"FAIL","errors":[],"warnings":[],"defaults":[],
               "profile":"standard"|"rush","fixList48h":[...]}
              defaults[] = every template token that will ship on its |default.

EXIT CODES
  0  success / validation passed
  1  validation failed (errors[] is non-empty)
  2  bad usage (unknown flag, missing name, missing files)

EXAMPLES
  node manus-skills/dealer-site-intake/scripts/new-client.mjs --init smoky-mountain
  node manus-skills/dealer-site-intake/scripts/new-client.mjs --validate smoky-mountain
  node manus-skills/dealer-site-intake/scripts/new-client.mjs --validate smoky-mountain --profile rush
`;

function out(obj) { process.stdout.write(JSON.stringify(obj, null, 2) + '\n'); }
function die(msg, code) { process.stderr.write(msg + '\n'); process.exit(code); }

const args = process.argv.slice(2);
if (!args.length || args.includes('--help') || args.includes('-h')) {
  process.stdout.write(HELP);
  process.exit(args.length ? 0 : 2);
}

const force = args.includes('--force');
const verbose = args.includes('--verbose');
const profileIdx = args.indexOf('--profile');
const profile = profileIdx >= 0 ? String(args[profileIdx + 1] || '') : 'standard';
if (profileIdx >= 0 && profile !== 'rush' && profile !== 'standard') die(`Unknown --profile "${profile}". Use rush or omit.`, 2);
const mode = args.find(a => a === '--init' || a === '--validate');
const name = args[args.indexOf(mode) + 1];
if (!mode || !name || name.startsWith('--')) die('Missing mode or client name. See --help.', 2);
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) die(`Client name "${name}" must be lowercase alphanumeric/hyphens.`, 2);
const isRush = profile === 'rush';

const clientDir = join(clientsRoot, name);

/* ---------------- init ---------------- */
if (mode === '--init') {
  const pairs = [
    ['intake.template.json', 'intake.json'],
    ['client.config.template.js', 'client.config.js'],
    ['WIRING.template.md', 'WIRING.md'],
    ['tokens.env.template', 'tokens.env']
  ];
  mkdirSync(clientDir, { recursive: true });
  const files = [], skipped = [];
  for (const [src, dst] of pairs) {
    const srcPath = templateSrc(src);
    if (!srcPath) die(`Skill template missing: ${src}`, 2);
    const dstPath = join(clientDir, dst);
    if (existsSync(dstPath) && !force) { skipped.push(dst); continue; }
    writeFileSync(dstPath, readFileSync(srcPath, 'utf8'));
    files.push(dst);
  }
  out({ status: files.length ? 'created' : 'exists', clientDir: `clients/${name}`, files, skipped });
  process.exit(0);
}

/* ---------------- validate ---------------- */
const errors = [], warnings = [], defaults = [], fixList48h = [];

const configPath = join(clientDir, 'client.config.js');
if (!existsSync(configPath)) die(`No config at clients/${name}/client.config.js — run --init first.`, 2);

let cfg = {};
try {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(configPath, 'utf8'), sandbox, { filename: 'client.config.js' });
  cfg = sandbox.window.CLIENT_CONFIG || {};
} catch (e) {
  errors.push(`client.config.js does not evaluate: ${e.message}`);
}

/* tokens.env → KEY=value map (build-config.mjs reads these from process.env) */
const envTokens = {};
const envPath = join(clientDir, 'tokens.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[2] !== '' && !m[2].includes('{{')) envTokens[m[1]] = m[2];
  }
} else {
  warnings.push('No tokens.env — every content token will rely on config keys or |defaults.');
}

function val(v) { return v !== undefined && v !== null && String(v) !== '' && !String(v).includes('{{') ? String(v) : ''; }
function push48(what, owner, configKey) {
  fixList48h.push({ what, owner, config_key: configKey });
  warnings.push(`48h: ${what} (${configKey}) — owner ${owner}`);
}

/* CRITICAL / REQUIRED — empty = broken wiring or silent lead loss. HARD-FAIL.
   Rush uses the same silent-lead-loss set + domain + financing + offer + hero. */
const required = [
  ['client.name', cfg.client?.name],
  ['client.primaryPhone', cfg.client?.primaryPhone],
  ['client.primaryPhoneHref', cfg.client?.primaryPhoneHref],
  ['client.smsHref', cfg.client?.smsHref],
  ['client.address', cfg.client?.address],
  ['client.hours', cfg.client?.hours],
  ['client.market', cfg.client?.market],
  ['client.websiteUrl', cfg.client?.websiteUrl],
  ['offers.financing', cfg.offers?.financing],
  ['offers.primary', cfg.offers?.primary],
  ['tracking.ga4Id', cfg.tracking?.ga4Id],
  ['tracking.metaPixelId', cfg.tracking?.metaPixelId],
  ['endpoints.lead', cfg.endpoints?.lead],
  ['home.heroImage', cfg.home?.heroImage]
];
for (const [key, v] of required) if (!val(v)) errors.push(`CRITICAL config key empty or still tokenized (broken wiring / silent lead loss): ${key}`);

/* GHL location — not in client.config; standing note. Rush still requires the
   intake to name it (WIRING / wrangler) — warn into 48h only if intake.json
   also lacks it; never a silent waive of live-verify. */
const intakePath = join(clientDir, 'intake.json');
let intakeGhl = '';
if (existsSync(intakePath)) {
  try {
    const intake = JSON.parse(readFileSync(intakePath, 'utf8'));
    intakeGhl = val(intake?.wiring?.ghlSubAccountId);
  } catch { /* ignore */ }
}
if (!intakeGhl) {
  if (isRush) {
    errors.push('REQUIRED (rush): GHL location ID missing — set intake.json wiring.ghlSubAccountId (and wrangler GHL_LOCATION_ID secret). Rush does not waive CRM routing.');
  } else {
    warnings.push('GHL location ID not recorded in intake.json wiring.ghlSubAccountId — confirm wrangler GHL_LOCATION_ID before launch (REQUIRED tier).');
  }
}

if (!val(cfg.tracking?.clarityId)) {
  if (isRush) push48('Microsoft Clarity project ID', 'Client', 'tracking.clarityId');
  else warnings.push('tracking.clarityId empty — no session recordings (cosmetic; wiring gate B2 still expects it before launch).');
}
if (!val(cfg.tracking?.ghlExternalTracking)) {
  if (isRush) push48('GHL External Tracking URL', 'HTL', 'tracking.ghlExternalTracking');
  else warnings.push('tracking.ghlExternalTracking empty — no GHL session stitching/page-view attribution (cosmetic: attribution loss, not lead loss; add within 48h of launch, wiring ID #9).');
} else if (!/^https:\/\/\S+$/.test(String(cfg.tracking.ghlExternalTracking))) {
  errors.push(`tracking.ghlExternalTracking must be the https script src URL from the GHL External Tracking snippet, got "${cfg.tracking.ghlExternalTracking}"`);
}
if (!val(cfg.tracking?.ghlBookingCalendarId)) {
  if (isRush) push48('GHL Booking Calendar ID', 'Client', 'tracking.ghlBookingCalendarId');
  else warnings.push('tracking.ghlBookingCalendarId empty — /book/ runs in request-mode (no live slots; leads still captured and confirmed by text). Set the GHL calendar ID to enable real slot booking.');
}
if (!val(cfg.client?.logoUrl)) {
  if (isRush) push48('Logo (header)', 'Client', 'client.logoUrl');
}
if (!val(cfg.tracking?.gscVerification)) {
  if (isRush) push48('GSC verification token', 'Client', 'tracking.gscVerification');
}
if (isRush) {
  push48('Meta CAPI access token (Cloudflare secret)', 'HTL', 'secret:META_CAPI_ACCESS_TOKEN');
  push48('Meta offline webhook secret (Cloudflare secret)', 'HTL', 'secret:META_OFFLINE_WEBHOOK_SECRET');
  push48('GHL custom fields (6 Meta attribution keys)', 'HTL', 'ghl_fields:meta_attribution');
  push48('Opportunity Stage → /api/meta-offline workflow', 'HTL', 'workflow:meta-offline');
  push48('Events Manager custom conversions (QualifiedLead + Showed)', 'HTL', 'meta:custom_conversions');
  push48('GHL chat widget ID', 'HTL', 'wiring.ghlChatWidgetId');
  push48('Closebot source ID', 'HTL', 'wiring.closebotSourceId');
  push48('Category photos (non-hero) — gradient wells OK short-term', 'Client', 'assets.categoryPhotos');
} else {
  warnings.push('GHL sub-account routing (GHL_API_TOKEN, GHL_LOCATION_ID) are wrangler secrets this validator cannot read — they are launch-blocking LIVE verifications per references/wiring.md.');
  warnings.push('Meta CAPI secrets (META_CAPI_ACCESS_TOKEN, META_OFFLINE_WEBHOOK_SECRET) and META_PIXEL_ID env are Cloudflare secrets this validator cannot read — standing MANUAL per references/wiring.md (same class as GHL token). Offline CRM events also need the 6 GHL custom field keys + stage webhook (silent skip if missing = attribution loss).');
}

/* E164 */
const e164 = String(cfg.client?.primaryPhoneHref || '').replace(/^tel:/, '');
if (val(cfg.client?.primaryPhoneHref) && !/^\+1[2-9]\d{9}$/.test(e164))
  errors.push(`client.primaryPhoneHref must be tel:+1XXXXXXXXXX (E164), got "${cfg.client?.primaryPhoneHref}"`);
const sms = String(cfg.client?.smsHref || '').replace(/^sms:/, '');
if (val(cfg.client?.smsHref) && !/^\+1[2-9]\d{9}$/.test(sms))
  errors.push(`client.smsHref must be sms:+1XXXXXXXXXX (E164), got "${cfg.client?.smsHref}"`);

/* offer date: ISO with timezone, in the future — or explicitly empty (evergreen) */
const endsAt = val(cfg.offers?.endsAt);
if (endsAt) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:?\d{2})$/.test(endsAt))
    errors.push(`offers.endsAt must be ISO 8601 WITH timezone (e.g. 2026-08-01T23:59:59-05:00) or empty for evergreen, got "${endsAt}"`);
  else if (new Date(endsAt).getTime() < Date.now())
    errors.push(`offers.endsAt is in the past (${endsAt}) — stale countdown. Use a future date or empty (evergreen).`);
} else {
  warnings.push('offers.endsAt empty → evergreen mode (body.offer-static hides countdown UI). Confirm intended at Checkpoint 1.');
}

/* URL shapes */
for (const [key, v] of [['client.mapUrl', cfg.client?.mapUrl], ['client.websiteUrl', cfg.client?.websiteUrl], ['client.facebookUrl', cfg.client?.facebookUrl]]) {
  if (val(v) && !/^https?:\/\/\S+$/.test(String(v))) errors.push(`${key} is not a valid URL: "${v}"`);
}

/* hostile-value warnings (these break the pipe parser / attributes) */
function hostileScan(path, v) {
  if (!val(v)) return;
  if (String(v).includes('|')) warnings.push(`${path} contains "|" — safe in config, but NEVER put "|" in tokens.env values used inside {{TOKEN|default}} contexts.`);
}
(function walkCfg(obj, path) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v && typeof v === 'object') walkCfg(v, `${path}${k}.`);
    else hostileScan(`${path}${k}`, v);
  }
})(cfg, '');

/* token coverage: mirror build-config.mjs's map, then scan template HTML */
const configTokenMap = {
  CLIENT_NAME: cfg.client?.name, CLIENT_LEGAL_NAME: cfg.client?.legalName, CLIENT_MARKET: cfg.client?.market,
  CLIENT_TAGLINE: cfg.client?.tagline, CLIENT_PHONE: cfg.client?.primaryPhone, CLIENT_PHONE_E164: e164,
  CLIENT_ADDRESS: cfg.client?.address, CLIENT_MAP_URL: cfg.client?.mapUrl, CLIENT_HOURS: cfg.client?.hours,
  CLIENT_WEBSITE_URL: cfg.client?.websiteUrl, CLIENT_STORAGE_PREFIX: cfg.client?.storagePrefix,
  BRAND_BLUE: cfg.brand?.primary, BRAND_BLUE_DEEP: cfg.brand?.deep, BRAND_BLUE_NIGHT: cfg.brand?.night,
  BRAND_GOLD: cfg.brand?.accent, BRAND_RED: cfg.brand?.urgent,
  META_PIXEL_ID: cfg.tracking?.metaPixelId, GA4_ID: cfg.tracking?.ga4Id, CLARITY_ID: cfg.tracking?.clarityId,
  LEAD_VALUE: cfg.tracking?.leadValue, LEAD_CURRENCY: cfg.tracking?.leadCurrency,
  PRIMARY_OFFER: cfg.offers?.primary, FINANCING_PROMISE: cfg.offers?.financing, DELIVERY_PROMISE: cfg.offers?.delivery,
  OFFER_NAME: cfg.offers?.name, OFFER_HEADLINE: cfg.offers?.headline, OFFER_SHORT: cfg.offers?.short,
  OFFER_ENDS_LABEL: cfg.offers?.endsLabel, OFFER_ENDS_AT: cfg.offers?.endsAt,
  CLIENT_EMAIL: cfg.client?.email, CLIENT_LOGO_URL: cfg.client?.logoUrl, CLIENT_LOGO_FOOTER_URL: cfg.client?.logoFooterUrl,
  CLIENT_MAP_EMBED_URL: cfg.client?.mapEmbedUrl, CLIENT_FACEBOOK_URL: cfg.client?.facebookUrl,
  CLIENT_ADDRESS_HTML: cfg.client?.addressHtml, CLIENT_HOURS_HTML: cfg.client?.hoursHtml,
  CLIENT_LEAD_DISCLAIMER: cfg.client?.leadDisclaimer,
  HOME_HERO_IMAGE: cfg.home?.heroImage, HOME_HERO_IMAGE_ALT: cfg.home?.heroImageAlt,
  HOME_EYEBROW: cfg.home?.eyebrow, HOME_HERO_HEADLINE: cfg.home?.headline,
  HOME_HERO_HEADLINE_ACCENT: cfg.home?.headlineAccent, HOME_HERO_SUBHEAD: cfg.home?.subhead,
  HOME_CAMPAIGN: cfg.home?.campaign, LEAD_ENDPOINT: cfg.endpoints?.lead,
  /* mirrors build-config.mjs: missing/tokenized gscVerification builds as ""
     and the empty meta tag is stripped — cosmetic, never a hard error */
  GSC_VERIFICATION: val(cfg.tracking?.gscVerification) || '',
  GHL_EXTERNAL_TRACKING: val(cfg.tracking?.ghlExternalTracking) || '',
  GHL_BOOKING_CALENDAR_ID: val(cfg.tracking?.ghlBookingCalendarId) || ''
};
const covered = new Set(Object.keys(envTokens));
/* Explicit empty string is a legitimate value: build-config hydrates it to ""
   (empty logo/map/offer label → element hidden by CSS, evergreen via JS).
   Only missing/null/token-containing values leave a raw {{TOKEN}} behind. */
const CRITICAL_TOKENS = new Set(['CLIENT_NAME', 'CLIENT_PHONE', 'CLIENT_PHONE_E164', 'CLIENT_ADDRESS', 'CLIENT_HOURS', 'CLIENT_MARKET', 'GA4_ID', 'META_PIXEL_ID', 'LEAD_ENDPOINT']);
const explicitEmpty = [];
for (const [k, v] of Object.entries(configTokenMap)) {
  if (v !== undefined && v !== null && !String(v).includes('{{')) {
    if (String(v) === '' && CRITICAL_TOKENS.has(k)) continue; // stays uncovered → hard error above
    covered.add(k);
    if (String(v) === '') explicitEmpty.push(k);
  }
}
if (explicitEmpty.length) warnings.push(`Explicitly empty cosmetic value(s) — hydrate to "" and the element is hidden/evergreen; confirm intended at HUMAN CHECKPOINT 1: ${explicitEmpty.join(', ')}`);

const tokenRe = /\{\{([A-Z0-9_]+)(?:\|([^}]*))?\}\}/g;
const seen = new Map(); // token -> hasDefault
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.wrangler', '.git', 'skills', 'clients', 'dist'].includes(entry)) continue;
    const f = join(dir, entry);
    if (statSync(f).isDirectory()) walk(f);
    else if (/\.html$/i.test(entry)) {
      const text = readFileSync(f, 'utf8');
      let m;
      while ((m = tokenRe.exec(text))) {
        const prev = seen.get(m[1]);
        seen.set(m[1], (prev ?? false) || m[2] !== undefined);
      }
    }
  }
})(repoRoot);

for (const [token, hasDefault] of [...seen.entries()].sort()) {
  if (covered.has(token)) continue;
  if (hasDefault) defaults.push(token);
  else errors.push(`Token has no value and no |default — would ship as literal {{${token}}}: ${token}`);
}

if (defaults.length) warnings.push(`${defaults.length} token(s) will ship on their |default value — requires sign-off at HUMAN CHECKPOINT 1.`);

/* Upsert 48-HOUR FIX LIST into WIRING.md (rush always; standard when list non-empty) */
if (fixList48h.length && (isRush || fixList48h.length)) {
  const wiringPath = join(clientDir, 'WIRING.md');
  let body = existsSync(wiringPath)
    ? readFileSync(wiringPath, 'utf8')
    : `# WIRING.md — ${name}\n`;
  const lines = [
    '## 48-HOUR FIX LIST',
    '',
    `Generated by \`new-client.mjs --validate --profile ${isRush ? 'rush' : 'standard'}\`. Launch may proceed; close within 48h.`,
    '',
    '| Done | What we need | Owner | config / secret |',
    '|---|---|---|---|'
  ];
  for (const r of fixList48h) {
    lines.push(`| [ ] | ${r.what} | ${r.owner} | \`${r.config_key}\` |`);
  }
  lines.push('');
  const section = lines.join('\n');
  if (/## 48-HOUR FIX LIST/.test(body)) {
    body = body.replace(/## 48-HOUR FIX LIST[\s\S]*?(?=\n## |\n*$)/, section.trim() + '\n\n');
  } else {
    body = body.trimEnd() + '\n\n' + section;
  }
  writeFileSync(wiringPath, body);
}

const status = errors.length ? 'FAIL' : 'PASS';
const result = {
  status,
  client: name,
  profile: isRush ? 'rush' : 'standard',
  errors,
  warnings,
  defaults: verbose ? defaults : defaults.slice(0, 50),
  fixList48h
};
if (!verbose && defaults.length > 50) result.defaultsTruncated = `${defaults.length - 50} more — rerun with --verbose`;
out(result);
process.exit(errors.length ? 1 : 0);
