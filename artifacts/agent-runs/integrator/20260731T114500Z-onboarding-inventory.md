# Onboarding design inventory — Hot Tub Launch Success

**Run id:** `20260731T114500Z-onboarding-inventory`  
**Agent:** integrator  
**Branch:** `factory/p2-onboarding-forms-and-workflows` @ `9b51c64` (from `origin/factory/p0-safety-lock`)  
**Date (UTC):** 2026-07-31  
**Mode:** Read-only inventory + source package placement. **No live creates.**

## Confirmed inventory location

| Field | Value |
|---|---|
| Name | Hot Tub Launch Success |
| Location ID | `wTkbEAsxM73C2gLNpdi8` |
| Company ID | `uVK13CFqZs9TOBENvXSH` |
| Timezone | America/Los_Angeles |
| Website | hottublaunch.com |
| MCP registered | Yes (owner-authorized PIT) |
| Active for inventory | Confirmed via `get_current_location` before and after reads |

### Explicitly not inventoried / not selected

- Paradise Spas and Outdoor Living (`NpZCArkZIoHhOIl8Qjd1`)
- AI Agent Test Account (`wwetjji8EqcGpqol6JY3`)
- Hot Tub Launch Retainer Snapshot (`8iqYr9YNiaTcGdEKl6UU`) — snapshot structure deferred
- Sun Pool — untouched

---

## 1. Source package (placed this run)

Master: `/Users/alexlobaito/Downloads/HTL_Optimized_Forms_Master.md`  
Split into `docs/onboarding/source/` (7/7 non-empty; normalized rejoin fidelity OK):

| File | Lines (approx) |
|---|---|
| `00_GLOBAL_BUILD_RULES.md` | 98 |
| `01_MAIN_CLIENT_ONBOARDING_FORM.md` | 180 |
| `02_EMPLOYEE_CRM_ACCESS_REQUEST.md` | 45 |
| `03_INITIAL_INVENTORY_UPLOAD_FORM.md` | 34 |
| `04_CALL_1_KICKOFF_AND_ACCESS_FORM.md` | 156 |
| `05_CALL_2_CRM_SETUP_AND_TRAINING_FORM.md` | 121 |
| `06_CANONICAL_CUSTOM_FIELD_REGISTRY.md` | 49 |

No fields invented. No renames during split.

---

## 2. GHL — Hot Tub Launch Success only

### Forms (3)

| Name | Form ID |
|---|---|
| Store Onboarding Form (Hot Tub Launch Success) | `m0crENESrVvozjmHIunZ` |
| Notify Test Form (Hot Tub Launch Success) | `HPb3oFLlZ4vYD2lqNgjf` |
| Form 0 | `BOza6EMJRt9ZwUzG3TIr` |

**Gap vs optimized package:** Live account has **one** primary store onboarding form + test forms. Optimized package defines **five** product forms (`main_client_onboarding`, `employee_crm_access`, `initial_inventory_upload`, `csm_call_1`, `csm_call_2`). Not yet built live.

### Custom fields

- **~50** contact custom fields, all named `Store Onboarding | …`
- Folder/parent: `1ayzDw6zjfrctGjmwVji`
- Model: `contact` only (no company custom fields observed in this list)
- Examples of fieldKeys: `contact.store_onboarding__store_name`, `…__website_link`, `…__ein__federal_tax_id`, financing/A2P/hours/delivery fields
- Option language is human (`Yes`/`No`/`Not sure`), **not** frozen snake_case machine values from the optimized package

**Implication for mapping matrix:** Live GHL fields are a legacy “Store Onboarding” set. Optimized package is SoT for *design*; live IDs map where concepts overlap; many new canonical fields will need **later authorized create** (not this phase).

### Workflows (4 published)

| Name | ID |
|---|---|
| Notify Test Form \| Internal SMS Notification \| v1 | `cd3d6559-7618-41f7-9c1d-8c2bcbfab8d9` |
| Store Onboarding \| Send Service Agreement Contract \| v1 | `57118a4c-ec5d-43e0-a2b8-e80b9a5de285` |
| Store Onboarding \| Submission Thank You SMS \| v1 | `911a6bcf-1568-45a0-bb78-d18aa94b011d` |
| Store Onboarding \| Tag on Form Completion \| v1 | `ba425b5b-5c19-4c24-9aba-d0e9829b4098` |

No Form 1–5 reminder / Call 1–2 / provisioning workflows yet.

### Pipelines

- **None** (`pipelines: []`)

### Tags (selected)

- `store-onboarding-form-completed` (`1tYcMeJwtXUZtH1XZ61R`) — onboarding-relevant
- Multiple `follow-up 1..10`, `google ads`, `googleleads`, `wait on response`

### Calendars

- `Free Estimate Calendar` (`WEFvm3aC1Q1jHslkKsfu`) — active; appears estimate/booking oriented, not Call 1/Call 2 onboarding calendar

### Users

- 1 admin: Alex Bloomfield (`5RbjT3TZqWmEj3A4yVG7`)

### Surveys / webhooks

- Surveys: none
- Webhooks list endpoint: **404** (no usable webhook inventory via MCP)

### Soft collision / design notes

- Existing Store Onboarding form + tag + thank-you + contract workflows are the **current** CSM process — preserve while designing replacement five-form model
- Do not silently reuse Retainer Snapshot location for process inventory

---

## 3. Make (org inventory — read-only)

| Metric | Value |
|---|---|
| Team | My Team `442605` |
| Total scenarios | 43 |
| Active | **26** |
| Inactive | 17 |
| HTL Factory Form 1 Intake (dev_test) | `4852018` — **inactive** |
| Soft name risk | Inactive DWY `Onboarding Scenario (DWY) 2nd Version` `1856850` — do not reuse |

**Capacity:** Active count remains at plan ceiling historically hit during Form 1 activate attempts. **P2 live scenario create still blocked by design-freeze auth + likely active-slot pressure.** Prefer cleanup recommendation before any later live Make build. Do not deactivate anything in this phase.

---

## 4. Supabase (`htl-factory-dev` / linked MCP project)

Read-only `list_tables` confirms factory tables present; row counts currently **0** for clients/cases/intake (empty ready state).

| Table | Notes |
|---|---|
| `clients` | Identity keys present |
| `onboarding_cases` | Status check enum = live state machine (20 statuses); `ghl_location_id` nullable until provision |
| `intake_submissions` | `form ∈ {form1,form2,form3}` only — **no form4/form5** |
| `config_versions` | `source_form ∈ {form1,form2,form3,system}` |
| `workflow_events` | Outbox/audit |
| `sync_failures` | Retry / exception surface |
| `idempotency_keys` | Present |
| `factory_transition_rules` | 27 rules seeded |
| RPC | `request_client_transition` (from contract / prior verify) |

**Product vs storage (for next contract-delta):**

| Product ID | Tentative storage | Contract note |
|---|---|---|
| `main_client_onboarding` | `form1` | Align with frozen form1 policies |
| `employee_crm_access` | `form2` | **Conflicts** with frozen `field_policies` that assign website/DNS to form2 |
| `initial_inventory_upload` | `form3` | Check against form3 ownership |
| `csm_call_1` / `csm_call_2` | `system` + provenance | No enum expansion |

---

## 5. ClickUp

- **No ClickUp MCP connected** in this environment
- Design specs for ClickUp structure/timers remain docs-only next; live ClickUp inventory deferred until connection authorized

---

## 6. Future provisioning context (documented; not built)

Trigger must **not** be raw Form 1 alone. Emit `provisioning_ready` only when payment confirmed + main form complete + CSM review approved + identity/slug/fields valid + duplicate checks + no blocking conflict + approved snapshot + eligible case status. Later P3 may create GHL sub-account / snapshot / ClickUp milestones. **Not authorized now.**

---

## 7. Confirmations

- Sun Pool untouched
- No Make/GHL/ClickUp objects created (GHL MCP **register_location** only for inventory access, owner-approved)
- No provisioning, snapshot apply, migrations, live submissions
- `docs/EXECUTION_STATE.md` not updated
- Excluded locations not inspected beyond prior registry listing

---

## 8. Stop / next owner decision

**STOP before:** live GHL field/form/workflow create, Make create, ClickUp create, Supabase writes, provisioning, snapshot, `EXECUTION_STATE`.

**Next authorized design steps (when you say continue):**

1. `CONTRACT_DELTA_REPORT.md` (especially form2 ownership)
2. Field registry + mapping matrix (map live Store Onboarding IDs where overlap; leave gaps for later create)
3. Form specs / ClickUp ops / timers / reminders / `provisioning_ready` doc / local tests
4. Evidence GO / GO WITH CHANGES / BLOCKED

**Unresolved:** Owner approval of contract-delta when produced; ClickUp workspace not connected; Make active-slot cleanup before any later live Make work.
