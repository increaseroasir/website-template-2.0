# Current Execution State

Integrator-only file. Agents report via `artifacts/agent-runs/`.

## Repository

| Field | Value |
|---|---|
| Canonical local path | `website-template-premium-redesign` |
| Canonical remote | `increaseroasir/website-template-2.0` |
| Clean baseline branch | `premium-redesign` |
| Baseline tag | `htl-factory-pre-hardening-2026-07-30` |
| Integration branch | `factory/p0-safety-lock` |
| Pre-publish integration branch | `factory/p2-integration-reconcile` |
| Integration tip (p0-safety-lock) | `9b51c64` |
| Onboarding lane | `factory/p2-onboarding-forms-and-workflows` @ `9ba627d` |
| Make lane | `factory/p2-make-intake` @ `cb4cc58` |
| `required_base_sha` | `309ac92d226b14cafd0bee6130606c3fcf1b5195` |
| Baseline tag SHA | `42ba6eda625afbcea9e0f10da070d3c309e763ad` |
| Sun Pool tree OID | `f3da831b2c31d37693f6022340b2d2f936bb4f72` |
| Production operations allowed | no |
| Sun Pool operations allowed | no |

## Phase Status

- R0 Cursor readiness: COMPLETE AND VERIFIED
- P0 safety and control plane: COMPLETE AND VERIFIED
- P0.5 canonical contract freeze: COMPLETE AND VERIFIED
- P1 Supabase target registration: COMPLETE AND VERIFIED
- P1 Supabase migrations/RPC: COMPLETE AND VERIFIED (dev_test `epeddfdifckzzmskhdsz`)
- P2 onboarding design: **Hybrid A+C PUBLISHED IN GIT**
  - Contract `0.2.0` / onboarding schema `1.1.0` live in Git config
  - Six `*_reported_*` website/domain fields published (form1-owned)
  - Child-table migration **files landed**; **NOT APPLIED** to Supabase
- P2 Make intake: **INACTIVE DEV OBJECTS EXIST — NOT COMPLETE**
  - Form 1 scenario `4852018` inactive; webhook `2785703`; connection `4834536`
  - No scenario executions; activation not authorized; E2E incomplete
  - Forms 2 and 3 not built; GHL wiring not authorized
- P3 provisioning: NOT STARTED
- P4 hydration: NOT STARTED
- P5 staging: NOT STARTED
- P6 production: NOT STARTED
- P7 fleet: NOT STARTED

## Current Contract

- Contract version (live in Git): **0.2.0**
- Onboarding schema version (live in Git): **1.1.0**
- Registered Supabase project: htl-factory-dev / `epeddfdifckzzmskhdsz` / dev_test
- Migration apply authorized (config gate): **no**
- P1 migration apply completed: yes (core tables + RPC only; 2026-07-31)
- Child-table migrations landed in Git: yes (`20260731184500`, `20260731184600`) — **NOT APPLIED**
- Production migration apply authorized: no
- Sun Pool mutation authorized: no

## Active Gate

**Published in Git ≠ applied in Supabase.**

Landed child migrations (Git only):

- `supabase/migrations/20260731184500_create_onboarding_employees.sql`
- `supabase/migrations/20260731184600_create_inventory_submissions.sql`

Timestamps sort after verified remote max `20260731081314`. RLS ENABLE present; zero policies; no anon grants.

**Still unauthorized / incomplete:**

- apply child-table migrations to `htl-factory-dev`
- activate scenario `4852018` / webhook E2E
- GHL form wiring; Forms 2/3; ClickUp live create
- P3+ provisioning / production
- merge of this branch into `factory/p0-safety-lock`

Next owner decision:

1. Authorize applying the two child-table migrations to `htl-factory-dev` only, followed by read-only verification and smoke testing.

## Usage governance

| Field | Value |
|---|---|
| Sprint budget | _(owner sets in Cursor dashboard)_ |
| Used at last check | NOT VERIFIED |
| Last checked | 2026-07-31 |
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
