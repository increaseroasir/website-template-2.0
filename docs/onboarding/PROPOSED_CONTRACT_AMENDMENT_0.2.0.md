# PROPOSED Contract Amendment — NOT FINAL

> **STATUS (2026-08-01 checkpoint):** Contract `0.2.0` / onboarding schema `1.1.0` **published in Git**.
> Child migrations **applied and verified** on `htl-factory-dev` (remote `20260731193347` / `20260731193358`; RLS on; zero policies).
> `apply_authorized=false` for further applies. Form 1 Make blueprint inactive; Form 1 E2E not run; **P2 not complete**.
> Historical filename retained for provenance. Superseded proposal wording below may remain for trail.


**Status:** **PUBLISHED IN GIT** (historical filename retained). Live `config/identity-fields.json` is `0.2.0` / `1.1.0`. Child tables applied and verified on htl-factory-dev; further apply gated.

| Item | Current (live) | Proposed (awaiting approval) |
|---|---|---|
| `contract_version` | `0.1.1` (prior) | **`0.2.0` (published in Git)** |
| `onboarding_schema_version` | `1.0.0` (prior) | **`1.1.0` (published in Git)** |

Live files now published at `0.2.0` / `1.1.0` (was blocked until approval):

- `config/identity-fields.json`
- `config/factory-contract.schema.json`
- `config/supabase-targets.json` (and any other `0.1.1` pins)

## Smallest change set

### A. Add six form1-owned reported fields

| Canonical field | Owner | Allowed writers | Classification | Storage |
|---|---|---|---|---|
| `website_reported_status` | form1 | form1, human_override | public_configuration | config |
| `website_reported_url` | form1 | form1, human_override | public_configuration | config |
| `domain_reported_name` | form1 | form1, human_override | public_configuration | config |
| `domain_reported_ownership_status` | form1 | form1, human_override | public_configuration | config |
| `dns_reported_provider` | form1 | form1, human_override | public_configuration | config |
| `dns_reported_owner` | form1 | form1, human_override | public_configuration | config |

Precedence for each: `["human_override", "form1"]`. Clearable: true. Null does not clear.

### B. Do not change ownership of operational fields

Leave as form2 (or CSM/system verification writers as already contracted):

- `website_url`
- `domain`
- `dns_provider`
- `dns_owner`

### C. Product destination notes (documentation in identity-fields when approved)

```text
main_client_onboarding  → form1 (+ reported website fields)
employee_crm_access     → onboarding_employees table (not form2)
initial_inventory_upload → inventory_submissions table (not form3)
csm_call_1 / csm_call_2 → system + CSM provenance
```

### D. Optional companion fields (not required for smallest bump)

`verified_by`, `verified_at` for CSM verification metadata — can land in the same `0.2.0` approval or a follow-on. Not required to unblock reported-field split.

## Compatibility

- No change to `intake_submissions.form` enum (`form1|form2|form3`)
- No Alternative B semantic rename
- Existing Make Form 1 identity path remains valid
- Merge precedence rules unchanged; new fields are form1-scoped only

## Owner action required next

1. Authorize applying the two child-table migrations to `htl-factory-dev` only
2. Read-only verification after apply
3. Keep Make inactive until a separate E2E authorization
