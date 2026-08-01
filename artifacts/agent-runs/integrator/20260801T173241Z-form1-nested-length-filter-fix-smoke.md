# Form 1 nested length filters + module 78 relocation + CREATE smoke

**UTC:** 20260801T173241Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Start tip:** `67785eb502c3686363a8f66d28a89fd9deda801d`  
**Scenario:** `4852018`

---

## AUTHORIZED PATCH (single inactive `scenarios_update`)

### A. Nested identity filters (32 conditions)

Under module 9, for `N` in {5,6,7,8}:

| From | To |
|---|---|
| `{{N.body}}` `text:equal` `"[]"` | `{{length(N.body)}}` `text:equal` `"0"` |
| `{{N.body}}` `text:notequal` `"[]"` | `{{length(N.body)}}` `text:equal` `"1"` |

Multi-match routes 10–12 (`numeric:greater` `"1"`) **unchanged**. Cross-record `client_id` disagree equality checks **unchanged**.

### B. create_new (module 70)

Preserved `1.client_id` notexist. Requires:

- `length(5.body)` `text:equal` `"0"`
- `length(6.body)` `text:equal` `"0"`
- `length(7.body)` `text:equal` `"0"`
- `length(8.body)` `text:equal` `"0"`

### C. Module 78 exclusivity

| Before | After |
|---|---|
| Router 3 route 3 native `fallback:true` → module 78 | **Removed** from Router 3 |
| — | Module 9 last route native `fallback:true` → module 78 (`identity_resolution_unclassified`) |

Router 3 final routes: **5** (`not_replay`) / **4** (`replay`) / **77** (`integrity`) — **no fallback**.

Artifacts: `20260801T173241Z-form1-nested-length-BEFORE.json`, `BEFORE-filters.json`, `CHANGES.json`, `AFTER.json`, `AFTER-filters.json`, `STATIC-PROOF.json`, `UPDATE-VERIFY.json`.

---

## STATIC PROOF (before activation)

All checks **PASS** (`all_static_pass=true`):

- create-or-link present; module 70 present
- no PLACEHOLDER_CONTINUE; no incomplete_apply
- zero raw `{{N.body}}` vs `"[]"` for N=5..8
- Router 3 zero/one/multi mutually exclusive; no Router 3 fallback
- module 78 trail `/3.r0/9.r16` only; fallback under module 9
- CREATE path WebhookRespond = **76** only
- match order 30→40→50→70
- webhook `2785703`; connection `4834536` only; contract `0.2.0`; schema `1.1.0`
- scenario inactive during patch

---

## CREATE SMOKE — FAIL (hard stop; no second patch)

| Item | Value |
|---|---|
| Active before | 26 |
| Run ID | `HTL-E2E-20260801-173536` |
| Execution ID | `c1788f7b19424dac8423c0c29e24e426` |
| Timestamp | `2026-08-01T17:35:42.041Z` |
| Duration | 3258 ms |
| Operations | **11** (prior stall was **7**) |
| Centicredits | 1100 |
| HTTP | 500 (`Scenario failed to complete.`) |
| Status | ERROR |
| Deactivated | immediately after failure |

### What progressed (nested filter fix **confirmed**)

Ops **11** ≈ modules **1,2,5,6,7,8,70,71,72,73,74**:

- Router 3 entered **not_replay**
- Lookups 5–8 ran (empty → length `"0"`)
- **Module 70 create_new executed**
- Client created: `b3851b65-f00a-40ee-b678-0cb9e4163e87` / `htl-e2e-0801173536-a`
- Case created: `11cf8ac0-5e1a-4e79-9ec8-93349ec298b1` (status `submitted`, schema `1.1.0`)
- Intake created: submission `HTL-E2E-20260801-173536-sub-a`
- Module **78 did not execute** (no unclassified response body)
- Exactly one WebhookRespond did **not** complete (failed before module 76)

### Exact failing module

| Field | Value |
|---|---|
| Cause module | Supabase `createARow` |
| Blueprint module | **74** (`config_versions` insert) |
| Error | `[403] permission denied for table config_versions` |
| Privilege proof | `service_role` `config_versions` INSERT=**true**, SELECT=**false** |
| config rows written | **0** |
| RPC / module 76 | not reached |

**Interpretation:** Authorized nested-filter + exclusivity patch succeeded functionally through create_new and early writes. CREATE smoke hard-failed on Make `createARow` for `config_versions`, consistent with INSERT-only grant + module needing SELECT for representation return. **Grants not modified** (out of authorized patch scope). **No second patch.**

---

## CLEANUP

| Check | Result |
|---|---|
| Admin Postgres write window | temporary MCP `read_only=false` on `epeddfdifckzzmskhdsz` only |
| Synthetic client/case/intake/config | **removed** |
| Residue counts | clients=0, cases=0, intake=0, config=0 |
| MCP restored | `supabase_read_only_user` / `transaction_read_only=on` |
| `apply_authorized` | **false** (unchanged) |

---

## FINAL STATE

| Check | Result |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** (restored) |
| Webhook | `2785703` attached |
| Other scenarios | none changed |
| Grants | unchanged (`cv_ins=true`, `cv_sel=false`) |
| RLS | unchanged |
| Blueprint nested length + 78 under module 9 | **live** |
| Sun Pool / production / Paradise | untouched |

---

## TESTS

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

## NEXT OWNER GATE (exactly one)

Authorize a **least-privilege grant change only**: `GRANT SELECT ON public.config_versions TO service_role` on `htl-factory-dev` (so Make `createARow` / Prefer representation can succeed), then re-run CREATE smoke only. Do **not** reopen nested filter work (proven). Do not broaden DELETE. Do not run LINK/REPLAY/IDENTITY_CONFLICT until CREATE passes.

---

## VERDICT

**FAILED** (CREATE incomplete) — nested empty/single-hit filters + module 78 exclusivity **fixed and proven** (ops 11; create_new wrote client/case/intake; module 78 absent). Hard-stop at module **74** `config_versions` 403 due to missing SELECT grant. Residue cleaned. P2 incomplete.
