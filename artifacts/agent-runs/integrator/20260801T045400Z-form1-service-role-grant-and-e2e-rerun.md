# Form 1 service_role grant + E2E rerun

**UTC:** 20260801T045400Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Start tip:** `e5b45d0800883e986870c7fdc0696825b10e188f`  
**Migration commit:** `833e8a5b578afb4aeb29aa5e2d163b1b8acb18a4`

---

## Root cause (prior failure)

Make execution `2d8b8dfc11f146ca988fcd3c5d325db0` failed with `[403] permission denied for table intake_submissions` because `service_role` lacked Data API table grants (RLS bypass ≠ object privileges).

---

## Phase 1A — Live blueprint operation matrix (scenario 4852018)

| table / target | SELECT | INSERT | UPDATE | DELETE | modules / why |
|---|---|---|---|---|---|
| `clients` | yes | yes | yes | **no** | GET lookups; createARow; PATCH `active_onboarding_case_id` |
| `onboarding_cases` | yes | yes | no | **no** | GET by opportunity; createARow |
| `intake_submissions` | yes | yes | no | **no** | idempotency GET; createARow |
| `config_versions` | no | yes | no | **no** | createARow only |
| `idempotency_keys` | — | — | — | — | **omitted** — no direct modules |
| `workflow_events` | — | — | — | — | **omitted** — no direct modules |
| `rpc:request_client_transition` | — | — | — | EXECUTE | 4× POST `/rest/v1/rpc/...` |

- DELETE modules: **0** (hard-stop clear)
- Packages: `gateway`, `supabase`, `builtin` only
- Connection: `4834536` on all Supabase modules

---

## Phase 1B — Principal / before state

| Check | Result |
|---|---|
| Project | `https://epeddfdifckzzmskhdsz.supabase.co` |
| Connection name | `HTL Factory Dev (epeddfdifckzzmskhdsz)` |
| Runtime grant subject | `service_role` (Data API role; matches 403 surface) |
| Schema USAGE | already true |
| Before table DML | all six tables SEL/INS/UPD/DEL = false |
| Before RPC EXECUTE (`service_role`) | **false** |
| Before RPC EXECUTE (`anon`/`authenticated`) | **false** |
| `routine_privileges` rows | empty (PUBLIC revoked at function create) |
| RLS | enabled; policy_count = 0 on Form 1 tables |
| Pre-existing `service_role` TRUNCATE | true (not granted by this migration; pre-existing REFERENCES/TRIGGER/TRUNCATE posture) |

**Security finding (report only, not revoked):** RPC EXECUTE was not available to PUBLIC/anon/authenticated before or after this pass (empty grantee list prior; only `service_role` EXECUTE added).

---

## PRIVILEGE FIX

| Item | Value |
|---|---|
| Migration file | `supabase/migrations/20260801041000_grant_form1_service_role_privileges.sql` |
| SHA-256 | `b1ab19231ec5157418b9b5ea0b8598fa30494f73ff0948b1e07ce5ee7ff8aad2` |
| Remote version | `20260801045303` |
| Remote name | `grant_form1_service_role_privileges` |

### Final per-table privilege matrix (`service_role`)

| table | SELECT | INSERT | UPDATE | DELETE | TRUNCATE (pre-existing) |
|---|---|---|---|---|---|
| `clients` | yes | yes | yes | **no** | yes (pre-existing) |
| `onboarding_cases` | yes | yes | no | **no** | yes (pre-existing) |
| `intake_submissions` | yes | yes | no | **no** | yes (pre-existing) |
| `config_versions` | no | yes | no | **no** | yes (pre-existing) |
| `idempotency_keys` | no | no | no | no | yes (pre-existing) |
| `workflow_events` | no | no | no | no | yes (pre-existing) |
| RPC EXECUTE | **yes** (`service_role` only) | | | | |

| Check | Result |
|---|---|
| RLS enabled | yes |
| Policy counts | unchanged (0) |
| anon/authenticated new DML | **none** |
| Make DELETE grants | **none** |
| Blueprint patched | **no** |

---

## WRITE PROBE

| Step | Result |
|---|---|
| `SET LOCAL ROLE service_role` insert client/case/intake/config + client UPDATE | PASS |
| Admin-path cleanup (`reset role` + DELETE) | PASS |
| Residue | **zero** |

---

## E2E RESULTS

Activation of `4852018` succeeded after grants. Case A webhook:

| Case | Result | Execution ID | Notes |
|---|---|---|---|
| A create | **FAIL** | `dec53faff0704ed6a41333010a8c4262` | HTTP 200 but `outcome=replayed` with empty DB; false-positive idempotency route |
| B link | **NOT EXECUTABLE** | — | hard-stop after A |
| C replay | **NOT EXECUTABLE** | — | hard-stop after A |
| D identity_conflict | **NOT EXECUTABLE** | — | hard-stop after A |
| E review_required | **NOT EXECUTABLE UNDER CURRENT CONSTRAINTS** | — | UNIQUE slug/key |
| E2E-08 / E2E-09 | **DEFERRED** | — | not run |

### Blueprint defect (not patched)

Idempotency router compares `{{2.body}}` to text `"[]"` via `text:notequal` / `text:equal`. After privileges were fixed, empty GET no longer 403s, but Make’s `2.body` is **not** equal to the literal string `[]`, so the replay branch always wins (`result` embedded empty → `"result":,`). No rows written. **Do not patch in this pass** — separate owner authorization required.

---

## DATABASE / MAKE

| Item | Result |
|---|---|
| Rows created by E2E | **0** |
| Residue | **zero** |
| Scenario final | `isActive=false`, `nextExec=null` |
| Other scenarios changed | none observed |
| Webhook attached | yes (`2785703`) |
| MCP final | `read_only=true` |
| `apply_authorized` | **false** |

---

## TESTS

| Suite | Result |
|---|---|
| onboarding | **54/54** |
| factory-contract | **46/46** |
| safety | **31/31** |
| QA | **9/9** |
| GHL | **2/2** |
| ClickUp | **2/2** |
| provisioning | **7/7** |
| brand:guard | **PASS** |

**151 passed / 0 failed** + brand:guard PASS.

---

## Confirmations

- No GHL / ClickUp / P3 / production / Paradise / Sun Pool / Retainer Snapshot writes  
- No Make DELETE grants  
- No blueprint patch  
- No uniqueness weakened  

---

## Next owner decision (exactly one)

Authorize a **docs/blueprint-only** fix to Form 1 idempotency routing on scenario `4852018` so empty `intake_submissions` GET is treated as not-replay (e.g. length/empty-array check instead of text compare to `"[]"`), then re-run synthetic E2E. Do not broaden `service_role` grants.

---

## VERDICT

**GO WITH CHANGES** — privilege migration applied and verified; E2E blocked on blueprint idempotency filter defect; P2 remains incomplete.
