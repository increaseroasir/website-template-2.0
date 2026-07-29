#!/usr/bin/env node
/* verify-product-route.mjs — proves a deployed product URL both ROUTES and RENDERS.
 *
 *   node scripts/verify-product-route.mjs <base-url> [slug] [--no-render]
 *
 * Without a slug it reads one from the live /api/inventory (preferring a
 * featured, available unit) so the check can never chase an invented slug
 * (WTV-031).
 *
 * Two separate failure modes are covered, because the first version of this
 * script only caught the first and shipped a broken page anyway:
 *
 *   1. ROUTING (HTTP)   — WTV-034: the `_redirects` 200-proxy pointed at
 *      `.../SLUG/index.html`. Pages 308-normalizes the extension away and does
 *      not chain redirects, so the destination resolved to a redirect instead
 *      of an asset and every product URL 404'd.
 *   2. RENDERING (JS)   — WTV-035: the shell shipped a build-time
 *      `data-product-slug`, which the renderer preferred over the URL. Every
 *      unit requested one hardcoded slug, got no row, and printed "Product
 *      unavailable" — with a perfect 200 and a perfectly valid shell. HTTP
 *      checks alone cannot see this.
 *
 * The render pass drives headless Chrome (no npm dependency) and asserts the
 * rendered product and the emitted Product JSON-LD match the real API record.
 * Set CHROME_PATH to override binary detection. --no-render downgrades the
 * render pass to a skip; only use it where no browser can be installed.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const argv = process.argv.slice(2);
const noRender = argv.includes('--no-render');
const [baseArg, slugArg] = argv.filter(a => !a.startsWith('--'));

if (!baseArg) {
  console.error('usage: node scripts/verify-product-route.mjs <base-url> [slug] [--no-render]');
  process.exit(2);
}
const base = baseArg.replace(/\/+$/, '');
const results = [];
const add = (name, pass, detail) => results.push({ name, pass, detail });

async function head(url) {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') || '' };
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/snap/bin/chromium'
  ].filter(Boolean);
  return candidates.find(p => existsSync(p)) || '';
}

/* ---------- resolve a real slug + its authoritative record ---------- */
let slug = slugArg;
let record = null;
{
  const res = await fetch(`${base}/api/inventory`);
  if (!res.ok) {
    console.error(`FAIL: /api/inventory returned ${res.status} — cannot resolve inventory.`);
    process.exit(1);
  }
  const body = await res.json();
  const list = Array.isArray(body) ? body : (body.products || body.data || []);
  if (slug) {
    record = list.find(p => p.slug === slug) || null;
    if (!record) {
      console.error(`FAIL: slug "${slug}" is not in live inventory. Never test an invented slug (WTV-031).`);
      process.exit(1);
    }
  } else {
    record = list.find(p => p.featured && p.status === 'available')
      || list.find(p => p.status === 'available') || list[0];
    if (!record?.slug) {
      console.error('FAIL: /api/inventory returned no products with a slug.');
      process.exit(1);
    }
    slug = record.slug;
  }
  add('slug resolved from live inventory (not constructed)', true, `${slug} — "${record.inventory_name || '(unnamed)'}"`);
}

/* ---------- 1. ROUTING ---------- */
const canonical = await head(`${base}/active-inventory/${slug}/`);
add('GET /active-inventory/<slug>/ → 200', canonical.status === 200,
  `got ${canonical.status}${canonical.location ? ` → ${canonical.location}` : ''}`);

const bare = await head(`${base}/active-inventory/${slug}`);
add('GET /active-inventory/<slug> → 301 to trailing slash',
  bare.status === 301 && bare.location.endsWith(`/active-inventory/${slug}/`),
  `got ${bare.status} → ${bare.location || '(none)'}`);

const listing = await fetch(`${base}/active-inventory/`);
const listingHtml = listing.ok ? await listing.text() : '';
add('GET /active-inventory/ still serves the listing, not the product shell',
  listing.status === 200 && !listingHtml.includes('data-pdp-headline'),
  `status ${listing.status}, pdp markers ${listingHtml.includes('data-pdp-headline') ? 'PRESENT (shadowed!)' : 'absent'}`);

const page = await fetch(`${base}/active-inventory/${slug}/`);
const html = page.ok ? await page.text() : '';
add('served document is the product shell', html.includes('data-pdp-headline'),
  page.status === 200 ? 'shell markers found' : `status ${page.status}`);

const offRoute = await head(`${base}/definitely-not-a-real-page-zzz/`);
add('unrelated path still 404s (proxy is scoped, no site-wide catch-all)',
  offRoute.status === 404, `got ${offRoute.status}`);

/* The shell must not carry a hardcoded slug: it is served for every product
   URL, so any build-time value pins all units to one record (WTV-035). */
const pinned = /<body[^>]*\sdata-product-slug=["']([^"']*)["']/i.exec(html);
const pinnedValue = (pinned?.[1] || '').replace(/\{\{[^}]+\}\}/g, '').trim();
add('shell carries no build-time data-product-slug', !pinnedValue,
  pinnedValue ? `pinned to "${pinnedValue}" — every unit would request this slug` : 'absent or empty');

/* ---------- 2. RENDERING (the part HTTP cannot see) ---------- */
const chrome = noRender ? '' : findChrome();
if (noRender) {
  add('RENDER: skipped via --no-render', true, 'routing only — dynamic rendering NOT verified');
} else if (!chrome) {
  add('RENDER: headless browser available', false,
    'no Chrome/Chromium found — set CHROME_PATH. Without this, a page that 200s but renders "Product unavailable" passes unnoticed (WTV-035).');
} else {
  let dom = '';
  try {
    const { stdout } = await run(chrome, [
      '--headless', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=8000',
      '--dump-dom', `${base}/active-inventory/${slug}/`
    ], { maxBuffer: 32 * 1024 * 1024 });
    dom = stdout;
  } catch (err) {
    add('RENDER: page rendered', false, `headless Chrome failed: ${err.message.slice(0, 160)}`);
  }

  if (dom) {
    add('RENDER: no "Product unavailable" error state', !/Product unavailable/i.test(dom),
      /Product unavailable/i.test(dom) ? 'renderer could not resolve this slug — check data-product-slug and /api/inventory?slug=' : 'clean');

    const expectedName = record.inventory_name || '';
    add('RENDER: page shows the real product name from D1',
      Boolean(expectedName) && dom.includes(expectedName),
      expectedName ? `expected "${expectedName}"${dom.includes(expectedName) ? '' : ' — NOT found in rendered DOM'}` : 'record has no inventory_name');

    const ld = [...dom.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => { try { return JSON.parse(m[1]); } catch { return null; } })
      .filter(Boolean);
    const product = ld.find(o => o['@type'] === 'Product');
    add('RENDER: Product JSON-LD emitted', Boolean(product),
      product ? `@type Product present (${ld.length} ld+json block(s))` : `no Product schema among ${ld.length} block(s)`);

    if (product) {
      add('RENDER: JSON-LD name matches the D1 record', product.name === expectedName,
        `schema "${product.name}" vs D1 "${expectedName}"`);
      const offerUrl = product.offers?.url || '';
      add('RENDER: JSON-LD offer URL points at THIS slug',
        offerUrl.includes(`/active-inventory/${slug}/`),
        offerUrl || '(no offers.url)');
    }
  }
}

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name} — ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} passed for slug "${slug}" on ${base}`);
if (chrome) console.log(`rendered with: ${chrome}`);
process.exit(failed.length ? 1 : 0);
