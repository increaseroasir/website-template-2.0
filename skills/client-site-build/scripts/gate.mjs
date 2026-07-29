#!/usr/bin/env node
/**
 * gate.mjs — mechanical launch gate for a BUILT client site (dist/ only).
 * Part of the client-site-build skill. Node 18+, zero dependencies.
 * JSON to stdout, diagnostics to stderr. Never fakes a PASS: anything this
 * script cannot verify statically is emitted as MANUAL.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const HELP = `gate.mjs — mechanical launch gate (runs against dist/ ONLY)

USAGE
  node skills/client-site-build/scripts/gate.mjs --env staging|prod [--dist <path>] [--verbose]
  node skills/client-site-build/scripts/gate.mjs --help

  --env      staging: robots must be noindex. prod: robots must be index,follow.
  --dist     Path to the BUILT site (default ./dist). Errors if missing —
             never point this at the template checkout; the template is
             expected to fail (it still contains tokens by design).

CHECKS (static)
  tokens          zero "{{" anywhere in built html/css/js
  fingerprints    zero template/Paradise values (scripts/template-fingerprints.json)
  duplicate-ids   no repeated id= within a page (post-hydration, pre-injection)
  links           internal hrefs resolve; #anchors exist on that page
  images          every <img> has alt + width/height
  preload         at most one <link rel="preload"> per page; if present its
                  href must be referenced by the page (the LCP hero); zero
                  preloads is a PASS on pages with no hero
  robots          robots meta matches --env
  phones          tel:/sms: hrefs are E164 and match the built config
  robots.txt      exists; staging = "Disallow: /", prod = allow + Sitemap line
  sitemap         parses, absolute URLs resolve to shipped pages, excluded
                  pages (404/thank-you/admin/SLUG template) absent
  gsc-meta        google-site-verification absent when token empty, never
                  empty/tokenized when present
  json-ld         every static application/ld+json block parses (runtime
                  FAQ/Breadcrumb/Product schema is a MANUAL rich-results row)
  ghl-tracking    tracking.ghlExternalTracking is "" (stripped) or a valid
                  https URL; never tokenized; staging must NOT carry a real
                  ID (staging page views would pollute client attribution)
  functions       dist/functions/api/{lead,inventory,meta-offline,booking}.js
                  exist — an artifact without them deploys a site with no
                  working APIs (build #1 regression)
  routing         dist/_redirects + dist/404.html exist — without them every
                  product slug URL, legacy .html redirect, and 404 serves the
                  homepage via SPA fallback (build #1 regression)

MANUAL rows are emitted for: console errors, duplicate IDs after inventory
injection, form fit at 390x650/320, reduced-motion, Lighthouse, live wiring
(GA4/Pixel/Clarity/GHL/Closebot), device screenshots.

OUTPUT   JSON: {env, dist, summary:{pass,fail,manual}, checks:[{check,status,evidence}]}
EXIT     0 = no FAIL rows · 1 = one or more FAIL · 2 = bad usage
`;

function die(msg, code) { process.stderr.write(msg + '\n'); process.exit(code); }
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) { process.stdout.write(HELP); process.exit(0); }
const env = args[args.indexOf('--env') + 1];
if (!args.includes('--env') || !['staging', 'prod'].includes(env)) die('Missing/invalid --env (staging|prod). See --help.', 2);
const verbose = args.includes('--verbose');
const dist = resolve(args.includes('--dist') ? args[args.indexOf('--dist') + 1] : 'dist');
if (!existsSync(dist) || !statSync(dist).isDirectory()) die(`No dist/ at ${dist}. Build first (never in place) — see SKILL.md step 5.`, 2);
if (!existsSync(join(dist, 'index.html'))) die(`${dist} has no index.html — is this really a built site?`, 2);

const fingerprintsRaw = JSON.parse(readFileSync(join(skillRoot, 'scripts', 'template-fingerprints.json'), 'utf8')).fingerprints;
for (const fp of fingerprintsRaw.filter(f => f.pending))
  process.stderr.write(`NOTE: pending fingerprint not yet enforceable — ${fp.kind}: ${fp.note || 'value unknown'}\n`);
const fingerprints = fingerprintsRaw.filter(fp => !fp.pending)
  .map(fp => ({ ...fp, value: Buffer.from(fp.b64, 'base64').toString('utf8') }));

/* collect files */
const pages = [], textFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.wrangler', '.git', 'functions', 'scripts', 'docs'].includes(name)) continue;
    const f = join(dir, name);
    if (statSync(f).isDirectory()) walk(f);
    else if (/\.html$/i.test(name)) { pages.push(f); textFiles.push(f); }
    else if (/\.(css|js|json|toml|xml|txt)$/i.test(name)) textFiles.push(f);
  }
})(dist);

const checks = [];
function add(check, status, evidence) { checks.push({ check, status, evidence }); }
function lineOf(text, idx) { return text.slice(0, idx).split('\n').length; }
/* Markup-only scans must ignore <script> bodies (JS template strings contain
   href=/id= fragments that aren't real DOM at load). */
function scriptRanges(text) {
  const ranges = [];
  for (const m of text.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}
function inRanges(ranges, idx) { return ranges.some(([a, b]) => idx >= a && idx < b); }
function cap(arr, n = 8) { return arr.length > n && !verbose ? arr.slice(0, n).concat(`…+${arr.length - n} more (--verbose)`) : arr; }

/* 1. tokens */
{
  const hits = [];
  /* Flag {{TOKEN-shaped leftovers. A bare "{{" without a token name is the
     template's own leftover-detection code (JS indexOf('{{'), CSS
     [src*="{{"]) and is functional, not a hydration miss. */
  for (const f of textFiles) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/\{\{[A-Z0-9_]+/g)) {
      hits.push(`${relative(dist, f)}:${lineOf(text, m.index)} ${text.slice(m.index, m.index + 40).split('\n')[0]}`);
    }
  }
  add('tokens: zero {{TOKEN leftovers in built output', hits.length ? 'FAIL' : 'PASS', hits.length ? cap(hits) : `scanned ${textFiles.length} files`);
}

/* 2. fingerprints */
{
  const hits = [];
  for (const f of textFiles) {
    const text = readFileSync(f, 'utf8');
    const lower = text.toLowerCase();
    for (const fp of fingerprints) {
      const hay = fp.caseSensitive ? text : lower;
      const needle = fp.caseSensitive ? fp.value : fp.value.toLowerCase();
      const idx = hay.indexOf(needle);
      if (idx !== -1) hits.push(`${relative(dist, f)}:${lineOf(text, idx)} → ${fp.kind}: "${fp.value}"`);
    }
  }
  add('fingerprints: zero template/Paradise values', hits.length ? 'FAIL' : 'PASS', hits.length ? cap(hits) : `${fingerprints.length} fingerprints checked`);
}

/* 2b. tracking prerequisites — both are "site works, tracking silently dead"
   failure modes that only surface when a client reports no pixel data. */
{
  const problems = [];
  if (!existsSync(join(dist, 'client.config.js'))) {
    problems.push('client.config.js missing from dist root — window.CLIENT_CONFIG undefined, ALL runtime tracking (GA4/Clarity/GHL external/pixel fallback) silently fails');
  }
  for (const p of pages) {
    const text = readFileSync(p, 'utf8');
    if (text.includes('assets/tracking.js') && !text.includes('fbevents.js')) {
      problems.push(`${relative(dist, p)}: loads tracking.js but has no hardcoded Meta pixel (fbevents.js) — build-config.mjs injectMetaPixel() was skipped (empty META_PIXEL_ID?)`);
    }
  }
  add('tracking: client.config.js present + Meta pixel hardcoded in every page', problems.length ? 'FAIL' : 'PASS', problems.length ? cap(problems) : `${pages.length} pages checked`);
}

/* 3. duplicate ids per page */
{
  const dupes = [];
  for (const p of pages) {
    const text = readFileSync(p, 'utf8');
    const ranges = scriptRanges(text);
    const idsSeen = new Map();
    for (const m of text.matchAll(/\sid="([^"]+)"/g)) {
      if (inRanges(ranges, m.index)) continue;
      const id = m[1];
      if (idsSeen.has(id)) dupes.push(`${relative(dist, p)}: duplicate id="${id}" (lines ${idsSeen.get(id)} and ${lineOf(text, m.index)})`);
      else idsSeen.set(id, lineOf(text, m.index));
    }
  }
  add('duplicate-ids (static, pre-injection)', dupes.length ? 'FAIL' : 'PASS', dupes.length ? cap(dupes) : `${pages.length} pages scanned`);
}

/* 4. links */
{
  const bad = [];
  const pageIds = new Map();
  for (const p of pages) {
    const text = readFileSync(p, 'utf8');
    const ranges = scriptRanges(text);
    pageIds.set(relative(dist, p), new Set([...text.matchAll(/\sid="([^"]+)"/g)].filter(m => !inRanges(ranges, m.index)).map(m => m[1])));
  }
  for (const p of pages) {
    const rel = relative(dist, p);
    const text = readFileSync(p, 'utf8');
    const ranges = scriptRanges(text);
    for (const m of text.matchAll(/\shref="([^"]+)"/g)) {
      if (inRanges(ranges, m.index)) continue;
      const href = m[1];
      const where = `${rel}:${lineOf(text, m.index)}`;
      if (/^(https?:|mailto:|javascript:)/.test(href)) continue;
      if (/^(tel:|sms:)/.test(href)) {
        if (!/^(tel|sms):\+1[2-9]\d{9}$/.test(href)) bad.push(`${where} non-E164 ${href}`);
        continue;
      }
      const [pathPart, anchor] = href.split('#');
      let targetPage = rel;
      if (pathPart) {
        const clean = pathPart.replace(/\?.*$/, '');
        let fsPath = clean.startsWith('/') ? join(dist, clean) : resolve(dirname(p), clean);
        if (existsSync(fsPath) && statSync(fsPath).isDirectory()) fsPath = join(fsPath, 'index.html');
        if (!existsSync(fsPath)) { bad.push(`${where} dead href ${href}`); continue; }
        targetPage = relative(dist, fsPath);
      }
      if (anchor) {
        const ids = pageIds.get(targetPage);
        if (ids && !ids.has(anchor)) bad.push(`${where} missing #${anchor} on ${targetPage}`);
      }
    }
  }
  add('links: hrefs + #anchors resolve, tel/sms E164', bad.length ? 'FAIL' : 'PASS', bad.length ? cap(bad) : 'all internal links resolve');
}

/* 5. images */
{
  const bad = [];
  for (const p of pages) {
    const text = readFileSync(p, 'utf8');
    const ranges = scriptRanges(text);
    for (const m of text.matchAll(/<img\b[^>]*>/g)) {
      if (inRanges(ranges, m.index)) continue;
      const tag = m[0];
      const where = `${relative(dist, p)}:${lineOf(text, m.index)}`;
      if (!/\salt="/.test(tag)) bad.push(`${where} img missing alt`);
      if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) bad.push(`${where} img missing width/height`);
    }
  }
  add('images: every img has alt + width/height', bad.length ? 'FAIL' : 'PASS', bad.length ? cap(bad) : 'all imgs dimensioned');
}

/* 6. preload — owner ruling: AT MOST one per page; if present it must
   reference that page's LCP hero (its href appears again in the page as the
   hero's src/style); zero preloads is a PASS on pages with no hero. */
{
  const bad = [];
  for (const p of pages) {
    const text = readFileSync(p, 'utf8');
    const links = [...text.matchAll(/<link[^>]*rel="preload"[^>]*>/g)];
    if (links.length > 1) { bad.push(`${relative(dist, p)}: ${links.length} preloads (at most 1 allowed)`); continue; }
    if (links.length === 1) {
      const href = (links[0][0].match(/\shref="([^"]+)"/) || [])[1];
      if (!href) { bad.push(`${relative(dist, p)}: preload has no href`); continue; }
      const rest = text.replace(links[0][0], '');
      if (!rest.includes(href)) bad.push(`${relative(dist, p)}: preload href "${href.slice(0, 60)}" not referenced by the page (stale hero preload)`);
    }
  }
  add('preload: ≤1 per page, and it must reference the LCP hero', bad.length ? 'FAIL' : 'PASS', bad.length ? cap(bad, 12) : `${pages.length} pages`);
}

/* 7. robots vs env */
{
  const want = env === 'prod' ? /index\s*,\s*follow/i : /noindex/i;
  const bad = [];
  for (const p of pages) {
    /* 404.html and admin/ are deliberately noindex in every environment —
       an indexed error page or back office is the bug, not the noindex.
       (admin/ is also robots.txt-Disallowed; both layers are intentional.) */
    const rel = relative(dist, p);
    if (rel === '404.html' || rel.startsWith('admin/')) continue;
    const text = readFileSync(p, 'utf8');
    const m = text.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
    if (!m) bad.push(`${relative(dist, p)}: no robots meta`);
    else if (!want.test(m[1]) || (env === 'prod' && /noindex/i.test(m[1]))) bad.push(`${relative(dist, p)}: robots="${m[1]}" wrong for --env ${env}`);
  }
  add(`robots: matches --env ${env}`, bad.length ? 'FAIL' : 'PASS', bad.length ? cap(bad, 12) : 'all pages correct');
}

/* 8. phones match built config */
{
  let evidence = 'client.config.js not found in dist';
  let status = 'MANUAL';
  const cfgPath = join(dist, 'client.config.js');
  if (existsSync(cfgPath)) {
    try {
      const sandbox = { window: {} };
      vm.createContext(sandbox);
      vm.runInContext(readFileSync(cfgPath, 'utf8'), sandbox, { filename: 'client.config.js' });
      const cfg = sandbox.window.CLIENT_CONFIG || {};
      const e164 = String(cfg.client?.primaryPhoneHref || '').replace(/^tel:/, '');
      if (!/^\+1[2-9]\d{9}$/.test(e164)) { status = 'FAIL'; evidence = `config primaryPhoneHref not E164: "${cfg.client?.primaryPhoneHref}"`; }
      else {
        const bad = [];
        for (const p of pages) {
          const text = readFileSync(p, 'utf8');
          const ranges = scriptRanges(text);
          for (const m of text.matchAll(/\shref="(tel|sms):([^"]+)"/g)) {
            if (inRanges(ranges, m.index)) continue;
            if (m[2] !== e164) bad.push(`${relative(dist, p)}:${lineOf(text, m.index)} ${m[1]}:${m[2]} ≠ config ${e164}`);
          }
        }
        status = bad.length ? 'FAIL' : 'PASS';
        evidence = bad.length ? cap(bad) : `all tel:/sms: = ${e164}`;
      }
    } catch (e) { status = 'FAIL'; evidence = `config does not evaluate: ${e.message}`; }
  }
  add('phones: tel/sms match built config (E164)', status, evidence);
}

/* 9. robots.txt exists and matches env */
{
  const robotsPath = join(dist, 'robots.txt');
  if (!existsSync(robotsPath)) add('robots.txt: exists and matches --env', 'FAIL', 'robots.txt missing from dist (build-config.mjs generates it — check DOMAIN/CLIENT_WEBSITE_URL)');
  else {
    const text = readFileSync(robotsPath, 'utf8');
    const bad = [];
    if (env === 'staging') {
      if (!/^Disallow:\s*\/\s*$/m.test(text)) bad.push('staging robots.txt must contain "Disallow: /"');
    } else {
      if (/^Disallow:\s*\/\s*$/m.test(text)) bad.push('prod robots.txt contains blanket "Disallow: /"');
      if (!/^Sitemap:\s*https:\/\/\S+\/sitemap\.xml\s*$/m.test(text)) bad.push('prod robots.txt missing "Sitemap: https://<domain>/sitemap.xml" line');
    }
    if (text.includes('{{')) bad.push('robots.txt contains unhydrated tokens');
    add('robots.txt: exists and matches --env', bad.length ? 'FAIL' : 'PASS', bad.length ? cap(bad) : `robots.txt correct for ${env}`);
  }
}

/* 10. sitemap.xml: parses, URLs resolve to shipped pages, no excluded pages */
{
  const sitemapPath = join(dist, 'sitemap.xml');
  if (!existsSync(sitemapPath)) {
    add('sitemap: exists, parses, URLs resolve, exclusions honored', env === 'staging' ? 'MANUAL' : 'FAIL',
      env === 'staging' ? 'sitemap.xml not generated on this staging build — required before prod' : 'sitemap.xml missing from dist');
  } else {
    const text = readFileSync(sitemapPath, 'utf8');
    const bad = [];
    if (!/^<\?xml[^>]*\?>\s*<urlset[^>]*>[\s\S]*<\/urlset>\s*$/.test(text.trim())) bad.push('sitemap.xml is not a well-formed <urlset> document');
    const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    if (!locs.length) bad.push('sitemap.xml contains zero <loc> entries');
    const EXCLUDED = /\/(404\.html|thank-you\.html|admin\/|active-inventory\/SLUG\/)/;
    for (const loc of locs) {
      if (!/^https:\/\//.test(loc)) { bad.push(`non-absolute URL: ${loc}`); continue; }
      if (EXCLUDED.test(loc)) { bad.push(`excluded page present in sitemap: ${loc}`); continue; }
      const rel = loc.replace(/^https:\/\/[^/]+\//, '');
      const candidate = rel === '' ? 'index.html' : (rel.endsWith('/') ? rel + 'index.html' : rel);
      if (!existsSync(join(dist, candidate))) bad.push(`sitemap URL has no shipped page: ${loc} → ${candidate}`);
    }
    add('sitemap: exists, parses, URLs resolve, exclusions honored', bad.length ? 'FAIL' : 'PASS',
      bad.length ? cap(bad, 12) : `${locs.length} URLs, all resolve, 404/thank-you/admin/SLUG excluded`);
  }
}

/* 11. GSC verification meta: absent (empty token) or non-empty and untokenized */
{
  const bad = [];
  for (const p of pages) {
    const text = readFileSync(p, 'utf8');
    const m = text.match(/<meta\s+name="google-site-verification"\s+content="([^"]*)"/i);
    if (!m) continue; // omitted entirely = valid (empty token path)
    if (m[1] === '') bad.push(`${relative(dist, p)}: empty GSC meta shipped — build should have stripped it`);
    else if (m[1].includes('{{')) bad.push(`${relative(dist, p)}: GSC meta still tokenized: "${m[1]}"`);
  }
  add('gsc-meta: absent when empty, valid when present', bad.length ? 'FAIL' : 'PASS', bad.length ? cap(bad) : 'no empty/tokenized verification metas');
}

/* 12. JSON-LD: every static <script type="application/ld+json"> block parses */
{
  const bad = [];
  let count = 0;
  for (const p of pages) {
    const text = readFileSync(p, 'utf8');
    for (const m of text.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      count++;
      try { JSON.parse(m[1]); } catch (e) { bad.push(`${relative(dist, p)}: JSON-LD does not parse — ${e.message}`); }
    }
  }
  add('json-ld: all static blocks parse', bad.length ? 'FAIL' : 'PASS',
    bad.length ? cap(bad) : `${count} static block(s) parse (FAQ/Breadcrumb/Product schema is JS-emitted; see MANUAL rich-results row)`);
}

/* 13. GHL External Tracking: '' (stripped) or a real https URL; never
   tokenized; staging builds never carry a real tracking ID */
{
  let status = 'MANUAL', evidence = 'client.config.js not found in dist';
  const cfgPath = join(dist, 'client.config.js');
  if (existsSync(cfgPath)) {
    try {
      const sandbox = { window: {} };
      vm.createContext(sandbox);
      vm.runInContext(readFileSync(cfgPath, 'utf8'), sandbox, { filename: 'client.config.js' });
      const v = String((sandbox.window.CLIENT_CONFIG || {}).tracking?.ghlExternalTracking ?? '');
      if (v.includes('{{')) { status = 'FAIL'; evidence = `tracking.ghlExternalTracking still tokenized: "${v}"`; }
      else if (v === '') { status = 'PASS'; evidence = 'empty — not injected (attribution loss only; wiring ID #9 open item)'; }
      else if (env === 'staging') { status = 'FAIL'; evidence = `staging build carries a real external tracking URL ("${v.slice(0, 60)}") — staging page views would pollute the client's GHL attribution`; }
      else if (!/^https:\/\/\S+$/.test(v)) { status = 'FAIL'; evidence = `not an https script URL: "${v.slice(0, 80)}"`; }
      else { status = 'PASS'; evidence = `injected from ${v.slice(0, 80)}`; }
    } catch (e) { status = 'FAIL'; evidence = `config does not evaluate: ${e.message}`; }
  }
  add('ghl-external-tracking: empty-stripped or valid https, never on staging', status, evidence);
}

/* 14. functions/: server code ships with the artifact (build #1 regression:
   a "patch-only" redeploy dropped functions/ entirely — every /api/* route
   returned the homepage HTML while the static gate still reported all-PASS) */
{
  const required = ['functions/api/lead.js', 'functions/api/inventory.js', 'functions/api/meta-offline.js', 'functions/api/booking.js'];
  const missing = required.filter(f => !existsSync(join(dist, f)));
  add('functions: server code present in artifact (lead/inventory/meta-offline/booking)',
    missing.length ? 'FAIL' : 'PASS',
    missing.length
      ? `missing from dist: ${missing.join(', ')} — deploying this ships a site with NO working APIs (forms dead, grids empty, /api/* answers with HTML); re-hydrate (the rsync recipe keeps functions/) and run wrangler pages deploy from the dist root`
      : `all ${required.length} API entry points present in dist/functions/`);
}

/* 15. routing files: _redirects + 404.html ship with the artifact (build #1:
   both were dropped at deploy — every product /active-inventory/<slug>/ URL,
   every legacy .html 301, and every 404 silently served the homepage) */
{
  const missing = ['_redirects', '404.html'].filter(f => !existsSync(join(dist, f)));
  add('routing: _redirects + 404.html present in artifact',
    missing.length ? 'FAIL' : 'PASS',
    missing.length
      ? `missing from dist: ${missing.join(', ')} — without them Pages falls back to SPA mode: product slug URLs, .html redirects, and 404s ALL serve the homepage with a 200; deploy the gated dist byte-exact`
      : 'both present — smoke-test after deploy: /hot-tubs.html must 301, a nonsense path must 404, /active-inventory/<real-slug>/ must serve the product template');
}

/* 15b. no 200-proxy may target a .html file. Pages 308-normalizes extensions
   (/a/index.html → /a/) and never chains redirects, so a .html destination
   resolves to a redirect rather than an asset and the entire route 404s while
   the rest of the site looks perfect. This killed every product URL in WTV-034. */
{
  const problems = [];
  const file = join(dist, '_redirects');
  if (existsSync(file)) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      const clean = line.trim();
      if (!clean || clean.startsWith('#')) return;
      const [from, to, status] = clean.split(/\s+/);
      if (status === '200' && /\.html$/i.test(to || '')) {
        problems.push(`line ${i + 1}: "${from}" → "${to}" 200 — destination must be the directory form (".../SLUG/"), not a .html path`);
      }
    });
  }
  add('routing: no 200-proxy targets a .html path (Pages normalizes + never chains)',
    problems.length ? 'FAIL' : 'PASS',
    problems.length ? cap(problems) : 'all 200-proxy destinations are directory paths');
}

/* 15c. the dynamic product shell must not pin a slug. It is served for EVERY
   /active-inventory/<slug>/ URL, so a hydrated data-product-slug makes every
   unit request that one slug: D1 returns nothing and the page renders "Product
   unavailable" behind a perfect 200 and a valid shell (WTV-035). Every HTTP
   check passes; only a JS-rendering check or this static check catches it. */
{
  const shellPath = join(dist, 'active-inventory', 'SLUG', 'index.html');
  let status = 'PASS';
  let detail = 'no build-time slug — renderer derives it from the URL';
  if (!existsSync(shellPath)) {
    status = 'FAIL';
    detail = 'active-inventory/SLUG/index.html missing from artifact — every product URL would 404';
  } else {
    const shell = readFileSync(shellPath, 'utf8');
    const match = /<body[^>]*\sdata-product-slug=["']([^"']*)["']/i.exec(shell);
    const value = (match?.[1] || '').replace(/\{\{[^}]+\}\}/g, '').trim();
    if (value) {
      status = 'FAIL';
      detail = `shell pins data-product-slug="${value}" — all units would request that slug and render "Product unavailable"; remove the attribute (PRODUCT_SLUG token was deleted in WTV-035)`;
    }
  }
  add('product shell: no hardcoded data-product-slug (renders per-URL)', status, detail);
}

/* 15d. accessibility regressions that cost real Lighthouse points and are
   invisible in review (WTV-036). A drawer hidden only by transform keeps its
   links keyboard-focusable inside an aria-hidden subtree; a logo aria-label of
   "<name> home" drops the visible tagline from the accessible name. */
{
  const problems = [];
  for (const f of textFiles) {
    if (!/\.html$/i.test(f)) continue;
    const html = readFileSync(f, 'utf8');
    const rel = f.slice(dist.length + 1);
    const drawer = /<div[^>]*id=["']drawer["'][^>]*>/i.exec(html);
    if (drawer && !/\binert\b/.test(drawer[0])) {
      problems.push(`${rel}: #drawer missing \`inert\` (closed drawer stays focusable)`);
    }
    if (/<a[^>]*class=["']logo(?:-mark)?["'][^>]*aria-label=/i.test(html)) {
      problems.push(`${rel}: logo link overrides its accessible name with aria-label`);
    }
  }
  add('accessibility: inert drawer + logo accessible name',
    problems.length ? 'FAIL' : 'PASS',
    problems.length ? cap(problems) : 'closed drawer is inert; logo name comes from its text');
}

/* 16. no captcha anywhere (TVD-025): Turnstile was removed from the template
   after broken widgets silently rejected 100% of live leads twice (build #1).
   Any reference in the artifact means a stale pre-removal template. */
{
  const hits = [];
  for (const f of textFiles) {
    const text = readFileSync(f, 'utf8');
    if (/cf-turnstile|challenges\.cloudflare\.com\/turnstile|TURNSTILE_/i.test(text)) hits.push(f.slice(dist.length + 1));
  }
  add('security: zero captcha / Turnstile references in artifact (TVD-025)',
    hits.length ? 'FAIL' : 'PASS',
    hits.length
      ? `turnstile references found in: ${hits.slice(0, 6).join(', ')} — this is a stale pre-TVD-025 template; re-hydrate from current premium-redesign HEAD and delete TURNSTILE_* vars from the Pages project`
      : 'no cf-turnstile / challenges.cloudflare.com / TURNSTILE_ references — also ensure TURNSTILE_* env vars are absent on the Pages project (validator cannot read them)');
}

/* MANUAL rows — a script cannot verify these; never fake a PASS */
for (const [check, evidence] of [
  ['console: zero errors on load+scroll+interaction', 'Run each page in a browser; interact with drawer, FAQ, form step 1, a card CTA'],
  ['duplicate-ids after inventory injection', 'Load pages with live /api/inventory and re-scan DOM ids'],
  ['forms fit 390x650 and 320px, consent visible, no internal scroll', 'Viewport-emulate and measure the drawer/survey/gate submit + consent'],
  ['reduced-motion: fully static, final values shown', 'Enable OS reduced motion and reload every page'],
  ['lighthouse: Perf ≥85 mobile / ≥95 desktop, A11y ≥95, SEO ≥95, CLS <0.1', 'Run Lighthouse on the staging URL'],
  ['wiring: IDs 1–10 + Meta CAPI/offline live-verified on the CLIENT account', 'references/wiring.md — GA4 Realtime, Pixel Test Events, Clarity, GHL webhook+widget, Closebot, native form submit (no captcha — TVD-025), phone routing, external-tracking stitch + dedupe (ONE contact), booking calendar live test (or intentionally empty); Cloudflare secrets META_CAPI_ACCESS_TOKEN + META_OFFLINE_WEBHOOK_SECRET (standing MANUAL — validator cannot read); 6 GHL Meta fields + stage→/api/meta-offline; Test Events Lead DEDUPED; Schedule on real booking; one QualifiedLead offline; Events Manager custom conversions for QualifiedLead/Showed'],
  ['post-deploy API smoke: / + theme.css 200, /api/inventory 200 JSON, POST /api/lead not 503, D1 schema matches functions/db/schema.sql', 'curl after EVERY deploy (wrangler only, never raw API); /api/* answering with HTML = functions/ never deployed — redeploy from the dist root; 503 "Lead vault" = GOOGLE_SHEETS_ID missing (set prod + preview); inventory 500 = D1 schema drift — diff sqlite_master vs functions/db/schema.sql, additive ALTER only; paste the curl output in the completion report — a report without it is not done'],
  ['device screenshots archived (1440/390 every page)', 'Store with WIRING.md per launch-checklist.md'],
  ['rich results: JS-emitted JSON-LD valid per page type', 'Run homepage (FAQPage), a category page (BreadcrumbList), and a live product URL (Product+Breadcrumb) through https://search.google.com/test/rich-results']
]) add(check, 'MANUAL', evidence);

const summary = {
  pass: checks.filter(c => c.status === 'PASS').length,
  fail: checks.filter(c => c.status === 'FAIL').length,
  manual: checks.filter(c => c.status === 'MANUAL').length
};
process.stdout.write(JSON.stringify({ env, dist, summary, checks }, null, 2) + '\n');
process.exit(summary.fail ? 1 : 0);
