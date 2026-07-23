import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const forbidden = ['Paradise Spas', 'paradisespas.com', 'Minot', 'North Dakota State Fair', 'Red River Valley Fair', '701-838-2614'];
/* Owner ruling (FINAL_DIAL_IN closeout): the guard scans only BUILDABLE
   sources (html/js/css/toml/json) — never *.md docs. Documentation may name
   fingerprints; shipped pages may not. */
const allowed = new Set([
  'scripts/check-template-guard.mjs'
]);
const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.wrangler' || name === '.git') continue;
    const file = join(dir, name);
    const rel = file.slice(root.length).replace(/^\//, '');
    if (allowed.has(rel)) continue;
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.(html|js|css|toml|json)$/i.test(name)) {
      const text = readFileSync(file, 'utf8');
      for (const term of forbidden) if (text.includes(term)) hits.push(`${rel}: ${term}`);
    }
  }
}
walk(root);
if (hits.length) { console.error('Template guard failed. Hardcoded client values found:\n' + hits.join('\n')); process.exit(1); }
console.log('Template guard passed.');
