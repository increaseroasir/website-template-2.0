#!/usr/bin/env node
/**
 * PageSpeed Insights gate — the number of record for the launch check.
 *
 *   node scripts/psi-check.mjs <url>                # mobile (default)
 *   node scripts/psi-check.mjs <url> --desktop
 *   node scripts/psi-check.mjs <url> --runs 5
 *   node scripts/psi-check.mjs <url> --json out.json
 *
 * THE MEASUREMENT TRAP THIS CLOSES. `scripts/lighthouse-check.mjs` runs
 * Lighthouse on whatever machine invokes it, and Lighthouse's CPU throttling is
 * a fixed multiplier applied to that machine's speed — so a fast dev box stays
 * fast even "throttled". Measured on one unchanged URL:
 *   local Lighthouse, benchmarkIndex ~3995  -> performance 99
 *   PSI runner,       benchmarkIndex ~738   -> performance 66
 * Same bytes, 33 points apart. PSI deliberately emulates a mid-tier phone, and
 * PSI is what Google reports and what the launch gate is written against. A
 * local pass therefore proves nothing; this script is the authority.
 *
 * Keep using lighthouse-check.mjs for fast iteration — it is free and instant.
 * Confirm here before calling a performance problem fixed.
 *
 * SEO scoring caveat, same as lighthouse-check.mjs: Cloudflare serves
 * `X-Robots-Tag: noindex` on every *.pages.dev hostname, which costs ~34 SEO
 * points no matter what the markup says. That is a property of the preview
 * host, so SEO is only enforced on a canonical domain. Re-run after DNS
 * cutover before signing off on SEO.
 *
 * The API key lives in `.env.psi` (git-ignored), never in this file.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http'));
const desktop = args.includes('--desktop');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const runs = args.includes('--runs') ? Math.max(1, Number(args[args.indexOf('--runs') + 1]) || 3) : 3;
const keyArg = args.includes('--key') ? args[args.indexOf('--key') + 1] : null;

if (!url) {
  console.error('usage: node scripts/psi-check.mjs <url> [--desktop] [--runs N] [--json out.json]');
  process.exit(2);
}

/* A dotenv dependency would be a whole package to split a string on '='. */
function readEnvFile(path) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return {};
  }
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiKey = process.env.PAGESPEED_API_KEY || keyArg || readEnvFile(join(repoRoot, '.env.psi')).PAGESPEED_API_KEY;

if (!apiKey) {
  console.error('\nNo PageSpeed API key found.');
  console.error('');
  console.error('PSI does answer without a key, but the keyless quota is tiny and shared by');
  console.error('IP — three runs of this script will usually exhaust it and every later call');
  console.error('fails with a 429. So the key is required here rather than optional.');
  console.error('');
  console.error('Put it in .env.psi at the repo root (git-ignored, same pattern as .dev.vars):');
  console.error('    PAGESPEED_API_KEY=your-key-here');
  console.error('');
  console.error('Or pass --key <key>, or export PAGESPEED_API_KEY. Get a key from the Google');
  console.error('Cloud console with the "PageSpeed Insights API" enabled on the project.');
  console.error('');
  process.exit(2);
}

const THRESHOLDS = desktop
  ? { performance: 90, accessibility: 95, seo: 90 }
  : { performance: 70, accessibility: 95, seo: 90 };

const isPagesPreview = /\.pages\.dev$/i.test(new URL(url).hostname);

console.log(`\nPageSpeed Insights (${desktop ? 'desktop' : 'mobile'})  ${url}`);
console.log(`  runs: ${runs} (median)   scored on Google's runner, not this machine\n`);

async function runOnce() {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', desktop ? 'desktop' : 'mobile');
  for (const c of ['performance', 'accessibility', 'seo', 'best-practices']) {
    endpoint.searchParams.append('category', c);
  }
  endpoint.searchParams.set('key', apiKey);

  let res;
  try {
    res = await fetch(endpoint, { headers: { accept: 'application/json' } });
  } catch (err) {
    console.error(`\n  PSI request failed to send: ${err.message}`);
    console.error('  Check network access to www.googleapis.com.');
    process.exit(1);
  }

  const body = await res.json().catch(() => null);

  /* PSI reports failures as a 4xx/5xx with an `error` object, and the message
     is the only place the real cause appears. */
  if (!res.ok || body?.error) {
    const e = body?.error;
    console.error(`\n  PSI error ${e?.code ?? res.status}: ${e?.message ?? res.statusText}`);
    for (const d of e?.errors ?? []) {
      if (d.reason && d.reason !== e?.status) console.error(`    reason: ${d.reason}`);
    }
    console.error('');
    console.error('  Common causes:');
    console.error('    - quota exceeded (429): too many runs too fast, or a keyless call');
    console.error('    - key rejected (403): PageSpeed Insights API not enabled on the');
    console.error('      project, or the key is restricted to a different API/referrer');
    console.error('    - URL unreachable (400/500): PSI could not load the page at all —');
    console.error('      confirm it responds 200 publicly, with no auth or geo block');
    console.error('');
    process.exit(1);
  }

  const lhr = body?.lighthouseResult;
  if (!lhr) {
    console.error('\n  PSI returned no lighthouseResult. Retry; this is usually transient.\n');
    process.exit(1);
  }
  if (lhr.runtimeError?.code && lhr.runtimeError.code !== 'NO_ERROR') {
    console.error(`\n  PSI runtime error: ${lhr.runtimeError.message}\n`);
    process.exit(1);
  }
  return lhr;
}

const reports = [];
for (let i = 0; i < runs; i++) {
  const lhr = await runOnce();
  const perf = Math.round((lhr.categories.performance?.score ?? 0) * 100);
  const lcp = lhr.audits['largest-contentful-paint']?.numericValue ?? 0;
  console.log(`  run ${i + 1}: performance ${String(perf).padStart(3)}   LCP ${(lcp / 1000).toFixed(2)}s`);
  reports.push({ lhr, perf });
}

/* PSI will happily serve one analysis to several identical back-to-back
   requests, and it looks exactly like a real run — three "runs" returning the
   same score in 13s total instead of ~90s. Left undetected that turns the
   median into a single measurement, which is the whole thing this gate is
   trying to avoid. fetchTime is the only reliable tell. Requesting a fresh
   analysis is not an option: the usual trick, a cache-busting query string,
   changes the URL and so measures a cold Cloudflare edge instead of the site. */
const distinctLoads = new Set(reports.map((r) => r.lhr.fetchTime)).size;

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

console.log(`\n  median of ${runs} run(s)${distinctLoads < runs ? ` — WARNING: only ${distinctLoads} distinct PSI analysis(es)` : ''}:`);
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

const METRICS = [
  ['first-contentful-paint', 'FCP'],
  ['largest-contentful-paint', 'LCP'],
  ['total-blocking-time', 'TBT'],
  ['cumulative-layout-shift', 'CLS'],
  ['speed-index', 'Speed Index'],
];
console.log('\n  metrics:');
for (const [id, label] of METRICS) {
  const a = lhr.audits[id];
  if (a?.displayValue) console.log(`    ${label.padEnd(12)} ${a.displayValue}`);
}

/* The single most useful diagnostic PSI gives us. Splitting LCP into server
   time vs discovery delay vs transfer vs render delay is what tells you whether
   to fix the origin, the preload, the image, or the main thread — the score
   alone never does. */
const breakdown = lhr.audits['lcp-breakdown-insight']?.details?.items
  ?.find((i) => i.type === 'table')?.items ?? [];
if (breakdown.length) {
  console.log('\n  LCP breakdown:');
  for (const row of breakdown) {
    console.log(`    ${String(row.label ?? row.subpart).padEnd(24)} ${String(Math.round(row.duration ?? 0)).padStart(6)} ms`);
  }
}

/* Every audit PSI thinks it can quantify a win for, biggest first, so a failure
   is a work list instead of a number. */
const savings = Object.values(lhr.audits)
  .filter((a) => a.score !== null && a.score < 1)
  .map((a) => ({
    id: a.id,
    title: a.title,
    ms: a.details?.overallSavingsMs ?? 0,
    bytes: a.details?.overallSavingsBytes ?? 0,
  }))
  .filter((a) => a.ms > 0 || a.bytes > 0)
  .sort((a, b) => b.ms - a.ms || b.bytes - a.bytes);

if (savings.length) {
  console.log('\n  opportunities (PSI estimate):');
  for (const s of savings) {
    const ms = s.ms ? `${Math.round(s.ms)} ms` : '';
    const kb = s.bytes ? `${Math.round(s.bytes / 1024)} KiB` : '';
    console.log(`    ${[ms, kb].filter(Boolean).join(', ').padEnd(18)} ${s.id}`);
  }
}

/* Whose machine produced this number. Google's runner sits far below a dev box
   on purpose; printing it stops the next operator from "reproducing" the score
   locally and concluding the site is fine. */
const bench = lhr.environment?.benchmarkIndex;
console.log(`\n  runner: Google PSI   lighthouse ${lhr.lighthouseVersion ?? '?'}   benchmarkIndex ${
  typeof bench === 'number' ? Math.round(bench) : '?'
}`);
console.log('          a local run on a dev laptop indexes ~4000 and scores far higher');
console.log('          on identical bytes. This number is the one that counts.');

if (distinctLoads < runs) {
  console.log('\n  note: PSI reused a cached analysis, so this is really the median of');
  console.log(`        ${distinctLoads} load(s), not ${runs}. Run-to-run spread on this API is wide`);
  console.log('        (10+ points is normal). Wait a minute and re-run before trusting');
  console.log('        a number that sits near a threshold.');
}

if (isPagesPreview) {
  console.log('\n  note: *.pages.dev sends X-Robots-Tag: noindex — SEO is not');
  console.log('        meaningful here. Re-run on the canonical domain after DNS.');
}

console.log('');
process.exit(failed ? 1 : 0);
