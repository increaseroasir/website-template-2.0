#!/usr/bin/env node
/**
 * Reproducible Lighthouse gate (WTV-036, hardened in WTV-041).
 *
 * Every prior Lighthouse number in this project was produced by hand in a
 * browser, so results were unrepeatable and nobody could tell a real
 * regression from run-to-run noise. This runs the audit the same way every
 * time and applies explicit thresholds.
 *
 *   node scripts/lighthouse-check.mjs <url>              # mobile (default)
 *   node scripts/lighthouse-check.mjs <url> --desktop
 *   node scripts/lighthouse-check.mjs <url> --runs 5
 *   node scripts/lighthouse-check.mjs <url> --no-warm    # diagnose cold start
 *   node scripts/lighthouse-check.mjs <url> --json out.json
 *
 * TWO measurement traps this script exists to close, both of which produced
 * false launch blockers on real deployments:
 *
 * 1. COLD EDGE. A Cloudflare Pages deployment hash has an empty edge cache.
 *    The first request for the LCP hero image goes all the way to origin.
 *    Measured on one unchanged URL, one machine, identical settings:
 *      cold  -> performance 89, LCP 3.72s
 *      warm  -> performance 99, LCP 1.73s
 *    Deploy-then-immediately-audit therefore scores a CDN cold start, not the
 *    site. Every real visitor after the first hits a warm edge, so warm is the
 *    representative measurement. The cache is primed before scoring.
 *
 * 2. SINGLE RUN. Lighthouse's own guidance is to run several times and take
 *    the median; a lone run swings several points on identical bytes.
 *
 * Neither of these inflates the result — they remove noise that was hiding
 * the real number in both directions. `--no-warm` is kept so a cold start can
 * still be measured deliberately when that is the question being asked.
 *
 * SEO scoring caveat: Cloudflare serves `X-Robots-Tag: noindex` on every
 * *.pages.dev hostname, which costs ~34 SEO points no matter what the markup
 * says. That is a property of the preview host, not of the site, so the SEO
 * threshold is only enforced on a canonical domain. Always re-run against the
 * real domain after DNS cutover before signing off on SEO.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http'));
const desktop = args.includes('--desktop');
const noWarm = args.includes('--no-warm');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const runs = args.includes('--runs') ? Math.max(1, Number(args[args.indexOf('--runs') + 1]) || 3) : 3;

if (!url) {
  console.error('usage: node scripts/lighthouse-check.mjs <url> [--desktop] [--runs N] [--no-warm] [--json out.json]');
  process.exit(2);
}

/* Mobile is the default because that is where this template actually loses
   points: the desktop profile has never been the binding constraint. */
const THRESHOLDS = desktop
  ? { performance: 90, accessibility: 95, seo: 90 }
  : { performance: 65, accessibility: 95, seo: 90 };

const origin = new URL(url).origin;
const isPagesPreview = /\.pages\.dev$/i.test(new URL(url).hostname);
const tmp = mkdtempSync(join(tmpdir(), 'lh-'));

console.log(`\nLighthouse (${desktop ? 'desktop' : 'mobile'})  ${url}`);
console.log(`  runs: ${runs} (median)   cache: ${noWarm ? 'COLD — not representative' : 'warmed'}\n`);

/* Prime the edge for the document and every same-origin subresource the HTML
   references. Fetching the document alone is not enough: the LCP element is
   the hero image, and it is the hero image's origin fetch that costs the two
   seconds. */
async function warmEdge() {
  let html;
  try {
    html = await fetch(url, { cache: 'no-store' }).then((r) => r.text());
  } catch {
    console.error('  warm-up: could not fetch the page. Is the URL reachable?');
    process.exit(1);
  }
  const refs = new Set();
  const patterns = [
    /<(?:script|img)[^>]+src="([^"]+)"/gi,
    /<link[^>]+href="([^"]+)"/gi,
    /<source[^>]+srcset="([^"]+)"/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const raw = m[1].split(',')[0].trim().split(' ')[0];
      if (!raw || raw.startsWith('data:')) continue;
      let abs;
      try { abs = new URL(raw, url).href; } catch { continue; }
      if (abs.startsWith(origin)) refs.add(abs);
    }
  }
  const results = await Promise.allSettled(
    [...refs].map((r) => fetch(r, { cache: 'no-store' }).then((res) => res.arrayBuffer()))
  );
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  console.log(`  warm-up: primed ${ok}/${refs.size} same-origin assets\n`);
}

function runOnce(index) {
  const report = join(tmp, `run-${index}.json`);
  try {
    execFileSync(
      'npx',
      [
        '--yes', 'lighthouse', url,
        '--quiet',
        '--output=json',
        `--output-path=${report}`,
        '--only-categories=performance,accessibility,best-practices,seo',
        ...(desktop ? ['--preset=desktop'] : []),
        '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      ],
      { stdio: ['ignore', 'ignore', 'inherit'] }
    );
  } catch {
    console.error('Lighthouse failed to run. Is the URL reachable?');
    process.exit(1);
  }
  const lhr = JSON.parse(readFileSync(report, 'utf8'));
  if (lhr.runtimeError) {
    console.error(`Lighthouse error: ${lhr.runtimeError.message}`);
    process.exit(1);
  }
  return lhr;
}

if (!noWarm) await warmEdge();

const reports = [];
for (let i = 0; i < runs; i++) {
  const lhr = runOnce(i);
  const perf = Math.round((lhr.categories.performance?.score ?? 0) * 100);
  const lcp = lhr.audits['largest-contentful-paint']?.numericValue ?? 0;
  console.log(`  run ${i + 1}: performance ${String(perf).padStart(3)}   LCP ${(lcp / 1000).toFixed(2)}s`);
  reports.push({ lhr, perf });
}

/* Median run, chosen by performance score — the metric this gate turns on. The
   whole report from that run is then used, so the printed audits and the
   printed score always describe the same load. */
reports.sort((a, b) => a.perf - b.perf);
const median = reports[Math.floor(reports.length / 2)];
const lhr = median.lhr;
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(lhr, null, 2));

const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
const results = {
  performance: score('performance'),
  accessibility: score('accessibility'),
  'best-practices': score('best-practices'),
  seo: score('seo'),
};

console.log(`\n  median of ${runs} run(s):`);
let failed = 0;
for (const [cat, value] of Object.entries(results)) {
  const min = THRESHOLDS[cat];
  if (min === undefined) {
    console.log(`  ${cat.padEnd(16)} ${String(value).padStart(3)}`);
    continue;
  }
  const exempt = cat === 'seo' && isPagesPreview;
  const ok = value >= min;
  if (!ok && !exempt) failed++;
  const tag = exempt ? 'EXEMPT (pages.dev noindex)' : ok ? 'pass' : `FAIL (min ${min})`;
  console.log(`  ${cat.padEnd(16)} ${String(value).padStart(3)}   ${tag}`);
}

/* Surface the specific audits that have regressed before, so a failure is
   actionable instead of just a number. */
const WATCHED = [
  'aria-hidden-focus', 'label', 'heading-order', 'color-contrast',
  'target-size', 'render-blocking-resources', 'render-blocking-insight',
  'uses-responsive-images', 'unused-javascript', 'is-crawlable',
];
const broken = WATCHED
  .map((id) => lhr.audits[id])
  .filter((a) => a && a.score !== null && a.score < 1);

if (broken.length) {
  console.log('\n  failing audits:');
  for (const a of broken) console.log(`    - ${a.id}: ${a.title}`);
}

/* A slow runner produces a low score on a fast site. This does NOT exempt the
   failure — it tells the operator whether to fix the site or the runner.
   Reference: an unthrottled 2023 laptop indexes ~3900; Lighthouse itself warns
   below ~1000, where the emulated-device assumptions stop holding. */
const bench = lhr.environment?.benchmarkIndex;
if (typeof bench === 'number') {
  const note = bench < 1000 ? '  <-- very slow runner; scores are not comparable to a normal machine'
    : bench < 1800 ? '  <-- slow runner; expect several points below a normal machine'
    : '';
  console.log(`\n  runner benchmarkIndex: ${Math.round(bench)}${note}`);
  if (failed && bench < 1800) {
    console.log('  Before treating this as a site defect, re-run on a faster machine or');
    console.log('  compare against a known-good URL to separate runner speed from regression.');
  }
}

if (noWarm) {
  console.log('\n  note: --no-warm measures a cold CDN edge. On a fresh Pages deployment');
  console.log('        hash that costs ~10 performance points and ~2s of LCP, and it is');
  console.log('        not what real visitors experience. Do not gate on this number.');
}

if (isPagesPreview) {
  console.log('\n  note: *.pages.dev sends X-Robots-Tag: noindex — SEO is not');
  console.log('        meaningful here. Re-run on the canonical domain after DNS.');
}

console.log('');
process.exit(failed ? 1 : 0);
