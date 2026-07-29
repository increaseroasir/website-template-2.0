#!/usr/bin/env node
/**
 * Reproducible Lighthouse gate (WTV-036).
 *
 * Every prior Lighthouse number in this project was produced by hand in a
 * browser, so results were unrepeatable and nobody could tell a real
 * regression from run-to-run noise. This runs the audit the same way every
 * time and applies explicit thresholds.
 *
 *   node scripts/lighthouse-check.mjs <url>              # mobile (default)
 *   node scripts/lighthouse-check.mjs <url> --desktop
 *   node scripts/lighthouse-check.mjs <url> --json out.json
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
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;

if (!url) {
  console.error('usage: node scripts/lighthouse-check.mjs <url> [--desktop] [--json out.json]');
  process.exit(2);
}

/* Mobile is the default because that is where this template actually loses
   points: the desktop profile has never been the binding constraint. */
const THRESHOLDS = desktop
  ? { performance: 90, accessibility: 95, seo: 90 }
  : { performance: 70, accessibility: 95, seo: 90 };

const isPagesPreview = /\.pages\.dev$/i.test(new URL(url).hostname);

const tmp = mkdtempSync(join(tmpdir(), 'lh-'));
const report = join(tmp, 'report.json');

console.log(`\nLighthouse (${desktop ? 'desktop' : 'mobile'})  ${url}\n`);

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
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(lhr, null, 2));

const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
const results = {
  performance: score('performance'),
  accessibility: score('accessibility'),
  'best-practices': score('best-practices'),
  seo: score('seo'),
};

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
  'target-size', 'render-blocking-resources', 'uses-responsive-images',
  'unused-javascript', 'is-crawlable',
];
const broken = WATCHED
  .map((id) => lhr.audits[id])
  .filter((a) => a && a.score !== null && a.score < 1);

if (broken.length) {
  console.log('\n  failing audits:');
  for (const a of broken) console.log(`    - ${a.id}: ${a.title}`);
}

if (isPagesPreview) {
  console.log('\n  note: *.pages.dev sends X-Robots-Tag: noindex — SEO is not');
  console.log('        meaningful here. Re-run on the canonical domain after DNS.');
}

console.log('');
process.exit(failed ? 1 : 0);
