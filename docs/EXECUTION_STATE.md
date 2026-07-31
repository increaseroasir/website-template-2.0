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
| Integration tip | `dd1ab2d` (merge of PR #6) |
| `required_base_sha` | `309ac92d226b14cafd0bee6130606c3fcf1b5195` (post-brain tip; must be ancestor of agent PRs) |
| Baseline tag SHA | `42ba6eda625afbcea9e0f10da070d3c309e763ad` |
| Sun Pool tree OID | `f3da831b2c31d37693f6022340b2d2f936bb4f72` |
| Production operations allowed | no |
| Sun Pool operations allowed | no |

## Phase Status

- R0 Cursor readiness: COMPLETE AND VERIFIED
- P0 safety and control plane: COMPLETE AND VERIFIED
- P0.5 canonical contract freeze: COMPLETE AND VERIFIED
- P1 Supabase migrations/RPC: COMPLETE BUT NOT APPLIED
- P2 Make intake: NOT STARTED / NOT AUTHORIZED
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
- Sun Pool tree OID: f3da831b2c31d37693f6022340b2d2f936bb4f72
- Sun Pool mutation authorized: no

## Active Gate

No Make implementation and no migration application are authorized.

Next owner decisions:

1. Approve a dedicated HTL factory development/test Supabase project.
2. Separately authorize applying the migrations to that project.
3. Verify the applied schema and RPC behavior.
4. Only then decide whether to authorize Make intake implementation.

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
