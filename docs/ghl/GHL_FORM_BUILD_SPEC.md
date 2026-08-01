# GHL Form Build Specification — HTL Onboarding Package

**Status:** SPEC ONLY — create NOTHING without separate owner authorization  
**Target location:** Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`  
**Contract / schema:** `0.2.0` / `1.1.0`  
**Direction:** Hybrid A+C (preserve storage `form1|form2|form3` meanings)  
**Companion inventory:** [`GHL_ONBOARDING_INVENTORY.md`](./GHL_ONBOARDING_INVENTORY.md)  
**Companion mapping:** [`GHL_FIELD_MAPPING.md`](./GHL_FIELD_MAPPING.md)

Evidence labels used below: `repository_derived` (configs/source), `live_verified_readonly` (current GHL gap), `pending_live_inventory` (IDs after create), `prior_evidence_only` (Make IDs).

---

## Global build rules (locked)

Source: `docs/onboarding/source/00_GLOBAL_BUILD_RULES.md` · Label: `repository_derived`

1. Prefer structured field types over free text.
2. Every status field includes `unknown` / `not_verified` where applicable.
3. Canonical values = lowercase `snake_case`.
4. Never collect passwords, API keys, tokens, recovery codes, or full card numbers.
5. Clients report facts once; CSM verifies later (Call 1 / Call 2).
6. Do not invent canonical names outside source package + six approved `*_reported_*` fields.
7. Product form IDs ≠ storage form enum.

### Submission envelope (all product forms)

Every submit payload must include:

`form_type`, `form_version`, `submission_id`, `submitted_at`, `client_id` (when known), `onboarding_case_id` (when known), `correlation_id`, `actor_type`, `actor_id`, `schema_version` (`1.1.0`).

### Authority

| Layer | Role |
|---|---|
| GHL | Collect UI + contact custom fields + optional tags |
| Make | Intake worker (webhook → normalize → Supabase); may **request** transitions |
| Supabase | Authoritative status + config + child tables via controlled RPCs |
| 1Password | Secret **values** only |

---

## Legacy Store Onboarding disposition

| Decision | Spec |
|---|---|
| Object | Live form `m0crENESrVvozjmHIunZ` · Label: `live_verified_readonly` |
| Classification | `exists_needs_change` |
| Recommended path | **Freeze** for new factory clients. Do not rebuild in place as Main Client Onboarding. |
| Why | Field set is messaging/ops-oriented (pricing, deposits, A2P EIN) and lacks Meta/consent/reported website ownership model. |
| Migration | Map overlapping fields into new Main form + Make mapper; retire or rename after cutover authorization. |
| EIN field | Do **not** carry raw EIN into new Main form; use `ein_availability` only unless owner approves a separate sensitive-ID policy. |

---

## Form A — Main Client Onboarding

| Attribute | Spec |
|---|---|
| Product form ID | `main_client_onboarding` |
| Human title | Main Client Onboarding Form |
| Audience | Client |
| Storage | `intake_submissions.form = form1` + config (`*_reported_*` for website/domain) |
| Timing | Send within 15m after payment; due EOD next business day |
| Live status | `missing` as package form · Label: `live_verified_readonly` |
| Machine source | `config/forms/form-1-main-client-onboarding.json` (70 fields) |
| Classification after build | Target `exists_and_matches` |

### Sections (build order)

1. **Business Identity** — `legal_business_name`, `public_dba_name`, `domain_reported_name` (conditional), owner contacts, `submitted_by_email`, address, timezone, locations count, `ein_availability`, implementation lead, goals, volume/sales ranges, referral.
2. **Locations and Service Area** — primary location block, hours, appointment availability, targeting, additional locations flag (+ repeatable if yes).
3. **Products, Offers, Financing** — categories, featured products, promotions, financing availability/provider/details.
4. **Website and Brand (reported)** — `website_reported_status`, `website_reported_url`, `domain_reported_ownership_status`, social/GBP statuses, logo/media availability. **Never** bind these controls to operational `website_url` / `domain` / `dns_*`.
5. **Systems Overview** — CRM, Meta portfolio/ad/payment statuses, phone/POS/inventory/chatbot, previous agency.
6. **Contact Database and Marketing** — database status, consent/opt-out, ads, reporting.
7. **Lead Routing** — sales structure, primary/backup recipients, default routing method.
8. **DNS reported (optional/conditional)** — `dns_reported_provider`, `dns_reported_owner`.

### Conditional logic (must implement)

| Trigger | Behavior |
|---|---|
| `website_reported_status = no_website` | Hide admin/access questions; flag Call 1 domain/registrar checklist |
| previous agency controls website/domain | Create blocker task (ClickUp later); do not clear fields |
| `additional_locations_exist = yes` | Show repeatable location block |
| `target_area_type = radius` | Require `target_radius_miles` |
| financing yes | Require provider / details availability |
| Meta statuses unknown/restricted | Surface Call 1 Meta decision tree |

### GHL object model

- Primary object: **Contact** (person) + custom fields folder **HTL Onboarding \| Form 1** (proposed; create later).
- Standard fields: first/last/email/phone for submitter; map owner fields to custom if owner ≠ submitter.
- On submit: tag `htl-form1-submitted` (proposed); webhook to Make Form 1 hook (`2785703` · Label: `prior_evidence_only`).

### Idempotency

`intake:form1:{ghl_contact_id}:{submission_id}` · Label: `repository_derived`

### Do not

- Write operational `website_url` / `domain` / `dns_provider` / `dns_owner` from this form.
- Store raw credentials.
- Treat `ghl_contact_id` as `client_id`.

---

## Form B — Employee CRM Access

| Attribute | Spec |
|---|---|
| Product form ID | `employee_crm_access` |
| Human title | Employee CRM Access Request |
| Audience | Client (one submission per employee) |
| Storage | **`onboarding_employees`** — **not** `form2` |
| Timing | Due 12:00 local, 1 business day before Call 2 |
| Live status | `missing` · Label: `live_verified_readonly` |
| Machine source | `config/forms/form-2-employee-access.json` (21 fields) |

### Fields (all required unless noted)

`client_id_display` (hidden/prefilled), `employee_full_name`, `employee_email`, `employee_mobile`, `employee_job_title` (+ `employee_job_title_other` if other), `employee_location_id`, `required_crm_role`, `lead_assignment_role`, permission radios (`can_view_all_leads`, `can_edit_opportunities`, `can_send_communications`, `can_manage_calendar`), `calendar_needed` (+ `calendar_name` if yes), `working_days`, `working_hours`, `employee_timezone`, `required_crm_functions`, `approving_manager_name`, `manager_approval_date`.

### Confirmations

- No credentials shared in form.
- Manager approval received.
- Accuracy attestation.

### Disposition of legacy Lead Responders field

Keep Store Onboarding free-text as historical (`duplicate_risk`). New clients use this form only. Do not dual-write without ownership rules.

### Make / Supabase

Webhook → insert/upsert row in `onboarding_employees` keyed by `(onboarding_case_id, employee_email)` with idempotency key. Classification after authorize: `pending_live_inventory`.

---

## Form C — Initial Inventory Upload

| Attribute | Spec |
|---|---|
| Product form ID | `initial_inventory_upload` |
| Human title | Initial Inventory Upload |
| Audience | Client |
| Storage | **`inventory_submissions`** — **not** `form3` |
| Timing | Due 12:00 local, 1 business day before Call 1 |
| Live status | `missing` · Label: `live_verified_readonly` |
| Machine source | `config/forms/form-3-inventory-upload.json` (7 fields) |

### Fields

| Field | Required | Notes |
|---|---|---|
| `client_id_display` | Yes | Hidden/prefilled |
| `inventory_availability` | Yes | `ready_to_upload` / `needs_template` / `no_current_inventory` / `pending` |
| `inventory_spreadsheet` | Conditional | `.xlsx`/`.csv` if ready |
| `inventory_source_system` | Yes | spreadsheet / pos_export / inventory_platform / none |
| `inventory_approval_owner` | Conditional | If ready |
| `inventory_rights_confirmed` | Conditional | If ready |
| `inventory_expected_date` | Conditional | If pending |

### Rules

- Do not accept product images on this form.
- `no_current_inventory`: do not block Call 1; block campaign launch later.
- `needs_template`: task to send template.
- Legacy “Inventory Owner and Update Frequency” remains historical (`duplicate_risk`).

---

## Form D — Call 1 Kickoff and Access (CSM)

| Attribute | Spec |
|---|---|
| Product form ID | `csm_call_1` |
| Audience | CSM-only |
| Storage | `config_versions.source_form = system` + CSM provenance |
| Timing | Live on Call 1; submit before call ends; target within 2 business days after Form 1 complete |
| Live status | `missing` · Label: `live_verified_readonly` |
| Machine source | `config/forms/form-4-call-1-csm.json` (54 fields) |

### Prefill

`client_id`, `onboarding_case_id`, `legal_business_name`, reported domain, `client_slug`.

### Build blocks

1. Call context (date, CSM, attendees, decision maker).
2. Business confirmation checkboxes (unchecked → notes + blocker).
3. Website verified decision tree → may set operational website/domain/DNS **only** via CSM/`form2` writers, not client reported overwrite.
4. Meta setup decision tree (portfolio, ad account, billing, pixel, HTL partner access, client admin remains).
5. Access statuses (Google, GBP, hosting, DNS, CRM, phone, POS, inventory).
6. Previous agency risk + access approved.
7. Creative / positioning / prohibited topics.
8. Evidence statuses (inventory, offers, financing, testimonials, awards, people permission).
9. Employee access form status gate.
10. Commitments, Call 2 schedule, outcome summary, optional recommended transition (request only).

### Authority note

CSM form may **recommend** a status transition; Supabase commits only through `request_client_transition` with `expected_version` / `expected_current_status`.

---

## Form E — Call 2 CRM Setup and Training (CSM)

| Attribute | Spec |
|---|---|
| Product form ID | `csm_call_2` |
| Audience | CSM-only |
| Storage | `system` provenance |
| Timing | Live; employee forms due 1 business day before; default retest = 1 business day |
| Live status | `missing` · Label: `live_verified_readonly` |
| Machine source | `config/forms/form-5-call-2-csm.json` (47 fields) |

### Build blocks

1. Employee access verification (expected vs provisioned counts; login/permission/role tests).
2. Lead routing tests (test lead, assignment, delay).
3. Communication tests (SMS/email send/receive, notifications).
4. Appointment + pipeline tests.
5. Phone / AI / voicemail / recording disclosure.
6. Compliance: A2P status, contact-list opt-in, import approval.
7. Training outcomes + open issues + retest schedule.
8. Outcome summary + optional recommended transition (request only).

### Rule

Every `fail` / `blocked` / `not_tested` (when required) needs reason, owner, and retest date.

---

## Proposed GHL supporting objects (not created)

| Object | Classification | Notes |
|---|---|---|
| Custom field folder `HTL Onboarding \| Form 1` | `missing` | New fields; do not rename Store Onboarding folder in place without cutover plan |
| Folders for employees / inventory / Call1 / Call2 | `missing` | Or survey/internal forms if GHL form UX insufficient for CSM |
| Tags `htl-form1-submitted`, `htl-employee-access-submitted`, `htl-inventory-submitted`, `htl-call1-complete`, `htl-call2-complete` | `missing` | |
| Onboarding pipeline + stages | `missing` | Live pipelines = empty · `live_verified_readonly` |
| Workflows: Form→Make webhook; thank-you SMS; internal notify | `missing` | Do not reuse Store Onboarding workflows without remapping triggers |
| Make Form 1 activate | `blocked` | Scenario inactive / org slot · `prior_evidence_only` |

---

## Build sequence (authorized phases only)

1. **Spec freeze** (this doc) — done in Git.
2. Owner authorizes GHL field create on HTL Success only.
3. Create Form 1 fields + form → wire Make (inactive until E2E auth).
4. Create Employee + Inventory forms → child-table writers.
5. Create Call 1 / Call 2 CSM forms (internal).
6. Retire or quarantine Store Onboarding for factory path.
7. E2E on `htl-factory-dev` only; no production; no Sun Pool.

---

## Acceptance criteria (when build authorized)

- [ ] Five product forms exist on `wTkbEAsxM73C2gLNpdi8` with canonical field keys documented in `GHL_FIELD_MAPPING.md` (`pending_live_inventory` → filled IDs).
- [ ] Form 1 never writes operational website/domain/DNS fields.
- [ ] Employee/inventory never land in `form2`/`form3` storage enum.
- [ ] No secrets in payloads.
- [ ] Store Onboarding not used as factory Form 1.
- [ ] Sun Pool untouched; no creates on forbidden locations.
