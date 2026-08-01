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
- P2 Make intake: **INACTIVE; NESTED LENGTH FILTERS + MODULE 78 UNDER MODULE 9; CREATE HARD-STOP AT config_versions**
  - Scenario `4852018` inactive; webhook `2785703`; connection `4834536`; `nextExec=null`
  - Router 3: `length(2.body)` text 0/1 + numeric >1; **no native fallback**
  - Nested 5–8 / create_new: `length(N.body)` text `"0"` / `"1"` (32 conditions); module 78 = module 9 fallback only
  - CREATE smoke exec `c1788f7b19424dac8423c0c29e24e426`: ops **11**; create_new wrote client/case/intake; failed module **74** `config_versions` 403 (`cv_sel=false`); module 78 absent; residue cleaned
  - Grants unchanged; RLS unchanged; `apply_authorized=false`
  - `review_required` **NOT EXECUTABLE UNDER CURRENT CONSTRAINTS**; E2E-08/09 deferred
  - GHL / ClickUp / Forms 2/3 still unauthorized
- P2 overall: **NOT COMPLETE** (`config_versions` SELECT grant + GHL gates open)
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

Child tables verified on `htl-factory-dev`. Make Core verified. Form 1 nested identity empty/single-hit filters and module 78 exclusivity are live. CREATE smoke proved create_new writes then hard-stopped at module 74 `config_versions` (service_role INSERT without SELECT). GHL / ClickUp / P3 remain unauthorized. `apply_authorized=false`.

Next owner decision:

1. Authorize `GRANT SELECT ON public.config_versions TO service_role` on `htl-factory-dev` only, then re-run CREATE smoke on scenario `4852018`. Do not reopen nested filter blueprint work. Do not grant DELETE.

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
