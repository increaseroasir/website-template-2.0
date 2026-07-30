/* Dev helper: swap the inlined <style data-inlined="home.css"> block in a built
   preview for the current (or an arbitrary) home.css, so CSS tweaks can be
   re-rendered without a full rehydrate.

   node scripts/reinline-css.mjs <preview-dir> [css-file] */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const previewDir = process.argv[2];
const cssFile = process.argv[3] || join(previewDir, 'assets', 'home.css');
if (!previewDir) {
  console.error('usage: node scripts/reinline-css.mjs <preview-dir> [css-file]');
  process.exit(1);
}

const indexPath = join(previewDir, 'index.html');
const css = readFileSync(cssFile, 'utf8').replace(/<\/style/gi, '<\\/style');
const html = readFileSync(indexPath, 'utf8');
const block = /<style data-inlined="home\.css">[\s\S]*?<\/style>/;
if (!block.test(html)) {
  console.error('no inlined home.css block found in ' + indexPath);
  process.exit(1);
}
writeFileSync(indexPath, html.replace(block, `<style data-inlined="home.css">\n${css}\n</style>`));
console.log(`re-inlined ${cssFile} -> ${indexPath}`);
