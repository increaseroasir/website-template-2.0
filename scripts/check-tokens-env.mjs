#!/usr/bin/env node
/**
 * Lint a client tokens.env before it is hydrated.
 *
 * The hydrate recipe sources this file with `set -a && . tokens.env`, so it is a
 * bash script, not a config format. Two mistakes are invisible afterwards:
 *
 *   1. An unquoted value containing spaces. `CLIENT_NAME=Sun Pool & Spa Supply`
 *      assigns "Sun" for one command, backgrounds the rest, and exports nothing.
 *      Because most tokens in the markup carry a `|default`, the page then renders
 *      the template's default and no gate complains — the client's real copy is
 *      simply gone.
 *   2. A duplicate key. The last assignment wins, so editing the first occurrence
 *      appears to do nothing.
 *
 *   node scripts/check-tokens-env.mjs clients/<name>/tokens.env
 */
import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/check-tokens-env.mjs <path/to/tokens.env>');
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`not found: ${file}`);
  process.exit(2);
}

const lines = readFileSync(file, 'utf8').split('\n');
const errors = [];
const warnings = [];
const seen = new Map();

lines.forEach((raw, idx) => {
  const lineNo = idx + 1;
  const line = raw.trim();
  if (!line || line.startsWith('#')) return;
  if (!line.includes('=')) {
    errors.push({ lineNo, msg: `not an assignment and not a comment: ${line.slice(0, 60)}` });
    return;
  }
  const key = line.slice(0, line.indexOf('='));
  const value = line.slice(line.indexOf('=') + 1);

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    errors.push({ lineNo, msg: `"${key}" is not a valid shell variable name` });
  }

  if (seen.has(key)) {
    errors.push({
      lineNo,
      msg: `${key} was already set on line ${seen.get(key)} — the last assignment wins, so the earlier one is dead`
    });
  }
  seen.set(key, lineNo);

  const quoted = (value.startsWith('"') && value.endsWith('"') && value.length > 1)
    || (value.startsWith("'") && value.endsWith("'") && value.length > 1);

  if (!quoted && /[\s&|;<>()$`*?#]/.test(value)) {
    errors.push({
      lineNo,
      msg: `${key} is unquoted and contains shell-significant characters, so sourcing this file exports the wrong value (often empty). Wrap it in double quotes.`
    });
  }

  if (quoted && value.startsWith('"') && /(^|[^\\])\$\{?[A-Za-z_]/.test(value.slice(1, -1))) {
    warnings.push({ lineNo, msg: `${key} contains $VAR inside double quotes — bash will expand it during sourcing` });
  }

  if (value.trim() === '' || value === '""' || value === "''") {
    warnings.push({ lineNo, msg: `${key} is empty, so the page renders the template default instead` });
  }
});

const label = file.replace(process.cwd() + '/', '');
if (errors.length) {
  console.log(`FAIL  ${label}`);
  for (const e of errors) console.log(`  line ${e.lineNo}: ${e.msg}`);
} else {
  console.log(`PASS  ${label} — ${seen.size} tokens, no duplicates, all values survive sourcing`);
}
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  line ${w.lineNo}: ${w.msg}`);
}

process.exit(errors.length ? 1 : 0);
