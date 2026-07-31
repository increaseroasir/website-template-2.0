# Proposed registry / mapping alignment — NOT applied to live JSON

> **STATUS (2026-07-31):** Published in Git as contract `0.2.0` / onboarding schema `1.1.0`.
> Retained under historical filename for provenance.
> Child-table migrations landed under `supabase/migrations/` but **NOT APPLIED** to Supabase.
> **Published in Git ≠ applied in Supabase.**


**Status:** Applied to design JSON (`config/onboarding-*.json`, `config/forms/*`) on 2026-07-31.  
**Still not published:** live `config/identity-fields.json` remains `0.1.1` / `1.0.0`.

Contract direction (docs): Hybrid A+C **APPROVED**.  
Versions `0.2.0` / `1.1.0`: **proposed only** — do not publish into `config/identity-fields.json` yet.

## Destination matrix (approved design)

| Product form ID | Storage destination | Live `storage_form` today | Proposed status |
|---|---|---|---|
| `main_client_onboarding` | `form1` + reported website fields | mixed / conflict on website | `proposed_form1_reported` |
| `employee_crm_access` | `onboarding_employees` | `blocked_contract_decision` | `proposed_child_table` |
| `initial_inventory_upload` | `inventory_submissions` | `blocked_contract_decision` | `proposed_child_table` |
| `csm_call_1` / `csm_call_2` | `config_versions.source_form=system` | `ok_design` | keep |

## Six reported fields (add to registry + mappings + identity-fields when versions approved)

| Canonical | Product source (main form) | Supabase path | Owner |
|---|---|---|---|
| `website_reported_status` | maps from `website_status` answers | `config.website_reported_status` | form1 |
| `website_reported_url` | maps from main-form website URL answer | `config.website_reported_url` | form1 |
| `domain_reported_name` | maps from `primary_domain` / domain name answer | `config.domain_reported_name` | form1 |
| `domain_reported_ownership_status` | maps from `domain_ownership_status` | `config.domain_reported_ownership_status` | form1 |
| `dns_reported_provider` | maps from DNS provider answer if collected | `config.dns_reported_provider` | form1 |
| `dns_reported_owner` | maps from DNS owner/controller answer | `config.dns_reported_owner` | form1 |

**Do not** write main-form answers into operational `website_url` / `domain` / `dns_provider` / `dns_owner`.

## Mapping patch rules (when JSON is authorized)

1. Main form `website_url` row currently `contract_conflict` → retarget canonical to `website_reported_url`, `storage_form=form1`, status `proposed_aligned_pending_version_publish`.
2. Main form `website_status` → prefer storing as `website_reported_status` (or dual-key with explicit alias note).
3. Main form `domain_ownership_status` → `domain_reported_ownership_status`.
4. Main form `primary_domain` → keep identity path if already form1-aligned; also feed `domain_reported_name` if that is the reported domain name.
5. All `employee_crm_access` rows:
   - `supabase_table`: `onboarding_employees`
   - `storage_form`: `null` (not form2)
   - `storage_binding_status`: `proposed_child_table_pending_migration`
6. All `initial_inventory_upload` rows:
   - `supabase_table`: `inventory_submissions`
   - `storage_form`: `null` (not form3)
   - `storage_binding_status`: `proposed_child_table_pending_migration`
7. Completeness flag in mappings JSON:
   - from `blocked_pending_contract_decision`
   - to `approved_hybrid_ac_pending_version_and_migration`

## identity-fields.json patch (only after version approval)

```json
{
  "contract_version": "0.2.0",
  "onboarding_schema_version": "1.1.0",
  "field_policies_add": {
    "website_reported_status": {
      "owner": "form1",
      "allowed_writers": ["form1", "human_override"],
      "classification": "public_configuration",
      "clearable": true,
      "precedence": ["human_override", "form1"]
    },
    "website_reported_url": {
      "owner": "form1",
      "allowed_writers": ["form1", "human_override"],
      "classification": "public_configuration",
      "clearable": true,
      "precedence": ["human_override", "form1"]
    },
    "domain_reported_name": {
      "owner": "form1",
      "allowed_writers": ["form1", "human_override"],
      "classification": "public_configuration",
      "clearable": true,
      "precedence": ["human_override", "form1"]
    },
    "domain_reported_ownership_status": {
      "owner": "form1",
      "allowed_writers": ["form1", "human_override"],
      "classification": "public_configuration",
      "clearable": true,
      "precedence": ["human_override", "form1"]
    },
    "dns_reported_provider": {
      "owner": "form1",
      "allowed_writers": ["form1", "human_override"],
      "classification": "public_configuration",
      "clearable": true,
      "precedence": ["human_override", "form1"]
    },
    "dns_reported_owner": {
      "owner": "form1",
      "allowed_writers": ["form1", "human_override"],
      "classification": "public_configuration",
      "clearable": true,
      "precedence": ["human_override", "form1"]
    }
  },
  "field_policies_unchanged": {
    "website_url": { "owner": "form2" },
    "domain": { "owner": "form2" },
    "dns_provider": { "owner": "form2" },
    "dns_owner": { "owner": "form2" }
  }
}
```

**Guardrail:** Treat the JSON above as a recommendation. Do not merge into live contract until you explicitly approve the version numbers.
