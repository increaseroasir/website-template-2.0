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
- P2 Make intake: **INACTIVE CREATE-OR-LINK RESTORED; NATIVE FALLBACK ON ROUTER 3; CREATE SMOKE FAIL**
  - Make plan verified **Core**; capacity no longer blocks activation
  - Scenario `4852018` inactive; webhook `2785703`; connection `4834536`; `nextExec=null`
  - Privilege migration `20260801041000_grant_form1_service_role_privileges` applied (remote `20260801045303`); grants unchanged this pass
  - Restore safety gate PASS on `_tmp/form1-idempotency-AFTER-full.json` SHA-256 `058a4b701e1da912b5b71df948d08aae64bd1b09702ec96de07692adcbb24967`
  - Router 3: `length(2.body)` equal 0 / 1 / greater 1 + native `fallback:true` on module 78; create subtree restored (module 70 present)
  - CREATE smoke FAIL exec `146345b0dc8f4fa4a55929114bdabe51`: mapper `body_length=0` but not_replay `numeric:equal 0` unmatched → fallback; zero rows
  - Nested 5–8 literal `"[]"` filters unchanged / not reached; no second patch this run
  - `review_required` **NOT EXECUTABLE UNDER CURRENT CONSTRAINTS**; E2E-08/09 deferred
  - GHL wiring still unauthorized; ClickUp still unauthorized; Forms 2/3 not built
- P2 overall: **NOT COMPLETE** (empty-length Router filter match + GHL gates open)
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

Child tables verified on `htl-factory-dev`. Make Core verified. Form 1 create-or-link restored with native fallback Router 3. CREATE smoke failed: mapper reports `length(2.body)=0` but filtered `not_replay` did not match. GHL / ClickUp / P3 remain unauthorized. `apply_authorized=false`.

Next owner decision:

1. Authorize a blueprint-only follow-up on scenario `4852018` to make empty idempotency GET match `not_replay` under live module-2 filter evaluation (inspect exec `146345b0dc8f4fa4a55929114bdabe51`), then re-run CREATE smoke. Do not broaden `service_role` grants. Do not speculative-patch nested `"[]"` filters until length-0 routing works.

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
