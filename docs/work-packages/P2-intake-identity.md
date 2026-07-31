# P2 — Intake + identity write path

**Phase:** P2  
**Status:** OWNER AUTHORIZED (2026-07-31) — Make intake against `htl-factory-dev` only  
**Goal:** Accept Form 1/2/3 into Supabase with canonical identity fields; request status only via `request_client_transition`. No Cloudflare provision; no GHL sub-account provision; no hydrate; no deploy.  
**Branch:** `factory/p2-make-intake`  
**Inventory:** `artifacts/agent-runs/integrator/20260731T084800Z-p2-make-inventory.md`

## Dependencies

- P0 protection library + denylist
- P0.5 frozen `config/identity-fields.json`, `config/state-machine.json`, `config/factory-contract.schema.json`, `config/forbidden-aliases.json`
- P1 migrations **COMPLETE AND VERIFIED** on `epeddfdifckzzmskhdsz`
- Make org `Increase ROAS` / team `My Team` (`442605`)

## Locked Supabase target

| Field | Value |
|---|---|
| `project_name` | `htl-factory-dev` |
| `project_ref` | `epeddfdifckzzmskhdsz` |
| `target_environment` | `dev_test` |
| Further migration apply | Locked (config `apply_authorized: false`) |
| Production | Forbidden |

## Inputs

| Input | Source | Required |
|---|---|---|
| `schema_version` | Form / mapper | Yes (`1.0.0`) |
| `submission_id` | Form platform external id | Yes (idempotency) |
| Form 1 payload | Make webhook (test) or mapped CSV | Yes for new case |
| Form 2 / Form 3 payloads | Make webhook | Optional; merge onto same case |
| Actor | Make | Yes — use `make_service` or `system` only where state machine allows |
| `correlation_id` | Make | Yes on every side-effecting call |

Canonical identity fields written (names locked — do not invent):

- `client_id`, `onboarding_case_id`
- `ghl_contact_id`, `ghl_opportunity_id`, `ghl_location_id` (nullable until provision)
- `client_slug`, `deployment_key`, `business_name`, `domain`

**Forbidden aliases (fail closed):** `ghlLocationId`, `ghlSubAccountId`, `location_id`, `GHL_LOCATION`, and all entries in `config/forbidden-aliases.json`.

## Outputs (live tables)

| Output | Destination |
|---|---|
| Raw row | `intake_submissions` (append-only; `form` ∈ `form1`/`form2`/`form3`) |
| Client + case | `clients`, `onboarding_cases` |
| Normalized config | `config_versions` (append-only; bump `config_version`) |
| Status | `onboarding_cases.status` **only** via `request_client_transition` |
| Audit | `status_history`, `workflow_events`, `idempotency_keys` |
| Mirror (optional later) | ClickUp checklist — non-authoritative; not required for Form 1 e2e |
| Local scaffold | `clients/<slug>/` via `new-client.mjs` — **not** in first Make path |

## Idempotency

| Key | Scope |
|---|---|
| `intake:form1:{ghl_contact_id}:{submission_id}` | Duplicate Form 1 → same `onboarding_case_id` / `client_id` |
| `intake:form{N}:{client_id}:{submission_id}` | Form 2/3 dedupe |
| `transition:{onboarding_case_id}:{requested_status}:{correlation_id}` | RPC (also accepts explicit `p_idempotency_key`) |

Repeated identical submissions return the original result; never create a second `client_id` for the same opportunity/`submission_id` pair.

Unique DB constraint: `intake_submissions (form, submission_id)`.

## States (live machine)

Authoritative enum: `config/state-machine.json` / applied `onboarding_cases_status_check`.

| Role | Status |
|---|---|
| Initial on Form 1 insert | `submitted` (`version` = 1) |
| First Make-allowed transition | `submitted` → `under_review` (actors: `csm`, `make_service`, `system`) |
| P2 non-goals | Do **not** transition into `approved`, `provisioning`, or beyond |

Invalid transitions rejected by RPC. Free-form `UPDATE onboarding_cases.status` is forbidden (trigger).

```text
Form 1 creates case at submitted
  → (optional) request_client_transition → under_review
Form 2/3 merge config_versions on same onboarding_case_id
  → no status inventing in Make
```

## Make scenario naming (collision-safe)

| Scenario | Name |
|---|---|
| Form 1 | `HTL Factory — Form 1 Intake (dev_test)` |
| Form 2 | `HTL Factory — Form 2 Intake (dev_test)` |
| Form 3 | `HTL Factory — Form 3 Intake (dev_test)` |

Do not reuse DWY onboarding scenario `1856850` or webhook `Sub Account Creation`.

## Form 1 success path (first e2e)

1. Webhook receives **test/fake dealer** payload with required fields + `submission_id` + `correlation_id`.
2. Reject forbidden aliases / missing required fields (fail closed).
3. Reject `client_slug` = protected Sun Pool slug.
4. Upsert-or-return via idempotency key; on first success:
   - `INSERT clients` (slug, deployment_key, business_name, domain, ghl_contact_id)
   - `INSERT onboarding_cases` (`status=submitted`, `version=1`, schema `1.0.0`)
   - Link `clients.active_onboarding_case_id`
   - `INSERT intake_submissions` (`form=form1`, raw `payload`)
   - Optional `INSERT config_versions` (`config_version=1`)
5. Optional: `request_client_transition` to `under_review` as `make_service` with expected status/version.
6. Duplicate webhook → same ids; no second client/case.

## Tests

- Unit / contract: forbidden alias rejection
- Unit: duplicate `submission_id` idempotent
- Unit: Form 2 out of order still merges; stale `expected_version` rejected
- Unit: null field ≠ approved deferral
- Integration (dev_test only): Form 1 e2e + RPC path
- Negative: no Cloudflare / GHL provision API calls from intake scenarios

## Credentials required

| Cred | Env | P2 default |
|---|---|---|
| Supabase service role (or equivalent HTTP auth) | **dev_test** `epeddfdifckzzmskhdsz` only | Required for Make HTTP/RPC — via Make credential UI, never in Git/docs/chat |
| Make webhook URL | team `442605` | Created with scenario |
| GHL webhook signing secret | test location | Optional until GHL wiring; Form 1 can use Make gateway webhook + test payloads first |
| Cloudflare / production / real client GHL | — | **Forbidden** |

## Explicit non-goals

- Creating Pages/D1/R2/GHL locations
- Hydrate / deploy / fleet
- Free-form status writes
- Make data stores as status SoT
- Touching `clients/sun-pool-spa` or real client data
- Editing migrations
- Storing secret values in Make notes, GitHub, docs, or chat
- P3+ work

## Files

- This package: `docs/work-packages/P2-intake-identity.md`
- Scenario design: `docs/make/P2-form1-scenario.md`
- Inventory evidence: `artifacts/agent-runs/integrator/20260731T084800Z-p2-make-inventory.md`
- Contracts: `config/identity-fields.json`, `config/state-machine.json`, `config/forbidden-aliases.json`
- Applied SQL: `supabase/migrations/20260731000100_factory_core_tables.sql`, `…00200_request_client_transition.sql` (do not edit)
