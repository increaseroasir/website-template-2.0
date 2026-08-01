/**
 * QA gate: Form1 E2E acceptance matrix + create-or-link static invariants.
 * Read-only against repository evidence. No live Make/GHL/Supabase calls.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

describe("Form1 E2E acceptance matrix gate", () => {
  it("requires QA matrix and merge-gate docs", () => {
    for (const rel of [
      "docs/qa/FORM1_E2E_ACCEPTANCE_MATRIX.md",
      "docs/qa/P2_RED_TEAM_REVIEW.md",
      "docs/qa/P2_MERGE_GATE.md",
    ]) {
      assert.equal(existsSync(join(root, rel)), true, `missing ${rel}`);
    }
  });

  it("matrix names the five required outcomes and match order", () => {
    const matrix = read("docs/qa/FORM1_E2E_ACCEPTANCE_MATRIX.md");
    for (const outcome of [
      "created",
      "linked",
      "replayed",
      "identity_conflict",
      "review_required",
    ]) {
      assert.match(matrix, new RegExp(outcome));
    }
    assert.match(matrix, /client_id.*deployment_key.*client_slug/s);
    assert.match(matrix, /null_does_not_clear|Null behavior/i);
    assert.match(matrix, /Forbidden auto-link/i);
  });

  it("merge gate holds P2 complete until E2E", () => {
    const gate = read("docs/qa/P2_MERGE_GATE.md");
    assert.match(gate, /HOLD_P2_COMPLETE/);
    assert.match(gate, /ALLOW_MERGE/);
  });
});

describe("Form1 create-or-link static evidence", () => {
  const afterPath =
    "artifacts/agent-runs/integrator/20260731T203300Z-form1-create-or-link-AFTER.json";

  it("AFTER snapshot is inactive create-or-link with required outcomes", () => {
    assert.equal(existsSync(join(root, afterPath)), true);
    const after = readJson(afterPath);
    assert.equal(after.isActive, false);
    assert.equal(String(after.scenario_id), "4852018");
    assert.equal(after.module_count, 46);
    for (const outcome of [
      "created",
      "linked",
      "replayed",
      "identity_conflict",
      "review_required",
    ]) {
      assert.ok(after.outcomes.includes(outcome), `missing outcome ${outcome}`);
    }
    for (const filter of [
      "link_by_client_id",
      "link_by_deployment_key",
      "link_by_client_slug",
      "create_new",
      "replay",
    ]) {
      assert.ok(after.filters.includes(filter), `missing filter ${filter}`);
    }
  });

  it("lookup filter key order is client_id then deployment_key then client_slug", () => {
    const s = read(afterPath);
    const keys = [];
    const re =
      /"key"\s*:\s*"(client_id|deployment_key|client_slug)"\s*,\s*"value"\s*:\s*"eq\./g;
    let m;
    while ((m = re.exec(s)) !== null) keys.push(m[1]);
    assert.ok(keys.length >= 3, "expected at least three identity lookups");
    assert.deepEqual(keys.slice(0, 3), [
      "client_id",
      "deployment_key",
      "client_slug",
    ]);
  });

  it("does not use weak identifiers as clients filter keys", () => {
    const s = read(afterPath);
    for (const bad of [
      "owner_email",
      "owner_phone",
      "business_name",
      "ghl_contact_id",
    ]) {
      const keyEq = new RegExp(`"key"\\s*:\\s*"${bad}"`);
      assert.equal(keyEq.test(s), false, `forbidden filter key ${bad}`);
    }
  });

  it("link-path client PATCH only sets active_onboarding_case_id", () => {
    const after = readJson(afterPath);
    const patches = [];
    const walk = (o) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === "object") {
        const mapper = o.mapper;
        if (
          mapper &&
          typeof mapper.url === "string" &&
          mapper.url.includes("/rest/v1/clients?") &&
          String(mapper.method).toUpperCase() === "PATCH"
        ) {
          patches.push(mapper);
        }
        Object.values(o).forEach(walk);
      }
    };
    walk(after.blueprint);
    assert.ok(patches.length >= 3, "expected link/create client PATCH modules");
    for (const mapper of patches) {
      const body =
        typeof mapper.body === "string" ? JSON.parse(mapper.body) : mapper.body;
      assert.deepEqual(Object.keys(body).sort(), ["active_onboarding_case_id"]);
    }
  });
});

describe("Form1 reported vs Form2 contract split", () => {
  it("publishes reported fields on form1 and operational on form2", () => {
    const identity = readJson("config/identity-fields.json");
    assert.equal(identity.contract_version, "0.2.0");
    assert.equal(identity.onboarding_schema_version, "1.1.0");
    const reported = [
      "website_reported_status",
      "website_reported_url",
      "domain_reported_name",
      "domain_reported_ownership_status",
      "dns_reported_provider",
      "dns_reported_owner",
    ];
    for (const field of reported) {
      assert.equal(identity.forms.form1.fields[field].owner, "form1");
      assert.equal(identity.field_policies[field].owner, "form1");
    }
    for (const field of [
      "website_url",
      "domain",
      "dns_provider",
      "dns_owner",
    ]) {
      assert.equal(identity.forms.form2.fields[field].owner, "form2");
    }
  });

  it("mappings keep null_does_not_clear on reported fields", () => {
    const mappings = readJson("config/onboarding-field-mappings.json");
    const items = [];
    const walk = (o) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === "object") {
        if (o.canonical_field) items.push(o);
        Object.values(o).forEach(walk);
      }
    };
    walk(mappings);
    for (const name of [
      "website_reported_status",
      "website_reported_url",
      "domain_reported_name",
      "domain_reported_ownership_status",
      "dns_reported_provider",
      "dns_reported_owner",
    ]) {
      const row = items.find((x) => x.canonical_field === name);
      assert.ok(row, `missing mapping ${name}`);
      assert.equal(row.null_behavior, "null_does_not_clear");
      assert.equal(row.storage_form, "form1");
    }
  });
});
