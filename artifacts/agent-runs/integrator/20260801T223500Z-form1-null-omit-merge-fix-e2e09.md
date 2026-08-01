# Form 1 null-omit merge fix — E2E-09 verification

**UTC:** 20260801T223500Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Tip at start:** `ddcbda55`  
**Repo:** `increaseroasir/website-template-2.0`  
**Scenario:** `4852018`  
**Webhook:** `2785703` / `https://hook.us1.make.com/3kbchattgqyafd0sqb8xdod3deayksto`  
**Connection:** `4834536`  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`  
**Run ID:** `HTL-E2E-20260801-183317-e2e09`  
**Contract / schema:** `0.2.0` / `1.1.0`  
**Authorization:** temporary activate 4852018 for E2E-09 synthetic only; **no second blueprint patch**; `apply_authorized` stays false; no GHL  
**Debug log:** `.cursor/debug-661443.log` sessionId `661443` runId `post-fix`

---

## DIAGNOSIS

Prior authorized patch added `ifempty(trim(incoming); prior.body[1].field)` on link config inserts (modules **33 / 43 / 53**) with prior GETs (modules **36 / 46 / 56**) selecting:

`website_reported_status:config->>website_reported_status` (and five siblings).

**Root cause of continued clear:** `config_versions.config` is stored as a **JSON string inside jsonb** (double-encoded). PostgREST `config->>field` therefore returns empty/null. Module 36/46/56 priors resolve empty → `ifempty` falls through to empty → new link config writes `""` for all six reported fields.

Create path (module **74**) still maps `{{1.*}}` directly and was unchanged (confirmed).

**Static override note (no live override run):** meaningful non-empty incoming would win via `ifempty` (first arg when non-empty after `trim`). Expression alone proves override; omit-path failed because prior arg was empty due to encoding, not because `ifempty` prefers empty.

Hard rule honored: **no second blueprint patch** after E2E-09 FAIL.

---

## PATCH SUMMARY (prior authorized work; not re-applied this run)

| Item | Value |
|---|---|
| Target modules | Prior GET **36/46/56**; config insert **33/43/53** |
| Create module 74 | Unchanged |
| Expression | `{{ifempty(trim(1.<field>); <36\|46\|56>.body[1].<field>)}}` |
| Static proof | `20260801T223000Z-form1-null-omit-STATIC-PROOF.json` |
| Gap | Prior GET aliases do not unwrap double-encoded `config` |

---

## PREFLIGHT (PASS)

| Check | Result |
|---|---|
| Remote | `increaseroasir/website-template-2.0` |
| Branch | `factory/p2-integration-reconcile` |
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** |
| Modules 36/46/56 | present |
| `ifempty(trim` on 33/43/53 | **true** |
| Create 74 | unchanged (`{{1.website_reported_status}}` style) |
| Leftover `htl-e2e-%` | **0** |
| `apply_authorized` | **false** |

---

## E2E-09 TABLE

| Step | Exec ID | Ops | HTTP | Outcome | client / case / config |
|---|---|---|---|---|---|
| CREATE (six reported populated) | `45c339bd5d494630aca64b7c6e9c56d5` | **13** | 200 | `created` | client `349efc92-038b-4f34-8e91-f91902b68e0e` · case `0a2940ed-cc87-4ecd-a27e-0545d133fad2` · config `41a91770-9939-4876-846a-d5fb019d8656` |
| LINK (omit six; client_id+slug+key agree; new submission_id) | `f9488a90c5dc40c8abf94103d99c39d2` | **13** | 200 | `linked` | same client · new case `97e83334-5e6b-46dd-9aac-83222024caf0` · config `998d3c57-bb4d-48dc-a61e-37eb9df2af61` |

### Reported field proof

| Field | BEFORE (create config) | AFTER (link config) |
|---|---|---|
| `website_reported_status` | `has_website` | `""` |
| `website_reported_url` | `https://retain-me.example.invalid` | `""` |
| `domain_reported_name` | `retain-me.example.invalid` | `""` |
| `domain_reported_ownership_status` | `owns_domain` | `""` |
| `dns_reported_provider` | `route53` | `""` |
| `dns_reported_owner` | `agency` | `""` |

| Assert | Result |
|---|---|
| outcome=linked; same client | **yes** |
| ops > 7 (link path; 13 with prior-config GET) | **yes** (13) |
| Module 78 absent | **yes** (ops=13 link path) |
| Six values equal CREATE; none `""`/null | **FAIL** — all six `""` |
| Form2 ops keys absent | **yes** (null before/after) |
| Hard fail on clear | **triggered** — deactivate + cleanup; **no second patch** |

**E2E-09 result: FAIL**

---

## CLEANUP + IDLE (PASS)

FK-safe delete for run `HTL-E2E-20260801-183317-e2e09` / client `349efc92-…`:  
`status_history` → `workflow_events` → `idempotency_keys` → `config_versions` → `intake_submissions` → null `active_onboarding_case_id` → `onboarding_cases` → `clients`.

| Residue | Count |
|---|---|
| clients / cases / intakes / configs / idem / events / status_history | **0** |

| Make final | Value |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** (preflight; post list briefly Unauthorized — scenario_get confirms idle) |
| Webhook / connection | `2785703` / `4834536` unchanged |
| DLQ / waiting | 0 / false |

Supabase MCP `read_only` restored **true** (home + project).  
`apply_authorized` remains **false**.  
No second blueprint patch; grants/RLS/migrations untouched.

---

## TESTS

| Suite | Result |
|---|---|
| onboarding design-freeze | **54/54** (artifact) + wrappers PASS (4) |
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
- Paradise / Retainer Snapshot untouched  
- No production contacted  
- No GHL / ClickUp / Forms 2–3 / P3  
- No secrets exposed / no payload dumps committed  
- Synthetic only (`example.invalid`, `+1555…`, unique slug/key/submissions)

---

## GATES

| Gate | Status |
|---|---|
| Make/Supabase Form 1 synthetic acceptance | **NOT CLOSED** (E2E-09 still FAIL) |
| GHL Form 1 build | **BLOCKED** until GO |
| Full P2 complete | **no** |
| E2E-07 | **WAIVED** (unchanged) |

---

## NEXT OWNER DECISION

Authorize a **targeted inactive** blueprint fix so prior-config GET (36/46/56) returns unwrapped reported fields from double-encoded `config` (or store `config` as a jsonb object, not a string), then re-run **E2E-09 only**. Do **not** start GHL until that returns GO. Do not weaken UNIQUE / do not re-open E2E-03/04/08.
