# Form Field Mapping Matrix (Hybrid A+C)

> **STATUS (2026-07-31):** Published in Git as contract `0.2.0` / onboarding schema `1.1.0`.
> Retained under historical filename for provenance.
> Child-table migrations landed under `supabase/migrations/` but **NOT APPLIED** to Supabase.
> **Published in Git ≠ applied in Supabase.**


**Machine source:** [`config/onboarding-field-mappings.json`](../../config/onboarding-field-mappings.json)  
**Direction:** Hybrid A+C **APPROVED**  
**Live JSON:** may still say `blocked_pending_contract_decision` until patch applied — see [`PROPOSED_REGISTRY_AND_MAPPING_PATCH.md`](./PROPOSED_REGISTRY_AND_MAPPING_PATCH.md)

## Completeness (target after patch)

| Layer | Status |
|---|---|
| Canonical names from source | Complete |
| GHL custom field IDs | `pending_live_ids` (map/create later) |
| ClickUp destinations | `pending_live_inventory` (MCP not connected) |
| Storage form bindings | **Approved Hybrid A+C** — pending version publish + migration auth |
| Contract versions | Live in Git `0.2.0` / `1.1.0`; child migrations landed **not applied** |

## Chain (target)

```text
Form field → canonical field → GHL object + custom field ID
→ Make payload key → Supabase table/column or JSON path
→ ClickUp task/custom field → allowed writer → verification writer
→ merge rule → blocker/state effect
```

## Product → storage (locked)

| Product form | Destination |
|---|---|
| `main_client_onboarding` | `form1` + six `*_reported_*` website/domain fields |
| `employee_crm_access` | `onboarding_employees` — **not** form2 |
| `initial_inventory_upload` | `inventory_submissions` — **not** form3 |
| `csm_call_1` / `csm_call_2` | `source_form=system` + CSM provenance |

Operational website/domain fields remain form2-owned; do not overwrite from main form.

## Existing GHL Store Onboarding field classification

Live inventory (~50 contact fields, prefix `Store Onboarding |`, parent `1ayzDw6zjfrctGjmwVji`) on Hot Tub Launch Success. **No create/rename/delete in this phase.**

| Live GHL field (human) | Classification vs optimized package | Notes |
|---|---|---|
| Store Name | map_to_new_canonical_field | → `public_dba_name` / `primary_location_name` |
| Website Link | map_to_reported_then_verify | → `website_reported_url` first; operational `website_url` via form2/CSM |
| Domain DNS Controller | map_to_reported_then_verify | → `dns_reported_*` / `domain_reported_ownership_status` |
| Inventory Owner and Update Frequency | overlaps inventory product form | Prefer `inventory_submissions` path |
| Lead Responders | map_to_new_canonical_field | lead routing; employee access is separate product form |

### Missing required (optimized package vs live)

Meta Business Portfolio status, Meta ad account status, Meta payment method status, contact consent / opt-out, previous agency involved, employee CRM access set, CSM verified fields, inventory availability enum, Call 1/2 test results — still `missing_required_field` for live GHL until authorized create.

## Live write gate

Do not create/rename/delete GHL fields in this phase.  
Do not publish contract versions `0.2.0` / `1.1.0` without owner approval.  
Do not apply proposed migrations without separate authorization.
