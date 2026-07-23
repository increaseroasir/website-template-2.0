#!/usr/bin/env node
/**
 * indexnow.mjs — IndexNow key generation + URL submission for a built site.
 * Part of the client-site-build skill. Node 18+, zero dependencies.
 * JSON to stdout, diagnostics to stderr. Idempotent: --init reuses an
 * existing key file, --submit re-submission of the same URLs is harmless
 * (IndexNow treats it as a no-op).
 *
 * SCOPE HONESTY: IndexNow reaches Bing, Yandex, Seznam, Naver — instantly.
 * Google does NOT use IndexNow. Google discovery still requires the GSC
 * sitemap submission + URL Inspection steps in references/launch-checklist.md.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const HELP = `indexnow.mjs — IndexNow key file + post-deploy URL submission

USAGE
  node skills/client-site-build/scripts/indexnow.mjs --init [--dist <path>]
  node skills/client-site-build/scripts/indexnow.mjs --submit <domain> [--dist <path>] [--dry-run]
  node skills/client-site-build/scripts/indexnow.mjs --help

MODES
  --init             Generate a 32-hex IndexNow key and write <key>.txt into
                     dist/ (the key file search engines fetch to verify
                     ownership). Idempotent: an existing key file in dist/ is
                     reused, never replaced.
  --submit <domain>  Read dist/sitemap.xml, POST its URL list to
                     https://api.indexnow.org/indexnow for <domain> (bare
                     host, e.g. example-spas.com). Run AFTER deploy — the
                     engines immediately fetch https://<domain>/<key>.txt to
                     verify, so the key file must already be live.
  --dry-run          With --submit: print the exact payload, POST nothing.

WHAT THIS COVERS
  Bing / Yandex / Seznam / Naver — instant notification.
  Google does NOT use IndexNow: submit sitemap.xml in Search Console and use
  URL Inspection > Request Indexing (manual; see launch-checklist.md).

NEVER submit a staging build (robots noindex) — see decision-table.md.

OUTPUT (stdout, JSON)
  --init     {"status":"created"|"exists","key":"…","keyFile":"…"}
  --submit   {"status":"submitted"|"dry-run"|"error","host":"…","urlCount":N,
              "httpStatus":202,"keyFile":"…"}
EXIT     0 = success · 1 = submission/validation failure · 2 = bad usage
`;

function die(msg, code) { process.stderr.write(msg + '\n'); process.exit(code); }
function out(obj, code = 0) { process.stdout.write(JSON.stringify(obj, null, 2) + '\n'); process.exit(code); }

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h') || !args.length) { process.stdout.write(HELP); process.exit(args.length ? 0 : 2); }
const dist = resolve(args.includes('--dist') ? args[args.indexOf('--dist') + 1] : 'dist');
if (!existsSync(dist) || !statSync(dist).isDirectory()) die(`No dist/ at ${dist}. Build first — this script only operates on built output.`, 2);

/* An IndexNow key file is a bare-name .txt whose content equals its name. */
function findKeyFile() {
  for (const name of readdirSync(dist)) {
    if (!/^[a-f0-9]{32}\.txt$/i.test(name)) continue;
    const key = name.replace(/\.txt$/i, '');
    if (readFileSync(join(dist, name), 'utf8').trim() === key) return { key, file: name };
  }
  return null;
}

if (args.includes('--init')) {
  const existing = findKeyFile();
  if (existing) out({ status: 'exists', key: existing.key, keyFile: join(dist, existing.file) });
  const key = randomBytes(16).toString('hex');
  writeFileSync(join(dist, `${key}.txt`), key);
  out({ status: 'created', key, keyFile: join(dist, `${key}.txt`) });
}

if (args.includes('--submit')) {
  const host = args[args.indexOf('--submit') + 1];
  if (!host || host.startsWith('--')) die('Missing domain: --submit <domain> (bare host, e.g. example-spas.com). See --help.', 2);
  if (/^https?:\/\//.test(host) || host.includes('/')) die(`Domain must be a bare host, got "${host}".`, 2);

  const sitemapPath = join(dist, 'sitemap.xml');
  if (!existsSync(sitemapPath)) die('No dist/sitemap.xml — build generates it; cannot submit without a URL list.', 1);
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (!urlList.length) die('sitemap.xml contains zero <loc> URLs — nothing to submit.', 1);
  const wrongHost = urlList.filter(u => { try { return new URL(u).host !== host; } catch { return true; } });
  if (wrongHost.length) die(`sitemap URLs do not match --submit host ${host}: ${wrongHost.slice(0, 3).join(', ')}`, 1);

  const robotsPath = join(dist, 'robots.txt');
  const isStaging = existsSync(robotsPath) && /^Disallow:\s*\/\s*$/m.test(readFileSync(robotsPath, 'utf8'));
  if (isStaging && !args.includes('--dry-run'))
    die('This dist/ is a STAGING build (robots.txt Disallow: /) — never submit staging to IndexNow. See decision-table.md.', 1);

  const keyInfo = findKeyFile();
  if (!keyInfo) die('No IndexNow key file in dist/ — run --init (and redeploy) first; engines verify https://<domain>/<key>.txt.', 1);

  const payload = { host, key: keyInfo.key, keyLocation: `https://${host}/${keyInfo.file}`, urlList };
  if (args.includes('--dry-run')) {
    const result = { status: 'dry-run', host, urlCount: urlList.length, keyFile: keyInfo.file, payload };
    if (isStaging) result.warning = 'staging dist (robots.txt Disallow: /) — a real --submit would be refused';
    out(result);
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(e => ({ ok: false, status: 0, statusText: e.message }));
  if (res.ok || res.status === 200 || res.status === 202) {
    out({ status: 'submitted', host, urlCount: urlList.length, httpStatus: res.status, keyFile: keyInfo.file });
  }
  out({ status: 'error', host, urlCount: urlList.length, httpStatus: res.status, detail: res.statusText || 'submission rejected' }, 1);
}

die('No mode given: use --init or --submit <domain>. See --help.', 2);
