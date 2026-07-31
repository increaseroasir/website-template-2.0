# Form Field Registry (design freeze → Hybrid A+C)

**Machine source:** [`config/onboarding-field-registry.json`](../../config/onboarding-field-registry.json)  
**Option sets:** [`config/onboarding-option-sets.json`](../../config/onboarding-option-sets.json)  
**Source of truth:** [`docs/onboarding/source/00–06`](./source/)  
**GHL location (inventory):** Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`  
**Contract direction:** Hybrid A+C **APPROVED** — see [`CONTRACT_DELTA_REPORT.md`](./CONTRACT_DELTA_REPORT.md)  
**Versions:** live still `0.1.1` / `1.0.0`; proposed `0.2.0` / `1.1.0` only — [`PROPOSED_CONTRACT_AMENDMENT_0.2.0.md`](./PROPOSED_CONTRACT_AMENDMENT_0.2.0.md)

## Rules

- Product form IDs are independent of storage `form1|form2|form3`.
- No invented fields beyond source package (+ CSM fields in Call 1/2 docs) except the six owner-approved **reported** website/domain fields (proposed, not published).
- Reported vs verified remain separate: main-form answers → `*_reported_*`; operational `website_url` / `domain` / `dns_*` stay form2-owned.
- Employees → proposed `onboarding_employees` (not form2). Inventory → proposed `inventory_submissions` (not form3).
- Live JSON may still show older `blocked_contract_decision` / `contract_conflict` until Agent mode applies [`PROPOSED_REGISTRY_AND_MAPPING_PATCH.md`](./PROPOSED_REGISTRY_AND_MAPPING_PATCH.md).

## Binding status vocabulary (target)

- `ok_design` — CSM `system` path
- `proposed_aligned_pending_version_publish` — form1 / reported fields awaiting version publish
- `proposed_child_table_pending_migration` — employees / inventory awaiting migration apply auth
- `contract_conflict` — legacy flag; should clear after reported_* retarget

## Proposed additions (review — not in live identity-fields yet)

1. `website_reported_status`
2. `website_reported_url`
3. `domain_reported_name`
4. `domain_reported_ownership_status`
5. `dns_reported_provider`
6. `dns_reported_owner`

## PII columns

Each field includes: `data_classification`, `retention_period`, `mask_in_logs`, `allowed_destinations`, `allowed_notification_channels`, `deletion_behavior`, `export_behavior`.
