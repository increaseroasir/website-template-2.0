# Current execution state

Integrator-only file. Agents report via `artifacts/agent-runs/`.

## Repository

| Field | Value |
|---|---|
| Canonical local path | `website-template-premium-redesign` |
| Canonical remote | `increaseroasir/website-template-2.0` |
| Clean baseline branch | `premium-redesign` |
| Baseline tag | `htl-factory-pre-hardening-2026-07-30` |
| Integration branch | `factory/p0-safety-lock` |
| `required_base_sha` | `42ba6eda625afbcea9e0f10da070d3c309e763ad` |
| Sun Pool tree OID | `f3da831b2c31d37693f6022340b2d2f936bb4f72` |
| Production operations allowed | no |
| Sun Pool operations allowed | no |

## Active phase

| Field | Value |
|---|---|
| Active phase | P0 — Architecture and Safety Lock |
| Canonical contract version | `0.1.0-draft` |
| Next gate | P0 complete when protection library, hooks, CI rejection tests, and brain are merged; then P0.5 freeze |

## Active work

| Stream | Status |
|---|---|
| Five-file brain | COMPLETE at `26b78b4` |
| Agent A Safety | not started |
| Agent B Contract + Supabase | not started |
| Agent C Impl map | not started |
| Agent D Review-fix | waits for first PR |

## Blocking decisions

- None (repo identity trap resolved)

## Usage governance

| Field | Value |
|---|---|
| Sprint budget | _(owner sets in Cursor dashboard)_ |
| Used at last check | NOT VERIFIED |
| Last checked | 2026-07-30 |
| Primary agents active | 0 |
| Subagents active | 0 |
| Escalated-model reviews used | 0 |
| Budget status | GREEN (limits must be set before fleet launch) |

## Cloud environment

| Field | Value |
|---|---|
| Install script | `npm ci` |
| Start script | blank |
| Snapshot | owner builds after Install Script save |

## R0 notes

- Repo identity PASS
- Package manager: npm + `package-lock.json`
- `brand:guard` PASS
- No lint/test/typecheck scripts yet (Agent A/B gap)
- Risky scripts must not run in cloud setup: `deploy`, `preview:deploy`, `db:init:*`, `ghl:fields:*`, `secrets:verify`
