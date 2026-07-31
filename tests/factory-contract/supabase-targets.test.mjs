import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  loadSupabaseTargets,
  assertApprovedSupabaseTarget,
  assertMigrationApplyAuthorized,
  getRegisteredSupabaseTarget,
  ContractError,
} from "../../scripts/lib/factory-contract/index.mjs";

describe("registered HTL factory Supabase target", () => {
  it("exposes only the exact approved project identity", () => {
    const targets = loadSupabaseTargets();
    assert.equal(targets.project_name, "htl-factory-dev");
    assert.equal(targets.dev_test_project_ref, "epeddfdifckzzmskhdsz");
    assert.equal(targets.target_environment, "dev_test");
    assert.equal(targets.apply_authorized, false);
    assert.equal(targets.production_apply_authorized, false);
    assert.equal(targets.production_project_ref, null);

    const registered = getRegisteredSupabaseTarget();
    assert.equal(registered.dev_test_project_ref, "epeddfdifckzzmskhdsz");
    assert.equal(registered.apply_authorized, false);
    assert.equal(registered.production_apply_authorized, false);
  });

  it("accepts only the exact approved project ref", () => {
    const ok = assertApprovedSupabaseTarget({
      project_ref: "epeddfdifckzzmskhdsz",
      project_name: "htl-factory-dev",
      target_environment: "dev_test",
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.project_ref, "epeddfdifckzzmskhdsz");
    assert.equal(ok.apply_authorized, false);
  });

  it("rejects null, empty, and different project refs", () => {
    assert.throws(
      () => assertApprovedSupabaseTarget({}),
      (err) => err instanceof ContractError && err.code === "supabase_target_required"
    );
    assert.throws(
      () => assertApprovedSupabaseTarget({ project_ref: null }),
      (err) => err instanceof ContractError && err.code === "supabase_target_required"
    );
    assert.throws(
      () => assertApprovedSupabaseTarget({ project_ref: "" }),
      (err) => err instanceof ContractError && err.code === "supabase_target_required"
    );
    assert.throws(
      () => assertApprovedSupabaseTarget({ project_ref: "otherprojectref123" }),
      (err) => err instanceof ContractError && err.code === "supabase_target_rejected"
    );
    assert.throws(
      () =>
        assertApprovedSupabaseTarget({
          project_ref: "epeddfdifckzzmskhdsz",
          project_name: "some-other-project",
        }),
      (err) => err instanceof ContractError && err.code === "supabase_target_rejected"
    );
  });

  it("keeps migration apply unauthorized for the registered target", () => {
    assert.throws(
      () =>
        assertMigrationApplyAuthorized({
          project_ref: "epeddfdifckzzmskhdsz",
          project_name: "htl-factory-dev",
        }),
      (err) =>
        err instanceof ContractError && err.code === "migration_apply_unauthorized"
    );
  });

  it("keeps production migration apply unauthorized", () => {
    assert.throws(
      () =>
        assertMigrationApplyAuthorized({
          project_ref: "epeddfdifckzzmskhdsz",
          environment: "production",
        }),
      (err) =>
        err instanceof ContractError &&
        (err.code === "production_migration_apply_unauthorized" ||
          err.code === "migration_apply_unauthorized")
    );
  });

  it("does not allow inferring a project from empty input", () => {
    assert.throws(
      () => assertApprovedSupabaseTarget(undefined),
      (err) => err instanceof ContractError && err.code === "supabase_target_required"
    );
    assert.throws(
      () => assertMigrationApplyAuthorized({}),
      (err) =>
        err instanceof ContractError &&
        (err.code === "supabase_target_required" ||
          err.code === "migration_apply_unauthorized")
    );
  });
});
