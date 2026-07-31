# Evidence: DEV/TEST migration apply + verification

**Run ID:** `20260731T081500Z-dev-test-migration-apply`  
**Agent:** integrator  
**UTC:** 2026-07-31T08:15:00Z  
**Authorization:** OWNER AUTHORIZATION: DEV/TEST MIGRATION APPLY

## Target lock

| Field | Value | Result |
|---|---|---|
| project_name | `htl-factory-dev` | locked |
| project_ref | `epeddfdifckzzmskhdsz` | PASS — `get_project_url` → `https://epeddfdifckzzmskhdsz.supabase.co` |
| environment | `dev_test` | locked |
| DB role at apply | `postgres` | write-capable |
| Pre-apply public tables | `[]` | PASS |
| Pre-apply migrations | `[]` | PASS |

## Migration files (unmodified)

| File | sha256 |
|---|---|
| `supabase/migrations/20260731000100_factory_core_tables.sql` | `11068c7b7373dd7aea2d4eeb80cb8246d009f1c9a129007e7fbdd7ca2d57e307` |
| `supabase/migrations/20260731000200_request_client_transition.sql` | `a52810d2745e28059e86ff752b0c242153133f73da48761628c5eceae48df332` |

Hashes confirmed identical before and after apply. No SQL edits during the run.

## Apply

| Step | MCP name | Result |
|---|---|---|
| 1 | `factory_core_tables` | success |
| 2 | `request_client_transition` | success |

Recorded migration history (Supabase MCP assign timestamps; content is the authored SQL):

1. `20260731081207` — `factory_core_tables`
2. `20260731081314` — `request_client_transition`

Note: MCP `apply_migration` versions are apply-time stamps, not the `20260731000100` / `20260731000200` filename prefixes. Content was applied verbatim from repo files.

## Schema verification

### Tables (12/12 expected)

`approval_readiness`, `clients`, `config_versions`, `deferrals`, `factory_transition_rules`, `idempotency_keys`, `intake_submissions`, `onboarding_cases`, `production_approvals`, `status_history`, `sync_failures`, `workflow_events`

No unexpected factory tables.

### Functions (authored)

- `forbid_direct_onboarding_status_update` (trigger)
- `audit_client_domain_change` (trigger)
- `request_client_transition` (SECURITY DEFINER RPC; PUBLIC revoked)

### Platform object (not migration-authored)

- `public.rls_auto_enable` — Supabase event-trigger helper that auto-enables RLS on `CREATE TABLE` in `public`. Present as platform infrastructure; not from factory migrations. Documented, not treated as migration drift.

### Triggers

- `trg_forbid_direct_onboarding_status_update` on `onboarding_cases`
- `trg_audit_client_domain_change` on `clients`

### Indexes

All authored indexes present (PKs, uniques, case/status/open partial indexes). Sample includes: `clients_ghl_contact_id_idx`, `onboarding_cases_status_idx`, `sync_failures_open_idx`, `production_approvals_open_idx`, `workflow_events_correlation_idx`, etc.

### Constraints

Status check, slug format, digest format, FK graph, unique constraints verified via verbose `list_tables` + `pg_constraint`.

### RLS

- RLS **enabled** on all 12 public tables (platform auto-enable via `rls_auto_enable`)
- Policy count: **0** on all tables (migrations did not author policies; service/postgres path used for smoke)
- Advisors: not blocking this apply gate; policy authoring is a later hardening item if anon/authenticated roles are used

### Seed data

- `factory_transition_rules`: **27** rows (matches authored seed)

## Test-data smoke (cleaned up)

Synthetic only (`htl-factory-test-client` / `test.htl-factory.invalid`):

1. Insert client + onboarding_case (`submitted`/v1)
2. Direct `UPDATE status` → blocked (`free_form_status_update_forbidden`) — PASS
3. `request_client_transition` submitted→under_review as `csm` — PASS (`ok: true`)
4. Delete all test rows — PASS (`clients=0`, `cases=0`, `status_history=0`; rules remain 27)

## Hard-stop checks

| Condition | Result |
|---|---|
| Wrong project ref | PASS (exact match) |
| Unexpected factory schema objects | PASS (12 expected tables only) |
| Migration drift / SQL edit required | PASS (hashes unchanged; applied verbatim) |
| Verification fail | PASS |
| Production / other projects / Make / Sun Pool / real client data | NOT TOUCHED |

## Sun Pool / production

- Sun Pool tree OID unchanged: `f3da831b2c31d37693f6022340b2d2f936bb4f72`
- No production project contacted
- No production credentials used
- Make: NOT AUTHORIZED / not started

## Repo context

- Branch: `factory/p0-safety-lock`
- Tip at evidence time: `c156dd80d4364a12edf33f92ad0e52346af63806` (pre-evidence commit; tip updates after integrator state commit)
- Remote: `increaseroasir/website-template-2.0`

## Verdict

**P1 Supabase migrations/RPC: COMPLETE AND VERIFIED** on `htl-factory-dev` (`epeddfdifckzzmskhdsz`) only.

Make remains **NOT AUTHORIZED**.
