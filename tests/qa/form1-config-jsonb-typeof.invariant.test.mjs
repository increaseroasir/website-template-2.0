/**
 * Form 1 runtime invariant: config_versions.config must be a native JSON object.
 *
 * STATIC SCAN SCOPE (LESSON-018 — critical):
 * - DO NOT scan historical evidence, Markdown, lessons, debug logs,
 *   before-state snapshots, or failure reproductions for forbidden patterns.
 *   Those files intentionally contain parseJSON(, "[]", and dual predicates.
 * - Scan ONLY if present:
 *   - canonical sanitized *current* Make blueprint snapshots
 *   - current scenario mapping fixtures
 *   - designated *-current-blueprint.json
 *   - other explicitly current workflow configuration files
 * - As of this package there is no canonical current blueprint snapshot in Git.
 *   Coverage is therefore limited; do not claim the live blueprint was fully scanned.
 *   Related lessons remain Mitigated/Open until a current snapshot exists and/or
 *   verified_live flips with exec ID + evidence.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const invariantRel = "config/form1-runtime-invariants.json";

/** Basename / path markers that identify *current* executable workflow config only. */
const CURRENT_BLUEPRINT_NAME_RE =
  /(?:^|[\\/])(?:.*-current-blueprint\.json|form1-.*-sanitized-current.*\.json|form1-current-.*blueprint.*\.json)$/i;

/**
 * Explicit allowlist roots for current workflow configuration (empty today).
 * Historical AFTER/BEFORE/STATIC proof JSON under artifacts/ is intentionally excluded.
 */
const EXPLICIT_CURRENT_SCAN_GLOBS = [
  // Reserved for future: "artifacts/agent-runs/integrator/form1-*-current-blueprint.json"
];

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function collectCurrentBlueprintFiles() {
  const found = [];

  // Designated *-current-blueprint.json anywhere under config/ or fixtures/ if present
  for (const base of ["config", "fixtures", "tests/qa/fixtures"]) {
    const abs = join(root, base);
    if (!existsSync(abs)) continue;
    walk(abs, (file) => {
      const rel = relative(root, file);
      if (CURRENT_BLUEPRINT_NAME_RE.test(rel.replace(/\\/g, "/"))) {
        found.push(rel);
      }
    });
  }

  for (const rel of EXPLICIT_CURRENT_SCAN_GLOBS) {
    // Placeholder for future explicit roots; keep empty until snapshots land
    void rel;
  }

  return [...new Set(found)].sort();
}

function walk(dir, onFile) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "_tmp") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, onFile);
    else if (st.isFile() && name.endsWith(".json")) onFile(p);
  }
}

/**
 * Dual text+numeric equality on the same length(...) predicate (heuristic for current JSON only).
 */
function hasDualTextNumericLengthEquality(text) {
  // Look for length(...) appearing near both text:equal and numeric:equal in the same filter blob
  const lengthSites = [...text.matchAll(/length\s*\(\s*[^)]+\)/gi)];
  for (const m of lengthSites) {
    const start = Math.max(0, m.index - 200);
    const end = Math.min(text.length, m.index + m[0].length + 200);
    const window = text.slice(start, end);
    if (/text\s*:\s*equal/i.test(window) && /numeric\s*:\s*equal/i.test(window)) {
      return true;
    }
  }
  return false;
}

describe("form1 config jsonb_typeof invariant record", () => {
  it("invariant file exists with expected_jsonb_typeof object", () => {
    assert.equal(existsSync(join(root, invariantRel)), true, `missing ${invariantRel}`);
    const inv = readJson(invariantRel);
    assert.equal(inv.expected_jsonb_typeof, "object");
    assert.equal(inv.true_acceptance_sql, "jsonb_typeof(config) = 'object'");
    assert.ok(Array.isArray(inv.proof_levels));
    assert.ok(inv.proof_levels.includes("database"));
    assert.ok(inv.proof_levels.includes("e2e09"));
  });

  it("verified_live false requires null evidence fields; true requires both", () => {
    const inv = readJson(invariantRel);
    if (inv.verified_live === true) {
      assert.equal(typeof inv.verified_execution_id, "string");
      assert.ok(inv.verified_execution_id.length > 0);
      assert.equal(typeof inv.verified_evidence, "string");
      assert.ok(inv.verified_evidence.length > 0);
      assert.equal(existsSync(join(root, inv.verified_evidence)), true);
    } else {
      assert.equal(inv.verified_live, false);
      assert.equal(inv.verified_execution_id, null);
      assert.equal(inv.verified_evidence, null);
    }
  });

  it("static_scan documents limited coverage and does not claim live blueprint fully scanned", () => {
    const inv = readJson(invariantRel);
    assert.ok(inv.static_scan);
    assert.equal(inv.static_scan.claim_live_blueprint_fully_scanned, false);
    assert.match(String(inv.static_scan.coverage), /limited/i);
    assert.ok(Array.isArray(inv.static_scan.scan_roots));
    // Until a canonical current snapshot is committed, scan_roots must stay empty
    // (do not silently point at historical AFTER/BEFORE evidence).
    assert.deepEqual(inv.static_scan.scan_roots, []);
  });

  it("scans only canonical current blueprint snapshots when present (none today)", () => {
    const inv = readJson(invariantRel);
    const files = collectCurrentBlueprintFiles();
    // Keep invariant JSON scan_roots in sync with discovery
    assert.deepEqual(inv.static_scan.scan_roots, []);

    if (files.length === 0) {
      // Limited coverage path — pass without false-positive historical scans
      assert.equal(files.length, 0);
      return;
    }

    for (const rel of files) {
      const text = readFileSync(join(root, rel), "utf8");
      assert.equal(
        text.includes("parseJSON("),
        false,
        `${rel} contains forbidden parseJSON(`
      );
      // Raw body comparison to literal "[]" (common anti-pattern)
      assert.equal(
        /=\s*"\[\]"|:\s*"\[\]"|equal\s*"\[\]"/i.test(text) &&
          /body/i.test(text),
        false,
        `${rel} appears to compare body to literal "[]"`
      );
      assert.equal(
        hasDualTextNumericLengthEquality(text),
        false,
        `${rel} has dual text/numeric length equality`
      );
    }
  });
});
