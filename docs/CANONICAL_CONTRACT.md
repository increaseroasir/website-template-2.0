# Canonical Contract

**Status:** P0.5 **COMPLETE AND VERIFIED** (owner approved with required changes incorporated).  
**Make scenarios:** NOT AUTHORIZED  
**Migration apply:** COMPLETE BUT NOT APPLIED (no inferred target)  
**Contract version:** `0.1.1`  
**Onboarding schema version:** `1.0.0`

Machine-readable companions (authoritative for field names, transitions, and validation):

| File | Role |
|---|---|
| `config/identity-fields.json` | Identity, per-field ownership/classification, merge + slug-lock rules |
| `config/state-machine.json` | Allowed / forbidden transitions + actors |
| `config/production-approval.json` | Approval TTL, states, retry limits, candidate binding |
| `config/sync-policy.json` | Supabase authority + ClickUp mirror lag policy |
| `config/supabase-targets.json` | Migration apply authorization (fail closed) |
| `config/factory-contract.schema.json` | JSON Schema for contract artifacts + deployment candidate |
| `config/forbidden-aliases.json` | Rejected alternate spellings / casings |
| `config/protected-clients.json` | Sun Pool denylist; null UUID is additional protection |

CI and agents MUST reject forbidden aliases (e.g. `ghlLocationId`, `location_id`, `GHL_LOCATION` when canon is `ghl_location_id`).

---

## Locked owner decisions (P0.5)

1. **Migration target** — Do not apply to production. No agent may guess a project. Until owner names a dedicated HTL factory development/test Supabase project, migrations remain **COMPLETE BUT NOT APPLIED** (`config/supabase-targets.json`).
2. **Production approval TTL** — Default **24 hours**. Binds to one exact deployment candidate + `artifact_digest` + one environment. Attempt does not consume; success consumes; max **2** failed retries; rollback needs separate authorization (`config/production-approval.json` + `scripts/lib/factory-contract/production-approval.mjs`).
3. **Client slug** — System-owned after reservation; proposed from business name; human-editable until explicit `slug_locked` when first managed resource reaches `created`. Never unlocks on failure/rollback/status change. Business-name changes do not rename.
4. **Sun Pool** — Do not invent a UUID. Protect by slug `sun-pool-spa`. Missing UUID increases protection. Fail closed without break-glass.
5. **ClickUp lag** — Supabase authoritative. 5 min → delayed; 15 min → `sync_failure` + alert. Never roll back Supabase because ClickUp failed. No stale mirror replay.
6. **Field precedence** — `form3 > form2 > form1` only inside each field’s ownership contract (`field_policies`). Null does not clear. Explicit clear is versioned. Human overrides outrank forms and still require `expected_version`.
7. **Form 3 secrets** — May collect secret **references**, access status, account IDs, authorization metadata. Must not store passwords, API keys, private tokens, recovery codes, or raw credentials. Classifications: `public_configuration` | `sensitive_identifier` | `secret_reference` | `credential`. Client-scoped identifiers must not leak cross-client.
8. **Transition authority** — Only `request_client_transition`. Make/GHL/ClickUp/AI may request; they may not bypass expected status, actor auth, validity, idempotency, or audit.

---

## Must-include checklist (P0 / P0.5)

Every work package that touches fulfillment MUST satisfy this checklist. Missing any item is a stop-the-line defect.

### Identity (locked — do not reopen)

- [x] `client_id` — dealer / customer **organization** UUID; immutable after create
- [x] `onboarding_case_id` — one onboarding **engagement** UUID; immutable after create
- [x] `ghl_contact_id` — external **person** / contact; never the company primary key
- [x] `ghl_opportunity_id` — external sales / onboarding workflow; unique when set
- [x] `ghl_location_id` — provisioned GHL sub-account; nullable until provision
- [x] `client_slug` — reserved human-readable slug; locked via explicit `slug_locked` event
- [x] `deployment_key` — machine deploy identifier; immutable
- [x] `business_name` — display name; editable (does not auto-rename slug)
- [x] `domain` — public domain; editable; audited

### Forms and merge

- [x] Every payload carries `schema_version` and raw `submission_id`
- [x] Form 1 creates/links `client_id` + `onboarding_case_id`; stores external GHL IDs; appends raw submission
- [x] Form 2 / Form 3 enrich the **same** `onboarding_case_id`
- [x] Duplicate Form 1 is idempotent (one logical case)
- [x] Form 2 / Form 3 may arrive out of order
- [x] Repeated Form 2 / Form 3 must not overwrite newer config (`expected_version` / optimistic concurrency)
- [x] Per-field ownership, writers, clearing, classification, storage, and precedence in `field_policies`
- [x] Forms never clear; only `clearConfigField` with actor/reason/timestamp/`expected_version`

### Deferrals

- [x] A null field is **not** a deferral
- [x] Approved deferral requires: field name, reason, approved by, timestamp, expiration, launch consequence, whether production is still allowed, whether required before launch
- [x] Expired deferrals do not satisfy approval readiness

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
- [x] Any post-approval change to bound fields invalidates approval
- [x] Approvals expire (24h default), are single-use on success; rollback needs distinct authorization
- [x] Max two failed production retries under one active unexpired approval

### Secrets and approval readiness

- [x] Secret **values**: 1Password only
- [x] Install: `wrangler pages secret put` + `secrets:verify` only
- [x] Forbidden: `deployment_configs` PATCH; secrets in Git / Supabase / Make / logs / docs / `wiring.json` values
- [x] Tracking IDs (GA4 / Meta Pixel) are `sensitive_identifier` / public configuration — client-scoped, not automatically vault secrets
- [x] Approval blocked unless required fields exist **or** are covered by unexpired deferrals that explicitly allow the target environment

### Supabase control plane

- [x] Tables for clients, onboarding cases, intake submissions, config versions, idempotency, status history, deferrals, sync failures, approval readiness, production approvals, workflow events
- [x] Controlled transition RPC; no free-form status updates; production path validates dedicated approval module
- [x] Migrations authored; **not** applied (`COMPLETE BUT NOT APPLIED`)

---

## Identity model

| Identifier | Role | Immutable? |
|---|---|---|
| `client_id` | Dealer / customer **organization** (UUID) | Yes after create |
| `onboarding_case_id` | One onboarding **engagement** (UUID) | Yes after create |
| `ghl_contact_id` | External person / contact | External; not the company key |
| `ghl_opportunity_id` | External sales / onboarding workflow | Unique when set |
| `ghl_location_id` | Provisioned GHL sub-account | Nullable until provision |
| `client_slug` | Human-readable slug | Locked by explicit `slug_locked` event |
| `deployment_key` | Machine deploy identifier | Immutable |
| `business_name` | Display name | Editable |
| `domain` | Public domain | Editable; audited |

**Rules**

- Contact ≠ company. One contact may own multiple dealers / cases.
- Do not upsert by email, phone, or business name as primary key.
- Match onboarding work to `onboarding_case_id`, linked to `client_id` + external GHL IDs.
- Cloudflare / D1 / R2 / deploy jobs reference `client_id` and/or `deployment_key`, not business name alone.
- Protected client `sun-pool-spa` is never mutated without a valid break-glass artifact (see `config/protected-clients.json`).

### Slug lock event

```json
{
  "slug_locked": true,
  "slug_locked_at": "2026-07-30T22:00:00Z",
  "slug_locked_by_resource_id": "resource_uuid",
  "slug_locked_reason": "first_managed_resource_created"
}
```

Once `slug_locked` is true, status transitions never unlock it.

---

## Forms (versioned)

Every payload carries `schema_version` and a raw `submission_id`. Payload shapes unchanged → `onboarding_schema_version` remains `1.0.0`.

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
- Per-field ownership: `config/identity-fields.json` → `field_policies`.

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

Stored in `deferrals`. Expired deferrals do not satisfy approval readiness.

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

Production approval creation/expiration/consumption/rollback live in `scripts/lib/factory-contract/production-approval.mjs`. The transition RPC validates (and on live success consumes) but does not own approval lifecycle.

Exact allowed / forbidden transitions: `config/state-machine.json`.

---

## Optimistic concurrency

| Resource | Version column | Write rule |
|---|---|---|
| Onboarding case status / case row | `onboarding_cases.version` | RPC / merge requires `expected_version` |
| Normalized config | `config_versions.config_version` | Append-only new version; merge/clear/override check `expected_version` |
| Domain edits | audited via `workflow_events` | Prior value retained in event payload |

Mismatch → reject (`concurrency_conflict`) + reconcile from authoritative Supabase row. Never last-write-wins across forms.

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

## Secrets

- Values: 1Password only.
- Install: `wrangler pages secret put` + `secrets:verify` only.
- Forbidden: `deployment_configs` PATCH; secrets in Git / Supabase / Make / logs / docs / `wiring.json` values.
- Supabase may store secret **refs** (`op://…`) and verification timestamps only — never plaintext secret values.
- GA4 / Meta Pixel IDs are client-scoped identifiers, not automatically vault secrets.

---

## Systems of record

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
Do not apply to any environment until the owner names a dedicated development/test project in `config/supabase-targets.json`.  
Local/CI verification uses mocked contract tests in `tests/factory-contract/`.
