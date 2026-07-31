# PROPOSED Contract Amendment — NOT FINAL

**Status:** Proposal only. Do **not** treat as published contract law until owner explicitly approves version numbers and merges the live config bump.

| Item | Current (live) | Proposed (awaiting approval) |
|---|---|---|
| `contract_version` | `0.1.1` | **`0.2.0` (proposed)** |
| `onboarding_schema_version` | `1.0.0` | **`1.1.0` (proposed)** |

Live files that must **not** be bumped until approval:

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

## Owner action required

Approve or revise:

1. Version numbers `0.2.0` / `1.1.0`
2. The six field names above
3. Then authorize a separate config PR/commit that actually bumps live contract files
