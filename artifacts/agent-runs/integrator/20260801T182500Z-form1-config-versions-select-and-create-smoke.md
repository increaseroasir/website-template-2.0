# Form 1 config_versions SELECT grant + CREATE smoke

**UTC:** 20260801T182500Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Start tip:** `2f9259a`  
**Repo:** `increaseroasir/website-template-2.0`  
**Scenario:** `4852018` (not modified this pass)  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`

---

## PHASE 1 — SELECT JUSTIFIED (decision gate)

| Proof | Result |
|---|---|
| Module 74 type | `supabase:createARow` on `public.config_versions` |
| Return behavior | createARow output = inserted row (`getTableInterface`); same pattern as modules 70/71 PKs |
| Prior 403 evidence | POST `/rest/v1/config_versions` → 403 with INSERT=true SELECT=false (return=minimal would be 201 empty) |
| Pre-grant privileges | service_role SELECT=**false**, INSERT=**true**, UPDATE=false, DELETE=false |

**Decision:** SELECT necessary for Prefer representation / inserted-row return. Authorized grant only.

---

## PHASE 2–4 — MIGRATION

| Item | Value |
|---|---|
| Local file | `supabase/migrations/20260801180627_grant_form1_config_versions_select.sql` |
| SQL | `GRANT SELECT ON TABLE public.config_versions TO service_role;` only |
| File SHA-256 | `775f61e7c730a4c91eddd83fda8af15c3a5b96e228ef4a120d5343879dd32c74` |
| Remote version | `20260801181727` / `grant_form1_config_versions_select` |
| UPDATE/DELETE/TRUNCATE/ALL/ownership/RLS/anon/authenticated | **not changed** |
| Scenario 4852018 blueprint | **not modified** |
| `apply_authorized` during apply | temporary true (working tree); restored **false** |
| MCP during apply | temporary write; restored read-only |

---

## PHASE 5 — PRIVILEGES AFTER GRANT

| Check | Result |
|---|---|
| service_role SELECT | **true** |
| service_role INSERT | **true** |
| service_role UPDATE | **false** |
| service_role DELETE | **false** |
| anon/authenticated SELECT/INSERT | none added |
| RLS on Form 1 tables | enabled; policy_count **0** (unchanged) |

---

## PHASE 6 — DATA API / REPRESENTATION PROBE

| Check | Result |
|---|---|
| Live service_role JWT via agent | unavailable (vault empty; Make connection secrets not exposed) |
| Equivalent probe | `SET ROLE service_role` + `INSERT ... RETURNING` on config_versions |
| Representation returned | yes (`config_version_id` + config jsonb) |
| Probe residue | cleaned to **zero** before CREATE smoke |

Live Prefer:return=representation path exercised by CREATE smoke via connection `4834536`.

---

## CREATE SMOKE — FAIL (module 78 dual-fire; no Make patch; no retry)

| Item | Value |
|---|---|
| Active before | 26 |
| Run ID | `HTL-E2E-20260801-181847` |
| Slug | `htl-e2e-0801181847-a` |
| Execution ID | `332f3838e38e48588bedaea1d2c71107` |
| Timestamp | `2026-08-01T18:21:31.422Z` |
| Duration | 3582 ms |
| Operations | **14** |
| Centicredits | 1400 |
| Make status | SUCCESS (status 1) |
| HTTP body observed | `outcome=review_required`, `error=identity_resolution_unclassified` (**module 78**) |
| Deactivated | immediately after failure |

### What the grant proved

| Module / write | Result |
|---|---|
| Module 74 `config_versions` | **succeeded** — row `6c73c1a6-f23d-4b59-b825-c5d0c23b9a3f` |
| config.contract_version | `0.2.0` |
| config.onboarding_schema_version | `1.1.0` |
| Client | `ecd088ff-ea16-4303-97f7-ffcd59a78cc5` / `htl-e2e-0801181847-a` |
| Case | `f7115eac-e03d-431c-90c3-f8d2147c567b` status `under_review` version 2 (RPC ran) |
| Intake | `e7885f5a-d034-4525-9a72-b70a5c16d85f` / submission `HTL-E2E-20260801-181847-sub-a` schema `1.1.0` |
| Employees / inventory / protected | **0** |

### Why CREATE PASS failed

PASS required: module 76 `outcome=created`, module 78 does **not** execute, exactly one WebhookRespond.

Observed: ops **14** (= create path ~13 + module **78**). Client HTTP saw module 78 unclassified response despite create writes + RPC completing. Module 9 native fallback dual-fired with matched create_new route.

**No Make patch. No grant broadening. No blind retry.** Per failure rules: deactivate, inspect, clean, stop.

---

## CLEANUP

| Check | Result |
|---|---|
| Synthetic client/case/intake/config/status_history/workflow/idempotency | **removed** |
| Residue counts | clients=0 cases=0 intakes=0 configs=0 events=0 idem=0 employees=0 inventory=0 status_hist=0 |
| MCP restored | `read_only=true` / `transaction_read_only=on` |
| `apply_authorized` | **false** |

---

## FINAL STATE

| Check | Result |
|---|---|
| Scenario `islinked` / active | **false** |
| `nextExec` | **null** |
| Active count | **26** |
| Webhook | `2785703` attached |
| Grants | `cv_sel=true`, `cv_ins=true`, `cv_upd=false`, `cv_del=false` |
| RLS | unchanged (enabled, 0 policies) |
| Blueprint | unchanged this pass |
| Sun Pool / production / Paradise | untouched |

---

## TESTS

| Suite | Result |
|---|---|
| onboarding design-freeze checks | **54/54** |
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

SELECT grant is live and proven (module 74 writes). CREATE smoke HTTP/exclusivity still fails because module **78** dual-fires with create_new.

Do **not** authorize LINK / REPLAY / IDENTITY_CONFLICT until CREATE PASS criteria are met (module 76 `created`, module 78 absent, single WebhookRespond).

Expected next authorization: investigate/fix **module 9 fallback exclusivity** on inactive scenario `4852018` (Make-only; no further privilege broadening), then re-run CREATE smoke only.

---

## VERDICT

**GRANT APPLIED AND VERIFIED. CREATE SMOKE FAILED** (module 78 executed; HTTP not `created`). Residue cleaned. P2 incomplete. Scenario inactive. No merge to `factory/p0-safety-lock`.
