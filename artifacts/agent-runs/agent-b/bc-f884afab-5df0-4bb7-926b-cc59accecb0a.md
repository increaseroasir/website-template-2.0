# Agent B run — Canonical Contract + Supabase

| Field | Value |
|---|---|
| Agent | B (Canonical Contract + Supabase) |
| Run ID | `bc-f884afab-5df0-4bb7-926b-cc59accecb0a` |
| Date (UTC) | 2026-07-31 |
| Branch | `cursor/agent-b-canonical-contract-cb0a` |
| Base | `factory/p0-safety-lock` |
| required_base_sha | `309ac92d226b14cafd0bee6130606c3fcf1b5195` |
| Ancestor proof | `git merge-base --is-ancestor 309ac92d226b14cafd0bee6130606c3fcf1b5195 HEAD` → **PASS** |
| Remote | `increaseroasir/website-template-2.0` → **PASS** |
| Migration status | **COMPLETE BUT NOT APPLIED** |
| Contract version | `0.1.0` |
| Onboarding schema version | `1.0.0` |

## Files changed

- `docs/CANONICAL_CONTRACT.md` — content freeze + must-include checklist (identity lock unchanged)
- `config/identity-fields.json` — one canonical name set, form ownership, merge rules
- `config/state-machine.json` — allowed/forbidden transitions + RPC policy
- `config/factory-contract.schema.json` — schema for companions, forms, deferrals, deployment candidate
- `config/forbidden-aliases.json` — CI-reject alias list
- `supabase/migrations/20260731000100_factory_core_tables.sql` — clients, onboarding_cases, intake_submissions, config_versions, idempotency_keys, status_history, deferrals, sync_failures, approval_readiness, workflow_events; free-form status ban trigger; domain audit
- `supabase/migrations/20260731000200_request_client_transition.sql` — controlled RPC + transition rule seed
- `supabase/README.md` — migration status label
- `scripts/lib/factory-contract/*` — mocked contract engine for tests
- `tests/factory-contract/*` — unit/contract tests (no live GHL/Make/Supabase)
- `package.json` — `test` / `test:factory-contract` scripts
- `artifacts/agent-runs/agent-b/bc-f884afab-5df0-4bb7-926b-cc59accecb0a.md` — this report

## Tests / checks

| Check | Result |
|---|---|
| `npm run test:factory-contract` | **PASS** — 21/21 |
| `npm run brand:guard` | **PASS** |
| Live GHL / Make | not contacted (mocked only) |
| Production Supabase migrate | **not applied** |
| Sun Pool tree OID | `f3da831b2c31d37693f6022340b2d2f936bb4f72` (unchanged) |

### Test coverage summary

- Identity lock + companion parity (SQL seed ↔ `state-machine.json`)
- Forbidden alias scan on `config/` + `supabase/migrations/`
- `request_client_transition`: allow, forbid skip, concurrency conflict, idempotency, actor ACL, approval_readiness gate
- Form1 create; duplicate Form1 idempotent; same opportunity → one case
- Out-of-order Form3 before Form2
- Stale `expected_version` rejected
- Secrets banned in Form3 payload
- Approval readiness: null ≠ deferral

## Assumptions

- Authoritative fulfillment status lives on `onboarding_cases.status` (engagement), resolved via `client_id` active case or `onboarding_case_id`.
- P0.5 owner freeze still required before Make scenarios.
- Local Postgres/Supabase not available in this environment; SQL is complete but verified via mocked JS parity + static SQL assertions.

## Unresolved risks

- SQL RPC not executed against a real Postgres instance in this run (label: COMPLETE BUT NOT APPLIED).
- `factory_transition_rules` seed must stay manually synced with `config/state-machine.json` (tests assert current parity).
- RLS policies / service-role grants intentionally minimal in P0; widen in a later hardening pass before Make.

## Confirmations

1. **Sun Pool untouched** — working tree and `HEAD:clients/sun-pool-spa` OID `f3da831b2c31d37693f6022340b2d2f936bb4f72`
2. **No production systems contacted**
3. **No secret values exposed** (Form3 rejects secret fields; no credentials used)
4. **docs/EXECUTION_STATE.md not edited**
5. **Protection library / hooks not edited** (Agent A scope)
6. **Make scenarios not implemented**
