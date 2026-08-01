# GHL Onboarding Inventory — Hot Tub Launch Success

**Run UTC:** `20260801T015734Z`  
**Agent role:** GHL inventory + forms architecture (read-only)  
**Target location:** Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`  
**Contract / schema (repo):** `0.2.0` / `1.1.0`  
**Baseline SHA:** `b7212fcce21130a08c16d7fafa325066ed6a49b0`  
**Scope:** create NOTHING in GHL / Make / Supabase / ClickUp

## Evidence labels

| Label | Meaning |
|---|---|
| `live_verified_readonly` | Observed via GHL MCP read on HTL Success in this run |
| `repository_derived` | From Git contract / form configs / source package |
| `prior_evidence_only` | Prior docs/artifacts; not re-verified this run |
| `pending_live_inventory` | Expected object not yet present or ID unknown |
| `unverified` | Stated but not confirmed |

## Location lock

| Check | Result | Label |
|---|---|---|
| Active location name | Hot Tub Launch Success | `live_verified_readonly` |
| Active location ID | `wTkbEAsxM73C2gLNpdi8` | `live_verified_readonly` |
| Forbidden locations touched | None (Paradise, Retainer Snapshot, AI Agent Test, Sun Pool not switched) | `live_verified_readonly` |
| Pipelines | Empty list (`[]`) | `live_verified_readonly` |

## Object classification vocabulary

`exists_and_matches` · `exists_needs_change` · `missing` · `duplicate_risk` · `blocked` · `not_required`

---

## Product forms vs live GHL forms

| Product form ID | Intended audience | Live GHL form | Classification | Label |
|---|---|---|---|---|
| `main_client_onboarding` | Client | **No dedicated form.** Closest: `Store Onboarding Form (Hot Tub Launch Success)` `m0crENESrVvozjmHIunZ` | `exists_needs_change` (legacy store form is not Hybrid A+C package) | `live_verified_readonly` + `repository_derived` |
| `employee_crm_access` | Client (one per employee) | None | `missing` | `live_verified_readonly` |
| `initial_inventory_upload` | Client | None | `missing` | `live_verified_readonly` |
| `csm_call_1` | CSM-only | None | `missing` | `live_verified_readonly` |
| `csm_call_2` | CSM-only | None | `missing` | `live_verified_readonly` |

### All live forms on HTL Success

| Form name | Form ID | Role vs package | Classification | Label |
|---|---|---|---|---|
| Store Onboarding Form (Hot Tub Launch Success) | `m0crENESrVvozjmHIunZ` | Legacy ops/messaging intake; ~50 custom fields; not contract Form 1 | `exists_needs_change` | `live_verified_readonly` |
| Notify Test Form (Hot Tub Launch Success) | `HPb3oFLlZ4vYD2lqNgjf` | Internal notification test | `not_required` (for onboarding package) | `live_verified_readonly` |
| Form 0 | `BOza6EMJRt9ZwUzG3TIr` | Unknown/placeholder; not in product package | `not_required` / review later | `live_verified_readonly` |

**Total forms:** 3 (`live_verified_readonly`).

---

## Live custom fields (Store Onboarding folder)

**Parent folder ID:** `1ayzDw6zjfrctGjmwVji`  
**Count:** 50 contact custom fields, prefix `Store Onboarding |`  
**Label:** `live_verified_readonly`

| GHL field ID | Human name | fieldKey | dataType | Package classification |
|---|---|---|---|---|
| `zzMZf1sEMt4O3LoYwsnC` | Store Name | `contact.store_onboarding__store_name` | TEXT | map → `public_dba_name` / `primary_location_name` (`exists_needs_change`) |
| `YV8rlSwV1VG5MOAm9BMT` | Store Address | `contact.store_onboarding__store_address` | TEXT | map → `primary_location_address` (`exists_needs_change`) |
| `nX8DFT2BLhmy6IbmF4at` | Main Customer Phone Number | `contact.store_onboarding__main_customer_phone_number` | PHONE | map → `location_main_phone` (`exists_needs_change`) |
| `PN7VAObzs1hWwxijFduh` | State | `contact.store_onboarding__state` | TEXT | partial overlap location (`exists_needs_change`) |
| `wNWdOTCYfMFxeAzl4cOP` | Entry-Level Tub Price Range | `contact.store_onboarding__entrylevel_tub_price_range` | TEXT | ops messaging; not in identity contract (`not_required` for factory identity) |
| `I5DcRxn2eMvbv8nhxn3P` | Mid-Range Tub Price Range | `contact.store_onboarding__midrange_tub_price_range` | TEXT | same (`not_required`) |
| `YAYLNCxHPLney9RurUld` | Premium and Swim Spa Price Range | `contact.store_onboarding__premium_and_swim_spa_price_range` | TEXT | same (`not_required`) |
| `hXJKhpgfjNVGpe3ZVVOs` | Lowest Monthly Payment (Cheapest Tub) | `contact.store_onboarding__lowest_monthly_payment_cheapest_tub` | TEXT | financing ops (`exists_needs_change` vs `financing_*`) |
| `5BUOTmH8EodtZOOs8R9g` | Offers Customer Financing | `contact.store_onboarding__offers_customer_financing` | SINGLE_OPTIONS | map → `financing_available` (`exists_needs_change`) |
| `NfkTKPvEPVkHjWF2X9OG` | Financing Partner | `contact.store_onboarding__financing_partner` | TEXT | map → `financing_provider` (`exists_needs_change`) |
| `E1ul1PBLzZyBt7BELkHZ` | Pre-Qualification Link | `contact.store_onboarding__prequalification_link` | TEXT | financing detail (`exists_needs_change`) |
| `3OKi1CndPaKCvtAw5KLk` | Financing Link Purpose | `contact.store_onboarding__financing_link_purpose` | SINGLE_OPTIONS | package gap / keep as ops (`not_required` or extend) |
| `ene1k0gQt1Lp8G63i3fE` | Credit Inquiry Type | `contact.store_onboarding__credit_inquiry_type` | SINGLE_OPTIONS | ops (`not_required` for contract identity) |
| `V5QrwStYZlFsL2Qu6KVv` | Financing Proof Upload | `contact.store_onboarding__financing_proof_upload` | FILE_UPLOAD | evidence (`exists_needs_change` vs Call 1 evidence) |
| `EjlAmI2AgV3u2fGaUhlF` | Financing Minimum Purchase Amount | `contact.store_onboarding__financing_minimum_purchase_amount` | TEXT | ops |
| `RCHlrMFh6f86a83YXBSp` | Financing Model and Terms | `contact.store_onboarding__financing_model_and_terms` | LARGE_TEXT | ops |
| `0Fk1EvfyWnU7HLn8ji0D` | Financing Representative | `contact.store_onboarding__financing_representative_name_email_phone` | LARGE_TEXT | ops |
| `3Slf6tooq1FQcKxEXeW6` | Refundable Deposit to Hold a Tub | `contact.store_onboarding__refundable_deposit_to_hold_a_tub` | SINGLE_OPTIONS | ops |
| `RPtN3g59ZlRekxmVMnig` | Deposit Amount and Hold Length | `contact.store_onboarding__deposit_amount_and_hold_length` | TEXT | ops |
| `lSmdFxtUDYfiaYq9CaQP` | Deposit Fully Refundable | `contact.store_onboarding__deposit_fully_refundable` | SINGLE_OPTIONS | ops |
| `86sry70TCBOop6PxBZ2z` | Inventory Owner and Update Frequency | `contact.store_onboarding__inventory_owner_and_update_frequency` | LARGE_TEXT | **`duplicate_risk`** vs `initial_inventory_upload` → `inventory_submissions` |
| `lhKUkyVc6MsBK0ieedF2` | Lead Responders (Name, Cell, Email) | `contact.store_onboarding__lead_responders_name_cell_email` | LARGE_TEXT | **`duplicate_risk`** vs `employee_crm_access` → `onboarding_employees` |
| `4sMm3Npv0BgHiSh0TGJJ` | Weekend Coverage | `contact.store_onboarding__weekend_coverage` | TEXT | ops / hours |
| `INNtnYlhvWXgWLOp4Bwq` | Logo File | `contact.store_onboarding__logo_file` | FILE_UPLOAD | map → `logo_available` / later `logo_url` (`exists_needs_change`) |
| `T2ngc4RGmMSuNRSLeHKj` | Showroom and Tub Photos | `contact.store_onboarding__showroom_and_tub_photos` | FILE_UPLOAD | map → `media_assets_status` |
| `zTPA06x8HiMpAGYMcr7Y` | Website Link | `contact.store_onboarding__website_link` | TEXT | map → **`website_reported_url`** only; **do not** write operational `website_url` (`exists_needs_change`) |
| `m8TGvdqgnucUTnabdXbt` | Google Business Profile Link | `contact.store_onboarding__google_business_profile_link` | TEXT | map → GBP status/URL (`exists_needs_change`) |
| `XyOVNbJ7GFazpjN77w35` | Facebook and Instagram Links | `contact.store_onboarding__facebook_and_instagram_links` | TEXT | split → FB/IG status+URL (`exists_needs_change`) |
| `Ygol3gRYXEFHvPvmtuPv` | Google Review Link | `contact.store_onboarding__google_review_link` | TEXT | ops |
| `v5W6ayb0cOHwA7ieYwvH` | Legal Business Name | `contact.store_onboarding__legal_business_name` | TEXT | map → `legal_business_name` (`exists_needs_change`) |
| `vTp9ubt8tpvfgFBRS4kR` | EIN / Federal Tax ID | `contact.store_onboarding__ein__federal_tax_id` | TEXT | **`duplicate_risk` / policy conflict** — package uses `ein_availability`, not raw EIN storage |
| `bXD8eFcwrVsh1ePQF6fw` | IRS Business Address (if different) | `contact.store_onboarding__irs_business_address_if_different` | TEXT | A2P ops |
| `YandiDgPI2XsGcv9sGHp` | A2P Business Website URL | `contact.store_onboarding__a2p_business_website_url` | TEXT | A2P; overlap with reported website (`duplicate_risk`) |
| `m4TUK2Eop4z8l6tUeU18` | Your Role at the Company | `contact.store_onboarding__your_role_at_the_company` | SINGLE_OPTIONS | map → `implementation_lead_type` (`exists_needs_change`) |
| `xOKf02Kumh41g8EUbXa4` | Sending Email Address | `contact.store_onboarding__sending_email_address` | TEXT | ops / email sending |
| `97mZaTkqgJjcFUBc0gk0` | Domain DNS Controller | `contact.store_onboarding__domain_dns_controller` | SINGLE_OPTIONS | map → `dns_reported_owner` / ownership (`exists_needs_change`) |
| `qJieYJDyi6pgBurANiIe` | Sells Saunas | `contact.store_onboarding__sells_saunas` | SINGLE_OPTIONS | fold into `product_categories` (`exists_needs_change`) |
| `KxBYHNePISGsRew4laZ6` | Sells Swim Spas | `contact.store_onboarding__sells_swim_spas` | SINGLE_OPTIONS | fold into `product_categories` (`exists_needs_change`) |
| `Y02Hw1JWNSg3da9QrmMw` | Brands Carried | `contact.store_onboarding__brands_carried` | TEXT | map → `featured_products` / brands (`exists_needs_change`) |
| `UqgmWVJLHPYMmIzKni58` | Takes Trade-Ins | `contact.store_onboarding__takes_tradeins` | SINGLE_OPTIONS | ops / offers |
| `K6u6cIQz6FVH8rWgs8sd` | Allows Wet Test | `contact.store_onboarding__allows_wet_test` | SINGLE_OPTIONS | ops |
| `cO5HKoxBXNE8ECy5kQI5` | Delivery Radius | `contact.store_onboarding__delivery_radius` | TEXT | map → target area (`exists_needs_change`) |
| `tkOBWld056U0zan2kKjN` | Delivery Included or Extra | `contact.store_onboarding__delivery_included_or_extra` | SINGLE_OPTIONS | ops |
| `DpEQelOWDgm2PMnEufFj` | Delivery Cost (if extra) | `contact.store_onboarding__delivery_cost_if_extra` | TEXT | ops |
| `7fYBmqZIcSZFliaAm1lq` | Typical Delivery Timeline | `contact.store_onboarding__typical_delivery_timeline` | TEXT | ops |
| `G7cA28S78Uwf8fGTvkhP` | Full Weekly Hours | `contact.store_onboarding__full_weekly_hours` | LARGE_TEXT | map → `location_store_hours` (`exists_needs_change`) |
| `E0edN699VdtFhE2AQrRA` | Seasonal Closures | `contact.store_onboarding__seasonal_closures` | TEXT | ops |
| `GmPj3JObyt6cYg6QJApQ` | Manufacturer Price Advertising Restrictions | `contact.store_onboarding__manufacturer_price_advertising_restrictions` | SINGLE_OPTIONS | ops / Call 1 creative |
| `NRvg1LURNF3OELNEy81Q` | Things Never to Say in a Message | `contact.store_onboarding__things_never_to_say_in_a_message` | LARGE_TEXT | map → prohibited topics (`exists_needs_change`) |
| `bbWmoRKV9AkjGEqbnoSP` | Max Ad Promotions & Sweeteners | `contact.store_onboarding__max_ad_promotions__sweeteners` | LARGE_TEXT | map → `current_offers` (`exists_needs_change`) |

### Standard contact fields used by Store Onboarding form

Observed in builder (`get_form_full`): First Name, Last Name, Phone, Email — `live_verified_readonly`. These are GHL standard contact fields, not custom.

---

## Missing package fields (required for Hybrid A+C)

These are **required or conditional** in `config/forms/*.json` / source package and have **no** dedicated live custom field on HTL Success (`live_verified_readonly` absence + `repository_derived` requirement → classification `missing`):

### Main Client Onboarding (high priority)

- Identity / goals: `owner_name`, `owner_email`, `owner_cell`, `submitted_by_email`, `primary_business_address`, `primary_timezone`, `number_of_locations`, `ein_availability` (status only), `primary_business_goals`, `monthly_lead_volume_range`, `monthly_sales_range`, `referral_source`
- Location targeting: `location_timezone`, `appointment_availability`, `target_area_type`, `target_areas`, `excluded_target_areas`, `additional_locations_exist`
- Website **reported** set: `website_reported_status`, `domain_reported_name`, `domain_reported_ownership_status`, `dns_reported_provider` (partial via DNS Controller only)
- Meta gates: `meta_business_portfolio_status`, `meta_ad_account_status`, `meta_payment_method_status`
- Systems: `existing_crm_status`, `phone_provider_status`, `pos_system_status`, `inventory_system_status`, `chatbot_ai_status`, `previous_agency_involved`
- Consent / marketing: `contact_database_status`, `email_consent_status`, `opt_out_status_available`, `social_ads_status`, `reporting_setup_status`
- Lead routing structured fields: `sales_team_structure`, `primary_lead_recipient_email`, `backup_lead_recipient_email`, `backup_lead_recipient_mobile`, `default_lead_routing_method`

### Employee CRM Access — entire form `missing`

All 21 canonical fields (e.g. `employee_full_name`, `required_crm_role`, calendars, permissions). Live “Lead Responders” free-text is **not** a substitute (`duplicate_risk` if both kept without ownership rules).

### Initial Inventory Upload — entire form `missing`

All 7 fields including `inventory_availability` enum. Live inventory owner free-text is **not** a substitute.

### Call 1 / Call 2 — entire CSM forms `missing`

54 + 47 CSM verification / test fields. No CSM-only forms live.

---

## Workflows

| Workflow name | ID | Status | Version | Classification | Label |
|---|---|---|---|---|---|
| Notify Test Form \| Internal SMS Notification \| v1 | `cd3d6559-7618-41f7-9c1d-8c2bcbfab8d9` | published | 5 | `not_required` for package | `live_verified_readonly` |
| Store Onboarding \| Send Service Agreement Contract \| v1 | `57118a4c-ec5d-43e0-a2b8-e80b9a5de285` | published | 5 | `exists_needs_change` (legacy trigger; not Form 1→Make→Supabase) | `live_verified_readonly` |
| Store Onboarding \| Submission Thank You SMS \| v1 | `911a6bcf-1568-45a0-bb78-d18aa94b011d` | published | 2 | `exists_needs_change` | `live_verified_readonly` |
| Store Onboarding \| Tag on Form Completion \| v1 | `ba425b5b-5c19-4c24-9aba-d0e9829b4098` | published | 6 | `exists_needs_change` | `live_verified_readonly` |

**Missing package workflows (proposed, not created):** Form submit → Make webhook → Supabase intake; employee/inventory child-table intake; CSM Call 1/2 system writes. Classification: `missing` · Label: `pending_live_inventory` / `repository_derived`.

---

## Tags

| Tag | ID | Classification | Label |
|---|---|---|---|
| `store-onboarding-form-completed` | `1tYcMeJwtXUZtH1XZ61R` | `exists_needs_change` (legacy completion marker) | `live_verified_readonly` |
| follow-up 1–10, google ads, googleleads, wait on response | (see live list) | `not_required` for onboarding package | `live_verified_readonly` |

**Missing proposed tags:** e.g. `htl-form1-submitted`, `htl-employee-access-submitted`, `htl-inventory-submitted`, `htl-call1-complete`, `htl-call2-complete` — `missing` · `pending_live_inventory`.

---

## GHL vs Supabase authority

| Concern | Authority | Notes | Label |
|---|---|---|---|
| `client_id`, `onboarding_case_id`, status transitions | **Supabase** via `request_client_transition` | GHL may request/mirror only | `repository_derived` |
| Secret values | **1Password** | Never GHL / Make / Supabase / Git | `repository_derived` |
| Contact custom fields | GHL (person-scoped CRM facts) | Not company PK; `ghl_contact_id` is external person | `repository_derived` |
| Form 1 intake create/link | Make (inactive) → Supabase | Scenario `4852018` inactive per Make dep doc | `prior_evidence_only` |
| Employees | `onboarding_employees` child table | Applied on `htl-factory-dev` per contract docs; further apply gated | `repository_derived` |
| Inventory | `inventory_submissions` child table | Same | `repository_derived` |
| Operational website/domain/DNS | form2 ownership | Main form only writes `*_reported_*` | `repository_derived` |
| Tracking IDs / provisioned location | form3 ownership | Not employee/inventory product forms | `repository_derived` |

---

## Conflicts and risks

| Risk | Classification | Detail | Label |
|---|---|---|---|
| Legacy Store Onboarding vs new Main Client Onboarding | `duplicate_risk` | Two forms would collect overlapping business facts | `live_verified_readonly` + `repository_derived` |
| Website Link → operational `website_url` | `blocked` if wired wrong | Must map to `website_reported_url` only | `repository_derived` |
| Raw EIN custom field | `exists_needs_change` / policy conflict | Package prefers `ein_availability`; avoid storing tax ID in CRM without explicit policy | `live_verified_readonly` + `repository_derived` |
| Lead Responders free-text vs employee form | `duplicate_risk` | Prefer structured `onboarding_employees` | `repository_derived` |
| Inventory owner free-text vs inventory form | `duplicate_risk` | Prefer `inventory_submissions` | `repository_derived` |
| No onboarding pipeline | `missing` | Empty pipelines list | `live_verified_readonly` |
| Make Form 1 inactive / org scenario limit | `blocked` | E2E blocked until owner frees Make slot | `prior_evidence_only` |
| Live GHL create unauthorized this phase | `blocked` | Specs only; no create/update/delete | `repository_derived` |

---

## Summary counts

| Class | Approx count |
|---|---|
| `exists_and_matches` | 0 product forms; 0 package custom fields exact-match |
| `exists_needs_change` | 1 legacy form + ~30 mappable Store Onboarding fields + 3 store workflows + 1 tag |
| `missing` | 4 product forms + majority of 199 mapped canonical fields + package tags/workflows/pipeline |
| `duplicate_risk` | Inventory owner, lead responders, website/A2P URL overlap, dual-form era |
| `blocked` | Live create; wrong website ownership wire; Make E2E until slot |
| `not_required` | Notify Test Form, Form 0 (for package), many pricing/deposit ops fields for factory identity |

**Sun Pool / Paradise / Retainer Snapshot / AI Agent Test:** not inventoried, not switched.  
**Production systems:** not contacted.  
**Secrets:** none written to repo.
