# P7 — Fleet upgrades + allowlists

**Phase:** P7  
**Goal:** Release manifests, allowlisted multi-client upgrades, canary ≠ Sun Pool, drift detection. Scale controls after single-client path works.  
**Side effects:** Spec only. No unrestricted `clients/*` mutation.

## Dependencies

- P4–P6 path proven on ≥1 non-protected client
- Protection library + break-glass (Agent A)
- `template_releases` / `client_template_versions` tables

## Inputs

| Input | Required |
|---|---|
| Release manifest (template_version ↔ git_sha, hydrator/gate versions) | Yes |
| Allowlist of `client_id` / `client_slug` | Yes — from Supabase, never FS glob |
| Explicit denylist including `sun-pool-spa` | Yes (default) |
| Canary slug (must be non-protected) | Yes |
| Per-client idempotency `upgrade:{client_id}:{target_template_version}` | Yes |

## Outputs

| Output | Destination |
|---|---|
| Canary staging + QA evidence | Supabase + artifacts |
| Per-client upgrade job results | `client_template_versions` |
| Drift alerts | secrets presence / readiness vs Supabase flags |
| Skip report for denylisted clients | Artifact (prove Sun Pool untouched) |

## States (per client)

`live` + pin → `upgrade_scheduled` → `upgrade_staging` → `upgrade_awaiting_qa` → `upgrade_prod` → `live` (new pin)  
Failures leave previous pin active.

## Idempotency

Re-running same upgrade key does not double-deploy; returns prior job.

## Tests

- Manifest missing canary → refuse
- Canary == `sun-pool-spa` → refuse
- FS glob discovery path **absent** from upgrade CLI (static analysis / unit)
- Denylist skip emits evidence OID unchanged for `clients/sun-pool-spa`
- Partial matrix failure does not continue to prod for failed members
- Drift cron dry-run against test data only in CI

## Files likely to change

- `.github/workflows/client-upgrade.yml`
- `.github/workflows/drift-detect.yml`
- `.github/workflows/template-release.yml`
- `scripts/fleet-upgrade.mjs` (create; allowlist-driven)
- `config/` release manifest schema
- Supabase release tables
- Docs: fleet runbook under `docs/runbooks/`

## Credentials required

| Cred | Env |
|---|---|
| Cloudflare deploy | Per allowlisted project; staging first |
| Supabase | Read allowlist + write job rows |
| Production | Only after per-client P6-style approval or batch policy signed by owner |
| Break-glass | Required to include any protected client |

## Explicit non-goals

- Using `clients/*` directory listing as fleet source of truth
- Canarying or bulk-operating Sun Pool without break-glass
- Per-client GitHub forks
- RAG / vector memory systems

## Success evidence for a fleet run

1. Manifest SHA + version  
2. Allowlist + denylist snapshots  
3. Canary staging evidence  
4. Per-client job table  
5. `git rev-parse HEAD:clients/sun-pool-spa` unchanged unless break-glass scope included it  
6. No production credentials in cloud agent logs  
