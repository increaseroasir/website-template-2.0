import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createMockStore,
  newId,
  requestClientTransition,
  ContractError,
} from "../../scripts/lib/factory-contract/index.mjs";

describe("request_client_transition (mocked RPC)", () => {
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
      domain: null,
      active_onboarding_case_id: caseId,
    });
    store.onboarding_cases.set(caseId, {
      onboarding_case_id: caseId,
      client_id: clientId,
      status: "submitted",
      version: 1,
      ghl_contact_id: "contact_1",
      ghl_opportunity_id: "opp_1",
      ghl_location_id: null,
    });
  });

  it("commits an allowed transition and bumps version", () => {
    const result = requestClientTransition(store, {
      onboarding_case_id: caseId,
      expected_current_status: "submitted",
      requested_status: "under_review",
      expected_version: 1,
      actor: "csm",
      correlation_id: "corr-1",
    });
    assert.equal(result.ok, true);
    assert.equal(result.idempotent, false);
    assert.equal(result.status, "under_review");
    assert.equal(result.version, 2);
    assert.equal(store.onboarding_cases.get(caseId).status, "under_review");
    assert.equal(store.status_history.length, 1);
  });

  it("rejects forbidden skip transitions", () => {
    assert.throws(
      () =>
        requestClientTransition(store, {
          onboarding_case_id: caseId,
          expected_current_status: "submitted",
          requested_status: "provisioning",
          expected_version: 1,
          actor: "make_service",
          correlation_id: "corr-bad",
        }),
      (err) => err instanceof ContractError && err.code === "invalid_transition"
    );
  });

  it("rejects stale expected_version (optimistic concurrency)", () => {
    requestClientTransition(store, {
      onboarding_case_id: caseId,
      expected_current_status: "submitted",
      requested_status: "under_review",
      expected_version: 1,
      actor: "csm",
      correlation_id: "corr-2",
    });
    assert.throws(
      () =>
        requestClientTransition(store, {
          onboarding_case_id: caseId,
          expected_current_status: "submitted",
          requested_status: "under_review",
          expected_version: 1,
          actor: "csm",
          correlation_id: "corr-3",
        }),
      (err) => err instanceof ContractError && err.code === "concurrency_conflict"
    );
  });

  it("is idempotent for repeated identical requests", () => {
    const req = {
      onboarding_case_id: caseId,
      expected_current_status: "submitted",
      requested_status: "under_review",
      expected_version: 1,
      actor: "csm",
      correlation_id: "corr-idem",
      idempotency_key: "transition-key-1",
    };
    const first = requestClientTransition(store, req);
    const second = requestClientTransition(store, req);
    assert.equal(first.idempotent, false);
    assert.equal(second.idempotent, true);
    assert.equal(store.onboarding_cases.get(caseId).version, 2);
    assert.equal(store.status_history.length, 1);
  });

  it("rejects unauthorized actors", () => {
    assert.throws(
      () =>
        requestClientTransition(store, {
          onboarding_case_id: caseId,
          expected_current_status: "submitted",
          requested_status: "under_review",
          expected_version: 1,
          actor: "ai_build_agent",
          correlation_id: "corr-actor",
        }),
      (err) => err instanceof ContractError && err.code === "actor_not_allowed"
    );
  });

  it("resolves active case from client_id", () => {
    const result = requestClientTransition(store, {
      client_id: clientId,
      expected_current_status: "submitted",
      requested_status: "under_review",
      expected_version: 1,
      actor: "system",
      correlation_id: "corr-client",
    });
    assert.equal(result.onboarding_case_id, caseId);
  });

  it("blocks under_review -> approved without approval_readiness", () => {
    store.onboarding_cases.get(caseId).status = "under_review";
    store.onboarding_cases.get(caseId).version = 2;
    assert.throws(
      () =>
        requestClientTransition(store, {
          onboarding_case_id: caseId,
          expected_current_status: "under_review",
          requested_status: "approved",
          expected_version: 2,
          actor: "csm",
          correlation_id: "corr-ready",
        }),
      (err) =>
        err instanceof ContractError && err.code === "approval_readiness_blocked"
    );

    store.approval_readiness.set("r1", {
      onboarding_case_id: caseId,
      target_environment: "staging",
      is_ready: true,
    });
    const ok = requestClientTransition(store, {
      onboarding_case_id: caseId,
      expected_current_status: "under_review",
      requested_status: "approved",
      expected_version: 2,
      actor: "csm",
      correlation_id: "corr-ready-2",
    });
    assert.equal(ok.status, "approved");
  });
});
