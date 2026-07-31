import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createMockStore,
  newId,
  applyFormSubmission,
  mergeOwnedFields,
  computeApprovalReadiness,
  loadIdentityFields,
  loadSupabaseTargets,
  createProductionApproval,
  validateProductionApproval,
  recordDeploymentFailure,
  markManagedResourceCreated,
  renameClientSlug,
  clearConfigField,
  applyHumanOverride,
  requestClientTransition,
  requestMirrorUpdate,
  reconcileClickUpMirror,
  ContractError,
} from "../../scripts/lib/factory-contract/index.mjs";
import {
  assertClientMutationAllowed,
  ClientProtectionError,
  loadProtectedClientsConfig,
} from "../../scripts/lib/client-protection.mjs";

const DIGEST_A = `sha256:${"aa".repeat(32)}`;
const DIGEST_B = `sha256:${"bb".repeat(32)}`;

function candidate(clientId, caseId, overrides = {}) {
  return {
    client_id: clientId,
    onboarding_case_id: caseId,
    configuration_version: 1,
    onboarding_schema_version: "1.0.0",
    template_version: "1.1.0",
    git_sha: "abcdef1",
    hydrator_version: "1.0.0",
    gate_version: "1.0.0",
    deployment_workflow_version: "1.0.0",
    artifact_digest: DIGEST_A,
    environment: "production",
    ...overrides,
  };
}

describe("P0.5 owner decision proofs", () => {
  /** @type {ReturnType<typeof createMockStore>} */
  let store;
  let clientId;
  let caseId;

  beforeEach(() => {
    store = createMockStore();
    clientId = newId();
    caseId = newId();
    store.clients.set(clientId, {
      client_id: clientId,
      client_slug: "acme-spas",
      deployment_key: "dep_acme-spas",
      business_name: "Acme Spas",
      domain: "acme.example",
      active_onboarding_case_id: caseId,
      slug_locked: false,
    });
    store.onboarding_cases.set(caseId, {
      onboarding_case_id: caseId,
      client_id: clientId,
      status: "submitted",
      version: 1,
    });
  });

  it("locks client_slug after first managed resource and never unlocks on provision failure", () => {
    markManagedResourceCreated(store, { client_id: clientId, resource_id: "res-1" });
    const client = store.clients.get(clientId);
    assert.equal(client.slug_locked, true);
    assert.equal(client.slug_locked_reason, "first_managed_resource_created");
    assert.throws(
      () => renameClientSlug(store, { client_id: clientId, next_slug: "other-spas", actor: "csm" }),
      (err) => err instanceof ContractError && err.code === "slug_locked"
    );

    // Provisioning failure / status regression must not unlock.
    store.onboarding_cases.get(caseId).status = "provision_failed";
    assert.equal(store.clients.get(clientId).slug_locked, true);
    assert.throws(
      () => renameClientSlug(store, { client_id: clientId, next_slug: "retry-spas", actor: "tech_operator" }),
      (err) => err instanceof ContractError && err.code === "slug_locked"
    );
  });

  it("rejects expired production approvals", () => {
    const approval = createProductionApproval(
      store,
      candidate(clientId, caseId),
      { nowMs: Date.now() - 25 * 3600 * 1000, ttl_hours: 24 }
    );
    assert.throws(
      () =>
        validateProductionApproval(store, {
          production_approval_id: approval.production_approval_id,
          onboarding_case_id: caseId,
          candidate: candidate(clientId, caseId),
        }),
      (err) => err instanceof ContractError && err.code === "production_approval_expired"
    );
  });

  it("rejects changed artifact_digest and environment mismatch", () => {
    const approval = createProductionApproval(store, candidate(clientId, caseId));
    assert.throws(
      () =>
        validateProductionApproval(store, {
          production_approval_id: approval.production_approval_id,
          onboarding_case_id: caseId,
          candidate: candidate(clientId, caseId, { artifact_digest: DIGEST_B }),
        }),
      (err) =>
        err instanceof ContractError && err.code === "production_approval_candidate_mismatch"
    );
    assert.throws(
      () =>
        validateProductionApproval(store, {
          production_approval_id: approval.production_approval_id,
          onboarding_case_id: caseId,
          candidate: candidate(clientId, caseId, { environment: "staging" }),
        }),
      (err) =>
        err instanceof ContractError && err.code === "production_approval_candidate_mismatch"
    );
  });

  it("enforces max two failed retries under one approval", () => {
    const approval = createProductionApproval(store, candidate(clientId, caseId));
    recordDeploymentFailure(store, {
      production_approval_id: approval.production_approval_id,
      candidate: candidate(clientId, caseId),
    });
    recordDeploymentFailure(store, {
      production_approval_id: approval.production_approval_id,
      candidate: candidate(clientId, caseId),
    });
    assert.throws(
      () =>
        validateProductionApproval(store, {
          production_approval_id: approval.production_approval_id,
          onboarding_case_id: caseId,
          candidate: candidate(clientId, caseId),
        }),
      (err) =>
        err instanceof ContractError && err.code === "production_approval_retry_exhausted"
    );
  });

  it("one approval cannot authorize two environments; staging cannot authorize production", () => {
    const staging = createProductionApproval(
      store,
      candidate(clientId, caseId, { environment: "staging" })
    );
    assert.throws(
      () =>
        validateProductionApproval(store, {
          production_approval_id: staging.production_approval_id,
          onboarding_case_id: caseId,
          candidate: candidate(clientId, caseId, { environment: "production" }),
        }),
      (err) =>
        err instanceof ContractError && err.code === "production_approval_candidate_mismatch"
    );
  });

  it("form3 cannot overwrite business_name despite global precedence", () => {
    const identity = loadIdentityFields();
    const base = {
      business_name: "Acme Spas",
      __owners: { business_name: "form1" },
    };
    assert.throws(
      () =>
        mergeOwnedFields(
          base,
          "form3",
          { business_name: "Hijacked Name", ga4_id: "G-TEST" },
          identity.forms.form3,
          identity
        ),
      (err) => err instanceof ContractError && err.code === "writer_not_allowed"
    );
  });

  it("explicit clear requires versioned operation; forms cannot clear", () => {
    const cfgId = newId();
    store.config_versions.set(cfgId, {
      config_version_id: cfgId,
      client_id: clientId,
      onboarding_case_id: caseId,
      config_version: 2,
      config: { domain: "acme.example", __owners: { domain: "form2" } },
    });

    assert.throws(
      () =>
        clearConfigField(store, {
          onboarding_case_id: caseId,
          field_name: "domain",
          actor: "form2",
          reason: "oops",
          expected_version: 2,
        }),
      (err) => err instanceof ContractError && err.code === "form_clear_forbidden"
    );

    assert.throws(
      () =>
        clearConfigField(store, {
          onboarding_case_id: caseId,
          field_name: "domain",
          actor: "csm",
          reason: "remove bad domain",
          expected_version: 1,
        }),
      (err) => err instanceof ContractError && err.code === "concurrency_conflict"
    );

    const cleared = clearConfigField(store, {
      onboarding_case_id: caseId,
      field_name: "domain",
      actor: "csm",
      reason: "remove bad domain",
      expected_version: 2,
    });
    assert.equal(cleared.config_version, 3);
    assert.equal(cleared.previous, "acme.example");
  });

  it("human override cannot bypass expected_version", () => {
    const cfgId = newId();
    store.config_versions.set(cfgId, {
      config_version_id: cfgId,
      client_id: clientId,
      onboarding_case_id: caseId,
      config_version: 4,
      config: { business_name: "Acme Spas", __owners: { business_name: "form1" } },
    });
    assert.throws(
      () =>
        applyHumanOverride(store, {
          onboarding_case_id: caseId,
          field_name: "business_name",
          value: "Acme Renamed",
          reason: "legal name",
          expected_version: 3,
        }),
      (err) => err instanceof ContractError && err.code === "concurrency_conflict"
    );
    const ok = applyHumanOverride(store, {
      onboarding_case_id: caseId,
      field_name: "business_name",
      value: "Acme Renamed",
      reason: "legal name",
      expected_version: 4,
    });
    assert.equal(ok.config_version, 5);
  });

  it("expired deferral no longer satisfies approval readiness", () => {
    const cfgId = newId();
    store.config_versions.set(cfgId, {
      config_version_id: cfgId,
      client_id: clientId,
      onboarding_case_id: caseId,
      config_version: 1,
      config: {
        business_name: "Acme",
        owner_name: "Pat",
        owner_email: "p@example.com",
        owner_phone: "+1",
        offer_summary: "deal",
        domain: "acme.example",
        dns_owner: "client",
        address: "1 Main",
        hours: "9-5",
        phone_e164: "+1555",
        ga4_id: "G-1",
        meta_pixel_id: "1",
        // ghl_location_id missing, covered only by expired deferral
      },
    });
    store.deferrals.push({
      deferral_id: "d1",
      onboarding_case_id: caseId,
      field_name: "ghl_location_id",
      expires_at: new Date(Date.now() - 1000).toISOString(),
      production_allowed: true,
    });
    const readiness = computeApprovalReadiness(store, caseId);
    assert.equal(readiness.is_ready, false);
    assert.ok(readiness.missing_fields.includes("ghl_location_id"));
  });

  it("ClickUp lag cannot reverse Supabase; stale mirror replay is rejected", () => {
    store.onboarding_cases.get(caseId).status = "under_review";
    store.onboarding_cases.get(caseId).version = 5;

    const mirrored = requestMirrorUpdate(store, {
      onboarding_case_id: caseId,
      authoritative_status: "under_review",
      authoritative_version: 5,
      authoritative_committed_at: Date.now() - 1000,
      mirrored_at: Date.now(),
    });
    assert.equal(mirrored.authoritative_unchanged, true);
    assert.equal(store.onboarding_cases.get(caseId).status, "under_review");

    // Advance authoritative state.
    store.onboarding_cases.get(caseId).status = "approved";
    store.onboarding_cases.get(caseId).version = 6;

    assert.throws(
      () =>
        reconcileClickUpMirror(store, {
          onboarding_case_id: caseId,
          proposed_status: "under_review",
          proposed_version: 5,
        }),
      (err) => err instanceof ContractError && err.code === "stale_authoritative_replay"
    );

    requestMirrorUpdate(store, {
      onboarding_case_id: caseId,
      authoritative_status: "approved",
      authoritative_version: 6,
    });

    assert.throws(
      () =>
        reconcileClickUpMirror(store, {
          onboarding_case_id: caseId,
          proposed_status: "approved",
          proposed_version: 6,
          proposed_mirror_version: 5,
        }),
      (err) => err instanceof ContractError && err.code === "stale_mirror_replay"
    );
  });

  it("marks ClickUp sync failure after 15 minutes without rolling back Supabase", () => {
    store.onboarding_cases.get(caseId).status = "approved";
    store.onboarding_cases.get(caseId).version = 3;
    const committed = Date.now() - 16 * 60 * 1000;
    const result = requestMirrorUpdate(store, {
      onboarding_case_id: caseId,
      authoritative_status: "approved",
      authoritative_version: 3,
      authoritative_committed_at: committed,
      mirrored_at: Date.now(),
    });
    assert.equal(result.mirror.mirror_status, "sync_failure");
    assert.equal(store.sync_failures.length, 1);
    assert.equal(store.onboarding_cases.get(caseId).status, "approved");
  });

  it("registers approved Supabase target without authorizing apply", () => {
    const targets = loadSupabaseTargets();
    assert.equal(targets.apply_authorized, false);
    assert.equal(targets.production_apply_authorized, false);
    assert.equal(targets.dev_test_project_ref, "epeddfdifckzzmskhdsz");
    assert.equal(targets.project_name, "htl-factory-dev");
    assert.equal(targets.target_environment, "dev_test");
  });

  it("missing Sun Pool UUID still fails closed", () => {
    const config = loadProtectedClientsConfig();
    const sun = config.protected_clients.find((c) => c.slug === "sun-pool-spa");
    assert.equal(sun.client_id, null);
    assert.equal(sun.missing_client_id_is_additional_protection, true);
    assert.throws(
      () =>
        assertClientMutationAllowed({
          clientSlug: "sun-pool-spa",
          operation: "mutate",
        }),
      (err) => err instanceof ClientProtectionError && err.code === "BREAK_GLASS_REQUIRED"
    );
    // Inventing a UUID must not open the gate.
    assert.throws(
      () =>
        assertClientMutationAllowed({
          clientSlug: "sun-pool-spa",
          clientId: "99999999-9999-9999-9999-999999999999",
          operation: "hydrate",
        }),
      (err) =>
        err instanceof ClientProtectionError &&
        (err.code === "BREAK_GLASS_REQUIRED" || err.code === "IDENTITY_MISMATCH")
    );
  });

  it("production transition validates approval without owning create/expire logic", () => {
    store.onboarding_cases.get(caseId).status = "awaiting_approval";
    store.onboarding_cases.get(caseId).version = 8;
    const approval = createProductionApproval(store, candidate(clientId, caseId));
    const started = requestClientTransition(store, {
      onboarding_case_id: caseId,
      expected_current_status: "awaiting_approval",
      requested_status: "production_deploying",
      expected_version: 8,
      actor: "approver",
      correlation_id: "corr-attempt",
      production_approval_id: approval.production_approval_id,
      artifact_digest: DIGEST_A,
      environment: "production",
    });
    assert.equal(started.status, "production_deploying");
    assert.equal(
      store.production_approvals.get(approval.production_approval_id).status,
      "deployment_attempted"
    );
  });
});
