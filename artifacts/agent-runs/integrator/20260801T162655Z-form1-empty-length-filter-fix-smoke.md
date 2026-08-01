# Form 1 empty-length Router filter fix + CREATE smoke

**UTC:** 20260801T162655Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Start tip:** `16946b6c613f179514ba6f098bc15c20f1b35261`  
**Scenario:** `4852018`

---

## FILTER DIAGNOSIS

| Evidence | Value |
|---|---|
| Prior exec | `146345b0dc8f4fa4a55929114bdabe51` |
| Detail API | `executions_get-detail` → `{status:SUCCESS}` only (no formal type label) |
| Mapper render | `"body_length":"0"` |
| Prior route | native fallback; ops=3; zero DB rows |
| Saved not_replay (before) | `{{length(2.body)}}` `numeric:equal` `"0"` |
| Working length filters (same scenario) | `{{length(N.body)}}` `numeric:equal`/`greater` `"1"` (never `"0"`) |
| Shape comparison | Same `a`/`o` family as working numerics; only material empty-branch difference was `"0"` |

**Why old filter did not match (pre-patch):** `numeric:equal "0"` did not select `not_replay` despite mapper length rendering `"0"`.

**Authorized default patch applied:** empty/one → `text:equal`; multi → keep `numeric:greater "1"`.

---

## PATCH (single inactive update)

| Route | Old | New |
|---|---|---|
| not_replay | `length(2.body)` `numeric:equal` `"0"` | `length(2.body)` `text:equal` `"0"` |
| replay | `length(2.body)` `numeric:equal` `"1"` | `length(2.body)` `text:equal` `"1"` |
| integrity | `length(2.body)` `numeric:greater` `"1"` | unchanged |
| fallback module 78 | `fallback:true` | preserved |

- Modules changed: Router 3 filter objects on modules 5 / 4 / 77 only  
- Modules 5–8 nested identity filters: **unchanged** (SHA match)  
- Module 70 present; no PLACEHOLDER  
- Verify: `20260801T162655Z-form1-empty-length-UPDATE-VERIFY.json`

---

## CREATE SMOKE

| Item | Value |
|---|---|
| Run ID | `HTL-E2E-20260801-165802` |
| Execution ID | `17dcae12690b4bfe89f04dc0ce1be1a8` |
| Timestamp | `2026-08-01T16:58:06.469Z` |
| Duration | 2049 ms |
| Operations | **7** (prior failure was **3**) |
| Centicredits | 700 |
| HTTP | 500 |
| Response body | still `idempotency_lookup_unclassified` / `body_length":"0"` |
| DB rows | **0** |

### Classification (Outcome B — with dual-route caveat)

- Ops **7** ≈ webhook + idempotency GET + modules **5+6+7+8** + one respond → execution **entered create-or-link lookups** (Router 3 `not_replay` progressed beyond prior 3-op fallback-only failure).
- Zero client/case/intake/config rows → nested create path did **not** write (consistent with modules 5–8 / create_new still using literal `"[]"` text compares).
- HTTP body still from module **78** fallback respond → Make also emitted the fallback WebhookRespond (sibling route), so the client saw unclassified even though lookup modules ran.
- **No second patch** this run.

Exact nested failing filter not exposed by detail API; next gate targets nested empty-detection on modules 5–8 / create_new (`text:*` vs `"[]"`), plus confirming Router 3 fallback exclusivity when `not_replay` matches.

---

## RESTORE

| Check | Result |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Webhook | `2785703` attached |
| Residue | **zero** |
| Other scenarios | none changed |
| Grants | unchanged (no DELETE) |
| RLS | unchanged |
| `apply_authorized` | **false** |
| Supabase MCP | read-only |

---

## TESTS

54 + 46 + 31 + 9 + GHL exit0 + ClickUp exit0 + 7 + brand:guard PASS → **151/151** + brand:guard.

---

## NEXT OWNER GATE (exactly one)

Authorize a blueprint-only fix to nested modules **5–8 / create_new** empty-result detection: replace literal `"[]"` text compares with the same parsed-field length pattern used for multi-match (`length(N.body)`), after confirming Router 3 `not_replay` exclusivity so fallback module 78 does not also respond when create-or-link is selected.

---

## VERDICT

**FAILED** (CREATE not completed) — empty-length Router filters advanced execution into modules 5–8 (ops 7); nested empty/`[]` path and/or fallback dual-response blocked create; zero residue; P2 incomplete.
