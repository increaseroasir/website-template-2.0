import { ContractError } from "./errors.mjs";
import { loadSupabaseTargets } from "./load-contract.mjs";

const APPROVED_REF = "epeddfdifckzzmskhdsz";
const APPROVED_NAME = "htl-factory-dev";
const APPROVED_ENV = "dev_test";

/**
 * Validate that a proposed Supabase target matches the owner-approved
 * HTL factory development/test project. Never infers a project.
 *
 * Registration of the target does NOT authorize migration apply.
 */
export function assertApprovedSupabaseTarget(proposed = {}, policy = loadSupabaseTargets()) {
  if (!proposed || typeof proposed !== "object") {
    throw new ContractError(
      "supabase_target_required",
      "An explicit Supabase project_ref is required; agents must not infer a target"
    );
  }

  const ref = proposed.project_ref ?? proposed.dev_test_project_ref ?? null;
  if (ref === undefined || ref === null || ref === "") {
    throw new ContractError(
      "supabase_target_required",
      "project_ref is required; null/empty targets are rejected"
    );
  }

  if (ref !== policy.dev_test_project_ref || ref !== APPROVED_REF) {
    throw new ContractError(
      "supabase_target_rejected",
      `project_ref "${ref}" is not the approved HTL factory development/test target`
    );
  }

  if (policy.project_name !== APPROVED_NAME) {
    throw new ContractError(
      "supabase_target_misconfigured",
      `config project_name must be ${APPROVED_NAME}`
    );
  }

  if (policy.target_environment !== APPROVED_ENV) {
    throw new ContractError(
      "supabase_target_misconfigured",
      `config target_environment must be ${APPROVED_ENV}`
    );
  }

  if (proposed.project_name && proposed.project_name !== APPROVED_NAME) {
    throw new ContractError(
      "supabase_target_rejected",
      `project_name "${proposed.project_name}" is not the approved HTL factory development/test target`
    );
  }

  if (
    proposed.target_environment &&
    proposed.target_environment !== APPROVED_ENV &&
    proposed.target_environment !== "development" &&
    proposed.target_environment !== "test"
  ) {
    throw new ContractError(
      "supabase_target_rejected",
      `target_environment "${proposed.target_environment}" is not a allowed for the approved target`
    );
  }

  return {
    ok: true,
    project_name: policy.project_name,
    project_ref: policy.dev_test_project_ref,
    target_environment: policy.target_environment,
    apply_authorized: policy.apply_authorized === true,
    production_apply_authorized: policy.production_apply_authorized === true,
  };
}

/**
 * Fail closed: registration of a target is not apply authorization.
 */
export function assertMigrationApplyAuthorized(
  opts = {},
  policy = loadSupabaseTargets()
) {
  const validated = assertApprovedSupabaseTarget(opts, policy);

  if (opts.environment === "production" || opts.production === true) {
    if (policy.production_apply_authorized !== true) {
      throw new ContractError(
        "production_migration_apply_unauthorized",
        "Production migration apply is not authorized"
      );
    }
  }

  if (policy.apply_authorized !== true) {
    throw new ContractError(
      "migration_apply_unauthorized",
      "Migration apply is not authorized for the registered HTL factory development/test target"
    );
  }

  return validated;
}

export function getRegisteredSupabaseTarget(policy = loadSupabaseTargets()) {
  return {
    project_name: policy.project_name ?? null,
    dev_test_project_ref: policy.dev_test_project_ref ?? null,
    production_project_ref: policy.production_project_ref ?? null,
    target_environment: policy.target_environment ?? null,
    apply_authorized: policy.apply_authorized === true,
    production_apply_authorized: policy.production_apply_authorized === true,
  };
}
