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
- P2 Make intake: **INACTIVE; E2E-03/04/08 PASS; E2E-09 FAIL; E2E-07 WAIVED**
  - Scenario `4852018` inactive; webhook `2785703`; connection `4834536`; `nextExec=null`; active count **26**
  - Module 9 = `builtin:BasicIfElse` (17 branches, first-match); Else → module 78 only; BasicMerge omitted (Decision B)
  - Prior CREATE/LINK/REPLAY/IDENTITY_CONFLICT remain PASS (see `20260801T194942Z-…`)
  - E2E-03 PASS (link by deployment_key; omit slug): exec `2cea3cc544a843de95648a85f9e548d2`; ops **12**; client `398326b7-…`
  - E2E-04 PASS (link by client_slug; omit key): exec `eab7f315c66546f9aa3d6a00a01d63ec`; ops **12**; client `2b786b27-…`
  - E2E-08 PASS (forbidden auto-link): peer `created` `546fb4f7-…` not linked to C `5571e098-…`; C case unchanged
  - E2E-09 FAIL: link with omitted reported wrote empty strings into new config (`6004e522-…`); prior create config retained values
  - E2E-07 **WAIVED** (UNIQUE slug/key; multi branches retained; length>1 static-only residual risk)
  - `config_versions` SELECT+INSERT remain; grants/RLS unchanged; `apply_authorized=false`
  - Make/Supabase Form 1 synthetic acceptance gate **NOT CLOSED**; GHL Form 1 still blocked
  - GHL / ClickUp / Forms 2/3 still unauthorized
- P2 overall: **NOT COMPLETE** (E2E-09 null-clear open; GHL unauthorized)
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

Child tables verified on `htl-factory-dev`. Make Core verified. Form 1 E2E-03/04/08 **PASS**; E2E-07 **WAIVED**; E2E-09 **FAIL** (null/omit clears reported into empty strings on new link config). Scenario inactive; capacity 26; residue 0. Make/Supabase Form 1 synthetic acceptance **not closed**. GHL Form 1 **blocked**. `apply_authorized=false`. P2 **not** complete.

Evidence: `artifacts/agent-runs/integrator/20260801T221625Z-form1-e2e-03-04-08-09-and-waiver.md`

Next owner decision:

1. Authorize a targeted inactive blueprint fix so link/create config writes preserve prior reported values when webhook fields are null/omitted, then re-run E2E-09 only. Do **not** start GHL until that returns GO.

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
