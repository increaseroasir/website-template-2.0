import { ContractError } from "./errors.mjs";
import { loadStateMachine } from "./load-contract.mjs";
import {
  consumeProductionApproval,
  recordDeploymentAttempt,
  validateProductionApproval,
} from "./production-approval.mjs";

/**
 * Mocked equivalent of supabase request_client_transition RPC.
 * Validates production approvals via the dedicated approval module;
 * does not own approval creation/expiration/rollback authorization.
 *
 * @param {ReturnType<import('./mock-store.mjs').createMockStore>} store
 * @param {object} req
 */
export function requestClientTransition(store, req, stateMachine = loadStateMachine()) {
  const {
    client_id = null,
    onboarding_case_id = null,
    expected_current_status,
    requested_status,
    expected_version,
    actor,
    correlation_id,
    reason = null,
    idempotency_key = null,
    production_approval_id = null,
    artifact_digest = null,
    environment = null,
    configuration_version = null,
    onboarding_schema_version = "1.0.0",
    template_version = null,
    git_sha = null,
    hydrator_version = null,
    gate_version = null,
    deployment_workflow_version = null,
    nowMs = Date.now(),
  } = req ?? {};

  if (!expected_current_status || !requested_status) {
    throw new ContractError(
      "invalid_argument",
      "expected_current_status and requested_status are required"
    );
  }
  if (expected_version === undefined || expected_version === null) {
    throw new ContractError("invalid_argument", "expected_version is required");
  }
  if (!actor || !String(actor).trim()) {
    throw new ContractError("invalid_argument", "actor is required");
  }
  if (!correlation_id || !String(correlation_id).trim()) {
    throw new ContractError("invalid_argument", "correlation_id is required");
  }
  if (!client_id && !onboarding_case_id) {
    throw new ContractError(
      "invalid_argument",
      "client_id or onboarding_case_id is required"
    );
  }

  const caseRow = resolveCase(store, client_id, onboarding_case_id);
  const key =
    (idempotency_key && String(idempotency_key).trim()) ||
    `transition:${caseRow.onboarding_case_id}:${requested_status}:${correlation_id}`;

  if (store.idempotency_keys.has(key)) {
    const prior = store.idempotency_keys.get(key);
    return { ok: true, idempotent: true, result: prior.result };
  }

  if (
    caseRow.status === requested_status &&
    caseRow.version === expected_version
  ) {
    const result = {
      ok: true,
      idempotent: true,
      onboarding_case_id: caseRow.onboarding_case_id,
      client_id: caseRow.client_id,
      status: caseRow.status,
      version: caseRow.version,
    };
    store.idempotency_keys.set(key, {
      key,
      operation: "request_client_transition",
      result,
    });
    return result;
  }

  if (
    caseRow.status !== expected_current_status ||
    caseRow.version !== expected_version
  ) {
    throw new ContractError(
      "concurrency_conflict",
      `expected status=${expected_current_status} version=${expected_version} but found status=${caseRow.status} version=${caseRow.version}`,
      {
        expected_current_status,
        expected_version,
        actual_status: caseRow.status,
        actual_version: caseRow.version,
      }
    );
  }

  const rule = stateMachine.transitions.find(
    (t) => t.from === expected_current_status && t.to === requested_status
  );
  if (!rule) {
    throw new ContractError(
      "invalid_transition",
      `invalid_transition: ${expected_current_status} -> ${requested_status}`
    );
  }
  if (!rule.actors.includes(actor)) {
    throw new ContractError(
      "actor_not_allowed",
      `${actor} cannot transition ${expected_current_status} -> ${requested_status}`
    );
  }

  if (rule.requires_approval_readiness) {
    const ready = [...store.approval_readiness.values()].some(
      (row) =>
        row.onboarding_case_id === caseRow.onboarding_case_id &&
        row.is_ready === true &&
        (row.target_environment === "staging" ||
          row.target_environment === "production")
    );
    if (!ready) {
      throw new ContractError(
        "approval_readiness_blocked",
        "case is not ready for approval transition"
      );
    }
  }

  let approvalUsed = null;
  if (rule.requires_production_approval) {
    const approvalRow =
      (production_approval_id &&
        store.production_approvals.get(production_approval_id)) ||
      [...store.production_approvals.values()].find(
        (row) =>
          row.onboarding_case_id === caseRow.onboarding_case_id &&
          row.environment === "production"
      );

    if (!approvalRow) {
      throw new ContractError(
        "production_approval_required",
        "awaiting_approval -> production_deploying requires an unexpired unused production approval"
      );
    }

    const candidate = {
      client_id: approvalRow.client_id,
      onboarding_case_id: caseRow.onboarding_case_id,
      configuration_version:
        configuration_version ?? approvalRow.configuration_version,
      onboarding_schema_version:
        onboarding_schema_version ?? approvalRow.onboarding_schema_version,
      template_version: template_version ?? approvalRow.template_version,
      git_sha: git_sha ?? approvalRow.git_sha,
      hydrator_version: hydrator_version ?? approvalRow.hydrator_version,
      gate_version: gate_version ?? approvalRow.gate_version,
      deployment_workflow_version:
        deployment_workflow_version ?? approvalRow.deployment_workflow_version,
      artifact_digest: artifact_digest ?? approvalRow.artifact_digest,
      environment: environment ?? "production",
    };

    validateProductionApproval(store, {
      production_approval_id: approvalRow.production_approval_id,
      onboarding_case_id: caseRow.onboarding_case_id,
      candidate,
      nowMs,
    });
    approvalUsed = recordDeploymentAttempt(store, {
      production_approval_id: approvalRow.production_approval_id,
      candidate,
      nowMs,
    });
  }

  // Successful production deploy consumes approval: production_deploying -> live
  if (
    expected_current_status === "production_deploying" &&
    requested_status === "live"
  ) {
    const approvalRow =
      (production_approval_id &&
        store.production_approvals.get(production_approval_id)) ||
      [...store.production_approvals.values()].find(
        (row) =>
          row.onboarding_case_id === caseRow.onboarding_case_id &&
          (row.status === "deployment_attempted" || row.status === "active") &&
          row.environment === "production"
      );
    if (approvalRow) {
      const candidate = {
        client_id: approvalRow.client_id,
        onboarding_case_id: caseRow.onboarding_case_id,
        configuration_version: approvalRow.configuration_version,
        onboarding_schema_version: approvalRow.onboarding_schema_version,
        template_version: approvalRow.template_version,
        git_sha: approvalRow.git_sha,
        hydrator_version: approvalRow.hydrator_version,
        gate_version: approvalRow.gate_version,
        deployment_workflow_version: approvalRow.deployment_workflow_version,
        artifact_digest: artifact_digest ?? approvalRow.artifact_digest,
        environment: "production",
      };
      approvalUsed = consumeProductionApproval(store, {
        production_approval_id: approvalRow.production_approval_id,
        candidate,
        nowMs,
      });
    }
  }

  const newVersion = caseRow.version + 1;
  const fromStatus = caseRow.status;
  caseRow.status = requested_status;
  caseRow.version = newVersion;
  caseRow.correlation_id = correlation_id;
  caseRow.updated_at = new Date().toISOString();
  store.onboarding_cases.set(caseRow.onboarding_case_id, caseRow);

  store.status_history.push({
    client_id: caseRow.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    from_status: fromStatus,
    to_status: requested_status,
    from_version: expected_version,
    to_version: newVersion,
    actor,
    correlation_id,
    reason,
    idempotency_key: key,
  });

  store.workflow_events.push({
    client_id: caseRow.client_id,
    onboarding_case_id: caseRow.onboarding_case_id,
    event_type: "status_transition",
    correlation_id,
    actor,
    payload: {
      from_status: fromStatus,
      to_status: requested_status,
      from_version: expected_version,
      to_version: newVersion,
      reason,
      production_approval_id: approvalUsed?.production_approval_id ?? null,
    },
  });

  const result = {
    ok: true,
    idempotent: false,
    onboarding_case_id: caseRow.onboarding_case_id,
    client_id: caseRow.client_id,
    status: requested_status,
    version: newVersion,
    production_approval_id: approvalUsed?.production_approval_id ?? null,
  };

  store.idempotency_keys.set(key, {
    key,
    operation: "request_client_transition",
    result,
  });

  return result;
}

function resolveCase(store, client_id, onboarding_case_id) {
  if (onboarding_case_id) {
    const row = store.onboarding_cases.get(onboarding_case_id);
    if (!row) {
      throw new ContractError("not_found", "onboarding_case_id");
    }
    if (client_id && row.client_id !== client_id) {
      throw new ContractError(
        "identity_mismatch",
        "client_id does not match onboarding_case_id"
      );
    }
    return row;
  }

  const client = store.clients.get(client_id);
  if (!client?.active_onboarding_case_id) {
    throw new ContractError(
      "not_found",
      "active onboarding case for client_id"
    );
  }
  const row = store.onboarding_cases.get(client.active_onboarding_case_id);
  if (!row) {
    throw new ContractError(
      "not_found",
      "active onboarding case for client_id"
    );
  }
  return row;
}
