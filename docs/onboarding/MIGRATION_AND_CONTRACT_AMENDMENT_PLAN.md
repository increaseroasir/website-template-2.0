# Migration + Contract Amendment Plan — STOP FOR OWNER APPROVAL

**Date:** 2026-07-31  
**Decision status:** Hybrid A+C direction **APPROVED**  
**Version status:** `contract_version` **0.2.0** and `onboarding_schema_version` **1.1.0** are **PROPOSALS ONLY** — not finalized, not published into live contract files  
**Live contract remains:** `0.1.1` / `1.0.0` in [`config/identity-fields.json`](../../config/identity-fields.json)

## What was completed

1. Marked [`CONTRACT_DELTA_REPORT.md`](./CONTRACT_DELTA_REPORT.md) as **APPROVED Hybrid A+C**; rejected B.
2. Proposed smallest version bump in [`PROPOSED_CONTRACT_AMENDMENT_0.2.0.md`](./PROPOSED_CONTRACT_AMENDMENT_0.2.0.md) — **not published**.
3. Six reported website/domain fields in design registry/mappings/form-1 (still absent from live `identity-fields.json`).
4. SQL proposals under [`proposed-migrations/`](./proposed-migrations/) (`.md` + `.sql` twins; not applied).
5. Design JSON + form specs aligned; acceptance **46/46** green.

## Smallest proposed contract change

| Item | Live | Proposed |
|---|---|---|
| `contract_version` | `0.1.1` | **`0.2.0` (proposed)** |
| `onboarding_schema_version` | `1.0.0` | **`1.1.0` (proposed)** |

### Exact new fields (form1-owned)

1. `website_reported_status`
2. `website_reported_url`
3. `domain_reported_name`
4. `domain_reported_ownership_status`
5. `dns_reported_provider`
6. `dns_reported_owner`

### Unchanged operational ownership (form2)

- `website_url`
- `domain`
- `dns_provider`
- `dns_owner`

## Exact proposed tables

### `onboarding_employees` (required for employee form)

Key columns: `client_id`, `onboarding_case_id`, `email`, `email_normalized`, CRM/role/calendar fields, `source_submission_id`, `payload`, statuses.  
Uniqueness: `(client_id, email_normalized)`, `(onboarding_case_id, source_submission_id)`.

### `inventory_submissions` (required for inventory form)

Key columns: availability/source/approval/rights/date, spreadsheet refs, `source_submission_id`, `payload`, parse/review status.  
Uniqueness: `(onboarding_case_id, source_submission_id)`.

### `inventory_items` (optional)

Line items under a submission; defer until parser authorized.

## Compatibility impact

- **No** change to `intake_submissions.form` enum (`form1|form2|form3`)
- **No** Alternative B semantic rename
- Existing Form 1 identity Make path remains valid
- Main-form website answers stop competing with form2 operational fields once reported_* publish is approved
- Child tables isolate repeatable employees/inventory without polluting form2/form3 ownership

## Migration proposal paths

| Proposal | Path |
|---|---|
| Employees | [`proposed-migrations/001_onboarding_employees.md`](./proposed-migrations/001_onboarding_employees.md) |
| Inventory batches | [`proposed-migrations/002_inventory_submissions.md`](./proposed-migrations/002_inventory_submissions.md) |
| Optional items | [`proposed-migrations/003_inventory_items_optional.md`](./proposed-migrations/003_inventory_items_optional.md) |
| Registry/mapping patch | [`PROPOSED_REGISTRY_AND_MAPPING_PATCH.md`](./PROPOSED_REGISTRY_AND_MAPPING_PATCH.md) |
| Test patch | [`PROPOSED_TEST_UPDATES.md`](./PROPOSED_TEST_UPDATES.md) |

`config/supabase-targets.json` must stay `apply_authorized: false` until a later apply authorization.

## Test status this pass

- Acceptance suite updated for Hybrid A+C (`APPROVED`); see [`tests/onboarding/`](../../tests/onboarding/).
- [`PROPOSED_TEST_UPDATES.md`](./PROPOSED_TEST_UPDATES.md) records the historical blocked→approved test expectation change.
- **Do not treat versions as final** in any test that bumps live `identity-fields.json`.

## Explicit readiness statement

**Not ready for live implementation.**

Still forbidden until separate owner authorizations:

- Finalize/publish `0.2.0` / `1.1.0`
- Apply migrations (even to dev)
- Create live Make / GHL / ClickUp / Supabase objects
- Update `EXECUTION_STATE`
- Touch production, Paradise Spas, Sun Pool, or Retainer Snapshot

## Owner decisions needed next

Reply with approvals or revisions for:

1. Version numbers: accept `0.2.0` / `1.1.0`, or supply different numbers  
2. Exact six reported field names  
3. Child-table SQL shapes (employees + inventory_submissions; inventory_items optional/deferred)  
4. Authorize Agent mode to land JSON/registry/test patches **without** publishing versions until you say so — or authorize version publish in the same breath  
5. Later, separate auth to copy SQL into `supabase/migrations/` and apply to `htl-factory-dev` only
