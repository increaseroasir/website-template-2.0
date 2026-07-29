#!/usr/bin/env node
/**
 * Paired A/B on PageSpeed Insights.
 *
 *   node scripts/psi-ab.mjs <urlA> <urlB> [--pairs 6] [--label-a X] [--label-b Y]
 *
 * Why this exists rather than two runs of psi-check.mjs:
 *
 * 1. INTERLEAVING. PSI's runner speed drifts (benchmarkIndex has been observed
 *    135-1294 within a session). Measuring all of arm A then all of arm B lets
 *    that drift masquerade as an effect. Alternating A,B,A,B pairs the arms in
 *    time, so drift hits both arms equally and cancels in the paired delta.
 *
 * 2. RESILIENCE. PSI returns a transient 500 "lighthouseError" often enough
 *    that psi-check.mjs's abort-on-first-error kills a 5-run batch routinely.
 *    Here a failed call is retried, and only successful runs are counted.
 *
 * 3. PAIRED STATISTICS. Reports the per-pair delta, not just two medians, so a
 *    consistent small effect is distinguishable from noise that happens to move
 *    two medians apart.
 *
 * Reports median and full spread for both arms, plus the sign of every pair.
 */

import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const urls = argv.filter((a, i) => !a.startsWith('--') && !String(argv[i - 1] || '').startsWith('--'));
const [urlA, urlB] = urls;
const pairs = Number(flag('--pairs', 6));
const labelA = flag('--label-a', 'A');
const labelB = flag('--label-b', 'B');

if (!urlA || !urlB) {
  console.error('usage: node scripts/psi-ab.mjs <urlA> <urlB> [--pairs 6] [--label-a X] [--label-b Y]');
  process.exit(2);
}

let key = process.env.PAGESPEED_API_KEY;
if (!key) {
  try {
    key = (readFileSync('.env.psi', 'utf8').match(/PAGESPEED_API_KEY=(.+)/) || [])[1]?.trim();
  } catch { /* no local key file */ }
}
if (!key) { console.error('PAGESPEED_API_KEY not set and .env.psi not readable'); process.exit(2); }

const endpoint = (url) => 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
  + `?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&key=${key}`;

async function measure(url, attempt = 1) {
  const res = await fetch(endpoint(url));
  if (!res.ok) {
    if (attempt >= 5) return null;
    await new Promise((r) => setTimeout(r, 4000 * attempt));
    return measure(url, attempt + 1);
  }
  const body = await res.json();
  const lhr = body.lighthouseResult;
  const audits = lhr.audits;
  const phases = audits['lcp-breakdown-insight']?.details?.items?.[0]?.items || [];
  const render = phases.find((p) => p.subpart === 'elementRenderDelay')?.duration;
  return {
    perf: Math.round(lhr.categories.performance.score * 100),
    lcp: audits['largest-contentful-paint']?.numericValue / 1000,
    fcp: audits['first-contentful-paint']?.numericValue / 1000,
    tbt: audits['total-blocking-time']?.numericValue,
    render,
    bench: lhr.environment?.benchmarkIndex,
    fetchTime: lhr.fetchTime
  };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const f = (n, d = 2) => (n == null ? '  —  ' : n.toFixed(d));

const A = [];
const B = [];
console.log(`\nPaired PSI A/B, mobile, ${pairs} pairs, interleaved\n  ${labelA}: ${urlA}\n  ${labelB}: ${urlB}\n`);
console.log(`  pair   ${labelA.padEnd(6)} perf  LCP     ${labelB.padEnd(6)} perf  LCP     ΔLCP(${labelB}-${labelA})  bench`);

for (let i = 1; i <= pairs; i++) {
  /* Alternate which arm goes first, so a systematic within-pair ordering
     effect (edge state, runner warm-up) cannot favour one arm. */
  const aFirst = i % 2 === 1;
  const first = aFirst ? urlA : urlB;
  const second = aFirst ? urlB : urlA;
  const r1 = await measure(first);
  const r2 = await measure(second);
  const ra = aFirst ? r1 : r2;
  const rb = aFirst ? r2 : r1;
  if (ra) A.push(ra);
  if (rb) B.push(rb);
  const d = ra && rb ? rb.lcp - ra.lcp : null;
  console.log(`  ${String(i).padStart(4)}   ${String(ra?.perf ?? '—').padStart(9)}  ${f(ra?.lcp)}s`
    + `   ${String(rb?.perf ?? '—').padStart(9)}  ${f(rb?.lcp)}s`
    + `   ${d == null ? '   —  ' : (d > 0 ? '+' : '') + f(d) + 's'}`
    + `        ${ra?.bench ?? '—'}/${rb?.bench ?? '—'}`);
}

function summary(label, rows) {
  if (!rows.length) { console.log(`\n  ${label}: no successful runs`); return null; }
  const perf = rows.map((r) => r.perf);
  const lcp = rows.map((r) => r.lcp);
  console.log(`\n  ${label}  n=${rows.length}  distinct analyses=${new Set(rows.map((r) => r.fetchTime)).size}`);
  console.log(`    performance   median ${median(perf)}   range ${Math.min(...perf)}-${Math.max(...perf)}`);
  console.log(`    LCP           median ${f(median(lcp))}s   range ${f(Math.min(...lcp))}-${f(Math.max(...lcp))}s`);
  console.log(`    FCP           median ${f(median(rows.map((r) => r.fcp)))}s`);
  console.log(`    TBT           median ${Math.round(median(rows.map((r) => r.tbt)))}ms`);
  const rd = rows.map((r) => r.render).filter((x) => x != null);
  if (rd.length) console.log(`    render delay  median ${Math.round(median(rd))}ms  (relative weight only)`);
  console.log(`    benchmarkIndex median ${Math.round(median(rows.map((r) => r.bench)))}`);
  return { perf: median(perf), lcp: median(lcp) };
}

const sa = summary(labelA, A);
const sb = summary(labelB, B);

if (sa && sb) {
  const dLcp = sb.lcp - sa.lcp;
  const dPerf = sb.perf - sa.perf;
  console.log(`\n  ${labelB} minus ${labelA}:  LCP ${dLcp > 0 ? '+' : ''}${f(dLcp)}s   performance ${dPerf > 0 ? '+' : ''}${dPerf}`);
  const n = Math.min(A.length, B.length);
  let wins = 0;
  for (let i = 0; i < n; i++) if (B[i].lcp < A[i].lcp) wins++;
  console.log(`  paired: ${labelB} had the lower LCP in ${wins}/${n} pairs`);
  const overlap = Math.max(...A.map((r) => r.lcp)) >= Math.min(...B.map((r) => r.lcp))
    && Math.max(...B.map((r) => r.lcp)) >= Math.min(...A.map((r) => r.lcp));
  console.log(`  ranges ${overlap ? 'OVERLAP — treat as inconclusive on this evidence' : 'do NOT overlap — separation is clean'}`);
}
console.log('');
