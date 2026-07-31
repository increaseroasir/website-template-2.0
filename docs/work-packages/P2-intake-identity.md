# P2 — Intake + identity write path

**Phase:** P2  
**Goal:** Accept Form 1/2/3 (and agent CSV) into Supabase with canonical identity fields; no Cloudflare provision; no hydrate; no deploy.  
**Side effects in this package:** Documentation + code against **test** Supabase only when owner unlocks. Spec itself is side-effect free.

## Dependencies

- P0 protection library + denylist (Agent A)
- P0.5 frozen `config/identity-fields.json`, `config/state-machine.json`, `config/factory-contract.schema.json` (Agent B)
- `docs/CANONICAL_CONTRACT.md` contract version ≥ freeze

## Inputs

| Input | Source | Required |
|---|---|---|
| `schema_version` | Form / mapper | Yes |
| `submission_id` | Form platform external id | Yes (idempotency) |
| Form 1 payload | GHL webhook or mapped CSV | Yes for new case |
| Form 2 / Form 3 payloads | GHL webhook | Optional; merge onto same case |
| Actor + correlation_id | Make / agent | Yes |

Canonical identity fields written (names locked — do not invent):

- `client_id`, `onboarding_case_id`
- `ghl_contact_id`, `ghl_opportunity_id`, `ghl_location_id` (nullable until provision)
- `client_slug`, `deployment_key`, `business_name`, `domain`

## Outputs

| Output | Destination |
|---|---|
| Raw row | `intake_submissions` (append-only) |
| Client + case | `clients`, onboarding case tables |
| Normalized config version | `client_configuration` (+ `config_version`) |
| Status | Supabase status = intake/enrichment states per state machine |
| Mirror request | ClickUp checklist create/update (non-authoritative) |
| Agent/local files (optional later) | `clients/<slug>/` scaffold via `new-client.mjs` — **not** in first Make path |

## Idempotency

| Key | Scope |
|---|---|
| `intake:{source}:{submission_id}` | Duplicate Form 1 → same `onboarding_case_id` |
| Merge Form 2/3 | Optimistic concurrency on `expected_version` / `config_version` |

Repeated identical submissions return the original result; never create a second `client_id` for the same opportunity.

## States (requested → Supabase commits)

Illustrative (exact enum in `config/state-machine.json`):

`not_started` → `intake_received` → `enrichment_partial` → `enrichment_complete` → (handoff to P3 when approved)

Invalid transitions rejected. GHL/ClickUp may **request**; Supabase RPC commits.

## Tests

- Unit: forbidden alias rejection (`ghlLocationId`, `ghlSubAccountId`, `location_id`, `GHL_LOCATION`)
- Unit: duplicate `submission_id` idempotent
- Unit: Form 2 out of order still merges; stale `expected_version` rejected
- Unit: null field ≠ approved deferral
- Integration (test project only): webhook signature fail closed
- Negative: no Cloudflare API calls from intake scenarios

## Files likely to change

- `config/identity-fields.json` (Agent B owned — consume)
- `manus-skills/dealer-site-intake/**` (mapper alignment to `ghl_location_id`)
- `docs/manus-fulfillment-skills.md` (already corrected: no fork)
- Future: `supabase/migrations/*` (Agent B)
- Future Make scenario specs under `docs/` (not live scenarios)

## Credentials required

| Cred | Env | P2 default |
|---|---|---|
| Supabase service role | **test** project | Required for integration tests only |
| GHL webhook signing secret | test location | Required for webhook tests |
| Cloudflare | — | **None** |
| 1Password / Pages secrets | — | **None** |
| Production | — | **Forbidden** |

## Explicit non-goals

- Creating Pages/D1/R2/GHL locations
- Hydrate / deploy
- Touching `clients/sun-pool-spa`
- Storing secret values anywhere
