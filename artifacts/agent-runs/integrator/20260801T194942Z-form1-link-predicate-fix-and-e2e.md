# Form 1 link-predicate fix + post-fix E2E

**UTC:** 20260801T194942Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Repo:** `increaseroasir/website-template-2.0`  
**Scenario:** `4852018`  
**Webhook:** `2785703` / `https://hook.us1.make.com/3kbchattgqyafd0sqb8xdod3deayksto`  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`  
**Run ID:** `HTL-E2E-20260801-194942`  
**Authorization:** post-predicate-fix E2E only; no blueprint/grants/RLS/mapping/webhook/connection changes in this run

---

## ROOT CAUSE (prior LINK failure)

BasicIfElse link branches AND-combined `text:equal "1"` **with** `numeric:equal "1"` on `length(...)`.  
Make treated the dual predicate as a miss → Else module 78 (`identity_resolution_unclassified`, ops=7).

## PATCH SUMMARY (already applied before this E2E; not re-applied here)

Removed **5** `numeric:equal "1"` predicates from **3** link branches (`link_by_client_id`, `link_by_deployment_key`, `link_by_client_slug`), keeping `text:equal "1"`.  
Evidence: `artifacts/agent-runs/integrator/20260801T193700Z-form1-link-predicate-BEFORE-AFTER.json`.

### Preflight confirmation (this run)

| Check | Result |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Module 9 | `builtin:BasicIfElse` (17 branches) |
| Link branches `text:equal "1"` | **present** |
| Link branches `numeric:equal "1"` on length | **absent** (0 `numeric:equal` in blueprint) |
| Active count | **26** |
| Leftover probe `b681d776-…` / `htl-e2e-%` | cleaned to **0** before activate |

---

## PHASE 1 — ACTIVATE

| Check | Result |
|---|---|
| Activated | `4852018` only |
| Active after | **27** (+1) |

---

## PHASE 2 — CREATE (E2E-01) PASS

| Item | Value |
|---|---|
| Execution ID | `646ef201a41b44f09f9d375cae74a019` |
| Timestamp | `2026-08-01T19:49:58.292Z` |
| Operations | **13** |
| HTTP | **200** |
| Outcome | `created` |
| client_id | `1dd71a39-26ff-4824-bd47-1e3e1510508a` |
| onboarding_case_id | `46e262d3-9b3b-4e59-808c-4da6a7738f1c` |
| submission_id | `HTL-E2E-20260801-194942-sub-a` |
| client_slug | `htl-e2e-20260801-194942-a` |
| deployment_key | `htl-e2e-20260801-194942-a-deploy` |

---

## PHASE 3 — LINK (E2E-02) PASS

| Item | Value |
|---|---|
| Execution ID | `533058104fbb4349b0b03ceed380ae1d` |
| Timestamp | `2026-08-01T19:50:16.640Z` |
| Operations | **12** (>7; link path, not Else-only) |
| HTTP | **200** |
| Outcome | `linked` (NOT `identity_resolution_unclassified`) |
| client_id | same A `1dd71a39-…` |
| onboarding_case_id | `527c4bab-1a9d-488f-a479-0a4252366ca9` |
| submission_id | `HTL-E2E-20260801-194942-sub-link` |

Hypothesis A (numeric:equal blocked length=1 link branches) **CONFIRMED fixed** by live LINK path.

---

## PHASE 4 — REPLAY (E2E-05) PASS

| Item | Value |
|---|---|
| Execution ID | `08992679cd064b59888dd6705a596f17` |
| Timestamp | `2026-08-01T19:50:28.991Z` |
| Operations | **3** (respond-only) |
| HTTP | **200** |
| Outcome | `replayed` / `idempotent=true` |
| New client | **no** |

Exact CREATE payload resent (same `submission_id`).

---

## PHASE 5 — IDENTITY_CONFLICT (E2E-06) PASS

Created client B first:

| Item | Value |
|---|---|
| CREATE B exec | `c1ada0bff64840879678573a905cfe6e` |
| Ops | **13** |
| Outcome | `created` |
| client_id B | `38e428ec-376e-451e-8fc5-915447b34199` |
| slug/key B | `htl-e2e-20260801-194942-b` / `…-b-deploy` |

Then disagreement payload (`client_id`=A + slug/key of B):

| Item | Value |
|---|---|
| Execution ID | `2826f47879e849afbb9e426da8d59f84` |
| Timestamp | `2026-08-01T19:50:47.220Z` |
| Operations | **7** (lookups + respond-only) |
| HTTP | **409** |
| Outcome | `identity_conflict` |
| Error | `client_id_deployment_key_disagree` |
| Third client | **no** (still 2 clients: A+B) |

---

## PHASE 6 — DEACTIVATE

| Check | Result |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** |
| waiting / DLQ | false / 0 |

---

## PHASE 7 — CLEANUP

Deleted A+B (and preflight probe leftover) with FK-safe order:  
`status_history` → `workflow_events` → `idempotency_keys` → `config_versions` → `intake_submissions` → null `active_onboarding_case_id` → `onboarding_cases` → `clients`.

| Residue | Count |
|---|---|
| clients / cases / intakes / configs / idem / events / status_history for run IDs | **0** |

Supabase MCP `read_only` restored to **true** (home + project `.cursor/mcp.json`).  
`apply_authorized` remains **false**.

---

## PHASE 8 — TESTS

| Suite | Result |
|---|---|
| onboarding design-freeze | **54/54** (artifact) + 4 pytest wrappers PASS |
| factory-contract | **46/46** |
| safety | **31/31** |
| QA | **9/9** |
| GHL static | **2/2** |
| ClickUp static | **2/2** |
| provisioning | **7/7** |
| brand:guard | **PASS** |

**151 passed / 0 failed** + brand:guard PASS.

---

## SECURITY

- Sun Pool untouched  
- No production contacted  
- No GHL / ClickUp modules exercised  
- No secrets exposed / no payload dumps committed  
- Blueprint / grants / RLS / mappings / webhook / connection unmodified this run  
- Synthetic only (`example.invalid`, `+1555…`, unique slugs/keys/submission/opp/contact)

---

## E2E CASE STATUS

| Case | Result | Exec | Ops | HTTP | Outcome |
|---|---|---|---|---|---|
| E2E-01 CREATE | **PASS** | `646ef201a41b44f09f9d375cae74a019` | 13 | 200 | `created` |
| E2E-02 LINK | **PASS** | `533058104fbb4349b0b03ceed380ae1d` | 12 | 200 | `linked` |
| E2E-05 REPLAY | **PASS** | `08992679cd064b59888dd6705a596f17` | 3 | 200 | `replayed` |
| E2E-06 IDENTITY_CONFLICT | **PASS** | `2826f47879e849afbb9e426da8d59f84` | 7 | 409 | `identity_conflict` |
| Cleanup / idle | **PASS** | — | — | — | active=26 |

---

## VERDICT

**SUCCESS** — post-predicate-fix E2E green for CREATE / LINK / REPLAY / IDENTITY_CONFLICT; residue cleaned; scenario inactive; capacity 26 restored.
