# GHL Field Mapping — Contract 0.2.0 / Schema 1.1.0

**Location:** Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`  
**Machine companions (repo):** `config/onboarding-field-mappings.json` (199 rows, all `ghl_mapping_status=pending_live_ids`), `config/identity-fields.json`  
**Live custom fields inventoried:** 50 × `Store Onboarding |*` · Label: `live_verified_readonly`  
**This document:** architecture mapping for build; **no** live creates

Classification: `exists_and_matches` · `exists_needs_change` · `missing` · `duplicate_risk` · `blocked` · `not_required`

---

## Product form → storage binding (locked Hybrid A+C)

| Product form | Storage destination | Storage form enum | Classification | Label |
|---|---|---|---|---|
| `main_client_onboarding` | `intake_submissions` + `config_versions` including six `*_reported_*` | `form1` | target `exists_and_matches` after build | `repository_derived` |
| `employee_crm_access` | `onboarding_employees` | *(none — not form2)* | target child table | `repository_derived` |
| `initial_inventory_upload` | `inventory_submissions` | *(none — not form3)* | target child table | `repository_derived` |
| `csm_call_1` | `config_versions` + provenance | `system` | CSM verify | `repository_derived` |
| `csm_call_2` | `config_versions` + provenance | `system` | CSM verify | `repository_derived` |

### Forbidden remaps

| Do not | Why | Classification |
|---|---|---|
| Employee form → `form2` | Corrupts website/domain ownership | `blocked` |
| Inventory form → `form3` | Corrupts tracking/provisioning ownership | `blocked` |
| Main form → operational `website_url`/`domain`/`dns_*` | Violates reported vs verified split | `blocked` |

---

## Identity contract fields (factory SoT)

| Canonical | Owner | GHL live field | Classification | Supabase path | Label |
|---|---|---|---|---|---|
| `client_id` | system | n/a (not a GHL custom field) | `not_required` on GHL | `clients.id` | `repository_derived` |
| `onboarding_case_id` | system | n/a | `not_required` on GHL | `onboarding_cases.id` | `repository_derived` |
| `ghl_contact_id` | form1 | standard Contact id | `exists_and_matches` (platform) | external id on case | `repository_derived` |
| `ghl_opportunity_id` | form1 | Opportunity id when used | `missing` (no pipeline live) | external id | `live_verified_readonly` + `repository_derived` |
| `ghl_location_id` | form3 | provisioned sub-account id | `not_required` on Success account fields | config | `repository_derived` |
| `business_name` | form1 | partial via Store Name / Legal Name | `exists_needs_change` | config | both |
| `owner_name` / `owner_email` / `owner_phone` | form1 | no dedicated Store fields (standard name/email/phone are submitter) | `missing` | config | both |
| `website_reported_status` | form1 | none | `missing` | config | both |
| `website_reported_url` | form1 | Website Link `zTPA06x8HiMpAGYMcr7Y` | `exists_needs_change` | config | both |
| `domain_reported_name` | form1 | none (A2P URL / website overlap only) | `missing` / `duplicate_risk` | config | both |
| `domain_reported_ownership_status` | form1 | Domain DNS Controller partial | `exists_needs_change` | config | both |
| `dns_reported_provider` | form1 | none | `missing` | config | both |
| `dns_reported_owner` | form1 | Domain DNS Controller `97mZaTkqgJjcFUBc0gk0` | `exists_needs_change` | config | both |
| `website_url` / `domain` / `dns_provider` / `dns_owner` | **form2** | must not bind Main form | `blocked` if Main writes | config | `repository_derived` |
| `ga4_id` / `meta_pixel_id` / access flags / secret refs | **form3** | none in Store set | `missing` (separate enrichment) | config | `repository_derived` |

---

## Main Client Onboarding — live overlap map

| Canonical field | Live GHL custom field ID | Live name | Map action | Classification | Label |
|---|---|---|---|---|---|
| `legal_business_name` | `v5W6ayb0cOHwA7ieYwvH` | Legal Business Name | Reuse ID on new Form 1 **or** create HTL-prefixed twin then deprecate | `exists_needs_change` | `live_verified_readonly` |
| `public_dba_name` | `zzMZf1sEMt4O3LoYwsnC` | Store Name | Map with care (also overlaps `primary_location_name`) | `duplicate_risk` | both |
| `primary_location_name` | `zzMZf1sEMt4O3LoYwsnC` | Store Name | Prefer separate field in new package | `duplicate_risk` | both |
| `primary_location_address` | `YV8rlSwV1VG5MOAm9BMT` | Store Address | Map / recreate structured address | `exists_needs_change` | both |
| `location_main_phone` | `nX8DFT2BLhmy6IbmF4at` | Main Customer Phone Number | Map | `exists_needs_change` | both |
| `location_store_hours` | `G7cA28S78Uwf8fGTvkhP` | Full Weekly Hours | Map to structured schedule | `exists_needs_change` | both |
| `website_reported_url` | `zTPA06x8HiMpAGYMcr7Y` | Website Link | Map **reported only** | `exists_needs_change` | both |
| `dns_reported_owner` | `97mZaTkqgJjcFUBc0gk0` | Domain DNS Controller | Normalize option values to snake_case | `exists_needs_change` | both |
| `financing_available` | `5BUOTmH8EodtZOOs8R9g` | Offers Customer Financing | Map options → package enum | `exists_needs_change` | both |
| `financing_provider` | `NfkTKPvEPVkHjWF2X9OG` | Financing Partner | Map | `exists_needs_change` | both |
| `logo_available` | `INNtnYlhvWXgWLOp4Bwq` | Logo File | Derive status from upload presence | `exists_needs_change` | both |
| `media_assets_status` | `T2ngc4RGmMSuNRSLeHKj` | Showroom and Tub Photos | Derive status | `exists_needs_change` | both |
| `facebook_page_url` / `instagram_status` | `XyOVNbJ7GFazpjN77w35` | Facebook and Instagram Links | Split into discrete fields | `exists_needs_change` | both |
| `google_business_profile_status` | `m8TGvdqgnucUTnabdXbt` | Google Business Profile Link | URL present ≠ verified status | `exists_needs_change` | both |
| `product_categories` | `qJieYJDyi6pgBurANiIe` + `KxBYHNePISGsRew4laZ6` | Sells Saunas / Swim Spas | Fold into multi_select | `exists_needs_change` | both |
| `featured_products` | `Y02Hw1JWNSg3da9QrmMw` | Brands Carried | Partial | `exists_needs_change` | both |
| `current_offers` | `bbWmoRKV9AkjGEqbnoSP` | Max Ad Promotions & Sweeteners | Partial | `exists_needs_change` | both |
| `implementation_lead_type` | `m4TUK2Eop4z8l6tUeU18` | Your Role at the Company | Partial option remap | `exists_needs_change` | both |
| `ein_availability` | `vTp9ubt8tpvfgFBRS4kR` | EIN / Federal Tax ID | **Do not** map raw EIN → availability blindly | `blocked` without policy | both |
| Lead responders → employees | `lhKUkyVc6MsBK0ieedF2` | Lead Responders… | Prefer Employee form | `duplicate_risk` | both |
| Inventory owner → inventory form | `86sry70TCBOop6PxBZ2z` | Inventory Owner… | Prefer Inventory form | `duplicate_risk` | both |

### Main form fields with no live custom field (`missing`)

All remaining Form 1 canonicals from `config/forms/form-1-main-client-onboarding.json`, including but not limited to:

`owner_name`, `owner_email`, `owner_cell`, `submitted_by_email`, `primary_business_address`, `primary_timezone`, `number_of_locations`, `ein_availability`, `primary_business_goals`, `monthly_lead_volume_range`, `monthly_sales_range`, `referral_source`, `location_timezone`, `appointment_availability`, `target_area_type`, `target_areas`, `excluded_target_areas`, `additional_locations_exist`, `website_reported_status`, `domain_reported_name`, `domain_reported_ownership_status`, `dns_reported_provider`, `facebook_page_status`, `instagram_status` (status discrete), Meta trio, CRM/POS/phone/inventory/chatbot statuses, `previous_agency_involved`, consent/opt-out, lead routing structured emails/phones, `sales_team_structure`.

`ghl_custom_field_id` remains `null` / `pending_live_ids` until authorized create · Label: `pending_live_inventory`.

---

## Employee CRM Access mapping

| Canonical | Live GHL | Supabase | Classification | Label |
|---|---|---|---|---|
| `client_id_display` | none (prefill) | case join | `missing` | `repository_derived` |
| `employee_full_name` | none (Lead Responders free-text only) | `onboarding_employees.employee_full_name` | `missing` / `duplicate_risk` | both |
| `employee_email` | none | `onboarding_employees.employee_email` | `missing` | both |
| `employee_mobile` | none | `onboarding_employees.employee_mobile` | `missing` | both |
| `employee_job_title` (+ other) | none | columns | `missing` | both |
| `employee_location_id` | none | columns | `missing` | both |
| `required_crm_role` | none | columns | `missing` | both |
| `lead_assignment_role` | none | columns | `missing` | both |
| permission + calendar + schedule fields | none | columns | `missing` | both |
| manager approval fields | none | columns | `missing` | both |

**Make payload keys:** same as canonical names · Label: `repository_derived`  
**GHL object type (proposed):** Contact custom fields **or** form-only fields with Make extracting to Supabase without persisting all on contact (preferred for multi-employee). Decision for build auth: prefer **form submission payload → child table**, minimal contact custom fields.

---

## Initial Inventory Upload mapping

| Canonical | Live GHL | Supabase | Classification | Label |
|---|---|---|---|---|
| `inventory_availability` | none | `inventory_submissions.inventory_availability` | `missing` | both |
| `inventory_spreadsheet` | none | file ref / storage path (not secret) | `missing` | both |
| `inventory_source_system` | none | column | `missing` | both |
| `inventory_approval_owner` | partial free-text in Store Inventory Owner | column | `duplicate_risk` | both |
| `inventory_rights_confirmed` | none | column | `missing` | both |
| `inventory_expected_date` | none | column | `missing` | both |

---

## Call 1 / Call 2 mapping (system)

| Area | Canonical examples | Live GHL | Supabase | Classification | Label |
|---|---|---|---|---|---|
| Call 1 verified website | `website_verified_status`, registrar/DNS access | none | `config_versions` via system writer | `missing` | `repository_derived` |
| Call 1 Meta verified | `meta_portfolio_verified_status`, ad/billing/pixel | none | system | `missing` | both |
| Call 1 evidence | `evidence_*_status` | Financing proof upload is client-era only | system | `missing` / partial ops | both |
| Call 2 tests | `*_test` result enums | none | system | `missing` | both |
| Recommended transitions | `recommended_status_transition*` | none | **request only** → RPC | `missing` | both |

Operational website/domain writes from Call 1 use **form2 / CSM** ownership, never silent overwrite of newer config (`expected_version`).

---

## Option value normalization examples

| Live Store option (example) | Target canonical | Note |
|---|---|---|
| Domain DNS Controller: `You` / `Your web person` / `We host it` | map into `dns_reported_owner` / ownership enums | Exact enum TBD at field-create; do not invent outside option sets |
| Financing Yes/No | `financing_available` package enums (`yes_verified` / `yes_unverified` / `no` / `unknown`) | Live lacks verified/unverified split → `exists_needs_change` |
| Role Owner/Manager/Other | `implementation_lead_type` owner/employee/outside_partner | Partial · `exists_needs_change` |

Canonical option sets: `config/onboarding-option-sets.json` · Label: `repository_derived`.

---

## Make ↔ GHL ↔ Supabase chain (target)

```text
GHL form submit
  → Make webhook (Form 1 hook 2785703 prior_evidence_only)
  → normalize to canonical keys + schema_version 1.1.0
  → append intake_submissions (raw)
  → merge config per field_policies / expected_version
  → optional: mirror contact custom fields (non-authoritative)
  → optional: request_client_transition (never free-form status SQL)
```

| Layer | Authoritative? |
|---|---|
| GHL contact custom fields | No (CRM convenience) |
| Make | Worker / transport |
| Supabase | Yes for fulfillment state |
| ClickUp | Mirror only · `pending_live_inventory` this run |

---

## Mapping completeness scorecard

| Bucket | Count / status | Label |
|---|---|---|
| Repo mapping rows | 199 | `repository_derived` |
| Rows with live GHL custom field IDs filled | 0 in JSON (`pending_live_ids`) | `repository_derived` |
| Live Store fields usable as reuse candidates | ~20–30 | `live_verified_readonly` |
| Exact `exists_and_matches` package fields | 0 | `live_verified_readonly` |
| Product forms missing | 4 of 5 (+ Form 1 needs rebuild) | `live_verified_readonly` |

---

## Proposed config patch (report only — do not apply)

When owner authorizes live field create, update (outside this agent’s writable scope unless integrator expands):

- `config/onboarding-field-mappings.json` → set `ghl_custom_field_id` + `ghl_mapping_status=live_verified`
- Do **not** change ownership of form2/form3 operational fields
- Document Store Onboarding field IDs as `legacy_store_onboarding` aliases only

This agent wrote mapping guidance under `docs/ghl/**` only.
