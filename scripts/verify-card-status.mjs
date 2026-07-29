#!/usr/bin/env node
/**
 * Prove the sold / pending card treatment on every surface that renders a card.
 *
 * Three renderers draw product cards (category grid, active-inventory grid,
 * homepage rail) and the homepage keeps its own hidden fields, so a status fix
 * applied to one is silently absent from the others. This renders the real
 * template against a stubbed inventory, clicks the CTAs, and asserts both the
 * visual demotion and the values the CRM would actually receive.
 *
 *   npm run verify:cards
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const freePort = () => new Promise((resolve, reject) => {
  const srv = createServer();
  srv.on('error', reject);
  srv.listen(0, '127.0.0.1', () => {
    const { port } = srv.address();
    srv.close(() => resolve(port));
  });
});

const waitFor = async (url, tries = 40) => {
  for (let i = 0; i < tries; i++) {
    try { await fetch(url); return true; } catch { await new Promise(r => setTimeout(r, 300)); }
  }
  return false;
};

const sitePort = await freePort();
const cdpPort = await freePort();
const ORIGIN = `http://127.0.0.1:${sitePort}`;
const CDP = `http://127.0.0.1:${cdpPort}`;

const fixture = spawn('python3', [path.join(HERE, 'lib', 'card-status-fixture.py'), String(sitePort), ROOT], { stdio: 'ignore' });
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${path.join(process.env.TMPDIR || '/tmp', 'card-status-profile')}`,
  '--no-first-run', '--disable-gpu', 'about:blank'
], { stdio: 'ignore' });

const shutdown = () => { fixture.kill(); chrome.kill(); };
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });

if (!await waitFor(`${ORIGIN}/hot-tubs/`)) { console.error('fixture server did not start'); process.exit(1); }
if (!await waitFor(`${CDP}/json/version`)) {
  console.error(`headless Chrome did not start. Set CHROME_PATH if Chrome lives elsewhere than:\n  ${CHROME}`);
  process.exit(1);
}

const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const sock = new WebSocket(created.webSocketDebuggerUrl);
await new Promise(r => sock.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map();
sock.addEventListener('message', e => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id); pending.delete(msg.id);
    msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq; pending.set(id, { resolve, reject });
  sock.send(JSON.stringify({ id, method, params }));
});
const ev = async expression => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r.result.value;
};
const go = async p => { await send('Page.navigate', { url: ORIGIN + p }); await new Promise(r => setTimeout(r, 2400)); };

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1360, height: 1100, deviceScaleFactor: 1, mobile: false });

const results = [];
const check = (label, ok, detail = '') => results.push({ label, ok, detail });

const CARD_JS = `
  Array.from(document.querySelectorAll('[data-product-card], .product-card, .inv-card')).map(function (c) {
    var btn = c.querySelector('[data-open-lead], [data-home-prefill]');
    var img = c.querySelector('img');
    var cs = btn ? getComputedStyle(btn) : null;
    return {
      status: c.getAttribute('data-inventory-status') || '',
      badge: (c.querySelector('.sale-badge, .badge, .product-tag') || {}).textContent || '',
      cta: btn ? btn.textContent.replace(/\\s+/g, ' ').trim() : null,
      gold: cs ? /rgb\\(255, 21[0-9]/.test(cs.backgroundImage) : null,
      red: cs ? /rgb\\(23[0-9], 5[0-9], 4[0-9]\\)/.test(cs.backgroundImage) : null,
      navy: cs ? /rgb\\(2[0-9], 70, 15[0-9]\\)|rgb\\(11, 37, 89\\)/.test(cs.backgroundImage) : null,
      grayed: img ? /grayscale\\(0?\\.\\d+\\)/.test(getComputedStyle(img).filter) : null,
      priceText: (c.querySelector('.price, .price-block, .inv-price-box') || {}).textContent || ''
    };
  })`;

const trim = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60);

// ---- category grid ----
await go('/hot-tubs/');
let cards = await ev(CARD_JS);
let sold = cards.find(c => c.status === 'sold');
let pend = cards.find(c => c.status === 'pending');
let live = cards.find(c => !c.status);
check('category: sold badge reads Sold', /^sold$/i.test((sold?.badge || '').trim()), sold?.badge);
check('category: sold CTA is the restock ask', /restock/i.test(sold?.cta || ''), sold?.cta);
check('category: sold CTA is not gold', sold?.gold === false);
check('category: sold photo is desaturated', sold?.grayed === true);
check('category: pending CTA asks about similar models', /similar/i.test(pend?.cta || ''), pend?.cta);
check('category: pending photo is NOT desaturated', pend?.grayed === false);
check('category: available CTA keeps its gold fill', live?.gold === true);

// ---- active-inventory grid ----
await go('/active-inventory/');
cards = await ev(CARD_JS);
sold = cards.find(c => c.status === 'sold');
pend = cards.find(c => c.status === 'pending');
live = cards.find(c => !c.status);
check('inventory: sold CTA is the restock ask', /restock/i.test(sold?.cta || ''), sold?.cta);
check('inventory: sold CTA drops the red buy fill', sold?.red === false);
check('inventory: sold CTA is navy, still primary beside View Details', sold?.navy === true);
check('inventory: pending CTA drops the red buy fill', pend?.red === false);
check('inventory: available CTA keeps the red buy fill', live?.red === true);
check('inventory: sold price box states no longer available',
  /no longer available/i.test(sold?.priceText || ''), trim(sold?.priceText));
check('inventory: pending keeps pricing for a backup buyer',
  !/no longer available/i.test(pend?.priceText || ''), trim(pend?.priceText));

const panel = await ev(`
  (function () {
    var card = document.querySelector('[data-inventory-status="sold"]');
    var btn = card && card.querySelector('[data-open-lead]');
    if (!btn) return { error: 'no sold lead button' };
    btn.click();
    var form = document.querySelector('[data-lead-panel] form');
    if (!form) return { error: 'no panel form' };
    var out = {};
    ['inventory_status', 'inventory_status_tag', 'form_intent'].forEach(function (n) {
      var el = form.querySelector('[name="' + n + '"]');
      out[n] = el ? el.value : '(absent)';
    });
    return out;
  })()`);
// The stub ships a stale "Inventory Status - Available" tag on purpose.
check('inventory: CRM tag follows live status, not stored ghl_tags',
  panel.inventory_status_tag === 'Inventory Status - Sold', panel.inventory_status_tag);
// form_intent is a three-option <select> here; an unlisted value blanks it.
check('inventory: CRM intent survives the <select>',
  panel.form_intent === 'Next Available Unit Request', panel.form_intent || '(blank)');

// ---- homepage rail (separate prefill path, its own hidden fields) ----
await go('/');
cards = await ev(CARD_JS);
sold = cards.find(c => c.status === 'sold');
check('home: sold CTA is the restock ask', /restock/i.test(sold?.cta || ''), sold?.cta);
check('home: sold photo is desaturated', sold?.grayed === true);
check('home: sold CTA is not gold', sold?.gold === false);

const home = await ev(`
  (function () {
    var card = document.querySelector('[data-inventory-status="sold"]');
    var btn = card && card.querySelector('[data-home-prefill]');
    if (!btn) return { error: 'no home prefill button' };
    btn.click();
    var form = document.getElementById('leadForm');
    if (!form) return { error: 'no homepage form' };
    var out = {};
    ['product_name', 'inventory_status', 'inventory_status_tag', 'form_intent'].forEach(function (n) {
      var el = form.querySelector('[name="' + n + '"]');
      out[n] = el ? el.value : '(absent)';
    });
    return out;
  })()`);
check('home: form carries the sold status', home.inventory_status === 'sold', home.inventory_status);
check('home: form carries the sold CRM tag', home.inventory_status_tag === 'Inventory Status - Sold', home.inventory_status_tag);
check('home: intent is the restock ask, not a price request',
  home.form_intent === 'Next Available Unit Request', home.form_intent || '(blank)');

console.log('Homepage form payload after clicking a sold card');
for (const [k, v] of Object.entries(home)) console.log(`  ${k}: ${JSON.stringify(v)}`);

console.log('\nAssertions');
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.label}${r.detail ? '   [' + r.detail + ']' : ''}`);
}
console.log(`\n  ${results.length - failed} PASS / ${failed} FAIL`);

sock.close();
process.exit(failed ? 1 : 0);
