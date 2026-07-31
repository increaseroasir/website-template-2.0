# P0.5 Contract Freeze — Evidence Report

**Date:** 2026-07-30  
**Status:** P0.5 implementation complete locally; awaiting integrator commit/PR review if desired.

## Branch / SHAs

| Field | Value |
|---|---|
| Branch | `factory/p0-5-contract-freeze` |
| Base SHA | `a6ad5cd2ffdeeb87650053cbb8f20eaad2ce1541` (`factory/p0-safety-lock`) |
| Final committed SHA | `a6ad5cd2ffdeeb87650053cbb8f20eaad2ce1541` (changes are **uncommitted** on the branch working tree) |
| Base is ancestor of HEAD | yes |

## Contract version verification

| Artifact | `contract_version` | Notes |
|---|---|---|
| `config/identity-fields.json` | `0.1.1` | `onboarding_schema_version` remains `1.0.0` |
| `config/state-machine.json` | `0.1.1` | |
| `config/forbidden-aliases.json` | `0.1.1` | |
| `config/factory-contract.schema.json` | `0.1.1` | |
| `config/production-approval.json` | `0.1.1` | NEW — 24h TTL, max 2 failed retries |
| `config/sync-policy.json` | `0.1.1` | NEW — Supabase authoritative |
| `config/supabase-targets.json` | `0.1.1` | NEW — apply_authorized=false |

## Files changed

**Modified**

- `config/factory-contract.schema.json`
- `config/forbidden-aliases.json`
- `config/identity-fields.json`
- `config/protected-clients.json`
- `config/state-machine.json`
- `docs/CANONICAL_CONTRACT.md`
- `scripts/lib/client-protection.mjs`
- `scripts/lib/factory-contract/form-merge.mjs`
- `scripts/lib/factory-contract/index.mjs`
- `scripts/lib/factory-contract/load-contract.mjs`
- `scripts/lib/factory-contract/mock-store.mjs`
- `scripts/lib/factory-contract/request-client-transition.mjs`
- `tests/factory-contract/contract-config.test.mjs`
- `tests/factory-contract/transitions.test.mjs`

**Added**

- `config/production-approval.json`
- `config/supabase-targets.json`
- `config/sync-policy.json`
- `docs/P0_5_OWNER_SIGNOFF.md`
- `scripts/lib/factory-contract/clear-field.mjs`
- `scripts/lib/factory-contract/clickup-mirror.mjs`
- `scripts/lib/factory-contract/production-approval.mjs`
- `scripts/lib/factory-contract/slug-lock.mjs`
- `tests/factory-contract/owner-decisions.test.mjs`
- `artifacts/agent-runs/integrator/20260731T032600Z-p05-contract-freeze.md` (this report)

## Tests / checks

| Command | Result |
|---|---|
| `npm run brand:guard` | PASS |
| `npm run test:safety` | **31/31 PASS** |
| `npm run test:factory-contract` | **39/39 PASS** (was 24; +15 from owner-decision + companion coverage) |

## Sun Pool

| Check | Value |
|---|---|
| Tree OID before | `f3da831b2c31d37693f6022340b2d2f936bb4f72` |
| Tree OID after | `f3da831b2c31d37693f6022340b2d2f936bb4f72` |
| Mutation | UNTOUCHED / NOT AUTHORIZED |
| UUID invented | no (`client_id` remains null; fail closed) |

## External / production contact

- No Supabase apply
- No Make
- No Cloudflare / GHL / 1Password / production network calls
- Local mocks and unit tests only

## Gate statuses

| Gate | Status |
|---|---|
| P0.5 contract freeze | **COMPLETE AND VERIFIED** (local) |
| Migrations | **COMPLETE BUT NOT APPLIED** |
| Make | **NOT AUTHORIZED** |
| Sun Pool | **UNTOUCHED / NOT AUTHORIZED** |

## Assumptions

- Form payload shapes unchanged → `onboarding_schema_version` stays `1.0.0`.
- Production deploy consume happens on `production_deploying → live`; attempt is recorded on `awaiting_approval → production_deploying`.
- Max failed attempts = 2 under one approval.
- Integrator will commit/push and update `docs/EXECUTION_STATE.md` (agent-blocked by design).

## Unresolved risks

- Working tree not yet committed; evidence SHA equals base until integrator commits.
- Authored SQL migrations not yet extended for approval states / slug_locked columns (mock-enforced; SQL apply still unauthorized).
- Dedicated Supabase development/test project still unnamed.

---

## Exact paste for integrator — `docs/EXECUTION_STATE.md`

```md
# Current Execution State

## Repository

- Repository: increaseroasir/website-template-2.0
- Integration branch: factory/p0-safety-lock
- Feature branch (P0.5 freeze): factory/p0-5-contract-freeze
- Integration tip: a6ad5cd
- P0.5 freeze base: a6ad5cd
- Baseline tag: htl-factory-pre-hardening-2026-07-30
- Protected client: sun-pool-spa
- Sun Pool tree OID: f3da831b2c31d37693f6022340b2d2f936bb4f72
- Sun Pool mutation authorized: no
- Canonical contract version: 0.1.1
- Onboarding schema version: 1.0.0

## Phase Status

- R0 Cursor readiness: COMPLETE AND VERIFIED
- Five-file brain: COMPLETE AND VERIFIED
- P0 safety and control plane: COMPLETE AND VERIFIED
- P0.5 canonical contract: COMPLETE AND VERIFIED
- P1 Supabase migrations/RPC: COMPLETE BUT NOT APPLIED
- P2 Make intake: NOT STARTED
- P3 provisioning: NOT STARTED
- P4 hydration: NOT STARTED
- P5 staging: NOT STARTED
- P6 production: NOT STARTED
- P7 fleet: NOT STARTED

## Verification Evidence (P0.5 freeze)

- brand:guard: PASS
- test:safety: 31/31 PASS
- test:factory-contract: 39/39 PASS
- Sun Pool mutation: none
- Sun Pool OID unchanged: f3da831b2c31d37693f6022340b2d2f936bb4f72
- External systems contacted: none
- Make: NOT AUTHORIZED
- Migration apply: NOT AUTHORIZED

## Active Gate

No Make implementation or migration application may begin until the owner explicitly:
1. Approves merging factory/p0-5-contract-freeze into factory/p0-safety-lock
2. Names/approves a dedicated HTL factory development/test Supabase project
3. Separately green-lights Make

## Next Action

Owner/integrator: commit + review P0.5 freeze PR, then decide safe Supabase target before any apply or Make work.
```
