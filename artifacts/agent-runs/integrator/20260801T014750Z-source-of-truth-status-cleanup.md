# Source-of-truth status cleanup

**UTC:** 20260801T014750Z
**Agent:** integrator
**Branch tip before cleanup:** `3b72591fe8c25eab827cb7c7bdeb68e51cd144ed` (after checkpoint docs commit)
**Scope:** status wording only — no field ownership, schema, migrations, Make, GHL, ClickUp, or EXECUTION_STATE changes

## Authoritative current state

- `contract_version` = `0.2.0`
- `onboarding_schema_version` = `1.1.0`
- Child tables applied+verified on `htl-factory-dev` / `epeddfdifckzzmskhdsz`
  - `onboarding_employees` remote `20260731193347`
  - `inventory_submissions` remote `20260731193358`
- RLS enabled; policy count 0; no anon/auth row DML
- `apply_authorized` = false
- Make Form 1 scenario `4852018` inactive create-or-link blueprint exists
- Form 1 E2E has **not** run; P2 **not** complete
- GHL / ClickUp live product wiring still unauthorized

## Authoritative sources

- `config/identity-fields.json`
- `docs/CANONICAL_CONTRACT.md`
- `docs/EXECUTION_STATE.md` (unchanged; already accurate)
- `docs/make/P2-form1-scenario.md`
- Checkpoint audit `20260801T014500Z-factory-checkpoint-audit.md`
- Live Supabase MCP verify 2026-08-01 (read-only)

## Files changed

- `config/onboarding-field-mappings.json`
- `config/onboarding-field-registry.json`
- `config/forms/form-1-main-client-onboarding.json`
- `config/identity-fields.json`
- `docs/CANONICAL_CONTRACT.md`
- `docs/onboarding/FORM_FIELD_REGISTRY.md`
- `docs/onboarding/CONTRACT_DELTA_REPORT.md`
- `docs/onboarding/MIGRATION_AND_CONTRACT_AMENDMENT_PLAN.md`
- `docs/onboarding/FORM_FIELD_MAPPING_MATRIX.md`
- `docs/onboarding/proposed-migrations/README.md`
- `docs/onboarding/PROPOSED_CONTRACT_AMENDMENT_0.2.0.md`
- `docs/onboarding/PROPOSED_REGISTRY_AND_MAPPING_PATCH.md`
- `docs/engineering/MULTI_AGENT_DELIVERY_MODEL.md`
- `tests/onboarding/test_design_freeze_acceptance.py`

## Stale statements corrected

- mappings completeness storage_bindings: published_0_2_0_migrations_landed_not_applied -> published_0_2_0_child_migrations_applied_dev
- mappings completeness live_contract_versions: published_0.2.0_and_1.1.0_in_git_migrations_not_applied -> published_0.2.0_and_1.1.0_child_migrations_applied_htl_factory_dev
- mappings storage_binding_status published_schema_migrations_landed_not_applied -> published_schema_child_migrations_applied_dev (28 rows)
- registry live_contract_version_note: 'identity-fields.json remains 0.1.1 / 1.0.0 until owner publishes versions' -> updated current truth
- registry storage_binding_policy updated (was publish-gate wording)
- registry awaiting list retargeted to E2E/GHL/ClickUp gates
- registry proposed_aligned_pending_version_publish -> published_contract_0_2_0 (6)
- registry proposed_child_table_pending_migration -> published_schema_child_migrations_applied_dev (28)
- registry descriptions pending version publish updated (3)
- form-1 storage_binding_status: form1_hybrid_ac_reported_website_fields_pending_version_publish -> form1_hybrid_ac_reported_website_fields_published_0_2_0
- form-1 live_contract_version_note updated
- identity-fields description: landed-before-apply wording -> applied on htl-factory-dev
- CANONICAL_CONTRACT.md Forms section: child tables now marked applied on htl-factory-dev
- docs/onboarding/FORM_FIELD_REGISTRY.md: status banners/stale apply wording updated
- docs/onboarding/CONTRACT_DELTA_REPORT.md: status banners/stale apply wording updated
- docs/onboarding/MIGRATION_AND_CONTRACT_AMENDMENT_PLAN.md: status banners/stale apply wording updated
- docs/onboarding/FORM_FIELD_MAPPING_MATRIX.md: status banners/stale apply wording updated
- docs/onboarding/proposed-migrations/README.md: status banners/stale apply wording updated
- docs/onboarding/PROPOSED_CONTRACT_AMENDMENT_0.2.0.md: status banners/stale apply wording updated
- docs/onboarding/PROPOSED_REGISTRY_AND_MAPPING_PATCH.md: status banners/stale apply wording updated
- MULTI_AGENT_DELIVERY_MODEL.md: status + current integration tip
- tests/onboarding/test_design_freeze_acceptance.py: expect applied/published status strings

## Follow-up in same cleanup

- Updated onboarding acceptance tests to expect published/applied status strings (not stale `NOT APPLIED` / `0.1.1` gates).
- Corrected `MIGRATION_AND_CONTRACT_AMENDMENT_PLAN.md` owner-next list (child apply done; E2E is next).

## External writes

None. No Make / GHL / ClickUp / Supabase / production / protected-client mutations.
