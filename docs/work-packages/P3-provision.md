# P3 — Infrastructure provision (Make garage)

**Phase:** P3  
**Goal:** Create-if-missing Cloudflare Pages + D1 + R2 + GHL location + Lead Vault sheet; write resource IDs to Supabase. **No GitHub forks. No site code generation. No secret values in Make.**  
**Side effects:** Spec only until owner unlocks after P0.5 + P2.

## Dependencies

- P2 intake identity path live on test client
- Frozen state machine includes provision transitions
- SECRETS_RUNBOOK accepted (no `deployment_configs` PATCH)

## Inputs

| Input | Required |
|---|---|
| `client_id`, `onboarding_case_id` | Yes |
| `client_slug`, `deployment_key` | Yes |
| Approval / ready-for-provision signal | Yes |
| Idempotency key `provision:{client_id}:{approval_id}` | Yes |
| Actor, correlation_id | Yes |

## Outputs

| Resource | Supabase record fields (IDs only) |
|---|---|
| Cloudflare Pages project | `pages_project_name`, `pages_project_id` |
| D1 | `d1_database_id`, binding name `DB` |
| R2 | `r2_bucket_name`, binding `PRODUCT_IMAGES` |
| GHL location | `ghl_location_id` |
| Lead sheet | `google_sheets_id` (non-secret) |
| Job row | `provisioning_jobs` status + timestamps |

## Per-resource lifecycle

`not_requested` → `requested` → `creating` → `created` → `verified`  
Failure paths: `failed` | `orphaned` | `externally_missing`

Reconcile job compares Cloudflare/GHL vs Supabase and repairs IDs without double-create.

## Idempotency

| Key | Behavior |
|---|---|
| `provision:{client_id}:{approval_id}` | Second run returns original job result |
| `cf:pages:{client_slug}` | Unique Pages project per slug |
| `cf:d1:{client_id}` / `cf:r2:{client_id}` | One each |
| `ghl:location:{client_id}` | One location |
| `sheets:vault:{client_id}` | One sheet |

## States

Supabase: `enrichment_complete` / `approved` → `provisioning` → `infrastructure_ready` (or `provision_failed`)

Make must not set `live`.

## Tests

- Double provision with same idempotency key → single Pages project
- Timeout after CF create before SB write → reconcile restores ID
- Protected slug `sun-pool-spa` rejected without break-glass
- Assert zero calls to GitHub “create repo/fork” APIs
- Assert zero `deployment_configs` PATCH
- Unit: resource unique constraint `(client_id, resource_type)`

## Files likely to change

- `docs/` Make scenario specs (garage only)
- Supabase migrations: `provisioning_jobs`, `infrastructure_resources`
- `manus-skills/dealer-site-wiring/references/provisioning-checklist.md` (align wording)
- `config/protected-clients.json` consumers in provision CLI guards
- **Not:** shared HTML/CSS; **not** `clients/sun-pool-spa`

## Credentials required

| Cred | Env |
|---|---|
| Cloudflare API token (Pages/D1/R2 create) | **test account / test projects only** |
| GHL agency token (sub-account create) | test |
| Google service account (sheet create) | test vault |
| Supabase service role | test |
| 1Password | optional for later secret *refs* checklist — values not via Make |
| Production CF / GHL | **Forbidden** until P6 authorization |

## Explicit non-goals

- Forking or cloning template into a new GitHub repo
- Hydrate / `build-config` / deploy
- Writing secret values into Cloudflare (human/`secret put` path in wiring phase)
- Marking client `live`
