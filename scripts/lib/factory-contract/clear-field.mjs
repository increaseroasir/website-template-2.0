import { ContractError } from "./errors.mjs";
import { loadIdentityFields } from "./load-contract.mjs";
import { newId } from "./mock-store.mjs";

function headConfig(store, onboardingCaseId) {
  let head = null;
  for (const row of store.config_versions.values()) {
    if (row.onboarding_case_id !== onboardingCaseId) continue;
    if (!head || row.config_version > head.config_version) head = row;
  }
  return head;
}

/**
 * Explicit versioned clear. Forms may never clear values.
 */
export function clearConfigField(
  store,
  {
    onboarding_case_id,
    client_id = null,
    field_name,
    actor,
    reason,
    timestamp = new Date().toISOString(),
    expected_version,
  },
  identity = loadIdentityFields()
) {
  if (!field_name) throw new ContractError("invalid_argument", "field_name is required");
  if (!actor) throw new ContractError("invalid_argument", "actor is required");
  if (!reason) throw new ContractError("invalid_argument", "reason is required");
  if (expected_version === undefined || expected_version === null) {
    throw new ContractError("invalid_argument", "expected_version is required");
  }

  const policy = identity.field_policies?.[field_name];
  if (!policy) {
    throw new ContractError("unknown_field", `no field policy for ${field_name}`);
  }
  if (policy.clearable !== true) {
    throw new ContractError("field_not_clearable", `${field_name} is not clearable`);
  }
  if (!policy.allowed_writers.includes("human_override") && actor !== "human_override") {
    // clear is a human/system corrective op; require human_override writer allowance
  }
  if (actor === "form1" || actor === "form2" || actor === "form3") {
    throw new ContractError(
      "form_clear_forbidden",
      "forms may never clear values; use explicit clear operation"
    );
  }

  const caseRow = store.onboarding_cases.get(onboarding_case_id);
  if (!caseRow) throw new ContractError("not_found", "onboarding_case_id");
  if (client_id && caseRow.client_id !== client_id) {
    throw new ContractError("identity_mismatch", "client_id does not match case");
  }

  const head = headConfig(store, onboarding_case_id);
  const headVersion = head?.config_version ?? 0;
  if (expected_version !== headVersion) {
    throw new ContractError(
      "concurrency_conflict",
      `expected_version=${expected_version} but head config_version=${headVersion}`,
      { expected_version, actual_version: headVersion }
    );
  }

  const next = { ...(head?.config ?? {}) };
  const previous = next[field_name];
  delete next[field_name];
  if (next.__owners) {
    const owners = { ...next.__owners };
    delete owners[field_name];
    next.__owners = owners;
  }

  const configVersion = headVersion + 1;
  const id = newId();
  store.config_versions.set(id, {
    config_version_id: id,
    client_id: caseRow.client_id,
    onboarding_case_id,
    config_version: configVersion,
    config: next,
    source_form: "explicit_clear",
    correlation_id: `clear:${field_name}:${configVersion}`,
  });

  store.workflow_events.push({
    event_type: "config_field_cleared",
    client_id: caseRow.client_id,
    onboarding_case_id,
    actor,
    payload: {
      field_name,
      reason,
      timestamp,
      previous,
      expected_version,
      config_version: configVersion,
    },
  });

  return {
    ok: true,
    config_version: configVersion,
    field_name,
    previous,
  };
}

/**
 * Human override write. Still requires expected_version and field writer permission.
 */
export function applyHumanOverride(
  store,
  {
    onboarding_case_id,
    field_name,
    value,
    actor = "human_override",
    reason,
    expected_version,
  },
  identity = loadIdentityFields()
) {
  if (expected_version === undefined || expected_version === null) {
    throw new ContractError(
      "invalid_argument",
      "human overrides require expected_version"
    );
  }
  if (!reason) throw new ContractError("invalid_argument", "reason is required");

  const policy = identity.field_policies?.[field_name];
  if (!policy) throw new ContractError("unknown_field", `no field policy for ${field_name}`);
  if (!policy.allowed_writers.includes("human_override")) {
    throw new ContractError(
      "writer_not_allowed",
      `human_override cannot write ${field_name}`
    );
  }

  const caseRow = store.onboarding_cases.get(onboarding_case_id);
  if (!caseRow) throw new ContractError("not_found", "onboarding_case_id");
  const head = headConfig(store, onboarding_case_id);
  const headVersion = head?.config_version ?? 0;
  if (expected_version !== headVersion) {
    throw new ContractError(
      "concurrency_conflict",
      `expected_version=${expected_version} but head config_version=${headVersion}`,
      { expected_version, actual_version: headVersion }
    );
  }

  const next = { ...(head?.config ?? {}) };
  next[field_name] = value;
  next.__owners = { ...(next.__owners || {}), [field_name]: "human_override" };

  const configVersion = headVersion + 1;
  const id = newId();
  store.config_versions.set(id, {
    config_version_id: id,
    client_id: caseRow.client_id,
    onboarding_case_id,
    config_version: configVersion,
    config: next,
    source_form: "human_override",
    correlation_id: `override:${field_name}:${configVersion}`,
  });

  store.workflow_events.push({
    event_type: "human_override_applied",
    client_id: caseRow.client_id,
    onboarding_case_id,
    actor,
    payload: { field_name, value, reason, config_version: configVersion },
  });

  return { ok: true, config_version: configVersion };
}
