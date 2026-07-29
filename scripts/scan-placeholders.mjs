import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const mode = process.argv.includes('--launch') ? 'launch' : 'template';
const tokenPattern = /\{\{[^}]+\}\}/g;

const ignoredDirs = new Set(['.git', '.wrangler', 'node_modules']);
const launchAllowedFiles = new Set([
  'client.fulfillment.schema.json',
  'tracking.manifest.json',
  'docs/manus-fulfillment-skills.md',
  'verification.checklist.md',
  'README.md'
]);

const launchAllowedPatterns = [
  /^\.cursor\//,
  /^docs\//,
  /^client\.fulfillment\.schema\.json$/,
  /^tracking\.manifest\.json$/,
  /^verification\.checklist\.md$/,
  /^README\.md$/
];

function isTextFile(file) {
  return /\.(html|js|css|md|toml|json|sql|txt|yml|yaml)$/i.test(file);
}

function shouldSkip(relPath) {
  if (mode !== 'launch') return false;
  if (launchAllowedFiles.has(relPath)) return true;
  return launchAllowedPatterns.some((pattern) => pattern.test(relPath));
}

function walk(dir, hits) {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const file = join(dir, name);
    const relPath = relative(root, file);
    if (statSync(file).isDirectory()) {
      walk(file, hits);
      continue;
    }
    if (!isTextFile(file) || shouldSkip(relPath)) continue;

    const text = readFileSync(file, 'utf8');
    const matches = text.match(tokenPattern) || [];
    for (const token of matches) hits.push({ file: relPath, token });
  }
}

/* ---- Structural gate checks (launch mode only, run before the token scan).
   Both catch "site works, tracking silently dead" failures before deploy. ---- */
if (mode === 'launch') {
  const failures = [];
  /* 1. client.config.js must exist at the dist root: without it
     window.CLIENT_CONFIG is undefined and ALL tracking (pixel fallback, GA4,
     Clarity, GHL external) fails silently. */
  try { statSync(join(root, 'client.config.js')); }
  catch { failures.push('client.config.js is missing from the dist root — all runtime tracking would silently fail.'); }
  /* 2. Every HTML page that carries tracking must carry the hardcoded pixel
     (fbevents.js). Catches a skipped injectMetaPixel() (e.g. empty META_PIXEL_ID).
     "Carries tracking" means either the legacy <script src> form or the inlined
     form — keying only on the src string would have turned this whole check into
     a silent no-op the moment WTV-040 inlined it. */
  (function checkPixel(dir) {
    for (const name of readdirSync(dir)) {
      if (ignoredDirs.has(name)) continue;
      const file = join(dir, name);
      if (statSync(file).isDirectory()) { checkPixel(file); continue; }
      if (!/\.html$/i.test(name)) continue;
      const text = readFileSync(file, 'utf8');
      const rel = relative(root, file);
      const hasTracking = text.includes('assets/tracking.js') || text.includes('data-inlined="tracking.js"');
      if (hasTracking && !text.includes('fbevents.js')) {
        failures.push(rel + ' carries tracking.js but has no hardcoded Meta pixel (fbevents.js) — injectMetaPixel() was skipped.');
      }
      /* Either head script left as <script src> is two serialized round trips of
         render blocking (565ms each on 3G-class RTT) — the single biggest
         render-blocking cost the page had before WTV-040. Seeing the src form in
         a built artifact means inlineBlockingHeadScripts() did not run. */
      if (/<script src="[^"]*client\.config\.js"><\/script>/.test(text)) {
        failures.push(rel + ' still loads client.config.js as a blocking <script src> — inlineBlockingHeadScripts() did not run (WTV-040).');
      }
      if (/<script src="[^"]*assets\/tracking\.js"><\/script>/.test(text)) {
        failures.push(rel + ' still loads tracking.js as a blocking <script src> — inlineBlockingHeadScripts() did not run (WTV-040).');
      }
    }
  })(root);
  /* 3. No 200-proxy in _redirects may target a .html file. Cloudflare Pages
     308-normalizes extensions away (/a/index.html → /a/) and does NOT chain
     redirects, so such a destination resolves to a redirect instead of an asset
     and the whole route 404s — silently, while the rest of the site looks fine.
     This is exactly how every product URL died in WTV-034. */
  try {
    const lines = readFileSync(join(root, '_redirects'), 'utf8').split('\n');
    lines.forEach((line, i) => {
      const clean = line.trim();
      if (!clean || clean.startsWith('#')) return;
      const [from, to, status] = clean.split(/\s+/);
      if (status === '200' && /\.html$/i.test(to || '')) {
        failures.push(`_redirects line ${i + 1} proxies "${from}" to "${to}" — a 200 destination must not end in .html (Pages 308-normalizes it and never chains, so the route 404s). Use the directory form instead.`);
      }
    });
  } catch { /* no _redirects: routing checks below/elsewhere cover absence */ }
  /* 4. The dynamic product shell must not carry a hardcoded data-product-slug.
     It is served for EVERY /active-inventory/<slug>/ URL, so any hydrated value
     pins all units to one record: the renderer requests that slug, D1 returns
     nothing, and the page prints "Product unavailable" while still returning a
     perfect 200 with a valid shell (WTV-035). HTTP checks cannot see this. */
  try {
    const shell = readFileSync(join(root, 'active-inventory', 'SLUG', 'index.html'), 'utf8');
    const match = /<body[^>]*\sdata-product-slug=["']([^"']*)["']/i.exec(shell);
    const value = (match?.[1] || '').replace(/\{\{[^}]+\}\}/g, '').trim();
    if (value) {
      failures.push(`active-inventory/SLUG/index.html pins data-product-slug="${value}" — the shell serves every product URL, so all units would request that one slug and render "Product unavailable". Remove the attribute; product-page.js derives the slug from the URL.`);
    }
  } catch { /* shell absent: other checks cover a missing product page */ }
  /* 5. Accessibility regressions that Lighthouse caught but no build step did
     (WTV-036). Both are one-attribute mistakes that are invisible in review
     and cost real points, so they are pinned here rather than trusted to
     a manual audit. */
  (function checkA11y(dir) {
    for (const name of readdirSync(dir)) {
      if (ignoredDirs.has(name)) continue;
      const file = join(dir, name);
      if (statSync(file).isDirectory()) { checkA11y(file); continue; }
      if (!/\.html$/i.test(name)) continue;
      const html = readFileSync(file, 'utf8');
      const rel = relative(root, file);
      /* A closed drawer that is only translated off-screen keeps its links
         keyboard-focusable and in the accessibility tree. */
      const drawer = /<div[^>]*id=["']drawer["'][^>]*>/i.exec(html);
      if (drawer && !/\binert\b/.test(drawer[0])) {
        failures.push(`${rel}: #drawer ships without the \`inert\` attribute — the closed drawer stays focusable and screen readers tab into a hidden menu. Add \`inert\` to the markup; home.js toggles it thereafter.`);
      }
      /* The logo's visible text is name + tagline, so an aria-label of
         "<name> home" drops the tagline and fails label-content-name-mismatch. */
      if (/<a[^>]*class=["']logo(?:-mark)?["'][^>]*aria-label=/i.test(html)) {
        failures.push(`${rel}: the logo link overrides its accessible name with aria-label — the visible tagline is then missing from that name (label-content-name-mismatch). Remove the aria-label and let the link text speak.`);
      }
      /* 6. No image preloads (WTV-042). This is the check most likely to be
         "helpfully" undone, because preloading the LCP hero is textbook advice
         and PSI's own lcp-discovery-insight audit asks for it. It measured 2.3s
         WORSE on LCP: the preload takes the top priority slot and delays the
         render-blocking CSS the hero needs in order to paint. Pinned at source
         so the tag cannot come back through a well-intentioned edit. */
      for (const tag of html.match(/<link[^>]*rel=["']preload["'][^>]*>/gi) || []) {
        if (/\sas=["']image["']/i.test(tag)) {
          failures.push(`${rel}: preloads an image — forbidden (WTV-042). Preloading the hero measured 2.3s worse on LCP because it starves the render-blocking CSS the hero needs to paint. Delete the tag; fetchpriority="high" on the <img> already supplies the priority.`);
        }
      }
    }
  })(root);
  if (failures.length) {
    console.error('Structural gate checks failed:');
    for (const failure of failures) console.error('- ' + failure);
    process.exit(1);
  }
}

const hits = [];
walk(root, hits);

if (hits.length) {
  console.error('Unresolved template placeholders found:');
  for (const hit of hits.slice(0, 200)) {
    console.error('- ' + hit.file + ': ' + hit.token);
  }
  if (hits.length > 200) console.error('...and ' + (hits.length - 200) + ' more.');
  process.exit(1);
}

console.log(mode === 'launch'
  ? 'Launch placeholder scan passed.'
  : 'Template placeholder scan passed.');
