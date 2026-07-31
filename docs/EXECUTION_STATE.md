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
| Active work branch | `factory/p2-integration-reconcile` |
| Integration tip (p0-safety-lock) | `9b51c64` |
| Publish tip before apply | `1cd2c73` |
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
- P2 onboarding design: **Hybrid A+C PUBLISHED IN GIT** (`0.2.0` / `1.1.0`)
- P2 child tables: **APPLIED AND VERIFIED on htl-factory-dev**
  - `onboarding_employees` applied (remote version `20260731193347`)
  - `inventory_submissions` applied (remote version `20260731193358`)
  - RLS enabled; zero policies; no SELECT/INSERT/UPDATE/DELETE for anon/authenticated
  - Synthetic smoke passed; synthetic data deleted
  - `apply_authorized` returned to **false**
- P2 Make intake: **INACTIVE CREATE-OR-LINK BLUEPRINT ALIGNED — E2E STILL BLOCKED BY CAPACITY**
  - Scenario `4852018` inactive; webhook `2785703`; connection `4834536`
  - Blueprint: contract `0.2.0` / schema `1.1.0` + company create-or-link
  - Match order: `client_id` → `deployment_key` → `client_slug` (never contact/email/phone/name/domain)
  - Fail closed: `identity_conflict` / `review_required` do not fall through to create
  - Outcomes: `created` / `linked` / `replayed` / `identity_conflict` / `review_required`
  - No GHL/ClickUp modules; no activation; no webhook executions; no synthetic DB rows
  - Synthetic Form 1 E2E **still blocked** on Make capacity (26 active)
  - GHL wiring still unauthorized; ClickUp still unauthorized; Forms 2/3 not built
- P2 overall: **NOT COMPLETE** (Make E2E + GHL gates open)
- P3 provisioning: NOT STARTED
- P4–P7: NOT STARTED

## Current Contract

- Contract version (live in Git): **0.2.0**
- Onboarding schema version (live in Git): **1.1.0**
- Registered Supabase project: htl-factory-dev / `epeddfdifckzzmskhdsz` / dev_test
- Migration apply authorized (config gate): **no**
- Child-table migrations applied to dev: **yes** (verified)
- Production migration apply authorized: no
- Sun Pool mutation authorized: no

## Active Gate

Child tables verified on `htl-factory-dev`. Form 1 create-or-link blueprint is statically aligned to contract `0.2.0` / schema `1.1.0` and remains inactive. Synthetic E2E blocked only on Make active-slot capacity. GHL / ClickUp / P3 remain unauthorized.

Next owner decision:

1. Increase Make capacity by one active scenario slot, then authorize synthetic create, link, replay, and conflict Form 1 E2E cases on scenario `4852018` (no real client data; no pausing live workflows).

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
