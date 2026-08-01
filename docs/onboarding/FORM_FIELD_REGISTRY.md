# Form Field Registry (design freeze → Hybrid A+C)

> **STATUS (2026-08-01 checkpoint):** Contract `0.2.0` / onboarding schema `1.1.0` **published in Git**.
> Child migrations **applied and verified** on `htl-factory-dev` (remote `20260731193347` / `20260731193358`; RLS on; zero policies).
> `apply_authorized=false` for further applies. Form 1 Make blueprint inactive; Form 1 E2E not run; **P2 not complete**.
> Historical filename retained for provenance. Superseded proposal wording below may remain for trail.


**Machine source:** [`config/onboarding-field-registry.json`](../../config/onboarding-field-registry.json)  
**Option sets:** [`config/onboarding-option-sets.json`](../../config/onboarding-option-sets.json)  
**Source of truth:** [`docs/onboarding/source/00–06`](./source/)  
**GHL location (inventory):** Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`  
**Contract direction:** Hybrid A+C **APPROVED** — see [`CONTRACT_DELTA_REPORT.md`](./CONTRACT_DELTA_REPORT.md)  
**Versions:** live in Git `0.2.0` / `1.1.0` — [`PROPOSED_CONTRACT_AMENDMENT_0.2.0.md`](./PROPOSED_CONTRACT_AMENDMENT_0.2.0.md) (historical filename)

## Rules

- Product form IDs are independent of storage `form1|form2|form3`.
- No invented fields beyond source package (+ CSM fields in Call 1/2 docs) except the six owner-approved **reported** website/domain fields (published in contract `0.2.0`).
- Reported vs verified remain separate: main-form answers → `*_reported_*`; operational `website_url` / `domain` / `dns_*` stay form2-owned.
- Employees → `onboarding_employees` (not form2; applied on htl-factory-dev). Inventory → `inventory_submissions` (not form3; applied on htl-factory-dev).
- Live JSON may still show older `blocked_contract_decision` / `contract_conflict` until Agent mode applies [`PROPOSED_REGISTRY_AND_MAPPING_PATCH.md`](./PROPOSED_REGISTRY_AND_MAPPING_PATCH.md).

## Binding status vocabulary (target)

- `ok_design` — CSM `system` path
- `published_contract_0_2_0` — form1 / reported fields published in contract `0.2.0`
- `published_schema_child_migrations_applied_dev` — employees / inventory applied on htl-factory-dev
- `contract_conflict` — legacy flag; should clear after reported_* retarget

## Reported fields (published in live identity-fields)

1. `website_reported_status`
2. `website_reported_url`
3. `domain_reported_name`
4. `domain_reported_ownership_status`
5. `dns_reported_provider`
6. `dns_reported_owner`

## PII columns

Each field includes: `data_classification`, `retention_period`, `mask_in_logs`, `allowed_destinations`, `allowed_notification_channels`, `deletion_behavior`, `export_behavior`.
