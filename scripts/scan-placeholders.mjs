import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const mode = process.argv.includes('--launch') ? 'launch' : 'template';
const tokenPattern = /\{\{[^}]+\}\}/g;

const ignoredDirs = new Set(['.git', '.wrangler', 'node_modules']);
const launchAllowedFiles = new Set([
  'client.fulfillment.schema.json',
  'tracking.manifest.json',
  'docs/manus-fulfillment-skills.md',
  'verification.checklist.md',
  'README.md'
]);

const launchAllowedPatterns = [
  /^\.cursor\//,
  /^docs\//,
  /^client\.fulfillment\.schema\.json$/,
  /^tracking\.manifest\.json$/,
  /^verification\.checklist\.md$/,
  /^README\.md$/
];

function isTextFile(file) {
  return /\.(html|js|css|md|toml|json|sql|txt|yml|yaml)$/i.test(file);
}

function shouldSkip(relPath) {
  if (mode !== 'launch') return false;
  if (launchAllowedFiles.has(relPath)) return true;
  return launchAllowedPatterns.some((pattern) => pattern.test(relPath));
}

function walk(dir, hits) {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const file = join(dir, name);
    const relPath = relative(root, file);
    if (statSync(file).isDirectory()) {
      walk(file, hits);
      continue;
    }
    if (!isTextFile(file) || shouldSkip(relPath)) continue;

    const text = readFileSync(file, 'utf8');
    const matches = text.match(tokenPattern) || [];
    for (const token of matches) hits.push({ file: relPath, token });
  }
}

const hits = [];
walk(root, hits);

if (hits.length) {
  console.error('Unresolved template placeholders found:');
  for (const hit of hits.slice(0, 200)) {
    console.error('- ' + hit.file + ': ' + hit.token);
  }
  if (hits.length > 200) console.error('...and ' + (hits.length - 200) + ' more.');
  process.exit(1);
}

console.log(mode === 'launch'
  ? 'Launch placeholder scan passed.'
  : 'Template placeholder scan passed.');
