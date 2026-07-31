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
| Integration tip | `9b51c64` (pre-onboarding tip; onboarding design freeze is on `factory/p2-onboarding-forms-and-workflows`) |
| Make lane branch | `factory/p2-make-intake` (inactive Form 1 objects legalized 2026-07-31) |
| `required_base_sha` | `309ac92d226b14cafd0bee6130606c3fcf1b5195` (post-brain tip; must be ancestor of agent PRs) |
| Baseline tag SHA | `42ba6eda625afbcea9e0f10da070d3c309e763ad` |
| Sun Pool tree OID | `f3da831b2c31d37693f6022340b2d2f936bb4f72` |
| Production operations allowed | no |
| Sun Pool operations allowed | no |

## Phase Status

- R0 Cursor readiness: COMPLETE AND VERIFIED
- P0 safety and control plane: COMPLETE AND VERIFIED
- P0.5 canonical contract freeze: COMPLETE AND VERIFIED
- P1 Supabase target registration: COMPLETE AND VERIFIED
- P1 Supabase migrations/RPC: COMPLETE AND VERIFIED
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

- Contract version: 0.1.1
- Onboarding schema version: 1.0.0
- P0.5 base SHA: a6ad5cd
- P0.5 commit: 5040fa9
- Supabase target registration commit: df5708b
- Registered Supabase project name: htl-factory-dev
- Registered Supabase project ref: epeddfdifckzzmskhdsz
- Registered Supabase environment: dev_test
- Migration apply authorized (config gate): no — further apply requires new owner authorization
- Migration apply completed: yes (dev_test `epeddfdifckzzmskhdsz` only; 2026-07-31)
- Production migration apply authorized: no
- Migration apply evidence: `artifacts/agent-runs/integrator/20260731T081500Z-dev-test-migration-apply.md`
- Sun Pool tree OID: f3da831b2c31d37693f6022340b2d2f936bb4f72
- Sun Pool mutation authorized: no

## Active Gate

P2 Make Form 1 **dev/test objects are legalized as documentation baseline only**.

**Still unauthorized without a new owner decision:**

- activate scenario `4852018`
- run webhook / send payloads / process submissions
- GHL form wiring
- Forms 2 / 3 Make scenarios
- publish contract `0.2.0` / onboarding schema `1.1.0`
- apply further migrations
- P3+ provisioning / production

Registered target identity remains locked to `htl-factory-dev` / `epeddfdifckzzmskhdsz` only.
No agent may infer or substitute another project.
Production migration apply remains unauthorized.

Evidence:

- Make lane reconciliation: `artifacts/agent-runs/integrator/20260731T175936Z-make-lane-reconciliation.md`
- Legalization commit evidence: `artifacts/agent-runs/integrator/20260731T182400Z-make-lane-legalize.md`

Next owner decision:

1. Publish contract `0.2.0` / onboarding schema `1.1.0` (onboarding design freeze branch), then authorize fake-data Form 1 E2E under a free Make active slot — **not** activation in this gate alone.

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
