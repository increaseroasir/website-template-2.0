# Contract Delta Report — Product Forms vs Frozen Storage Forms

> **STATUS (2026-07-31):** Published in Git as contract `0.2.0` / onboarding schema `1.1.0`.
> Retained under historical filename for provenance.
> Child-table migrations landed under `supabase/migrations/` but **NOT APPLIED** to Supabase.
> **Published in Git ≠ applied in Supabase.**


**Status:** **APPROVED — Hybrid A+C** (owner decision 2026-07-31)  
**Rejected:** Alternative B (remap form2→employees / form3→inventory)  
**Live contract file:** [`config/identity-fields.json`](../../config/identity-fields.json) — `contract_version` **0.2.0**, `onboarding_schema_version` **1.1.0** (published in Git)  
**Child migrations:** landed in `supabase/migrations/` — **NOT APPLIED**  
**Proposal pack:** [`PROPOSED_CONTRACT_AMENDMENT_0.2.0.md`](./PROPOSED_CONTRACT_AMENDMENT_0.2.0.md), [`proposed-migrations/`](./proposed-migrations/)

## Owner decision (locked)

Preserve frozen storage semantics:

| Storage | Meaning (preserved) |
|---|---|
| `form1` | Company intake create-or-link |
| `form2` | Website / domain / DNS / location enrichment |
| `form3` | Tracking IDs, provisioned IDs, access state, secret references |
| `system` | CSM verification and controlled automated writes |

**Do not map:**

- `employee_crm_access` → `form2`
- `initial_inventory_upload` → `form3`

**Main Client Onboarding:**

- Aligned identity fields → `form1`
- Website/domain answers on the main form → **separate reported fields** (proposed)
- Verified operational website/domain fields keep current ownership (`form2` / CSM)

**Employees / inventory:** repeatable child tables (migrations landed in Git; not applied).

## Why B was rejected

Silent remapping would make `form2` mean website enrichment in old code and employee access in new code, corrupting `field_policies` ownership and merge precedence (`form3 > form2 > form1`). That confusion would spread through Make, tests, and developers.

## Current frozen ownership (still live)

**form1:** `business_name`, `owner_name`, `owner_email`, `owner_phone`, `offer_summary`, `market`, `ghl_contact_id`, `ghl_opportunity_id`

**form2:** `website_url`, `domain`, `dns_provider`, `dns_owner`, `logo_url`, `address`, `hours`, `phone_e164`

**form3:** `ga4_id`, `meta_pixel_id`, `ghl_location_id`, `access_meta_bm`, `access_ga4`, `access_cloudflare`, `capi_token_ref`, `ghl_api_token_ref`

## Approved target mapping (design)

| Product form ID | Destination |
|---|---|
| `main_client_onboarding` | `intake_submissions.form=form1` + config reported facts; website via `*_reported_*` |
| `employee_crm_access` | `onboarding_employees` (proposed table) — **not** form2 |
| `initial_inventory_upload` | `inventory_submissions` (+ optional `inventory_items`) — **not** form3 |
| `csm_call_1` / `csm_call_2` | `config_versions.source_form=system` + CSM provenance |

## Reported fields (form1-owned) — published in live contract

See amendment proposal. Exact six:

- `website_reported_status`
- `website_reported_url`
- `domain_reported_name`
- `domain_reported_ownership_status`
- `dns_reported_provider`
- `dns_reported_owner`

Operational (unchanged ownership): `website_url`, `domain`, `dns_provider`, `dns_owner`.

## Remaining gates

1. ~~Publish versions `0.2.0` / `1.1.0`~~ **done in Git**
2. Separate authorization to apply landed migrations to `htl-factory-dev` only
3. Separate authorization for live GHL/Make/ClickUp create

**Not done / not authorized now:** migration apply; live platform objects; production; protected-client mutation.
