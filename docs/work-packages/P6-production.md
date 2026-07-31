# P6 — Approval-gated production

**Phase:** P6  
**Goal:** Bind human approval to an immutable deployment candidate; single-use expiring approval; production deploy; handoff; rollback drill on **non-protected** client.  
**Side effects:** Spec only. Production credentials never issued to P0 cloud agents.

## Dependencies

- P5 staging_live with evidence pack
- `approvals` table + RPC (Agent B schema)
- SECRETS_RUNBOOK followed for prod secrets
- Owner authorization for production operations

## Inputs

| Input | Required |
|---|---|
| Full deployment candidate JSON | Yes (client_id, onboarding_case_id, configuration_version, onboarding_schema_version, template_version, git_sha, hydrator_version, gate_version, deployment_workflow_version, artifact_digest, environment=`production`) |
| Approval artifact (actor, scope, expiration, candidate digest bind) | Yes |
| Idempotency `deploy:{client_id}:{config_version}:{template_sha}:production` | Yes |
| Deferrals for any missing required fields | Yes if gaps |

Any post-approval change to candidate fields, domain, tracking, or secrets **invalidates** approval.

## Outputs

| Output | Destination |
|---|---|
| Production deployment ID + URL | Supabase `deployment_versions` |
| Status `live` | Supabase only after successful deploy + verify |
| Handoff | GHL URL fields + ClickUp close (mirrors) |
| Rollback record | Prior artifact redeploy authorization |

## States

`staging_live` → `awaiting_prod_approval` → `prod_deploying` → `live` / `prod_failed`  
Rollback: distinct authorization → `rolling_back` → `live` (prior version) / `rollback_failed`

## Idempotency

- Approval: single-use on success; expired/consumed approvals rejected
- Deploy key: duplicates return original successful deploy job

## Tests

- Missing approval → deploy refused
- Expired approval → refused
- Digests mismatch → refused
- Consumed approval reuse → refused
- Rollback drill on non-protected test client restores prior digest
- `sun-pool-spa` production path requires break-glass + owner scope
- `secrets:verify` on exact production host before handoff claims
- Gate MANUAL rows treated as blockers if policy says so

## Files likely to change

- `.github/workflows/production-deploy.yml`
- Supabase `approvals`, `deployment_versions`, status RPC
- `manus-skills/dealer-site-launch/references/launch-checklist.md`
- Handoff templates under manus-skills
- **Not** Make as production initiator

## Credentials required

| Cred | Env |
|---|---|
| Cloudflare production deploy | Named client project only, human-approved run |
| Approval signing / CI OIDC | Per security design |
| 1Password access | Human operator for any secret repair |
| Cloud agent production creds | **Never for P0; P6 only under explicit unlock** |

## Explicit non-goals

- Autonomous agent production without approval row
- Fleet-wide prod pushes (P7)
- Fork-based delivery
