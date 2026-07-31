# Canonical Contract (draft — freeze before Make)

Machine-readable companions (to be filled/validated by Agent B):

- `config/identity-fields.json`
- `config/state-machine.json`
- `config/factory-contract.schema.json`

CI must reject forbidden aliases (e.g. `ghlLocationId`, `location_id`, `GHL_LOCATION` when canon is `ghl_location_id`).

Contract version: `0.1.0-draft`  
`onboarding_schema_version`: `1.0.0-draft`

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

## Forms (versioned)

Every payload carries `schema_version` and a raw `submission_id`.

| Form | Purpose |
|---|---|
| Form 1 | Intake — creates/links `client_id` + `onboarding_case_id`; stores external GHL IDs; appends raw submission |
| Form 2 | Enrichment merge onto same case |
| Form 3 | Enrichment merge onto same case |

**Merge / duplicates**

- Duplicate Form 1 → one logical onboarding case (idempotent).
- Form 2 / Form 3 may arrive out of order.
- Repeated Form 2 / Form 3 must not overwrite newer config (optimistic concurrency).
- Field ownership and merge precedence: to be enumerated in `config/identity-fields.json` (Agent B).

## Deferrals

A null field is not a deferral. An approved deferral requires:

- field name
- reason
- approved by
- timestamp
- expiration
- launch consequence
- whether production is still allowed
- whether the field is required before launch

## State machine (requested transitions)

GHL and ClickUp may **request** or **mirror** state.  
**Supabase validates and commits** via controlled RPC only.

Illustrative RPC:

```text
request_client_transition(
  client_id | onboarding_case_id,
  expected_current_status,
  requested_status,
  actor,
  correlation_id,
  reason
)
```

Ban free-form `UPDATE ... SET status`.  
Repeated identical transition requests are idempotent.  
Invalid transitions are rejected.  
Stale writes (wrong expected version) are rejected.

Exact allowed/forbidden transitions live in `config/state-machine.json` (Agent B).

## Optimistic concurrency

Config and status writes require `expected_version`. Mismatch → reject + reconcile.

## Idempotency

Every side-effecting job carries an idempotency key (Form submission, provision step, hydrate, deploy).  
Duplicates return the original result; they do not double-create.

## Correlation IDs

Chain: `submission` → `onboarding_case` → `client` → `approval` → `provisioning_job` → `resources` → `hydration` → `staging_deploy` → `qa_approval` → `production_deploy`.

## Environments

| Env | Use |
|---|---|
| development | Local / agent sandbox |
| test | Synthetic fixtures; no prod credentials |
| staging | Client staging deploy; noindex; safe test leads |
| production | Approval-gated only |

Cloud agents: **zero** production credentials for P0 / P0.5.

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
  "environment": "staging|production"
}
```

Any post-approval change to these (or domain / tracking / secrets) invalidates approval.  
Approvals expire, are single-use on success, and rollback needs distinct authorization.

## Secrets

- Values: 1Password only.
- Install: `wrangler pages secret put` + `secrets:verify` only.
- Forbidden: `deployment_configs` PATCH; secrets in Git / Supabase / Make / logs / docs / `wiring.json` values.

## Later-phase contracts (specify now; side effects gated)

| Phase | Must define in work packages |
|---|---|
| P3 Provision | Per-resource lifecycle: `not_requested` → `requested` → `creating` → `created` → `verified` / `failed` / `orphaned` / `externally_missing`. Resources: pages, D1, R2, GHL location, lead sheet. |
| P4 Hydrate | Temp workspace → validate → atomic swap; overrides never overwritten; determinism tested; `wiring.json` machine SoT. |
| P5 Staging | Deployment job record; cross-client leakage suite; safe test-lead; noindex. |
| P6 Prod | Expiring single-use approval; handoff; rollback drill on non-protected client. |
| P7 Fleet | Release manifests; allowlists; canary ≠ Sun Pool. |

## Approval readiness

Approval blocked unless required fields exist **or** are covered by unexpired deferrals that explicitly allow the target environment.
