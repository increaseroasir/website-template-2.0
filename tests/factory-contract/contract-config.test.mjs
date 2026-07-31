import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  loadIdentityFields,
  loadStateMachine,
  loadForbiddenAliases,
  loadFactoryContractSchema,
  loadProductionApprovalPolicy,
  loadSyncPolicy,
  loadSupabaseTargets,
  scanForbiddenAliases,
} from "../../scripts/lib/factory-contract/index.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../scripts/lib/factory-contract/load-contract.mjs";

describe("canonical contract companions", () => {
  it("locks the identity name set", () => {
    const identity = loadIdentityFields();
    assert.equal(identity.contract_version, "0.1.1");
    assert.equal(identity.onboarding_schema_version, "1.0.0");
    for (const key of [
      "client_id",
      "onboarding_case_id",
      "ghl_contact_id",
      "ghl_opportunity_id",
      "ghl_location_id",
      "client_slug",
      "deployment_key",
      "business_name",
      "domain",
    ]) {
      assert.ok(identity.identity[key], `missing identity.${key}`);
    }
    assert.equal(identity.identity.ghl_contact_id.is_company_key, false);
    assert.equal(identity.identity.client_id.immutable_after_create, true);
    assert.equal(identity.identity.onboarding_case_id.immutable_after_create, true);
    assert.equal(identity.identity.deployment_key.immutable_after_create, true);
    assert.equal(identity.identity.business_name.editable, true);
    assert.equal(identity.identity.domain.audited, true);
    assert.equal(identity.identity.client_slug.lock_never_unlocks, true);
    assert.ok(identity.field_policies.business_name);
    assert.ok(identity.field_policies.ga4_id);
    assert.equal(identity.field_policies.ga4_id.classification, "sensitive_identifier");
    assert.equal(identity.field_policies.capi_token_ref.classification, "secret_reference");
  });

  it("state machine forbids free-form updates and skip paths", () => {
    const sm = loadStateMachine();
    assert.equal(sm.contract_version, "0.1.1");
    assert.equal(sm.rpc, "request_client_transition");
    assert.equal(sm.free_form_status_updates, "forbidden");
    assert.ok(sm.statuses.includes("infrastructure_ready"));
    assert.ok(
      !sm.statuses.includes("infra" + "_ready"),
      "short alias must not be a status"
    );

    const allowed = new Set(sm.transitions.map((t) => `${t.from}->${t.to}`));
    for (const bad of sm.forbidden_examples) {
      assert.equal(
        allowed.has(`${bad.from}->${bad.to}`),
        false,
        `forbidden example unexpectedly allowed: ${bad.from}->${bad.to}`
      );
    }
  });

  it("SQL transition seed matches state-machine.json", () => {
    const sm = loadStateMachine();
    const sql = readFileSync(
      join(repoRoot(), "supabase/migrations/20260731000200_request_client_transition.sql"),
      "utf8"
    );
    for (const t of sm.transitions) {
      assert.match(
        sql,
        new RegExp(`\\('${t.from}', '${t.to}'`),
        `SQL missing transition ${t.from} -> ${t.to}`
      );
    }
    assert.match(sql, /request_client_transition/);
  });

  it("factory schema defines deployment candidate bindings", () => {
    const schema = loadFactoryContractSchema();
    const required = schema.$defs.deploymentCandidate.required;
    for (const key of [
      "client_id",
      "onboarding_case_id",
      "configuration_version",
      "onboarding_schema_version",
      "template_version",
      "git_sha",
      "hydrator_version",
      "gate_version",
      "deployment_workflow_version",
      "artifact_digest",
      "environment",
    ]) {
      assert.ok(required.includes(key), `deployment candidate missing ${key}`);
    }
    assert.equal(schema.contract_version, "0.1.1");
    assert.ok(schema.$defs.productionApprovalDocument);
    assert.ok(schema.$defs.syncPolicyDocument);
    assert.ok(schema.$defs.supabaseTargetsDocument);
    assert.ok(schema.$defs.slugLockEvent);
    assert.ok(schema.$defs.explicitClearOperation);
  });

  it("forbidden alias scanner finds no violations in owned paths", () => {
    const aliases = loadForbiddenAliases();
    assert.equal(aliases.contract_version, "0.1.1");
    assert.ok(aliases.aliases.some((a) => a.canonical === "ghl_location_id"));
    const result = scanForbiddenAliases();
    assert.equal(
      result.ok,
      true,
      `forbidden aliases found: ${JSON.stringify(result.violations, null, 2)}`
    );
  });

  it("core migration defines required tables", () => {
    const sql = readFileSync(
      join(repoRoot(), "supabase/migrations/20260731000100_factory_core_tables.sql"),
      "utf8"
    );
    for (const table of [
      "clients",
      "onboarding_cases",
      "intake_submissions",
      "config_versions",
      "idempotency_keys",
      "status_history",
      "deferrals",
      "sync_failures",
      "approval_readiness",
      "production_approvals",
      "workflow_events",
    ]) {
      assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
    }
    assert.match(sql, /forbid_direct_onboarding_status_update/);
    assert.match(sql, /free_form_status_update_forbidden/);
  });

  it("RPC enforces requires_production_approval", () => {
    const sql = readFileSync(
      join(repoRoot(), "supabase/migrations/20260731000200_request_client_transition.sql"),
      "utf8"
    );
    assert.match(sql, /requires_production_approval/);
    assert.match(sql, /production_approval_required/);
    assert.match(sql, /FROM production_approvals/);
  });

  it("loads P0.5 companion policies at contract 0.1.1", () => {
    const approval = loadProductionApprovalPolicy();
    const sync = loadSyncPolicy();
    const targets = loadSupabaseTargets();
    assert.equal(approval.contract_version, "0.1.1");
    assert.equal(approval.default_ttl_hours, 24);
    assert.equal(approval.max_failed_attempts, 2);
    assert.equal(sync.contract_version, "0.1.1");
    assert.equal(sync.authoritative_system, "supabase");
    assert.equal(targets.contract_version, "0.1.1");
    assert.equal(targets.project_name, "htl-factory-dev");
    assert.equal(targets.dev_test_project_ref, "epeddfdifckzzmskhdsz");
    assert.equal(targets.target_environment, "dev_test");
    assert.equal(targets.apply_authorized, false);
    assert.equal(targets.production_apply_authorized, false);
    assert.equal(targets.production_project_ref, null);
  });
});
