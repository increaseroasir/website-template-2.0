# Form 1 synthetic E2E — FAILED (Make Supabase privileges)

**UTC:** 20260801T033100Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Tip at start:** `dfdc9b6129e8bdf1b3d4b5e103cae3a9d5d886d3`  
**Repo:** `increaseroasir/website-template-2.0`  
**Run ID:** `HTL-E2E-20260801-032549`

---

## MAKE PLAN

| Check | Result |
|---|---|
| Organization | Increase ROAS `1111422` |
| `productName` / `serviceName` | **Core** |
| Active scenarios before | **26** |
| Active scenarios after deactivate | **26** |
| Capacity blocker | **Resolved** (Core activation of `4852018` succeeded) |
| Scenario | `4852018` · `HTL Factory Form 1 Intake (dev_test)` |
| Pre-state | `isActive=false`, `nextExec=null` |
| Webhook | `2785703` attached · scenarioId=4852018 |
| Connection | `4834536` · `HTL Factory Dev (epeddfdifckzzmskhdsz)` |
| Blueprint | 46 modules; packages `gateway`/`supabase`/`builtin` only; no GHL/ClickUp |
| Contract / schema in blueprint | `0.2.0` / `1.1.0` present |
| Outcomes present | created / linked / replayed / identity_conflict / review_required |

---

## Phase 2b — Supabase write-path proof (before activation)

Temporary MCP write window (`read_only=false`) on `epeddfdifckzzmskhdsz` only.

| Step | Result |
|---|---|
| Identity | `postgres` / `transaction_read_only=off` |
| Create client + case + intake + config + idempotency_keys + workflow_events | PASS |
| Delete all writeproof rows | PASS |
| Zero residue | PASS |
| MCP restored `read_only=true` after run | PASS |

Constraint confirmed for Case E:

- `clients.client_slug` UNIQUE
- `clients.deployment_key` UNIQUE  
→ approved multi-match `review_required` fixture **cannot** be created without weakening uniqueness.

---

## Activation window

| Event | UTC |
|---|---|
| Activate `4852018` | ~2026-08-01T03:29:55Z |
| Case A webhook POST | 2026-08-01T03:30:00Z |
| Deactivate `4852018` | immediately after failure |
| Final `isActive` | **false** |
| Final `nextExec` | **null** |
| Other scenarios changed | **none** |

---

## E2E RESULTS

Payloads: synthetic only (`example.invalid`, `+1555…`); **no GHL IDs** included (not required for idempotency filter `form`+`submission_id`; must not participate in matching).

| Case | Result | Evidence |
|---|---|---|
| A create | **FAIL** | Execution `2d8b8dfc11f146ca988fcd3c5d325db0` — `[403] permission denied for table intake_submissions` on idempotency GET (`supabase:makeAnApiCall`) |
| B link | **NOT EXECUTABLE** | Hard-stopped after Case A; no webhook sent |
| C replay | **NOT EXECUTABLE** | Hard-stopped after Case A |
| D identity_conflict | **NOT EXECUTABLE** | Hard-stopped after Case A |
| E review_required | **NOT EXECUTABLE UNDER CURRENT CONSTRAINTS** | UNIQUE(`client_slug`), UNIQUE(`deployment_key`) prevent approved multi-match fixture; uniqueness not weakened; no fuzzy-match invented |
| E2E-08 forbidden auto-link | **DEFERRED** | Not executed |
| E2E-09 null_does_not_clear | **DEFERRED** | Not executed |

### Root cause (not a blueprint logic bug)

`service_role` (Data API role used by Make connection `4834536`) has **no** SELECT/INSERT/UPDATE/DELETE on:

- `clients`
- `onboarding_cases`
- `intake_submissions`
- `config_versions`
- `idempotency_keys`
- `workflow_events`

Only REFERENCES/TRIGGER/TRUNCATE were present for `service_role` on these tables. Blueprint was **not** patched.

---

## DATABASE

| Item | Result |
|---|---|
| Records created by Case A | **none** (failed before writes) |
| Synthetic residue | **zero** |
| Cleanup | N/A (nothing written); writeproof fixtures deleted before activation |
| Protected / production / Sun Pool | untouched |

---

## SCENARIO

| Item | Result |
|---|---|
| Activation succeeded under Core | yes |
| Final inactive | **yes** |
| Pending execution | none |
| Other scenario state changes | none |
| Webhook still attached | yes (`2785703`) |

---

## TESTS (fresh)

| Suite | Result |
|---|---|
| onboarding | **54/54** |
| factory-contract | **46/46** |
| safety | **31/31** |
| QA | **9/9** |
| GHL static | **2/2** |
| ClickUp static | **2/2** |
| provisioning | **7/7** |
| brand:guard | **PASS** |

**151 passed / 0 failed** + brand:guard PASS.

---

## Confirmations

- No GHL / ClickUp / P3 / production writes  
- No Paradise / Sun Pool / Retainer Snapshot touch  
- No blueprint patch  
- No uniqueness weakened  
- No fake fuzzy-match test  
- P2 remains **incomplete**

---

## Next owner decision (exactly one)

Authorize GRANT of `service_role` SELECT/INSERT/UPDATE/DELETE (and RPC EXECUTE on `request_client_transition`) for Form 1 tables on `htl-factory-dev`, then re-run the synthetic Form 1 E2E matrix on scenario `4852018`.

---

## VERDICT

**FAILED**
