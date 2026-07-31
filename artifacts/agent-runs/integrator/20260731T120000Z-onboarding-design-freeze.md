# Evidence — P2 Onboarding Design Freeze (docs-only)

**Run id:** `20260731T120000Z-onboarding-design-freeze`  
**Branch:** `factory/p2-onboarding-forms-and-workflows`  
**GHL inventory location:** Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`  
**Date:** 2026-07-31  

## Verdict

**GO WITH CHANGES** for documentation / design freeze.  
**BLOCKED AT CONTRACT DECISION** for live storage binding of:

- `employee_crm_access` → storage `form2`
- `initial_inventory_upload` → storage `form3`
- `main_client_onboarding` writes to frozen `form2` website/DNS fields without amendment

Owner must choose Alternative A / B / C in [`docs/onboarding/CONTRACT_DELTA_REPORT.md`](../../docs/onboarding/CONTRACT_DELTA_REPORT.md). Cursor did **not** invent or approve the mapping.

## Contract-delta recommendation

Surface clean alternatives; **prefer Alternative A** (preserve frozen meanings; keep employee/inventory off form2/form3 until amendment) unless owner wants a versioned remap (B).

## Files created (this phase)

### Docs
- `docs/onboarding/CONTRACT_DELTA_REPORT.md`
- `docs/onboarding/FORM_FIELD_REGISTRY.md`
- `docs/onboarding/FORM_FIELD_MAPPING_MATRIX.md`
- `docs/onboarding/CONDITIONAL_LOGIC.md`
- `docs/onboarding/CLICKUP_ONBOARDING_STRUCTURE.md`
- `docs/onboarding/CLICKUP_TIMER_RULES.md`
- `docs/onboarding/REMINDERS_AND_ESCALATIONS.md`
- `docs/onboarding/PROVISIONING_READY.md`
- `docs/onboarding/EXISTING_WORKFLOWS_REVIEW.md`
- `docs/onboarding/RELIABILITY.md`
- `docs/onboarding/FORM_STATE_TRANSITIONS.md`
- Source package (prior step): `docs/onboarding/source/00–06`

### Config
- `config/onboarding-option-sets.json`
- `config/onboarding-field-registry.json` (~197 fields)
- `config/onboarding-field-mappings.json`
- `config/onboarding-clickup.json`
- `config/onboarding-workflows.json`
- `config/form-state-transitions.json`
- `config/forms/form-1-main-client-onboarding.json`
- `config/forms/form-2-employee-access.json`
- `config/forms/form-3-inventory-upload.json`
- `config/forms/form-4-call-1-csm.json`
- `config/forms/form-5-call-2-csm.json`

### Tests
- `tests/onboarding/test_design_freeze_acceptance.py`
- `tests/onboarding/design_freeze_acceptance_results.json` — **27/27 passed**

## Mapping completeness

| Layer | Status |
|---|---|
| Canonical names | Complete from source |
| GHL IDs | pending_live_ids + classification table for ~50 Store Onboarding fields |
| ClickUp IDs | pending_live_inventory (MCP not connected) |
| Storage bindings | Blocked pending owner contract decision |

## Fields reused vs missing (GHL)

- Many Store Onboarding fields → `map_to_new_canonical_field` / `reuse_with_label_change`
- Gaps: Meta portfolio/ad/billing statuses, consent gates, employee access set, CSM verified/test fields, inventory availability enum
- Sensitive: raw EIN / IRS address → `requires_owner_decision`
- No live GHL field create/rename/delete performed

## Form specs

Five machine-readable specs under `config/forms/`. Employee + inventory specs marked `BLOCKED_AT_CONTRACT_DECISION_storage_slot`. CSM specs `system_ok`.

## ClickUp design

Master task + 9 phases + milestone checklists + ~18 custom fields + statuses — all IDs `pending_live_inventory`.

## Timer rules

Manual labor timers for hands-on CSM/fulfillment; exempt client/passive/automated waits; three basic flags only.

## Reminder workflows

Documented in `REMINDERS_AND_ESCALATIONS.md` (Form 1, CSM review, inventory, employees, blockers, missing-info bundling, suppression).

## Future provisioning

Documented in `PROVISIONING_READY.md`. Not built.

## Existing workflows

Reviewed 4 GHL published workflows + inactive Make Form 1 — leave untouched / replace-later notes in `EXISTING_WORKFLOWS_REVIEW.md`.

## Test results

27/27 local acceptance assertions passed (no live I/O). pytest module not installed; assertions executed via Python.

## Unresolved owner decisions

1. Contract Alternative A / B / C (form2 / form3 meanings)
2. Whether main form may own website/DNS after version bump
3. Raw EIN collection vs `ein_availability` only
4. ClickUp workspace/list connection for live inventory
5. Make active-scenario cleanup before any later live Make work
6. When to authorize Pass 4 live GHL field/form create

## Systems

| System | Modified? |
|---|---|
| GHL | No (read-only inventory earlier; no field/form/workflow create) |
| Make | No |
| ClickUp | No |
| Supabase | No writes |
| EXECUTION_STATE | Not updated |
| Sun Pool | Untouched |

## Stop

Design freeze docs-only work complete for this pass. **Do not** create live platform objects until owner resolves contract-delta and issues a separate live-build authorization.
