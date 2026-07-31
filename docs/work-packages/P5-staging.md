# P5 — Staging deploy + isolation suite

**Phase:** P5  
**Goal:** Record deployment job → deploy **one** allowlisted client to Cloudflare Pages **preview/staging** → noindex → safe test-lead → prove no cross-client leakage.  
**Side effects:** Spec only until unlocked; then **non-production** targets only.

## Dependencies

- P4 `hydrate-client.mjs` + gate PASS
- P3 resource IDs in Supabase for target client
- Secrets installed via SECRETS_RUNBOOK (`secret put` + `secrets:verify`) by tech operator — not by Make
- CI workflows exist for gate/brand (Agent A)

## Inputs

| Input | Required |
|---|---|
| `client_id`, `client_slug` | Yes |
| Allowlist membership | Yes |
| Hydrated `dist/` digest | Yes |
| Deployment candidate fields (staging) | Yes — see CANONICAL_CONTRACT |
| Idempotency `deploy:{client_id}:{config_version}:{template_sha}:staging` | Yes |
| Human/agent actor | Yes |

## Outputs

| Output | Destination |
|---|---|
| `deployment_jobs` row | Supabase |
| Cloudflare preview deployment ID + URL | Supabase + WIRING.md |
| `secrets:verify` exit 0 evidence | Artifact / WIRING |
| Safe test-lead response | Evidence (tagged test) |
| Staging `noindex` confirmation | Evidence |

## States

`hydrated` → `staging_deploying` → `staging_live` / `staging_failed`

## Idempotency

Duplicate deploy key returns original job; does not create divergent deployments without a new candidate digest.

## Tests

- Gate FAIL blocks deploy
- `sun-pool-spa` denied without break-glass
- Cross-client leakage suite: fingerprints from client A absent in client B dist; wrong D1/Sheets binding checklist
- Staging responses include noindex / robots disallow as specified
- Test lead does not pollute production CRM without test tag/filter
- `secrets:verify` against exact staging host required before PASS
- No production branch deploy from this package

## Files likely to change

- `.github/workflows/staging-deploy.yml` (create)
- `.github/workflows/cross-client-leak.yml` (create)
- `manus-skills/dealer-site-launch/**` (staging checklist)
- `scripts/` smoke helpers (read-only against staging URL)
- Supabase `deployment_jobs` / `deployment_versions`

## Credentials required

| Cred | Env |
|---|---|
| Cloudflare deploy token | Staging/preview project for **test** client |
| `ADMIN_PASSWORD` for `secrets:verify` | Staging host only |
| GHL test location | Safe test leads |
| Production deploy creds | **Forbidden** |

## Explicit non-goals

- Production deploy
- Fleet matrix
- `deployment_configs` PATCH
- Marking Supabase status `live`
