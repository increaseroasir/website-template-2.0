# Form 1 module 9 exclusivity + CREATE smoke

**UTC:** 20260801T190200Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Start tip:** `71f73c2`  
**Repo:** `increaseroasir/website-template-2.0`  
**Scenario:** `4852018`  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`

---

## PRECONDITIONS

| Check | Result |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Webhook | `2785703` attached |
| Connection | `4834536` only |
| Active count before | **26** |
| Pending execution | none (`iswaiting=false`) |

---

## PHASE 1 — OLD CONTROL FLOW PROOF

Prior exec `332f3838e38e48588bedaea1d2c71107`: ops **14**, HTTP `identity_resolution_unclassified` despite CREATE writes.

Live BEFORE module 9: `builtin:BasicRouter` with 17 routes; module 78 only at route 16 with `fallback:true` under module 9 (`/flow[2]/routes[0]/flow[4]/routes[16]`). Module 76 only on create_new route 15.

---

## BASICMERGE DECISION GATE

| Evidence | Result |
|---|---|
| Live module `BasicIfElse` available | yes |
| Org saved BasicIfElse example | none found |
| `validate_blueprint_schema` no-merge terminal WebhookRespond branches | **valid** |
| `validate_blueprint_schema` with-merge | also valid |
| Decision | **B — omit BasicMerge** (terminal respond branches; no unreachable Merge) |

---

## PATCH (one inactive `scenarios_update`)

Replaced module 9 `BasicRouter` → `BasicIfElse` with 17 branches (`merge:false`). Conditions moved from first-module filters into `branch.conditions`. Else branch = module 78 only. No module 79. No Router 3 / 5–8 / mapping / RPC / grant changes.

Artifacts:

- BEFORE: `20260801T183940Z-form1-module9-BEFORE.json`
- Equivalence: `20260801T183940Z-form1-module9-route-equivalence.json`
- AFTER filters: `20260801T183940Z-form1-module9-AFTER-filters.json`

### Route equivalence (summary)

| Old r# | Name | New branch | Type |
|---|---|---|---|
| 0–2 | multi_* | 0–2 | condition |
| 3 | opportunity_bound | 3 | condition |
| 4–11 | conflict responses | 4–11 | condition |
| 12 | link_by_client_id | 12 | condition |
| 13 | link_by_deployment_key | 13 | condition |
| 14 | link_by_client_slug | 14 | condition |
| 15 | create_new → 70…76 | 15 | condition |
| 16 | fallback → 78 | 16 | **else** |

---

## STATIC PROOF

All checks **PASS** before activation:

- module 9 = `BasicIfElse`, 17 branches
- first-match exclusivity (If-else semantics)
- Else only → 78; 76 only on create_new; CREATE cannot reach 78
- no branch has two WebhookRespond
- module 70 present; subtrees intact
- no PLACEHOLDER_CONTINUE / incomplete_apply
- webhook/connection unchanged; scenario inactive

---

## CREATE SMOKE — PASS

| Item | Value |
|---|---|
| Execution ID | `289d3d945a2645b688ee96b4a18fb50e` |
| Timestamp | `2026-08-01T19:01:52.028Z` |
| Operations | **13** (was 14 with dual-fire) |
| Centicredits | 1300 |
| Duration | 2983 ms |
| HTTP | **200** |
| Body | `outcome=created`, `idempotent=false`, contract `0.2.0`, schema `1.1.0` |
| Response module | **76** |
| Module 78 | **absent** |

Module path (ops 13): `1 → 2 → 5 → 6 → 7 → 8 → 70 → 71 → 72 → 73 → 74 → 75 → 76`

### Database before cleanup

| Row | ID / value |
|---|---|
| client | `dab143b8-42c3-46d0-9748-050fa7bddeb9` / `htl-e2e-0801185900-a` |
| case | `abbab3d0-273d-43e0-9d61-09a5b53821d9` status `under_review` v2 schema `1.1.0` |
| intake | `HTL-E2E-20260801-185900-sub-a` schema `1.1.0` |
| config | `867333fd-c43c-42db-8db8-18c9ad3b3c99` contains contract `0.2.0` / schema `1.1.0` |
| Counts | clients=1 cases=1 intakes=1 configs=1 employees=0 inventory=0 |

---

## CLEANUP / FINAL STATE

| Check | Result |
|---|---|
| Synthetic residue | **zero** |
| Scenario `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** |
| Webhook | `2785703` |
| Module 9 live | `BasicIfElse` 17 branches |
| `apply_authorized` | **false** |
| MCP | restored read-only |
| Grants/RLS | unchanged this pass (no DB patch) |
| Sun Pool / production | untouched |

---

## TESTS

| Suite | Result |
|---|---|
| onboarding design-freeze | **54/54** |
| factory-contract | **46/46** |
| safety | **31/31** |
| QA | **9/9** |
| GHL static | **2/2** |
| ClickUp static | **2/2** |
| provisioning | **7/7** |
| brand:guard | **PASS** |

**151 passed / 0 failed** + brand:guard PASS.

---

## NEXT OWNER GATE

Authorize synthetic **LINK**, **REPLAY**, and **IDENTITY_CONFLICT** E2E on inactive scenario `4852018`.

---

## VERDICT

**GO** — module 9 exclusivity fixed; CREATE smoke passed with single `created` response and module 78 absent.
