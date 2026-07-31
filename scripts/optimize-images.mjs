#!/usr/bin/env node
/**
 * Compress launch photography before it is referenced by a token (WTV-037).
 *
 *   node scripts/optimize-images.mjs <dir-or-file...> [--out DIR] [--max-kb 120]
 *                                    [--max-edge 1600] [--replace] [--dry-run]
 *
 * The template ships no hero or showroom images — `HOME_HERO_IMAGE`,
 * `VISIT_IMAGE_1`, and `VISIT_IMAGE_2` are client-supplied URLs — so nothing
 * in the build has ever inspected their weight. On Sun Pool that shipped
 * 167KB of oversized imagery straight into the mobile critical path.
 *
 * Quality is stepped down until the file fits the budget rather than using one
 * fixed setting: a flat quality number either bloats simple images or wrecks
 * detailed ones. Re-encoding also strips EXIF, which removes the GPS
 * coordinates phones attach to photos.
 */

import { readdirSync, statSync, mkdirSync, existsSync, renameSync, writeFileSync } from 'node:fs';
import { join, extname, basename, dirname, resolve } from 'node:path';
import {
  assertClientMutationAllowed,
  ClientProtectionError
} from './lib/client-protection.mjs';

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error('sharp is not installed. Run:  npm install --save-dev sharp');
  process.exit(2);
}

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(name);

const maxKb = Number(flag('--max-kb', 120));
const maxEdge = Number(flag('--max-edge', 1600));
const outDir = flag('--out', null);
const replace = has('--replace');
const dryRun = has('--dry-run');

const inputs = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out'
  && argv[i - 1] !== '--max-kb' && argv[i - 1] !== '--max-edge');

if (!inputs.length) {
  console.error('usage: node scripts/optimize-images.mjs <dir-or-file...> [--out DIR] [--max-kb 120] [--max-edge 1600] [--replace] [--dry-run]');
  process.exit(2);
}

for (const input of inputs) {
  const abs = resolve(input);
  const m = abs.replace(/\\/g, '/').match(/\/clients\/([^/]+)(?:\/|$)/);
  if (!m) continue;
  try {
    assertClientMutationAllowed({
      clientSlug: m[1],
      operation: dryRun ? 'images-optimize-dry-run' : 'images-optimize'
    });
  } catch (err) {
    if (err instanceof ClientProtectionError) {
      console.error('[client-protection]', err.message);
      process.exit(1);
    }
    throw err;
  }
}

const SOURCE = /\.(jpe?g|png|webp)$/i;

function collect(target, found = []) {
  const stat = statSync(target);
  if (stat.isDirectory()) {
    for (const name of readdirSync(target)) {
      if (name.startsWith('.') || name === 'node_modules') continue;
      collect(join(target, name), found);
    }
  } else if (SOURCE.test(target)) {
    found.push(target);
  }
  return found;
}

const files = inputs.flatMap((i) => collect(resolve(i)));
if (!files.length) {
  console.log('No JPG/PNG/WEBP files found.');
  process.exit(0);
}

const kb = (bytes) => (bytes / 1024).toFixed(0) + 'KB';
let totalBefore = 0;
let totalAfter = 0;
let skipped = 0;

console.log(`\nOptimizing ${files.length} image(s)  ->  <=${maxKb}KB, max ${maxEdge}px, WebP\n`);

for (const file of files) {
  const before = statSync(file).size;
  totalBefore += before;

  const image = sharp(file, { failOn: 'none' });
  const meta = await image.metadata().catch(() => null);
  if (!meta) {
    console.log(`  SKIP  ${basename(file)} (unreadable)`);
    totalAfter += before; skipped++; continue;
  }

  const resize = Math.max(meta.width || 0, meta.height || 0) > maxEdge
    ? { width: meta.width >= meta.height ? maxEdge : null,
        height: meta.height > meta.width ? maxEdge : null,
        withoutEnlargement: true }
    : null;

  /* Step quality down only as far as the budget requires, so a simple graphic
     keeps its fidelity and a busy photo still lands under the cap. */
  let output = null;
  for (const quality of [85, 80, 74, 68, 62, 55]) {
    let pipeline = sharp(file, { failOn: 'none' }).rotate(); // honour EXIF orientation, then drop EXIF
    if (resize) pipeline = pipeline.resize(resize);
    const buffer = await pipeline.webp({ quality, effort: 5 }).toBuffer();
    output = buffer;
    if (buffer.length <= maxKb * 1024) break;
  }

  if (!output || output.length >= before) {
    console.log(`  KEEP  ${basename(file)}  ${kb(before)} (already optimal)`);
    totalAfter += before; skipped++; continue;
  }

  const target = outDir
    ? join(outDir, basename(file, extname(file)) + '.webp')
    : join(dirname(file), basename(file, extname(file)) + '.webp');

  const pct = Math.round((1 - output.length / before) * 100);
  console.log(`  ${dryRun ? 'WOULD' : 'WRITE'} ${basename(file)}  ${kb(before)} -> ${kb(output.length)}  (-${pct}%)`);
  totalAfter += output.length;

  if (dryRun) continue;
  if (outDir && !existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  /* Write the encoded buffer as-is. Passing it back through sharp would
     re-encode an already-lossy WebP and land ~12% heavier than the size we
     just measured and reported. */
  writeFileSync(target, output);
  /* --replace removes the original only once the .webp exists on disk, and
     never when the source already was that exact .webp. */
  if (replace && resolve(target) !== resolve(file) && existsSync(target)) {
    renameSync(file, file + '.orig');
  }
}

const saved = totalBefore - totalAfter;
console.log(`\n  total  ${kb(totalBefore)} -> ${kb(totalAfter)}   saved ${kb(saved)}` +
  (skipped ? `   (${skipped} unchanged)` : ''));
if (replace && !dryRun) console.log('  originals renamed to *.orig — delete once you have checked the output.');
console.log('');
