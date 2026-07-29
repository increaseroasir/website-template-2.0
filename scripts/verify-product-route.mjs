#!/usr/bin/env node
/* verify-product-route.mjs — proves the dynamic product route survives deploy.
 *
 *   node scripts/verify-product-route.mjs <base-url> [slug]
 *
 * Without a slug it reads one from the live /api/inventory (preferring a
 * featured, available unit) so the check can never chase an invented slug
 * (WTV-031).
 *
 * Why this exists: the `/active-inventory/:slug/ … 200` proxy silently 404s
 * whenever its destination is itself a redirect. Cloudflare Pages 308-normalizes
 * `/index.html` away and does NOT chain redirects, so a destination of
 * `/active-inventory/SLUG/index.html` resolves to a redirect, not an asset, and
 * every product URL dies while the rest of the site looks perfect (WTV-034).
 *
 * Scope limit, stated honestly: Product JSON-LD is injected at runtime by
 * assets/product-page.js, so an HTTP fetch cannot see it. This script asserts
 * the emitter is wired and reachable; schema presence itself must be confirmed
 * with a JS-rendering tool (Rich Results Test / headless browser).
 */
const [, , baseArg, slugArg] = process.argv;
if (!baseArg) {
  console.error('usage: node scripts/verify-product-route.mjs <base-url> [slug]');
  process.exit(2);
}
const base = baseArg.replace(/\/+$/, '');
const results = [];
const add = (name, pass, detail) => { results.push({ name, pass, detail }); };

async function head(url) {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') || '' };
}

let slug = slugArg;
if (!slug) {
  const res = await fetch(`${base}/api/inventory`);
  if (!res.ok) {
    console.error(`FAIL: /api/inventory returned ${res.status} — cannot resolve a slug.`);
    process.exit(1);
  }
  const body = await res.json();
  const list = Array.isArray(body) ? body : (body.products || body.data || []);
  const pick = list.find(p => p.featured && p.status === 'available')
    || list.find(p => p.status === 'available')
    || list[0];
  if (!pick?.slug) {
    console.error('FAIL: /api/inventory returned no products with a slug.');
    process.exit(1);
  }
  slug = pick.slug;
  add('slug resolved from live inventory (not constructed)', true, slug);
}

/* 1. canonical trailing-slash URL must serve the shell directly with 200 */
const canonical = await head(`${base}/active-inventory/${slug}/`);
add('GET /active-inventory/<slug>/ → 200', canonical.status === 200,
  `got ${canonical.status}${canonical.location ? ` → ${canonical.location}` : ''}`);

/* 2. non-slash form must 301 to the canonical form (no dead end) */
const bare = await head(`${base}/active-inventory/${slug}`);
add('GET /active-inventory/<slug> → 301 to trailing slash',
  bare.status === 301 && bare.location.endsWith(`/active-inventory/${slug}/`),
  `got ${bare.status} → ${bare.location || '(none)'}`);

/* 3. the listing page must NOT be shadowed by the product proxy */
const listing = await fetch(`${base}/active-inventory/`);
const listingHtml = listing.ok ? await listing.text() : '';
add('GET /active-inventory/ still serves the listing, not the product shell',
  listing.status === 200 && !listingHtml.includes('data-pdp-headline'),
  `status ${listing.status}, pdp markers ${listingHtml.includes('data-pdp-headline') ? 'PRESENT (shadowed!)' : 'absent'}`);

/* 4. the served shell must be the product template and carry the schema emitter */
const page = await fetch(`${base}/active-inventory/${slug}/`);
const html = page.ok ? await page.text() : '';
add('served document is the product shell (data-pdp-headline present)',
  html.includes('data-pdp-headline'), page.status === 200 ? 'shell markers found' : `status ${page.status}`);
add('product-page.js loaded (runtime hydration + Product JSON-LD emitter)',
  /assets\/product-page\.js/.test(html), 'script tag present');
/* 5. the proxy must stay scoped: paths outside /active-inventory/ still 404.
   (Unknown *slugs* legitimately return 200 — the shell renders a not-found
   state client-side after querying the API. That is the design, not a leak.) */
const offRoute = await head(`${base}/definitely-not-a-real-page-zzz/`);
add('unrelated path still 404s (proxy is scoped, no site-wide catch-all)',
  offRoute.status === 404, `got ${offRoute.status}`);

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name} — ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} passed for slug "${slug}" on ${base}`);
console.log('MANUAL: confirm Product JSON-LD with a JS-rendering tool — runtime-injected, not visible to fetch.');
process.exit(failed.length ? 1 : 0);
