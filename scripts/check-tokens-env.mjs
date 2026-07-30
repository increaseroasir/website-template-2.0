#!/usr/bin/env node
/**
 * Lint a client tokens.env before it is hydrated.
 *
 * The hydrate recipe sources this file with `set -a && . tokens.env`, so it is a
 * bash script, not a config format. Two mistakes are invisible afterwards:
 *
 *   1. An unquoted value containing spaces. `CLIENT_NAME=Sun Pool & Spa Supply`
 *      assigns "Sun" for one command, backgrounds the rest, and exports nothing.
 *      Because most tokens in the markup carry a `|default`, the page then renders
 *      the template's default and no gate complains — the client's real copy is
 *      simply gone.
 *   2. A duplicate key. The last assignment wins, so editing the first occurrence
 *      appears to do nothing.
 *   3. A hard-required token missing from both tokens.env and client.config.js.
 *      Hard-required = appears as {{TOKEN}} with no |default, is not only inside
 *      an <!-- IF:TOKEN --> block, is not a member of an optionalSections group
 *      whose control is absent, and is not supplied by tokenMapFromConfig.
 *
 *   node scripts/check-tokens-env.mjs clients/<name>/tokens.env
 *   node scripts/check-tokens-env.mjs clients/<name>/tokens.env --template .
 *   node scripts/check-tokens-env.mjs clients/<name>/tokens.env --template . --config clients/<name>/client.config.js
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const templateRoot = (() => {
  const i = args.indexOf('--template');
  if (i >= 0 && args[i + 1]) return resolve(args[i + 1]);
  // Default: when checking clients/<name>/tokens.env, scan the repo that owns scripts/
  return REPO_ROOT;
})();
const configPath = (() => {
  const i = args.indexOf('--config');
  if (i >= 0 && args[i + 1]) return resolve(args[i + 1]);
  // Prefer sibling client.config.js next to tokens.env
  if (file) {
    const sibling = join(dirname(resolve(file)), 'client.config.js');
    if (existsSync(sibling)) return sibling;
  }
  const rootCfg = join(templateRoot, 'client.config.js');
  return existsSync(rootCfg) ? rootCfg : null;
})();

if (!file) {
  console.error('usage: node scripts/check-tokens-env.mjs <path/to/tokens.env> [--template <root>] [--config <client.config.js>]');
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`not found: ${file}`);
  process.exit(2);
}

const lines = readFileSync(file, 'utf8').split('\n');
const errors = [];
const warnings = [];
const seen = new Map();
const supplied = new Set();

lines.forEach((raw, idx) => {
  const lineNo = idx + 1;
  const line = raw.trim();
  if (!line || line.startsWith('#')) return;
  if (!line.includes('=')) {
    errors.push({ lineNo, msg: `not an assignment and not a comment: ${line.slice(0, 60)}` });
    return;
  }
  const key = line.slice(0, line.indexOf('='));
  const value = line.slice(line.indexOf('=') + 1);

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    errors.push({ lineNo, msg: `"${key}" is not a valid shell variable name` });
  }

  if (seen.has(key)) {
    errors.push({
      lineNo,
      msg: `${key} was already set on line ${seen.get(key)} — the last assignment wins, so the earlier one is dead`
    });
  }
  seen.set(key, lineNo);

  const quoted = (value.startsWith('"') && value.endsWith('"') && value.length > 1)
    || (value.startsWith("'") && value.endsWith("'") && value.length > 1);

  if (!quoted && /[\s&|;<>()$`*?#]/.test(value)) {
    errors.push({
      lineNo,
      msg: `${key} is unquoted and contains shell-significant characters, so sourcing this file exports the wrong value (often empty). Wrap it in double quotes.`
    });
  }

  if (quoted && value.startsWith('"') && /(^|[^\\])\$\{?[A-Za-z_]/.test(value.slice(1, -1))) {
    warnings.push({ lineNo, msg: `${key} contains $VAR inside double quotes — bash will expand it during sourcing` });
  }

  const bare = quoted ? value.slice(1, -1) : value;
  if (bare.trim() === '') {
    warnings.push({ lineNo, msg: `${key} is empty, so the page renders the template default instead` });
  } else {
    supplied.add(key);
  }
});

/** Keys tokenMapFromConfig can fill from client.config.js (mirrors build-config.mjs). */
function keysFromClientConfig(cfgPath) {
  if (!cfgPath || !existsSync(cfgPath)) return new Set();
  const source = readFileSync(cfgPath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(source, sandbox, { filename: 'client.config.js' });
  } catch (err) {
    warnings.push({ lineNo: 0, msg: `could not evaluate ${cfgPath}: ${err.message}` });
    return new Set();
  }
  const cfg = sandbox.window.CLIENT_CONFIG || {};
  const usable = (v) => v !== undefined && v !== null && String(v).indexOf('{{') === -1;
  const map = {
    CLIENT_NAME: cfg.client?.name,
    CLIENT_LEGAL_NAME: cfg.client?.legalName,
    CLIENT_MARKET: cfg.client?.market,
    CLIENT_TAGLINE: cfg.client?.tagline,
    CLIENT_PHONE: cfg.client?.primaryPhone,
    CLIENT_PHONE_E164: String(cfg.client?.primaryPhoneHref || '').replace(/^tel:/, ''),
    CLIENT_ADDRESS: cfg.client?.address,
    CLIENT_MAP_URL: cfg.client?.mapUrl,
    CLIENT_HOURS: cfg.client?.hours,
    CLIENT_WEBSITE_URL: cfg.client?.websiteUrl,
    CLIENT_STORAGE_PREFIX: cfg.client?.storagePrefix,
    BRAND_BLUE: cfg.brand?.primary,
    BRAND_BLUE_DEEP: cfg.brand?.deep,
    BRAND_BLUE_NIGHT: cfg.brand?.night,
    BRAND_GOLD: cfg.brand?.accent,
    BRAND_RED: cfg.brand?.urgent,
    META_PIXEL_ID: cfg.tracking?.metaPixelId,
    GA4_ID: cfg.tracking?.ga4Id,
    CLARITY_ID: cfg.tracking?.clarityId,
    LEAD_VALUE: cfg.tracking?.leadValue,
    LEAD_CURRENCY: cfg.tracking?.leadCurrency,
    PRIMARY_OFFER: cfg.offers?.primary,
    FINANCING_PROMISE: cfg.offers?.financing,
    DELIVERY_PROMISE: cfg.offers?.delivery,
    OFFER_NAME: cfg.offers?.name,
    OFFER_HEADLINE: cfg.offers?.headline,
    OFFER_SHORT: cfg.offers?.short,
    OFFER_ENDS_LABEL: cfg.offers?.endsLabel,
    OFFER_ENDS_AT: cfg.offers?.endsAt,
    CLIENT_EMAIL: cfg.client?.email,
    CLIENT_LOGO_URL: cfg.client?.logoUrl,
    CLIENT_LOGO_FOOTER_URL: cfg.client?.logoFooterUrl,
    CLIENT_MAP_EMBED_URL: cfg.client?.mapEmbedUrl,
    CLIENT_FACEBOOK_URL: cfg.client?.facebookUrl,
    CLIENT_ADDRESS_HTML: cfg.client?.addressHtml,
    CLIENT_HOURS_HTML: cfg.client?.hoursHtml,
    CLIENT_LEAD_DISCLAIMER: cfg.client?.leadDisclaimer,
    HOME_HERO_IMAGE: cfg.home?.heroImage,
    HOME_HERO_IMAGE_ALT: cfg.home?.heroImageAlt,
    HOME_EYEBROW: cfg.home?.eyebrow,
    HOME_HERO_HEADLINE: cfg.home?.headline,
    HOME_HERO_HEADLINE_ACCENT: cfg.home?.headlineAccent,
    HOME_HERO_SUBHEAD: cfg.home?.subhead,
    HOME_CAMPAIGN: cfg.home?.campaign,
    LEAD_ENDPOINT: cfg.endpoints?.lead || '/api/lead',
    GSC_VERIFICATION: cfg.tracking?.gscVerification,
    GHL_EXTERNAL_TRACKING: cfg.tracking?.ghlExternalTracking,
    GHL_BOOKING_CALENDAR_ID: cfg.tracking?.ghlBookingCalendarId
  };
  return new Set(Object.entries(map).filter(([, v]) => usable(v)).map(([k]) => k));
}

const OPTIONAL_PREFIXES = [
  'OFFER_', 'GUIDE_', 'FLOOR_COUNT', 'MASSAGE_CATEGORY_SUMMARY',
  'REVIEW_', 'REVIEWS_TOTAL_LINE'
];
function isOptionalMember(k) {
  return OPTIONAL_PREFIXES.some(p => k === p || k.startsWith(p));
}

/** Expand @include partials the same way build-config.mjs does (depth-limited). */
function resolveIncludesForScan(content, componentsDir, depth = 0) {
  if (depth > 5) return content;
  const INCLUDE_RE = /<!--\s*@include\s+(\S+?)(?:\s+([^>]*?))?\s*-->/g;
  return content.replace(INCLUDE_RE, (_, name, paramStr) => {
    const compPath = join(componentsDir, name);
    if (!existsSync(compPath)) return _;
    let comp = readFileSync(compPath, 'utf8').trimEnd();
    const params = {};
    if (paramStr) {
      for (const m of paramStr.matchAll(/([a-zA-Z_][\w-]*)="([^"]*)"/g)) params[m[1]] = m[2];
    }
    comp = comp.replace(/ ?\{\{@active:([\w-]+)\}\}/g, (__, slug) =>
      slug === params.active ? ' class="nav-active"' : '');
    comp = comp.replace(/\{\{@([a-zA-Z_][\w-]*)\}\}/g, (__, key) => params[key] ?? '');
    return resolveIncludesForScan(comp, componentsDir, depth + 1);
  });
}

/** Hard-required tokens in template HTML (WTV-062 procedure). */
function hardRequiredFromTemplate(root) {
  const skip = new Set(['node_modules', '.git', 'clients', 'components', 'manus-skills', 'skills', 'docs', '.wrangler', '.cursor', 'dist']);
  const IF = /<!-- IF:([A-Z0-9_]+) -->([\s\S]*?)<!-- \/IF:\1 -->/g;
  const componentsDir = join(root, 'components');
  const hard = new Set();
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const full = join(dir, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) { walk(full); continue; }
      if (!/\.(html|xml|webmanifest)$/i.test(name)) continue;
      let text = readFileSync(full, 'utf8');
      text = resolveIncludesForScan(text, componentsDir);
      text = text.replace(IF, ''); // absent IF control removes the block
      for (const m of text.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) {
        hard.add(m[1]);
      }
    }
  }
  if (existsSync(root)) walk(root);
  return hard;
}

const fromConfig = keysFromClientConfig(configPath);
const hard = hardRequiredFromTemplate(templateRoot);
const available = new Set([...supplied, ...fromConfig]);
const missingHard = [...hard]
  .filter(k => !available.has(k) && !isOptionalMember(k))
  .sort();

for (const k of missingHard) {
  errors.push({
    lineNo: 0,
    msg: `hard-required token ${k} is missing from tokens.env and client.config.js (no |default, not IF-guarded). Hydrate would emit literal {{${k}}} (WTV-062).`
  });
}

const label = resolve(file).replace(process.cwd() + '/', '');
if (errors.length) {
  console.log(`FAIL  ${label}`);
  for (const e of errors) {
    const loc = e.lineNo ? `line ${e.lineNo}: ` : '';
    console.log(`  ${loc}${e.msg}`);
  }
} else {
  console.log(
    `PASS  ${label} — ${seen.size} tokens, no duplicates, all values survive sourcing` +
    (hard.size ? `, ${hard.size - missingHard.length}/${hard.size} hard-required covered` : '')
  );
}
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) {
    const loc = w.lineNo ? `line ${w.lineNo}: ` : '';
    console.log(`  ${loc}${w.msg}`);
  }
}
if (configPath) console.log(`\n  config: ${configPath.replace(process.cwd() + '/', '')}`);
if (templateRoot) console.log(`  template: ${templateRoot.replace(process.cwd() + '/', '')}`);

process.exit(errors.length ? 1 : 0);
