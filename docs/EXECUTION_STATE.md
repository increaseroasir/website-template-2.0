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
| Onboarding lane | `factory/p2-onboarding-forms-and-workflows` @ `9ba627d` (Hybrid A+C design freeze) |
| Make lane | `factory/p2-make-intake` @ `cb4cc58` (inactive Form 1 legalized) |
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
- P2 onboarding design: **Hybrid A+C design freeze preserved — NOT PUBLISHED**
  - Live contract remains `0.1.1` / onboarding schema `1.0.0`
  - Proposed `0.2.0` / `1.1.0` and reported_* / child tables remain proposals only
- P2 Make intake: **INACTIVE DEV OBJECTS EXIST — NOT COMPLETE**
  - Form 1 scenario `4852018` (`HTL Factory Form 1 Intake (dev_test)`) exists and is **inactive**
  - Webhook `2785703` and Supabase connection `4834536` exist (project `epeddfdifckzzmskhdsz`)
  - Blueprint wired; **no scenario executions**; **no client data processed**
  - E2E verification **not complete**; **activation not authorized**
  - Forms 2 and 3 **not built**; GHL wiring **not authorized**
- P3 provisioning: NOT STARTED
- P4 hydration: NOT STARTED
- P5 staging: NOT STARTED
- P6 production: NOT STARTED
- P7 fleet: NOT STARTED

## Current Contract

- Contract version (live): 0.1.1
- Onboarding schema version (live): 1.0.0
- Proposed (not published): contract `0.2.0`, onboarding schema `1.1.0`
- Registered Supabase project: htl-factory-dev / `epeddfdifckzzmskhdsz` / dev_test
- Migration apply authorized (config gate): no — further apply requires new owner authorization
- Migration apply completed: yes (P1 core tables + RPC only; 2026-07-31)
- Production migration apply authorized: no
- Sun Pool mutation authorized: no

## Active Gate

`factory/p2-integration-reconcile` holds both verified lanes for review. **Not merged into `factory/p0-safety-lock` yet.**

**Still unauthorized / incomplete:**

- publish contract `0.2.0` / onboarding schema `1.1.0`
- copy/apply child-table migrations (`onboarding_employees`, `inventory_submissions`)
- activate scenario `4852018` / run webhook / process submissions
- GHL form wiring; Forms 2/3; ClickUp live create
- P3+ provisioning / production

Evidence:

- Onboarding design freeze: `factory/p2-onboarding-forms-and-workflows`
- Make legalization: `artifacts/agent-runs/integrator/20260731T182400Z-make-lane-legalize.md`
- Integration reconciliation: `artifacts/agent-runs/integrator/20260731T182946Z-p2-integration-reconciliation.md`

Next owner decision:

1. Publish contract `0.2.0` / onboarding schema `1.1.0` **from `factory/p2-integration-reconcile`**, copy approved child-table SQL into timestamped `supabase/migrations`, validate only, and **stop before dev apply**.

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
