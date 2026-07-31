# Proposed test updates — NOT applied (JSON/Python blocked in Plan mode)

Live tests still expect design-freeze “blocked at contract decision” wording. After Hybrid A+C approval in docs, these assertions must change when Agent mode is allowed.

## Current live assertions that will fail against updated docs

| Test | Current expectation | Proposed expectation |
|---|---|---|
| `test_contract_delta_exists` | text contains `BLOCKED AT CONTRACT DECISION` | contains `APPROVED` + `Hybrid A+C` + rejects B |
| `mapping_storage_blocked_flag` | completeness blocked | `approved_hybrid_ac_pending_version_and_migration` (after JSON patch) |
| employee / inventory blocked flags | `blocked_contract_decision` | `proposed_child_table_pending_migration` (after JSON patch) |

## New assertions to add

1. `versions_are_proposed_only` — `config/identity-fields.json` still `0.1.1` / `1.0.0` until publish approval
2. `proposed_amendment_lists_six_reported_fields`
3. `employee_maps_to_onboarding_employees_not_form2`
4. `inventory_maps_to_inventory_submissions_not_form3`
5. `operational_website_still_form2_owned` in live identity-fields
6. `proposed_migrations_exist_and_say_do_not_apply`
7. `apply_authorized_still_false` in `config/supabase-targets.json`
8. `no_form4_form5` unchanged

## Results artifact (after Agent run)

Regenerate `tests/onboarding/design_freeze_acceptance_results.json` and a new evidence file under `artifacts/agent-runs/integrator/`.

**This pass:** docs only; no test runner changes executed.
