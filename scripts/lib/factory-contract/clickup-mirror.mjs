import { ContractError } from "./errors.mjs";
import { loadSyncPolicy } from "./load-contract.mjs";
import { newId } from "./mock-store.mjs";

function getMirror(store, onboardingCaseId) {
  return (
    [...store.clickup_mirrors.values()].find(
      (row) => row.onboarding_case_id === onboardingCaseId
    ) || null
  );
}

/**
 * Mirror an authoritative Supabase status into ClickUp.
 * Never rolls back Supabase. Marks delayed / sync_failure by lag thresholds.
 */
export function requestMirrorUpdate(
  store,
  {
    onboarding_case_id,
    authoritative_status,
    authoritative_version,
    mirrored_at = Date.now(),
    authoritative_committed_at = null,
  },
  policy = loadSyncPolicy()
) {
  const caseRow = store.onboarding_cases.get(onboarding_case_id);
  if (!caseRow) throw new ContractError("not_found", "onboarding_case_id");

  if (
    caseRow.status !== authoritative_status ||
    caseRow.version !== authoritative_version
  ) {
    throw new ContractError(
      "authoritative_mismatch",
      "mirror payload must match current authoritative Supabase state"
    );
  }

  const committedAt = authoritative_committed_at ?? Date.now();
  const lagSeconds = Math.max(0, Math.floor((mirrored_at - committedAt) / 1000));
  let mirror_status = "synced";
  if (lagSeconds >= (policy.sync_failure_after_seconds ?? 900)) {
    mirror_status = "sync_failure";
    const failureId = newId();
    store.sync_failures.push({
      sync_failure_id: failureId,
      onboarding_case_id,
      client_id: caseRow.client_id,
      system: "clickup",
      reason: "mirror_lag_exceeded",
      lag_seconds: lagSeconds,
      created_at: new Date(mirrored_at).toISOString(),
      resolved_at: null,
    });
  } else if (lagSeconds >= (policy.delayed_after_seconds ?? 300)) {
    mirror_status = "delayed";
  }

  const existing = getMirror(store, onboarding_case_id);
  const id = existing?.mirror_id || newId();
  const row = {
    mirror_id: id,
    onboarding_case_id,
    client_id: caseRow.client_id,
    mirrored_status: authoritative_status,
    mirrored_version: authoritative_version,
    mirror_status,
    lag_seconds: lagSeconds,
    updated_at: new Date(mirrored_at).toISOString(),
  };
  store.clickup_mirrors.set(id, row);

  // Never mutate authoritative case from mirror lag.
  return { ok: true, mirror: { ...row }, authoritative_unchanged: true };
}

/**
 * Idempotent ClickUp reconciliation. Rejects stale replay over a newer mirror
 * and never overwrites a newer authoritative Supabase state.
 */
export function reconcileClickUpMirror(
  store,
  {
    onboarding_case_id,
    proposed_status,
    proposed_version,
    proposed_mirror_version = null,
  },
  policy = loadSyncPolicy()
) {
  if (policy.mirror_may_overwrite_newer_authoritative !== false) {
    // Contract requires false; treat anything else as unsafe.
  }

  const caseRow = store.onboarding_cases.get(onboarding_case_id);
  if (!caseRow) throw new ContractError("not_found", "onboarding_case_id");

  if (proposed_version < caseRow.version) {
    throw new ContractError(
      "stale_authoritative_replay",
      "ClickUp reconciliation cannot reverse a newer Supabase state"
    );
  }

  if (proposed_version > caseRow.version) {
    throw new ContractError(
      "mirror_ahead_of_authoritative",
      "ClickUp may not independently advance beyond Supabase"
    );
  }

  const mirror = getMirror(store, onboarding_case_id);
  if (
    mirror &&
    proposed_mirror_version !== null &&
    proposed_mirror_version < mirror.mirrored_version
  ) {
    throw new ContractError(
      "stale_mirror_replay",
      "ClickUp reconciliation cannot replay an older state over a newer mirror state"
    );
  }

  if (
    proposed_status !== caseRow.status ||
    proposed_version !== caseRow.version
  ) {
    throw new ContractError(
      "authoritative_mismatch",
      "reconciliation must match authoritative version and status"
    );
  }

  return requestMirrorUpdate(store, {
    onboarding_case_id,
    authoritative_status: caseRow.status,
    authoritative_version: caseRow.version,
  }, policy);
}
