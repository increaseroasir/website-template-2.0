# Migration + Contract Amendment Plan — PUBLISHED IN GIT / APPLY STILL GATED

> **STATUS (2026-08-01 checkpoint):** Contract `0.2.0` / onboarding schema `1.1.0` **published in Git**.
> Child migrations **applied and verified** on `htl-factory-dev` (remote `20260731193347` / `20260731193358`; RLS on; zero policies).
> `apply_authorized=false` for further applies. Form 1 Make blueprint inactive; Form 1 E2E not run; **P2 not complete**.
> Historical filename retained for provenance. Superseded proposal wording below may remain for trail.


**Date:** 2026-07-31  
**Decision status:** Hybrid A+C direction **APPROVED**  
**Version status:** `contract_version` **0.2.0** and `onboarding_schema_version` **1.1.0** are **PUBLISHED IN GIT**  
**Live contract file:** [`config/identity-fields.json`](../../config/identity-fields.json) = `0.2.0` / `1.1.0`  
**Child migrations:** applied and verified on `htl-factory-dev` (remote `20260731193347` / `20260731193358`); `apply_authorized=false`

## What was completed

1. Marked [`CONTRACT_DELTA_REPORT.md`](./CONTRACT_DELTA_REPORT.md) as **APPROVED Hybrid A+C**; rejected B.
2. Published contract amendment into live config — [`PROPOSED_CONTRACT_AMENDMENT_0.2.0.md`](./PROPOSED_CONTRACT_AMENDMENT_0.2.0.md) retained for provenance.
3. Six reported website/domain fields now in live `identity-fields.json`.
4. Child-table SQL landed and **applied/verified** on htl-factory-dev as remote versions `20260731193347` / `20260731193358` (Git files `20260731184500_*` / `20260731184600_*`).
5. Design JSON + form specs aligned; acceptance suite updated for published-in-Git truth.

## Smallest proposed contract change

| Item | Live | Proposed |
|---|---|---|
| `contract_version` | `0.1.1` (prior) | **`0.2.0` (published in Git)** |
| `onboarding_schema_version` | `1.0.0` (prior) | **`1.1.0` (published in Git)** |

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
- Versions are published in Git; keep `apply_authorized: false` until apply authorization.

## Explicit readiness statement

**Contract/schema published in Git. Child migrations applied and verified on htl-factory-dev. Form 1 E2E not run; P2 not complete.**

Still forbidden until separate owner authorizations:

- Further migration apply (apply_authorized currently false)
- Activate Make / run E2E
- Create live GHL / ClickUp objects
- Touch production or protected clients

## Owner decisions needed next

1. ~~Authorize applying the two child-table migrations to `htl-factory-dev` only~~ **DONE** (applied+verified; keep `apply_authorized=false` for further applies)
2. Increase Make capacity by one active slot, then authorize Form 1 synthetic E2E
3. Keep Make inactive until that E2E authorization; GHL/ClickUp still unauthorized
