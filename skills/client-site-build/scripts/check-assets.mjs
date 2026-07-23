#!/usr/bin/env node
/**
 * check-assets.mjs — inventory a folder of customer-uploaded images, map
 * filename labels → image tokens, and grade each file against the token's
 * minimum dimensions. Dependency-free: parses PNG/JPEG/WebP headers directly.
 * Part of the client-site-build skill. Node 18+. JSON to stdout.
 *
 * Grades: PASS  = meets the token minimum
 *         SOFT  = under minimum but ≥ half → upscale candidate (≤2× rule)
 *         FAIL  = below half the minimum, unparseable, or unmatched label
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const HELP = `check-assets.mjs — customer image intake inventory

USAGE
  node skills/client-site-build/scripts/check-assets.mjs --dir <folder> [--verbose]

Parses PNG/JPEG/WebP headers (no dependencies), matches filename label
prefixes (case-insensitive, longest label wins, trailing numbers/words
ignored) to image tokens, grades each file PASS/SOFT/FAIL against the
token minimums, and picks the largest file per token.

OUTPUT  JSON {files[], mapping{}, flags[], summary{}}
EXIT    0 = inventory produced (grades inside) · 2 = bad usage / no folder
`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h') || !args.includes('--dir')) {
  process.stdout.write(HELP);
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 2);
}
const dir = args[args.indexOf('--dir') + 1];
if (!dir || !statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
  process.stderr.write(`Not a directory: ${dir}\n`);
  process.exit(2);
}

/* label → [token, minW, minH]; matched longest-label-first */
const LABELS = [
  ['HEROHOTTUBS', 'HOT_TUBS_HERO_IMAGE', 1600, 1000],
  ['HEROSWIMSPAS', 'SWIM_SPAS_HERO_IMAGE', 1600, 1000],
  ['HEROSAUNAS', 'SAUNAS_HERO_IMAGE', 1600, 1000],
  ['SHOWROOM1', 'VISIT_IMAGE_1', 1200, 900],
  ['SHOWROOM2', 'VISIT_IMAGE_2', 1200, 900],
  ['LOGOLIGHT', 'CLIENT_LOGO_FOOTER_URL', 320, 80],
  ['HOTTUBS', 'HOT_TUBS_CATEGORY_IMAGE', 1000, 1250],
  ['SWIMSPAS', 'SWIM_SPAS_CATEGORY_IMAGE', 1000, 1250],
  ['SAUNAS', 'SAUNAS_CATEGORY_IMAGE', 1000, 1250],
  ['PRODUCT', 'PRODUCT_PRIMARY_IMAGE', 1200, 900],
  ['LOGO', 'CLIENT_LOGO_URL', 320, 80],
  ['HERO', 'HOME_HERO_IMAGE', 1600, 1000]
].sort((a, b) => b[0].length - a[0].length);

function dims(buf, ext) {
  try {
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) // PNG
      return { format: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (buf[0] === 0xff && buf[1] === 0xd8) { // JPEG: walk to SOFn
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
          return { format: 'jpeg', width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
        i += 2 + buf.readUInt16BE(i + 2);
      }
      return null;
    }
    if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const kind = buf.toString('ascii', 12, 16);
      if (kind === 'VP8 ') return { format: 'webp', width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      if (kind === 'VP8L') {
        const b = buf.readUInt32LE(21);
        return { format: 'webp', width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      if (kind === 'VP8X') return {
        format: 'webp',
        width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16))
      };
    }
    if (ext === '.svg' || buf.toString('utf8', 0, 300).includes('<svg')) return { format: 'svg', width: null, height: null };
  } catch { /* fall through */ }
  return null;
}

const files = [], flags = [];
const perToken = new Map();
for (const name of readdirSync(dir).sort()) {
  const f = join(dir, name);
  if (!statSync(f).isFile()) continue;
  const ext = extname(name).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.svg', '.avif', '.heic'].includes(ext)) continue;

  const stem = basename(name, ext).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const hit = LABELS.find(([label]) => stem.startsWith(label));
  const buf = readFileSync(f);
  const d = dims(buf, ext);

  const entry = { file: name, format: d?.format || ext.slice(1), width: d?.width ?? null, height: d?.height ?? null };
  if (!hit) {
    entry.status = 'FAIL';
    entry.reason = 'no label match — see CLIENT_UPLOAD_CHECKLIST labels';
    flags.push(`UNMATCHED: ${name}`);
  } else {
    const [label, token, minW, minH] = hit;
    entry.label = label; entry.token = token; entry.min = `${minW}x${minH}`;
    if (entry.format === 'svg') entry.status = 'PASS'; // vector: no pixel minimum
    else if (!d) { entry.status = 'FAIL'; entry.reason = `unparseable ${ext} header (avif/heic need MANUAL check)`; }
    else if (d.width >= minW && d.height >= minH) entry.status = 'PASS';
    else if (d.width >= minW / 2 && d.height >= minH / 2) { entry.status = 'SOFT'; entry.reason = `under ${minW}x${minH} — upscale candidate (≤2x rule, log in build report)`; }
    else { entry.status = 'FAIL'; entry.reason = `below half of ${minW}x${minH} — request a better original`; }
    if (entry.status !== 'FAIL') {
      const cur = perToken.get(token);
      const area = (d?.width || 0) * (d?.height || 0);
      if (!cur || area > cur.area) perToken.set(token, { file: name, area, status: entry.status });
    }
  }
  files.push(entry);
}

const mapping = {};
for (const [token, v] of [...perToken.entries()].sort()) mapping[token] = v.file;
const MUST = ['HOME_HERO_IMAGE', 'HOT_TUBS_CATEGORY_IMAGE', 'SWIM_SPAS_CATEGORY_IMAGE', 'SAUNAS_CATEGORY_IMAGE', 'VISIT_IMAGE_1', 'VISIT_IMAGE_2'];
for (const t of MUST) if (!mapping[t]) flags.push(`MISSING MUST-HAVE: ${t}`);
for (const e of files) if (e.status === 'SOFT') flags.push(`UPSCALE NEEDED: ${e.file} (${e.width}x${e.height} → min ${e.min})`);

const summary = {
  files: files.length,
  pass: files.filter(f => f.status === 'PASS').length,
  soft: files.filter(f => f.status === 'SOFT').length,
  fail: files.filter(f => f.status === 'FAIL').length,
  mustHavesCovered: MUST.filter(t => mapping[t]).length + '/' + MUST.length
};
process.stdout.write(JSON.stringify({ dir, summary, mapping, flags, files }, null, 2) + '\n');
