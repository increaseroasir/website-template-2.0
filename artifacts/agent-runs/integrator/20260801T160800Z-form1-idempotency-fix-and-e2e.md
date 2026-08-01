# Form 1 idempotency restore + native fallback + CREATE smoke

**UTC:** 20260801T160800Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Tip at start:** `4d1fabe105d0fc47d64de22e9b1f9ba15192a317`  
**Repo:** `increaseroasir/website-template-2.0`

---

## RESTORE SAFETY GATE

Source artifact: `artifacts/agent-runs/integrator/_tmp/form1-idempotency-AFTER-full.json`

| Check | Result |
|---|---|
| SHA-256 | `058a4b701e1da912b5b71df948d08aae64bd1b09702ec96de07692adcbb24967` |
| Name | `HTL Factory Form 1 Intake (dev_test)` |
| Module count | 48 (46 approved create-or-link + modules 77/78) |
| Module 70 present | yes |
| not_replay subtree IDs vs approved AFTER | **exact match** |
| Contract / schema | `0.2.0` / `1.1.0` |
| Connection | `4834536` only |
| Webhook | `2785703` |
| Packages | `gateway` / `supabase` / `builtin` only |
| No PLACEHOLDER / incomplete_apply | yes |
| Gate | **PASS** (see `20260801T160800Z-form1-RESTORE-SAFETY-GATE.json`) |

No secrets from the artifact were committed (filters/proof/evidence only).

---

## LIVE BEFORE STATE

- Scenario `4852018` inactive
- Create-or-link subtree accidentally truncated to `PLACEHOLDER_CONTINUE` / `incomplete_apply` (`lastEdit` `2026-08-01T05:11:19Z`)
- Router had length filters + ordinary catch-all (`submission_id` exist), not native fallback

---

## AUTHORIZED BLUEPRINT CHANGE (single inactive update)

1. Restored verified intact create-or-link subtree from gate-passed artifact  
2. Replaced Router 3 routes only:

| Order | Route | Filter | Module |
|---|---|---|---|
| 1 | `not_replay` | `{{length(2.body)}}` `numeric:equal` `0` | `5` → create-or-link |
| 2 | `replay` | `{{length(2.body)}}` `numeric:equal` `1` | `4` WebhookRespond |
| 3 | `idempotency_integrity_error` | `{{length(2.body)}}` `numeric:greater` `1` | `77` WebhookRespond |
| 4 | `idempotency_lookup_error` | **native** `"fallback": true` | `78` WebhookRespond only |

- Length field locked: **`2.body`** (same parsed field as modules 5–7 multi-match)
- Removed all Router 3 `2.statusCode` conditions
- No ordinary unfiltered route
- Nested modules 5–8 literal `"[]"` filters **unchanged**
- Update verify: `20260801T160800Z-form1-idempotency-UPDATE-VERIFY.json` — all checks true; `isActive=false`

### Old filters removed

- `{{2.body}}` `text:equal` / `text:notequal` `"[]"` (original false-replay defect)
- `{{2.statusCode}}` numeric equal/notequal (v1 failed smoke: ops=2 Accepted)
- Ordinary catch-all with `{{1.submission_id}}` exist (not native fallback)

### New filter expressions

```json
{"a":"{{length(2.body)}}","b":"0","o":"numeric:equal"}
{"a":"{{length(2.body)}}","b":"1","o":"numeric:equal"}
{"a":"{{length(2.body)}}","b":"1","o":"numeric:greater"}
{"name":"idempotency_lookup_error","fallback":true}
```

---

## STATIC PROOF

| Check | Result |
|---|---|
| Full create-or-link restored | yes |
| Module 70 present | yes |
| No PLACEHOLDER_CONTINUE | yes |
| No incomplete_apply | yes |
| 3 filtered + 1 native fallback | yes |
| `fallback: true` present / last | yes |
| Module 78 only on fallback | yes |
| All three filters use `length(2.body)` | yes |
| No Router 3 statusCode | yes |
| Scenario inactive during patch | yes |

---

## CREATE SMOKE — FAIL (hard stop)

| Item | Value |
|---|---|
| Activation | only `4852018`; active before 26 |
| Run ID | `HTL-E2E-20260801-161125` |
| Execution ID | `146345b0dc8f4fa4a55929114bdabe51` |
| Timestamp | `2026-08-01T16:11:33.339Z` |
| Duration | 1058 ms |
| Operations | **3** (webhook + idempotency GET + fallback respond) |
| HTTP | 500 |
| Response | `outcome=review_required`, `error=idempotency_lookup_unclassified`, **`body_length":"0"`** |
| DB rows | **0** (clients/cases/intake/config) |
| Deactivated | immediately |
| Residue | **zero** |

### What this proves

- Native fallback **worked** (ran only when no filtered route matched; no create/link writes)
- Mapper template evaluated `{{length(2.body)}}` as **`0`**
- Filtered route `not_replay` (`numeric:equal` `0`) **did not match** despite that length
- Modules `4` / `77` did not produce the response; create path (module 5+) **did not run**
- Failure is **not** the nested 5–8 `"[]"` gate (never reached)
- Per authorization: **no second speculative patch** in this run

### Hypotheses for next owner gate (report only)

1. Make filter `numeric:equal` with `"0"` may not treat empty-array length as matching (multi-match elsewhere only uses `numeric:greater` / `equal` `1`, never `equal` `0`)
2. Filter-time `length(2.body)` may differ from mapper-time evaluation for empty Supabase GET bodies
3. Alternate empty predicates to authorize next (examples only): `numeric:less` `1`, array-empty operator if available — after inspecting live module-2 bundle shape

---

## E2E RESULTS

| Case | Result | Execution ID |
|---|---|---|
| CREATE smoke | **FAIL** | `146345b0dc8f4fa4a55929114bdabe51` |
| B link | **NOT EXECUTABLE** | — |
| C replay | **NOT EXECUTABLE** | — |
| D identity_conflict | **NOT EXECUTABLE** | — |
| E review_required | **NOT EXECUTABLE UNDER CURRENT CONSTRAINTS** | — |
| E2E-08 / E2E-09 | **DEFERRED** | — |

---

## DATABASE

| Item | Result |
|---|---|
| Created/linked rows | none |
| Cleanup | N/A (zero writes); residue check = 0 |
| Grants | unchanged (see matrix below) |
| RLS | unchanged |

### service_role matrix (read-only verify after run)

| table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| clients | yes | yes | yes | no |
| onboarding_cases | yes | yes | no | no |
| intake_submissions | yes | yes | no | no |
| config_versions | no | yes | no | no |
| idempotency_keys | no | no | no | no |
| workflow_events | no | no | no | no |
| RPC `request_client_transition` | EXECUTE = yes | | | |

---

## MAKE

| Item | Result |
|---|---|
| Activation window | ~2026-08-01T16:11:29Z → deactivate after smoke |
| Final `isActive` | **false** |
| Final `nextExec` | **null** |
| Webhook attached | `2785703` |
| Router 3 final | length filters + native fallback (restored create tree intact) |
| Other scenarios changed | none observed |

---

## SECURITY

- Grants unchanged; no DELETE for Make path  
- RLS unchanged  
- `apply_authorized=false`  
- Supabase MCP remained read-only for verification (no write window needed — no rows to clean)  
- Sun Pool / production / Paradise untouched  

---

## TESTS

| Suite | Result |
|---|---|
| onboarding | **54/54** |
| factory-contract | **46/46** |
| safety | **31/31** |
| QA | **9/9** |
| GHL static | **2/2** (unittest module) |
| ClickUp static | **2/2** (unittest module) |
| provisioning | **7/7** |
| brand:guard | **PASS** |

**151 passed / 0 failed** + brand:guard PASS.

---

## CURRENT P2 STATUS

**Incomplete.**

Remaining gates:

1. Authorize a follow-up blueprint-only fix so empty idempotency GET (`length(2.body)==0` in mapper) matches `not_replay` under Make Router filter evaluation (inspect live module-2 bundle; do not speculate in the same run as this evidence)
2. Nested modules 5–8 still use literal `"[]"` text compares — remains a latent gate after length-0 routing works
3. GHL Form 1 live path still open
4. `review_required` uniqueness waiver still required for Case E

---

## NEXT OWNER DECISION (exactly one)

Authorize a **docs/blueprint-only** investigation+patch of Router 3 empty-length filter matching on scenario `4852018` using the live module-2 bundle from execution `146345b0dc8f4fa4a55929114bdabe51` (mapper already shows `body_length=0` while `numeric:equal 0` did not match), then re-run CREATE smoke. Do not broaden grants. Do not convert to If-else in that pass unless separately authorized.

---

## VERDICT

**FAILED** — restore + native fallback applied and statically verified; CREATE smoke hard-stopped on empty-length filter non-match (fallback path); zero residue; P2 incomplete.
