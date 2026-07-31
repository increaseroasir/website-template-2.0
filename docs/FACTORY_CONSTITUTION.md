# HTL Factory Constitution

Locked architectural decisions for the website factory. Change only via integrator + owner approval.

## Canonical factory repository

- Local path name: `website-template-premium-redesign`
- GitHub remote: `increaseroasir/website-template-2.0`

Do not use:

- Local `website-template-2.0` (legacy `ssaofficial` repository)
- Paradise Spas repository
- `increase-roas-os` (governance only — may reference this factory)
- agent-ops (separate tooling)

If `git remote get-url origin` does not contain `increaseroasir/website-template-2.0`, stop and report **WRONG REPOSITORY**.

## Core decisions

| Decision | Rule |
|---|---|
| Repo model | One monorepo. No per-client forks. |
| Client layout | `clients/<slug>/` holds config, tokens refs, overrides, assets. |
| Build | Hydrate template → immutable client `dist/` (gitignored). |
| Hosting | One Cloudflare Pages project per dealer. |
| Make | Builds empty infrastructure (“garage”). Never generates website code, mutates template files, holds secrets, or marks a site live. |
| Template | Builds the website (“car”) via hydration and gates. |
| Fulfillment state | Supabase is authoritative. GHL/ClickUp may request or mirror; they do not overwrite freely. |
| Secrets | 1Password is authoritative. Install only via `wrangler pages secret put` + verify. Never Cloudflare `deployment_configs` PATCH (WTV-049). |
| Tracking / wiring | `wiring.json` may hold secret **refs** (e.g. `op://...`). Never secret values. |
| Skills SoT | `manus-skills/` only. Legacy `skills/` is not authoritative. |
| Fleet selection | Allowlist from Supabase/release manifest. Never discover clients via `clients/*` filesystem glob. |
| Canary | Must be non-protected. **Never Sun Pool.** |
| Production | Human approval bound to an immutable deployment candidate (versions + artifact digest). |

## Systems of record

| Concern | Authority |
|---|---|
| Fulfillment status / IDs / config versions | Supabase |
| Secret values | 1Password |
| Website template + client files | This Git repo |
| CRM contacts / opportunities / forms | GHL (external IDs only in Supabase) |
| Human checklist UI | ClickUp (mirror of Supabase) |
| Cloudflare resources | Cloudflare (IDs recorded in Supabase) |

## Roles (summary)

| Role | May |
|---|---|
| Owner | Approve P0.5, production, break-glass |
| CSM | Intake review, deferrals, checklist |
| Tech operator | Provision, hydrate, staging, secrets install |
| Make service | Requested transitions + infra create-if-missing |
| AI build agent | Assigned paths only; no prod; no Sun Pool without break-glass |
| Approver | Bind approval to candidate |
| Break-glass admin | Time-limited protected-client mutation |

## Enforcement hierarchy

```text
AGENTS.md                 = policy
.cursor/rules/*.mdc       = contextual instructions
.cursor/hooks.json        = executable local/cloud block
CI                        = independent final enforcement
config/protected-clients.json + scripts/lib/client-protection.mjs
```

## Baseline identity (sprint start)

| Field | Value |
|---|---|
| Clean baseline branch | `premium-redesign` |
| Baseline tag | `htl-factory-pre-hardening-2026-07-30` |
| Integration branch | `factory/p0-safety-lock` |
| `required_base_sha` | See `docs/EXECUTION_STATE.md` |
| Sun Pool tree OID | See `docs/EXECUTION_STATE.md` |

## Non-goals for the control-plane sprint

Live Make scenarios, Cloudflare provisioning side effects, GHL sub-account automation, verified staging, production deploy, fleet upgrades, RAG/vector memory.
