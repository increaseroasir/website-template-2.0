# P2 Red-Team Review — Form 1 create-or-link

**UTC:** 20260801T015851Z  
**Agent:** qa (independent red-team)  
**Branch:** `factory/p2-qa-redteam`  
**Base SHA verified:** `b7212fcce21130a08c16d7fafa325066ed6a49b0` (clean tree at start)  
**Remote:** `increaseroasir/website-template-2.0`  
**Live platforms contacted this run:** none  

Claim labels used below: `live_verified_readonly` · `repository_derived` · `prior_evidence_only` · `pending_live_inventory` · `unverified`

---

## Executive verdict

Form 1 create-or-link is **statically aligned** to contract `0.2.0` / schema `1.1.0` with correct match order, forbidden auto-link surfaces absent, fail-closed conflict routes, and replay-before-write. **P2 must remain open** until synthetic E2E proves the five outcomes against live Make + Supabase. Merge of *this QA lane* is fine; merge of P2 as “complete” is not.

**Merge-gate recommendation:** `HOLD_P2_COMPLETE` — see `docs/qa/P2_MERGE_GATE.md`.

---

## Scope / safety

| Check | Result | Evidence label |
|---|---|---|
| Canonical remote | PASS | `repository_derived` |
| Expected base SHA clean | PASS | `repository_derived` |
| Writable only `docs/qa/**`, `artifacts/agent-runs/qa/**`, `tests/qa/**` | PASS (this lane) | `repository_derived` |
| No production / GHL / Make / Supabase writes | PASS | `repository_derived` |
| Protected client tree not mutated | PASS (hook also blocked protected-path read attempts) | `repository_derived` |
| No secret values printed | PASS | `repository_derived` |

---

## 1. Match order `client_id` → `deployment_key` → `client_slug`

| Finding | Status | Label |
|---|---|---|
| AFTER snapshot lookup key order is `client_id`, then `deployment_key`, then `client_slug` | PASS | `prior_evidence_only` (AFTER JSON `20260731T203300Z`) |
| Link routes named `link_by_client_id` / `link_by_deployment_key` / `link_by_client_slug` | PASS | `prior_evidence_only` |
| Docs (`docs/make/P2-form1-scenario.md`) match blueprint | PASS | `repository_derived` |
| Live re-poll of scenario `4852018` this run | NOT DONE | `pending_live_inventory` |

---

## 2. Forbidden auto-link

Never company-match on `ghl_contact_id`, owner email/phone, `business_name`, `domain`, or fuzzy.

| Finding | Status | Label |
|---|---|---|
| No clients filter keys for `owner_email` / `owner_phone` / `business_name` / `domain` / `ghl_contact_id` in AFTER blueprint | PASS | `prior_evidence_only` |
| `ghl_contact_id` appears only as payload/case metadata, not company match | PASS | `prior_evidence_only` |
| `ghl_opportunity_id` bound → `identity_conflict` (engagement, not company match) | PASS | `prior_evidence_only` |

---

## 3. Fail-closed outcomes

| Outcome | Route evidence | Status | Label |
|---|---|---|---|
| `identity_conflict` | disagree / miss / opportunity_bound filters | PASS (static) | `prior_evidence_only` |
| `review_required` | `multi_client_id` / `multi_deployment_key` / `multi_client_slug` | PASS (static) | `prior_evidence_only` |
| `created` only when no id/key/slug/opportunity hits | PASS (static) | `prior_evidence_only` |
| Live execution of conflict paths | MISSING | `pending_live_inventory` |

---

## 4. Replay-before-write

| Finding | Status | Label |
|---|---|---|
| Idempotency GET on `intake_submissions` before create/link | PASS (static) | `prior_evidence_only` |
| Router branch `replay` → `outcome=replayed` with no create/link writes | PASS (static) | `prior_evidence_only` |
| Unit/mocked Form1 duplicate submission idempotent | PASS | `repository_derived` (`tests/factory-contract`) |
| Live duplicate webhook proof | MISSING | `pending_live_inventory` |

---

## 5. Reported vs Form 2 operational

| Form1 reported (config) | Form2 operational | Separation |
|---|---|---|
| `website_reported_status` / `website_reported_url` | `website_url` | Contract notes: reported ≠ operational |
| `domain_reported_name` / `domain_reported_ownership_status` | `domain` | Same |
| `dns_reported_provider` / `dns_reported_owner` | `dns_provider` / `dns_owner` | Same |

| Finding | Status | Label |
|---|---|---|
| `identity-fields.json` ownership split published `0.2.0` | PASS | `repository_derived` |
| Link-path client PATCH body is only `active_onboarding_case_id` (no domain/business overwrite) | PASS | `prior_evidence_only` |
| Reported fields written into intake/config payloads in blueprint | PASS | `prior_evidence_only` |
| Form2 Make scenario / live merge proof | MISSING | `pending_live_inventory` |

---

## 6. `null_does_not_clear`

| Finding | Status | Label |
|---|---|---|
| All six reported mappings set `null_behavior: null_does_not_clear` | PASS | `repository_derived` |
| Mocked merge: Form1 re-intake does not wipe Form2/Form3 | PASS | `repository_derived` |
| Explicit clear requires versioned operation (forms cannot clear) | PASS | `repository_derived` |
| Live Make merge of null reported fields | MISSING | `pending_live_inventory` |

---

## 7. Child table RLS

| Table | Git migration | Remote apply (prior) | RLS posture |
|---|---|---|---|
| `onboarding_employees` | `20260731184500_...` ENABLE RLS, zero policies | remote `20260731193347` | fail-closed |
| `inventory_submissions` | `20260731184600_...` ENABLE RLS, zero policies | remote `20260731193358` | fail-closed |

| Finding | Status | Label |
|---|---|---|
| SQL fail-closed in Git | PASS | `repository_derived` |
| Contract test expects child migrations + fail-closed RLS | PASS | `repository_derived` |
| Live RLS/policy/grant verify | NOT re-run this session | `prior_evidence_only` (`20260731T193500Z`, `20260801T014500Z`) |

---

## 8. Make inactive

| Finding | Status | Label |
|---|---|---|
| AFTER snapshot `isActive: false`, scenario `4852018`, modules `46` | PASS | `prior_evidence_only` |
| Docs state inactive + capacity block (26 active) | PASS | `repository_derived` / `prior_evidence_only` |
| Fresh Make API poll this run | NOT DONE (forbidden live writes; read not authorized in this lane) | `pending_live_inventory` |

---

## 9. Protected clients

| Finding | Status | Label |
|---|---|---|
| `config/protected-clients.json` requires break-glass for protected slug; null UUID is additional protection | PASS | `repository_derived` |
| Safety tests 31/31 (unknown identity, CLI force alone, bulk `clients/*`, production) | PASS | `repository_derived` |
| This lane did not open or mutate protected client content | PASS | `repository_derived` |

---

## 10. Secrets / tooling in Git

| Finding | Status | Label |
|---|---|---|
| Best-effort secret regex over repo (excl. node_modules/.git) | 1 hit — `functions/lib/sheets.js` PEM *parser* for env-provided key (false positive) | `repository_derived` |
| Tracked `clients/hostile-rehearsal/tokens.env` | Hydration/copy tokens + infra IDs (not API private keys); naming is confusing | `repository_derived` |
| Second tracked `tokens.env` under protected client path | Path inventory only — content **not opened** (fail-closed hook) | `repository_derived` (path) / `unverified` (contents) |
| `scripts/lib/google-service-account.mjs` | Reads env; no embedded private key | `repository_derived` |
| JSON configs validated (7/7) | PASS | `repository_derived` |

**Risk:** Tracked `tokens.env` under a protected client path is a process smell even if values are non-secret hydration strings. Owner should confirm contents offline; this agent must not open that tree without break-glass.

---

## 11. Stale SoT wording

| Item | Status | Label |
|---|---|---|
| Integrator cleanup `20260801T014750Z` corrected mappings/registry “migrations_not_applied” / “remains 0.1.1” | PASS for live config | `repository_derived` + `prior_evidence_only` |
| `config/onboarding-field-mappings.json` completeness now says child migrations applied on htl-factory-dev | PASS | `repository_derived` |
| Residual stale banner: `docs/onboarding/PROPOSED_REGISTRY_AND_MAPPING_PATCH.md` line still claims identity-fields “remains 0.1.1” | OPEN (doc drift; outside QA writable scope) | `repository_derived` |
| `docs/engineering/P2_COMPLETION_CHECKLIST.md` still lists stale-doc cleanup as `[~]` | OPEN / meta | `repository_derived` |
| `docs/P0_5_OWNER_SIGNOFF.md` pins historical `0.1.1` | Historical OK if labeled; easy to misread | `repository_derived` |

---

## 12. Missing E2E tests

| Gap | Severity |
|---|---|
| No live synthetic **create / link / replay / identity_conflict / review_required** | **Blocker for P2 complete** |
| No automated test that loads Make AFTER blueprint and asserts route graph (repo has snapshots only) | Medium |
| Mocked `form-merge` tests cover merge/idempotency, not Make routing | Accepted for unit; not a substitute for E2E |

See `docs/qa/FORM1_E2E_ACCEPTANCE_MATRIX.md`.

---

## Local test totals (this run)

| Suite | Result |
|---|---|
| `python3 tests/onboarding/test_design_freeze_acceptance.py` | **54 passed / 0 failed** |
| `node --test tests/factory-contract/*.test.mjs` | **46 passed / 0 failed** |
| `node --test tests/safety/*.test.mjs` | **31 passed / 0 failed** |
| `npm run brand:guard` | **PASS** |
| JSON validation (7 config files) | **7/7 OK** |
| Secret/forbidden-path scan | Best-effort complete (see §10) |

---

## Findings summary

| ID | Severity | Finding | Blocks P2 complete? |
|---|---|---|---|
| F1 | Blocker | Form1 synthetic E2E not run (capacity + authorization) | Yes |
| F2 | High | No live re-poll of Make `isActive`/capacity in this environment | Yes (freshness) |
| F3 | Medium | Residual stale “0.1.1 remains” wording in proposed-patch doc | No |
| F4 | Medium | Tracked protected-client `tokens.env` path — contents unverified here | No (process) |
| F5 | Low | Child RLS live verify not re-run this session (prior evidence only) | No if prior trusted |

---

## Confirmations

1. Sun Pool untouched (no mutate/hydrate/deploy; protected-path content not opened).  
2. No production systems contacted.  
3. No secret values exposed in this review.  
4. Canonical config / EXECUTION_STATE / migrations / Make|GHL|ClickUp docs not modified by this lane.
