import { ContractError } from "./errors.mjs";
import { loadProductionApprovalPolicy } from "./load-contract.mjs";
import { newId } from "./mock-store.mjs";

const CANDIDATE_KEYS = [
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
];

function refreshDerivedState(approval, now = Date.now()) {
  if (approval.status === "consumed" || approval.status === "revoked") {
    return approval;
  }
  if (new Date(approval.expires_at).getTime() <= now) {
    approval.status = "expired";
  }
  return approval;
}

function candidateFromApproval(approval) {
  const out = {};
  for (const key of CANDIDATE_KEYS) out[key] = approval[key];
  return out;
}

function candidatesMatch(a, b) {
  return CANDIDATE_KEYS.every((key) => a[key] === b[key]);
}

/**
 * Create a production/staging deployment approval bound to one exact candidate.
 */
export function createProductionApproval(
  store,
  candidate,
  opts = {},
  policy = loadProductionApprovalPolicy()
) {
  for (const key of CANDIDATE_KEYS) {
    if (candidate?.[key] === undefined || candidate?.[key] === null || candidate?.[key] === "") {
      throw new ContractError(
        "invalid_argument",
        `deployment candidate missing ${key}`
      );
    }
  }

  const now = opts.nowMs ?? Date.now();
  const ttlHours = opts.ttl_hours ?? policy.default_ttl_hours ?? 24;
  const id = opts.production_approval_id || newId();
  const approval = {
    production_approval_id: id,
    ...candidateFromApproval(candidate),
    approved_by: opts.approved_by || "owner@example.com",
    approved_at: new Date(now).toISOString(),
    expires_at: new Date(now + ttlHours * 3600 * 1000).toISOString(),
    status: policy.initial_state || "active",
    failed_attempt_count: 0,
    attempt_count: 0,
    consumed_at: null,
    revoked_at: null,
  };
  store.production_approvals.set(id, approval);
  return { ...approval };
}

export function validateProductionApproval(
  store,
  {
    production_approval_id = null,
    onboarding_case_id,
    candidate,
    nowMs = Date.now(),
  },
  policy = loadProductionApprovalPolicy()
) {
  let approval = null;
  if (production_approval_id) {
    approval = store.production_approvals.get(production_approval_id) || null;
  } else {
    approval =
      [...store.production_approvals.values()].find(
        (row) =>
          row.onboarding_case_id === onboarding_case_id &&
          row.environment === candidate.environment
      ) || null;
  }

  if (!approval) {
    throw new ContractError(
      "production_approval_required",
      "no production approval found for candidate"
    );
  }

  refreshDerivedState(approval, nowMs);
  store.production_approvals.set(approval.production_approval_id, approval);

  if (approval.status === "expired") {
    throw new ContractError("production_approval_expired", "approval expired");
  }
  if (approval.status === "revoked") {
    throw new ContractError("production_approval_revoked", "approval revoked");
  }
  if (approval.status === "consumed") {
    throw new ContractError("production_approval_consumed", "approval already consumed");
  }
  if (!["active", "deployment_attempted"].includes(approval.status)) {
    throw new ContractError(
      "production_approval_invalid_state",
      `approval status ${approval.status} cannot authorize deployment`
    );
  }

  const bound = candidateFromApproval(approval);
  if (!candidatesMatch(bound, candidate)) {
    throw new ContractError(
      "production_approval_candidate_mismatch",
      "approval does not bind to the exact deployment candidate",
      { expected: bound, actual: candidate }
    );
  }

  if (approval.failed_attempt_count >= (policy.max_failed_attempts ?? 2)) {
    throw new ContractError(
      "production_approval_retry_exhausted",
      `approval exhausted ${policy.max_failed_attempts} failed attempts; new approval required`
    );
  }

  return { ...approval };
}

export function recordDeploymentAttempt(
  store,
  { production_approval_id, candidate, nowMs = Date.now() },
  policy = loadProductionApprovalPolicy()
) {
  const approval = validateProductionApproval(
    store,
    { production_approval_id, onboarding_case_id: candidate.onboarding_case_id, candidate, nowMs },
    policy
  );
  const row = store.production_approvals.get(approval.production_approval_id);
  row.attempt_count += 1;
  row.status = "deployment_attempted";
  row.last_attempt_at = new Date(nowMs).toISOString();
  store.production_approvals.set(row.production_approval_id, row);
  return { ...row };
}

export function recordDeploymentFailure(
  store,
  { production_approval_id, candidate, nowMs = Date.now() },
  policy = loadProductionApprovalPolicy()
) {
  const approval = validateProductionApproval(
    store,
    { production_approval_id, onboarding_case_id: candidate.onboarding_case_id, candidate, nowMs },
    policy
  );
  const row = store.production_approvals.get(approval.production_approval_id);
  row.failed_attempt_count += 1;
  row.last_failure_at = new Date(nowMs).toISOString();
  row.status = "deployment_attempted";
  store.production_approvals.set(row.production_approval_id, row);
  return { ...row };
}

export function consumeProductionApproval(
  store,
  { production_approval_id, candidate, nowMs = Date.now() },
  policy = loadProductionApprovalPolicy()
) {
  const approval = validateProductionApproval(
    store,
    { production_approval_id, onboarding_case_id: candidate.onboarding_case_id, candidate, nowMs },
    policy
  );
  const row = store.production_approvals.get(approval.production_approval_id);
  row.status = "consumed";
  row.consumed_at = new Date(nowMs).toISOString();
  store.production_approvals.set(row.production_approval_id, row);
  return { ...row };
}

export function authorizeRollback(store, auth, opts = {}) {
  const required = [
    "client_id",
    "onboarding_case_id",
    "from_artifact_digest",
    "to_artifact_digest",
    "environment",
    "approved_by",
    "reason",
  ];
  for (const key of required) {
    if (!auth?.[key]) {
      throw new ContractError("invalid_argument", `rollback authorization missing ${key}`);
    }
  }
  const now = opts.nowMs ?? Date.now();
  const id = auth.rollback_authorization_id || newId();
  const row = {
    rollback_authorization_id: id,
    ...auth,
    approved_at: auth.approved_at || new Date(now).toISOString(),
    expires_at:
      auth.expires_at || new Date(now + 24 * 3600 * 1000).toISOString(),
    consumed_at: null,
  };
  if (new Date(row.expires_at).getTime() <= now) {
    throw new ContractError("rollback_authorization_expired", "rollback authorization expired");
  }
  store.rollback_authorizations.set(id, row);
  return { ...row };
}
