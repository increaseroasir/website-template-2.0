import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const configPath = join(root, 'client.config.js');
const config = readFileSync(configPath, 'utf8');
const unresolved = [...config.matchAll(/\{\{([A-Z0-9_|.-]+)\}\}/g)].map(m => m[1]);
if (unresolved.length) console.warn('client.config.js still contains build tokens:', [...new Set(unresolved)].join(', '));
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.wrangler' || name === '.git') continue;
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.html$/i.test(name)) {
      let text = readFileSync(file, 'utf8');
      text = text.replace(/\{\{LEAD_ENDPOINT\|\/api\/lead\}\}/g, '/api/lead');
      text = text.replace(/\{\{ROBOTS_DIRECTIVE\|index,follow\}\}/g, 'index,follow');
      writeFileSync(file, text);
    }
  }
}
walk(root);
console.log('Build config pass complete.');
