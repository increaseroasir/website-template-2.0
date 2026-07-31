# Canonical Contract

**Status:** content-complete for P0 (Agent B). Make scenarios remain blocked until owner P0.5 freeze.  
**Contract version:** `0.1.0`  
**Onboarding schema version:** `1.0.0`

Machine-readable companions (authoritative for field names, transitions, and validation):

| File | Role |
|---|---|
| `config/identity-fields.json` | One canonical name set, ownership, merge precedence, immutability |
| `config/state-machine.json` | Allowed / forbidden transitions + actors |
| `config/factory-contract.schema.json` | JSON Schema for contract artifacts + deployment candidate |
| `config/forbidden-aliases.json` | Rejected alternate spellings / casings |

CI and agents MUST reject forbidden aliases (e.g. `ghlLocationId`, `location_id`, `GHL_LOCATION` when canon is `ghl_location_id`).

---

## Must-include checklist (P0 / P0.5)

Every work package that touches fulfillment MUST satisfy this checklist. Missing any item is a stop-the-line defect.

### Identity (locked — do not reopen)

- [x] `client_id` — dealer / customer **organization** UUID; immutable after create
- [x] `onboarding_case_id` — one onboarding **engagement** UUID; immutable after create
- [x] `ghl_contact_id` — external **person** / contact; never the company primary key
- [x] `ghl_opportunity_id` — external sales / onboarding workflow; unique when set
- [x] `ghl_location_id` — provisioned GHL sub-account; nullable until provision
- [x] `client_slug` — reserved human-readable slug; effectively immutable after infrastructure
- [x] `deployment_key` — machine deploy identifier; immutable
- [x] `business_name` — display name; editable
- [x] `domain` — public domain; editable; audited

### Forms and merge

- [x] Every payload carries `schema_version` and raw `submission_id`
- [x] Form 1 creates/links `client_id` + `onboarding_case_id`; stores external GHL IDs; appends raw submission
- [x] Form 2 / Form 3 enrich the **same** `onboarding_case_id`
- [x] Duplicate Form 1 is idempotent (one logical case)
- [x] Form 2 / Form 3 may arrive out of order
- [x] Repeated Form 2 / Form 3 must not overwrite newer config (`expected_version` / optimistic concurrency)
- [x] Field ownership and merge precedence enumerated in `config/identity-fields.json`

### Deferrals

- [x] A null field is **not** a deferral
- [x] Approved deferral requires: field name, reason, approved by, timestamp, expiration, launch consequence, whether production is still allowed, whether required before launch

### State machine

- [x] GHL / ClickUp may **request** or **mirror** state only
- [x] Supabase validates and commits via controlled RPC only (`request_client_transition`)
- [x] Free-form `UPDATE … SET status` is banned
- [x] Identical repeated transition requests are idempotent
- [x] Invalid transitions rejected
- [x] Stale writes (wrong `expected_version` / `expected_current_status`) rejected
- [x] Allowed / forbidden transitions live in `config/state-machine.json`

### Concurrency, idempotency, correlation

- [x] Config and status writes require `expected_version`; mismatch → reject + reconcile
- [x] Every side-effecting job carries an idempotency key
- [x] Duplicates return the original result; they do not double-create
- [x] Correlation chain: `submission` → `onboarding_case` → `client` → `approval` → `provisioning_job` → `resources` → `hydration` → `staging_deploy` → `qa_approval` → `production_deploy`

### Environments and deployment candidate

- [x] Environments: `development` | `test` | `staging` | `production`
- [x] Cloud agents: **zero** production credentials for P0 / P0.5
- [x] Deployment candidate binds: `client_id`, `onboarding_case_id`, `configuration_version`, `onboarding_schema_version`, `template_version`, `git_sha`, `hydrator_version`, `gate_version`, `deployment_workflow_version`, `artifact_digest`, `environment`
- [x] Any post-approval change to bound fields (or domain / tracking / secrets) invalidates approval
- [x] Approvals expire, are single-use on success; rollback needs distinct authorization

### Secrets and approval readiness

- [x] Secret **values**: 1Password only
- [x] Install: `wrangler pages secret put` + `secrets:verify` only
- [x] Forbidden: `deployment_configs` PATCH; secrets in Git / Supabase / Make / logs / docs / `wiring.json` values
- [x] Approval blocked unless required fields exist **or** are covered by unexpired deferrals that explicitly allow the target environment

### Supabase control plane (this PR)

- [x] Tables for clients, onboarding cases, intake submissions, config versions, idempotency, status history, deferrals, sync failures, approval readiness, workflow events
- [x] Controlled transition RPC; no free-form status updates
- [x] Migrations authored; **not** applied to production (`COMPLETE BUT NOT APPLIED`)

---

## Identity model

| Identifier | Role | Immutable? |
|---|---|---|
| `client_id` | Dealer / customer **organization** (UUID) | Yes after create |
| `onboarding_case_id` | One onboarding **engagement** (UUID) | Yes after create |
| `ghl_contact_id` | External person / contact | External; not the company key |
| `ghl_opportunity_id` | External sales / onboarding workflow | Unique when set |
| `ghl_location_id` | Provisioned GHL sub-account | Nullable until provision |
| `client_slug` | Reserved human-readable slug | Effectively immutable after infrastructure |
| `deployment_key` | Machine deploy identifier | Immutable |
| `business_name` | Display name | Editable |
| `domain` | Public domain | Editable; audited |

**Rules**

- Contact ≠ company. One contact may own multiple dealers / cases.
- Do not upsert by email, phone, or business name as primary key.
- Match onboarding work to `onboarding_case_id`, linked to `client_id` + external GHL IDs.
- Cloudflare / D1 / R2 / deploy jobs reference `client_id` and/or `deployment_key`, not business name alone.
- Protected client `sun-pool-spa` is never mutated without a valid break-glass artifact (see `config/protected-clients.json`).

---

## Forms (versioned)

Every payload carries `schema_version` and a raw `submission_id`.

| Form | Purpose |
|---|---|
| Form 1 | Intake — creates/links `client_id` + `onboarding_case_id`; stores external GHL IDs; appends raw submission |
| Form 2 | Enrichment merge onto same case |
| Form 3 | Enrichment merge onto same case |

**Idempotency key patterns**

| Operation | Key |
|---|---|
| Form 1 | `intake:form1:{ghl_contact_id}:{submission_id}` |
| Form 2 / 3 | `intake:form{N}:{client_id}:{submission_id}` |
| Status transition | `transition:{onboarding_case_id}:{requested_status}:{correlation_id}` |
| Config write | `config:{onboarding_case_id}:{expected_version}:{submission_id}` |

**Merge / duplicates**

- Duplicate Form 1 → one logical onboarding case (idempotent).
- Form 2 / Form 3 may arrive out of order.
- Repeated Form 2 / Form 3 must not overwrite newer config (optimistic concurrency).
- Field ownership and merge precedence: `config/identity-fields.json`.

### Form field ownership (summary)

| Form | Owns (canonical) |
|---|---|
| 1 | `business_name`, `owner_name`, `owner_email`, `owner_phone`, `offer_summary`, `market` (may defer), `ghl_contact_id`, `ghl_opportunity_id` |
| 2 | `domain`, `dns_provider`, `dns_owner`, `website_url`, `logo_url` (deferrable), `address`, `hours`, `phone_e164` |
| 3 | `ga4_id`, `meta_pixel_id`, `ghl_location_id`, access checkboxes; secrets never stored in form DB |

Brand palette colors are **not** collected by default (product Law 3); only via documented exception.

---

## Deferrals

A null field is not a deferral. An approved deferral requires:

| Field | Required |
|---|---|
| `field_name` | yes |
| `reason` | yes |
| `approved_by` | yes |
| `approved_at` | yes |
| `expires_at` | yes |
| `launch_consequence` | yes |
| `production_allowed` | yes (bool) |
| `required_before_launch` | yes (bool) |

Stored in `deferrals` (see Supabase migrations). Expired deferrals do not satisfy approval readiness.

---

## State machine (requested transitions)

GHL and ClickUp may **request** or **mirror** state.  
**Supabase validates and commits** via controlled RPC only.

```text
request_client_transition(
  p_client_id uuid DEFAULT NULL,
  p_onboarding_case_id uuid DEFAULT NULL,
  p_expected_current_status text,
  p_requested_status text,
  p_expected_version integer,
  p_actor text,
  p_correlation_id text,
  p_reason text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
```

Rules:

- Exactly one of `p_client_id` or `p_onboarding_case_id` may resolve the target case (client_id resolves the active case).
- Ban free-form `UPDATE … SET status`.
- Repeated identical transition requests (same idempotency key or same from→to with matching version) are idempotent.
- Invalid transitions are rejected.
- Stale writes (wrong `expected_version` or `expected_current_status`) are rejected with a concurrency error.

Exact allowed / forbidden transitions: `config/state-machine.json`.

### Canonical statuses

`submitted` → `under_review` → (`needs_correction` ↔ `under_review`) → `approved` | `rejected` | `deferred` → `provisioning` → (`provision_failed` ↔ `provisioning`) → `infrastructure_ready` → `building` → (`build_failed` ↔ `building`) → `staging` → (`qa_failed` → `building`) → `awaiting_approval` → `production_deploying` → `live` → (`update_requested` → `updating` → `staging`) | `suspended` ↔ `live` | `archived`

**Hard-forbidden examples:** `submitted → provisioning`, `approved → live`, `staging → live` (must pass `awaiting_approval` + approval row).

---

## Optimistic concurrency

| Resource | Version column | Write rule |
|---|---|---|
| Onboarding case status / case row | `onboarding_cases.version` | RPC / merge requires `expected_version` |
| Normalized config | `config_versions.config_version` | Append-only new version; merge reads head and checks `expected_version` |
| Domain edits | audited via `workflow_events` | Prior value retained in event payload |

Mismatch → reject (`concurrency_conflict`) + reconcile from authoritative Supabase row. Never last-write-wins across forms.

---

## Idempotency

Every side-effecting job carries an idempotency key (Form submission, provision step, hydrate, deploy, transition).  
Duplicates return the original result; they do not double-create.  
Keys live in `idempotency_keys` with unique constraint on `key`.

---

## Correlation IDs

Chain: `submission` → `onboarding_case` → `client` → `approval` → `provisioning_job` → `resources` → `hydration` → `staging_deploy` → `qa_approval` → `production_deploy`.

All workflow writes SHOULD include `correlation_id` for trace reconstruction. Persisted on `workflow_events` and transition history.

---

## Environments

| Env | Use |
|---|---|
| `development` | Local / agent sandbox |
| `test` | Synthetic fixtures; no prod credentials |
| `staging` | Client staging deploy; noindex; safe test leads |
| `production` | Approval-gated only |

Cloud agents: **zero** production credentials for P0 / P0.5.

---

## Deployment candidate (bind all of these)

```json
{
  "client_id": "uuid",
  "onboarding_case_id": "uuid",
  "configuration_version": 1,
  "onboarding_schema_version": "1.0.0",
  "template_version": "1.1.0",
  "git_sha": "...",
  "hydrator_version": "...",
  "gate_version": "...",
  "deployment_workflow_version": "...",
  "artifact_digest": "sha256:...",
  "environment": "staging"
}
```

Any post-approval change to these (or domain / tracking / secrets) invalidates approval.  
Approvals expire, are single-use on success, and rollback needs distinct authorization.

Schema: `config/factory-contract.schema.json` → `$defs/deploymentCandidate`.

---

## Secrets

- Values: 1Password only.
- Install: `wrangler pages secret put` + `secrets:verify` only.
- Forbidden: `deployment_configs` PATCH; secrets in Git / Supabase / Make / logs / docs / `wiring.json` values.
- Supabase may store secret **refs** (`op://…`) and verification timestamps only — never plaintext secret values.

---

## Approval readiness

Computed / stored in `approval_readiness`:

- Blocked unless every required field for the target environment is present **or** covered by an unexpired deferral with `production_allowed` / environment flags that permit that environment.
- Null ≠ deferred.
- `sync_failures` must be empty or explicitly waived for the case before production approval.

---

## Later-phase contracts (specify now; side effects gated)

| Phase | Must define in work packages |
|---|---|
| P3 Provision | Per-resource lifecycle: `not_requested` → `requested` → `creating` → `created` → `verified` / `failed` / `orphaned` / `externally_missing`. Resources: pages, D1, R2, GHL location, lead sheet. |
| P4 Hydrate | Temp workspace → validate → atomic swap; overrides never overwritten; determinism tested; `wiring.json` machine SoT. |
| P5 Staging | Deployment job record; cross-client leakage suite; safe test-lead; noindex. |
| P6 Prod | Expiring single-use approval; handoff; rollback drill on non-protected client. |
| P7 Fleet | Release manifests; allowlists; canary ≠ Sun Pool. |

---

## Systems of record (reminder)

| Concern | Authority |
|---|---|
| Fulfillment status / IDs / config versions | Supabase |
| Secret values | 1Password |
| Website template + client files | This Git repo |
| CRM contacts / opportunities / forms | GHL (external IDs only in Supabase) |
| Human checklist UI | ClickUp (mirror of Supabase) |
| Cloudflare resources | Cloudflare (IDs recorded in Supabase) |

---

## Migration status

Supabase SQL under `supabase/migrations/` is **COMPLETE BUT NOT APPLIED**.  
Do not apply to production from this sprint. Local/CI verification uses mocked contract tests in `tests/factory-contract/`.
