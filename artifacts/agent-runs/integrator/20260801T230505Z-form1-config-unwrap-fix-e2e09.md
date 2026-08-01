# Form 1 config unwrap fix — E2E-09 verification

**UTC:** 20260801T230505Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Tip at start:** `4c879b8`  
**Repo:** `increaseroasir/website-template-2.0`  
**Scenario:** `4852018`  
**Webhook:** `2785703` / `https://hook.us1.make.com/3kbchattgqyafd0sqb8xdod3deayksto`  
**Connection:** `4834536`  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`  
**Run ID:** `HTL-E2E-20260801-230505-e2e09-unwrap`  
**Contract / schema:** `0.2.0` / `1.1.0`  
**Authorization:** temporary activate 4852018 for E2E-09 synthetic only; **no blueprint patch**; `apply_authorized` stays false; no GHL  
**Debug log:** `.cursor/debug-661443.log` sessionId `661443` runId `post-fix`

---

## DIAGNOSIS

Prior authorized unwrap patch (static proof `20260801T224600Z-form1-config-unwrap-AFTER.json`) changed prior GET modules **36/46/56** to select bare `config` and link mappers **33/43/53** to:

`{{ifempty(trim(1.<field>); get(parseJSON(<36|46|56>.body[1].config); "<field>"))}}`

**Live LINK failure:** Make runtime error on config mapping:

`Failed to map 'config': Function 'ifempty' finished with error! Function 'get' finished with error! Function 'parseJSON' not found!`

So the unwrap expression is present in the blueprint but **`parseJSON` is not a valid Make IML function** in this scenario runtime. Hard rule honored: **no blueprint patch** after FAIL.

Create path (module **74**) still maps `{{1.*}}` directly and succeeded (double-encoded `config` confirmed via `jsonb_typeof(config)='string'`).

---

## PATCH SUMMARY (prior authorized work; not re-applied this run)

| Item | Value |
|---|---|
| Target modules | Prior GET **36/46/56** bare `config`; config insert **33/43/53** `get(parseJSON(...))` |
| Create module 74 | Unchanged plain `{{1.*}}` |
| Static proof | `20260801T224600Z-form1-config-unwrap-STATIC-PROOF.json` / `…-AFTER.json` |
| Live gap | `parseJSON` not found at execution time |

---

## PREFLIGHT (PASS)

| Check | Result |
|---|---|
| Remote | `increaseroasir/website-template-2.0` |
| Branch | `factory/p2-integration-reconcile` |
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** |
| Modules 36/46/56 select | `config_version_id,client_id,config_version,created_at,config` |
| `get(parseJSON(` on 33/43/53 | **true** |
| Create 74 | plain `{{1.*}}` (no parseJSON) |
| Leftover `htl-e2e-%` | **0** |
| `apply_authorized` | **false** |
| MCP `read_only` at start | **false** (authorized for synthetic writes) |

---

## E2E-09 TABLE

| Step | Exec ID | Ops | HTTP | Outcome | client / case / config |
|---|---|---|---|---|---|
| CREATE (six reported populated) | `809589b28577410d9447e72f7d69a806` | **13** | 200 | `created` | client `a8be912a-4fc9-40fe-b5bc-d2ae2456d129` · case `d804325d-bb82-48f4-bfb2-c419b30eea0b` · config `e69dcee7-9495-4127-aafe-353c38d67bb8` |
| LINK attempt 1 (reused ghl_opportunity_id) | `7bb20e00e9e345548a9873d3dbac6d84` | **7** | 409 | `identity_conflict` / `ghl_opportunity_id_already_bound` | no new config |
| LINK attempt 2 (omit six; new ghl ids; same client_id+slug+key) | `050235453ba444f9b35c58ac28512ea4` | **11** | 500 | **ERROR** | `DataError`: `parseJSON` not found while mapping `config` |

### Reported field proof (CREATE only — LINK did not write config)

| Field | BEFORE (create config) | AFTER (link config) |
|---|---|---|
| `website_reported_status` | `has_website` | *(no link config row — exec failed)* |
| `website_reported_url` | `https://retain-me.example.invalid` | *(n/a)* |
| `domain_reported_name` | `retain-me.example.invalid` | *(n/a)* |
| `domain_reported_ownership_status` | `owns_domain` | *(n/a)* |
| `dns_reported_provider` | `route53` | *(n/a)* |
| `dns_reported_owner` | `agency` | *(n/a)* |

| Assert | Result |
|---|---|
| CREATE `jsonb_typeof(config)='string'` | **yes** (encoding confirmed) |
| CREATE six values populated / distinct | **yes** |
| LINK outcome=linked; six retained | **FAIL** — Make execution error before successful config insert |
| Exact parse failure text | `Function 'parseJSON' not found!` |
| Hard fail path | **triggered** — deactivate + cleanup; **no blueprint patch** |

**E2E-09 result: FAIL**

---

## CLEANUP + IDLE (PASS)

FK-safe delete for run `HTL-E2E-20260801-230505-e2e09-unwrap` / client `a8be912a-…`:

### Writes
- `UPDATE clients SET active_onboarding_case_id = null` (1 row)

### Deletes
| Table | Rows deleted |
|---|---|
| `status_history` | 1 |
| `workflow_events` | 1 |
| `idempotency_keys` | 1 |
| `config_versions` | 1 |
| `intake_submissions` | 2 |
| `onboarding_cases` | 2 |
| `clients` | 1 |
| `approval_readiness` / `deferrals` / `inventory_submissions` / `onboarding_employees` / `production_approvals` / `sync_failures` | 0 |

| Residue | Count |
|---|---|
| clients / cases / intakes / configs / idem / events / status_history | **0** |

| Make final | Value |
|---|---|
| `isActive` | **false** |
| `nextExec` | **null** |
| Active count | **26** (preflight; deactivate restored idle) |
| Webhook / connection | `2785703` / `4834536` unchanged |
| DLQ / waiting | 0 / false |

Supabase MCP `read_only` restored **true** (home `~/.cursor/mcp.json` + project `.cursor/mcp.json`).  
`apply_authorized` remains **false**.  
No blueprint patch; grants/RLS/migrations untouched.

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
| Make/Supabase Form 1 synthetic acceptance | **NOT CLOSED** (E2E-09 FAIL — `parseJSON` not found) |
| GHL Form 1 build | **BLOCKED** until GO |
| Full P2 complete | **no** |
| E2E-07 | **WAIVED** (unchanged) |

---

## NEXT OWNER DECISION

Authorize a **targeted inactive** blueprint remapping for modules **33/43/53** that unwraps double-encoded prior `config` using a **Make-supported** expression (not `parseJSON` — runtime reports it missing). Candidates for owner approval only: e.g. `parseJSON` alternative available in Make IML for this org, JSON tools module, or store `config` as a jsonb **object** (not string) so `config->>field` works again. Then re-run **E2E-09 only**. Do **not** start GHL until that returns GO. Do not weaken UNIQUE / do not re-open E2E-03/04/08.

---

## DOC UPDATE NOTE

`docs/EXECUTION_STATE.md` could **not** be edited in this session: Cursor pretool returned `docs/EXECUTION_STATE.md is integrator-only` for StrReplace. Intended status lines are in this artifact (GATES / NEXT OWNER DECISION) and should be copied by the integrator session that has EXECUTION_STATE write access.

Other docs updated: `FORM1_E2E_ACCEPTANCE_MATRIX.md`, `P2-form1-scenario.md`, `P2_COMPLETION_CHECKLIST.md`.
