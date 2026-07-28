#!/usr/bin/env node
/**
 * map-intake.mjs — sheet / brief → REQUIRED blockers + 48h fix list.
 * Node 18+, zero deps. JSON stdout; diagnostics stderr.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'wrangler.toml')) && (existsSync(join(dir, 'index.html')) || existsSync(join(dir, 'package.json')))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(skillRoot, '..', '..');
}
const repoRoot = findRepoRoot(skillRoot);
const sheetPath = join(skillRoot, 'templates', 'CLIENT_INTAKE_SHEET.csv');

const HELP = `map-intake.mjs — map a filled intake sheet or messy brief onto tiered rows

USAGE
  node manus-skills/dealer-site-intake/scripts/map-intake.mjs --sheet <csv> --client <name> [--write-wiring]
  node manus-skills/dealer-site-intake/scripts/map-intake.mjs --brief <txt|json> --client <name> [--write-wiring]
  node manus-skills/dealer-site-intake/scripts/map-intake.mjs --help

INPUT
  --sheet   CSV with at least columns: what_we_need, priority, and either
            "value" / "answer" OR the filled value in a column named value.
            If only the canonical CLIENT_INTAKE_SHEET.csv shape is provided
            (no value column), every row is treated as BLANK (planning mode).
  --brief   Plain text or JSON. Text is scanned for keywords from the
            canonical sheet's what_we_need + config_key labels. JSON may be
            intake.template.json shape or a flat { "What we need": "value" } map.

OUTPUT (stdout JSON)
  {
    status: "BLOCKED"|"READY",
    requiredBlank: [...],   // Checkpoint 1 stop list
    fixList48h: [...],      // { what, owner, config_key }
    niceBlank: [...],
    mapped: [...]           // rows with non-empty values
  }

  --write-wiring  upserts "## 48-HOUR FIX LIST" into clients/<name>/WIRING.md
`;

function out(obj) { process.stdout.write(JSON.stringify(obj, null, 2) + '\n'); }
function die(msg, code) { process.stderr.write(msg + '\n'); process.exit(code); }

const args = process.argv.slice(2);
if (!args.length || args.includes('--help') || args.includes('-h')) {
  process.stdout.write(HELP);
  process.exit(args.length ? 0 : 2);
}

function parseArgs(argv) {
  const o = { writeWiring: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--sheet') o.sheet = argv[++i];
    else if (argv[i] === '--brief') o.brief = argv[++i];
    else if (argv[i] === '--client') o.client = argv[++i];
    else if (argv[i] === '--write-wiring') o.writeWiring = true;
  }
  return o;
}

const opts = parseArgs(args);
if (!opts.client || (!opts.sheet && !opts.brief)) die('Need --client and --sheet or --brief. See --help.', 2);
if (!/^[a-z0-9][a-z0-9-]*$/.test(opts.client)) die(`Bad client name: ${opts.client}`, 2);

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] ?? '').trim(); });
    return obj;
  });
  return { headers, rows };
}

function splitCsvLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const canon = parseCsv(readFileSync(sheetPath, 'utf8')).rows;
if (!canon.length) die(`Canonical sheet missing/empty: ${sheetPath}`, 2);

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

/** value lookup: exact what_we_need → value */
function valuesFromSheetCsv(path) {
  const { headers, rows } = parseCsv(readFileSync(path, 'utf8'));
  const valueKey = headers.find(h => /^(value|answer|filled|response)$/i.test(h.trim()));
  const map = new Map();
  for (const r of rows) {
    const key = r.what_we_need || r['What we need'] || r.What_we_need;
    if (!key) continue;
    const v = valueKey ? (r[valueKey] || '') : (r.value || r.answer || '');
    map.set(norm(key), String(v).trim());
  }
  return map;
}

function valuesFromBrief(path) {
  const text = readFileSync(path, 'utf8');
  const map = new Map();
  if (path.endsWith('.json')) {
    let data;
    try { data = JSON.parse(text); } catch (e) { die(`Invalid JSON brief: ${e.message}`, 2); }
    /* flat map */
    if (data && typeof data === 'object' && !data.business) {
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined && typeof v !== 'object') map.set(norm(k), String(v).trim());
      }
    }
    /* intake.template.json shape */
    const b = data.business || {};
    const o = data.offer || {};
    const w = data.wiring || {};
    const img = data.images || {};
    const pairs = [
      ['Trading / business name', b.tradingName],
      ['Legal business name', b.legalName],
      ['Phone display format', b.phoneDisplay],
      ['Phone E.164 (tel:)', b.phoneE164 ? (String(b.phoneE164).startsWith('tel:') ? b.phoneE164 : 'tel:' + b.phoneE164) : ''],
      ['SMS E.164 (sms:)', b.phoneE164 ? 'sms:' + String(b.phoneE164).replace(/^tel:/, '') : ''],
      ['Street address', b.address],
      ['Business hours', b.hours],
      ['Primary market / service area', b.market],
      ['Timezone (IANA)', b.timezone],
      ['Domain / website URL', b.websiteDomain ? (String(b.websiteDomain).startsWith('http') ? b.websiteDomain : 'https://' + b.websiteDomain) : ''],
      ['Financing promise line', o.financingPromise],
      ['Primary offer OR evergreen', o.headline || o.name || (o.active === false ? 'evergreen' : '')],
      ['Promo end date (if timed)', o.endsAtISO],
      ['Lead form POST endpoint', w.leadEndpoint],
      ['GA4 measurement ID', w.ga4Id],
      ['Meta Pixel ID', w.metaPixelId],
      ['Microsoft Clarity project ID', w.clarityId],
      ['GHL chat widget ID', w.ghlChatWidgetId],
      ['Closebot source ID', w.closebotSourceId],
      ['GHL location ID', w.ghlSubAccountId],
      ['Home hero photo', img.heroImage],
      ['Logo (header)', img.logoUrl],
      ['Facebook page URL', b.facebookUrl],
      ['Tagline', b.tagline]
    ];
    for (const [k, v] of pairs) if (v) map.set(norm(k), String(v).trim());
    return map;
  }
  /* plain text: keyword presence heuristic — marks row "present" if a distinctive token appears */
  const lower = text.toLowerCase();
  for (const row of canon) {
    const needles = [row.what_we_need, row.config_key, row.token_key].filter(Boolean);
    for (const n of needles) {
      const token = String(n).split(/[:./]/).filter(p => p.length > 3).pop();
      if (token && lower.includes(token.toLowerCase())) {
        /* capture a rough line value if "label: value" appears */
        const re = new RegExp(String(row.what_we_need).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:=-]\\s*(.+)', 'i');
        const m = text.match(re);
        map.set(norm(row.what_we_need), m ? m[1].split(/\n/)[0].trim() : '(mentioned in brief)');
        break;
      }
    }
  }
  return map;
}

const values = opts.sheet ? valuesFromSheetCsv(resolve(opts.sheet)) : valuesFromBrief(resolve(opts.brief));

const requiredBlank = [];
const fixList48h = [];
const niceBlank = [];
const mapped = [];

for (const row of canon) {
  const key = norm(row.what_we_need);
  const value = values.get(key) || '';
  const filled = !!(value && value !== '{{' && !String(value).includes('{{'));
  const item = {
    what: row.what_we_need,
    section: row.section,
    priority: row.priority,
    config_key: row.config_key,
    token_key: row.token_key || '',
    owner: row.owner_default || 'Client',
    value: filled ? value : ''
  };
  if (filled) mapped.push(item);
  else if (row.priority === 'REQUIRED') requiredBlank.push(item);
  else if (row.priority === '48h') fixList48h.push(item);
  else niceBlank.push(item);
}

const status = requiredBlank.length ? 'BLOCKED' : 'READY';
const result = { status, client: opts.client, requiredBlank, fixList48h, niceBlank, mappedCount: mapped.length };

if (opts.writeWiring) {
  const clientDir = join(repoRoot, 'clients', opts.client);
  mkdirSync(clientDir, { recursive: true });
  const wiringPath = join(clientDir, 'WIRING.md');
  let body = existsSync(wiringPath) ? readFileSync(wiringPath, 'utf8') : `# WIRING.md — ${opts.client}\n`;
  const section = renderFixList(fixList48h);
  if (/## 48-HOUR FIX LIST/.test(body)) {
    body = body.replace(/## 48-HOUR FIX LIST[\s\S]*?(?=\n## |\n*$)/, section.trim() + '\n\n');
  } else {
    body = body.trimEnd() + '\n\n' + section;
  }
  writeFileSync(wiringPath, body);
  result.wiringWritten = `clients/${opts.client}/WIRING.md`;
}

out(result);
process.exit(status === 'BLOCKED' ? 1 : 0);

function renderFixList(rows) {
  const lines = [
    '## 48-HOUR FIX LIST',
    '',
    'Auto-copied from intake (48h tier). Build may launch; close these within 48h.',
    '',
    '| Done | What we need | Owner | config / secret |',
    '|---|---|---|---|'
  ];
  for (const r of rows) {
    lines.push(`| [ ] | ${r.what} | ${r.owner} | \`${r.config_key}\` |`);
  }
  if (!rows.length) lines.push('| — | _(empty — no 48h blanks)_ | — | — |');
  lines.push('');
  return lines.join('\n');
}
