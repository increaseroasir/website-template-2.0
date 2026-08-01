# Form 1 LINK / REPLAY / IDENTITY_CONFLICT E2E

**UTC:** 20260801T192430Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Tip at start:** `166ba02`  
**Repo:** `increaseroasir/website-template-2.0`  
**Scenario:** `4852018`  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`  
**Run ID:** `HTL-E2E-20260801-191557`  
**Authorization:** synthetic LINK + REPLAY + IDENTITY_CONFLICT only; no blueprint/DB/grant/mapping changes

---

## PREFLIGHT (PASS)

| Check | Result |
|---|---|
| Remote | `increaseroasir/website-template-2.0` |
| Branch tip | `166ba02` |
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** |
| Webhook | `2785703` / URL matched |
| Connection | `4834536` only |
| Module 9 | `builtin:BasicIfElse` 17 branches |
| Branch order | multi → opportunity_bound → conflicts → link client_id → deployment_key → client_slug → create_new → Else→78 |
| Module 78 | Else-only |
| Module 76 | create_new-only |
| PLACEHOLDER / incomplete_apply | none |
| `apply_authorized` | **false** |
| Supabase MCP | read-only for preflight |
| Grants (service_role) | clients S/I/U; cases/intake/config S/I; idem/workflow/status_history none |
| RLS | enabled on clients/cases/intake/config/idem/workflow/status_history |
| Execution baseline newest | `289d3d945a2645b688ee96b4a18fb50e` (prior CREATE PASS) |

---

## PHASE 2 — CREATE FIXTURE (PASS)

| Item | Value |
|---|---|
| Activation | only `4852018`; active before 26 |
| Execution ID | `3b49db6db2cd4a5d8f478000924d05db` |
| Timestamp | `2026-08-01T19:16:07.150Z` |
| Operations | **13** |
| HTTP | **200** |
| Outcome | `created` |
| Response module | **76** (module 78 absent) |
| client_id | `70bd548e-7a8d-43fb-884e-c928ef6a0412` |
| onboarding_case_id | `8d5c9ad7-59bc-43b7-b920-52fd634b20b0` |
| submission_id | `HTL-E2E-20260801-191557-sub-a` |
| client_slug | `htl-e2e-20260801-191557-a` |
| deployment_key | `htl-e2e-20260801-191557-a-deploy` |
| DB before LINK | clients=1 cases=1 intakes=1 configs=1 |

Synthetic only: `example.invalid`, `+1555…`, unique slug/key/submission/opportunity.

---

## PHASE 3 — LINK (FAIL — HARD STOP)

| Item | Value |
|---|---|
| Execution ID | `e56c85057f104a22857f10b8828aa111` |
| Timestamp | `2026-08-01T19:16:25.671Z` |
| Operations | **7** |
| HTTP | **500** |
| Body | `outcome=review_required`, `error=identity_resolution_unclassified`, `body_length=0` |
| Response module | **78** (Else) |
| Expected | `outcome=linked` via module 35; module 78 absent |
| Second client created | **no** (respond-only Else; no link/create writes) |
| Deactivated | **immediately** after failure |

Payload shape (sanitized): new `submission_id` `…-sub-link`; existing synthetic `client_id`; matching slug + deployment_key; new fake opportunity/contact; no email/phone/domain matching.

### Module path inference

Ops **7** ⇒ `1 → 2 → 5 → 6 → 7 → 8 → 78` (lookups ran; no link/create branch modules).  
`executions_get-detail` returned only `{"status":"SUCCESS"}` (no per-module bundle via MCP).

### Root-cause analysis (report only; blueprint NOT changed)

1. **Primary hypothesis:** After BasicIfElse conversion, branches that require `length(N.body) text:equal "1"` were never live-proven. CREATE only exercises `text:equal "0"` (create_new). LINK/conflict branches AND-require `text:equal "1"` (+ often `numeric:equal "1"`). If `text:equal "1"` fails at IfElse evaluation time, every length=1 branch fails closed → Else module 78.
2. **Secondary:** webhook may omit unlearned `client_id`; even then `link_by_deployment_key` OR-group 2 (key+slug agree, no client_id) should match unless the same length=`"1"` predicate fails.
3. Same class of defect as prior Router length/`numeric:equal "0"` miss; CREATE still green because it only needs empty-length `"0"`.

Per authorization: **no blueprint patch; no blind retry.**

---

## PHASE 4 — REPLAY

**NOT RUN** — hard-stopped after LINK failure.

---

## PHASE 5 — IDENTITY_CONFLICT

**NOT RUN** — hard-stopped after LINK failure.

---

## PHASE 6 — CLEANUP (PASS)

Temporary Supabase MCP write window (`read_only=false` in `~/.cursor/mcp.json` + project `.cursor/mcp.json`), re-auth, SQL cleanup including `status_history`, restore `read_only=true`, re-auth.

Deleted for run `HTL-E2E-20260801-191557` / client `70bd548e-…`: status_history, workflow_events, idempotency_keys, config_versions, intake_submissions, onboarding_cases, clients.

| Residue check | Count |
|---|---|
| clients / cases / intakes / configs / workflow / idem / status_history | **0** |

---

## PHASE 7 — DEACTIVATE AND RESTORE (PASS)

| Check | Result |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** |
| Webhook attached | `2785703` |
| Connection | `4834536` |
| Pending / waiting / DLQ | none / false / 0 |
| `apply_authorized` | **false** |
| MCP | read-only restored |
| Grants / RLS | unchanged |

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
- No secrets exposed / no payload dumps committed
- Blueprint / grants / RLS / mappings / webhook / connection unmodified
- Synthetic IDs only

---

## E2E CASE STATUS

| Case | Result | Exec |
|---|---|---|
| CREATE fixture | **PASS** | `3b49db6db2cd4a5d8f478000924d05db` |
| E2E-02 LINK | **FAIL** | `e56c85057f104a22857f10b8828aa111` |
| E2E-05 REPLAY | **NOT RUN** | — |
| E2E-06 IDENTITY_CONFLICT | **NOT RUN** | — |
| E2E-07 review_required | **NOT EXECUTABLE** | — |
| E2E-08 / E2E-09 | **DEFERRED** | — |
| Cleanup | **PASS** zero residue | — |

---

## NEXT OWNER DECISION

Authorize a **targeted inactive blueprint filter fix** for BasicIfElse length predicates that must match `1` (and re-prove LINK → REPLAY → IDENTITY_CONFLICT), without expanding scope to review_required / E2E-08 / E2E-09 / GHL.

---

## VERDICT

**FAILED** — CREATE fixture green; LINK hit module 78 Else (`identity_resolution_unclassified`); REPLAY/IDENTITY_CONFLICT not executed; cleaned; idle restored; tests green.
