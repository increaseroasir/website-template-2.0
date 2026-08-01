---
document_owner: integrator
status: canonical
last_reviewed_at: 2026-08-01T23:28:05Z
lesson_statuses:
  - Open
  - Mitigated
  - Enforced
  - Waived
  - Superseded
---

# HTL Factory Lessons Ledger

Permanent failure knowledge for factory agents. Status vocabulary is **only**:

| Status | Meaning |
|---|---|
| **Open** | Active problem or no prevention mechanism |
| **Mitigated** | Corrected in current implementation, not mechanically prevented |
| **Enforced** | Automated test, lint, static check, or architectural control prevents recurrence |
| **Waived** | Explicitly accepted with documented rationale |
| **Superseded** | Replaced by a stronger architectural rule |

Never use “Closed.” Mark **Enforced** only when a mechanical control exists.

---

## LESSON-001 — Never compare Make bodies to literal `"[]"`

| Field | Value |
|---|---|
| Date | 2026-07-31 |
| Observed failure | Empty-array body checks against literal `"[]"` missed real empty results; routes misfired |
| Root cause | Make serializes / coerces empty collections inconsistently; string equality to `"[]"` is not a reliable emptiness test |
| Bad fixes attempted | Adding more string-equality variants for empty arrays |
| Permanent rule | Use `length(...)` (with proven text/numeric operators) for empty/single/multi; never compare bodies to literal `"[]"` |
| Required test | Static scan of current blueprint for `"[]"` body compares (when a canonical current snapshot exists) |
| Status | Mitigated |
| Evidence link | `artifacts/agent-runs/integrator/20260731T203300Z-form1-create-or-link-blueprint.md` |

---

## LESSON-002 — Prove `length()` text vs numeric comparison

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Nested identity filters treated empty/single incorrectly when wrong operator type was assumed |
| Root cause | Make `length(...)` may be compared as text or numeric depending on module/filter; assumptions without proof fail |
| Bad fixes attempted | Blindly switching all comparisons to numeric (or all to text) without live/static proof |
| Permanent rule | Prove text vs numeric for each `length(...)` site before shipping; document the proven operator per filter family |
| Required test | Filter proof fixtures / smoke for empty=`0` and single=`1` on nested lookups |
| Status | Mitigated |
| Evidence link | `artifacts/agent-runs/integrator/20260801T173241Z-form1-nested-length-filter-fix-smoke.md` |

---

## LESSON-003 — Never AND dual type equals for same length predicate

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Link branches missed (ops diverted to Else module 78) despite exactly one match |
| Root cause | AND of `text:equal "1"` with `numeric:equal "1"` on the same `length(...)` never both true |
| Bad fixes attempted | Keeping dual equals “for safety” |
| Permanent rule | One type equality per length predicate. Link length=`1` uses `text:equal "1"` only |
| Required test | Blueprint static assert: zero `numeric:equal "1"` on link length=`1` filters |
| Status | Mitigated |
| Evidence link | `artifacts/agent-runs/integrator/20260801T194942Z-form1-link-predicate-fix-and-e2e.md` |

---

## LESSON-004 — BasicRouter fallback may dual-fire → BasicIfElse first-match

| Field | Value |
|---|---|
| Date | 2026-07-31 |
| Observed failure | Fallback / merge paths dual-fired or unclassified identity outcomes |
| Root cause | BasicRouter + BasicMerge fallback semantics are not exclusive first-match |
| Bad fixes attempted | Adding BasicMerge after Router to “reunite” routes |
| Permanent rule | Use `builtin:BasicIfElse` first-match for identity resolution; Else → unclassified only; omit BasicMerge for this path |
| Required test | Static blueprint: Module 9 = BasicIfElse; no BasicMerge on identity path |
| Status | Mitigated |
| Evidence link | `docs/make/P2-form1-scenario.md` |

---

## LESSON-005 — Never assume a Make function exists (`parseJSON`)

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | LINK config map HTTP 500: `Function 'parseJSON' not found!` |
| Root cause | Blueprint used `get(parseJSON(...))` but `parseJSON` is not a valid IML function in this scenario runtime |
| Bad fixes attempted | Downstream unwrap expressions assuming parse helpers exist |
| Permanent rule | Never invent Make IML functions. Prove function availability in a no-op or documented runtime before use. Refuse further parseJSON patches |
| Required test | Current-blueprint forbidden-pattern scan for `parseJSON(` (when snapshot exists); live E2E must not depend on unverified IML |
| Status | Open |
| Evidence link | `artifacts/agent-runs/integrator/20260801T230505Z-form1-config-unwrap-fix-e2e09.md` |

---

## LESSON-006 — Verify stored JSON type at DB boundary (`jsonb_typeof`)

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Prior GET `config->>field` returned empty; merge appeared to clear values |
| Root cause | Column is jsonb but value is a JSON **string**; `->>` does not navigate into stringified JSON |
| Bad fixes attempted | Changing only Make reader expressions (`ifempty` / unwrap) without proving DB type |
| Permanent rule | After every CREATE config write in acceptance, assert `jsonb_typeof(config)='object'`. Reader fixes are invalid until type is correct |
| Required test | `config/form1-runtime-invariants.json` + `tests/qa/form1-config-jsonb-typeof.invariant.test.mjs`; live SQL on CREATE |
| Status | Open |
| Evidence link | `artifacts/agent-runs/integrator/20260801T223500Z-form1-null-omit-merge-fix-e2e09.md` |

---

## LESSON-007 — Do not double-encode JSONB; repair write boundary

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | CREATE stores `jsonb_typeof(config)='string'`; E2E-09 cannot retain reported fields on LINK |
| Root cause | Write path stringifies an already-JSON payload into jsonb (double-encode) |
| Bad fixes attempted | Downstream parse/unwrap on LINK mappers; ifempty over prior GET |
| Permanent rule | Store `config` as a native JSON object at the write boundary. Remove parse/unwrap approaches. Prove object type on CREATE, then E2E-09 only |
| Required test | Live `jsonb_typeof(config)='object'` on CREATE + E2E-09 PASS |
| Status | Open |
| Evidence link | `artifacts/agent-runs/integrator/20260801T230505Z-form1-config-unwrap-fix-e2e09.md` |

---

## LESSON-008 — Distinguish missing / null / `""` / `"null"` / `[]` / `{}`

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Null-omit / merge treated empty string as authoritative clear of prior reported values |
| Root cause | Collapse of distinct empty-ish values into one “falsy” branch |
| Bad fixes attempted | Broad `ifempty` without separating omit vs clear vs empty-string |
| Permanent rule | Treat missing, JSON null, `""`, string `"null"`, `[]`, and `{}` as distinct; define merge rules per type; omit must not clear |
| Required test | E2E-09 null_does_not_clear + unit merge fixtures for each empty-ish shape |
| Status | Open |
| Evidence link | `docs/qa/FORM1_E2E_ACCEPTANCE_MATRIX.md` (E2E-09) |

---

## LESSON-009 — Do not patch downstream readers when writers store wrong type

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Multiple authorized reader-side patches (ifempty, bare config GET, parseJSON unwrap) while CREATE still double-encodes |
| Root cause | Treating a write-boundary type bug as a mapping expression bug |
| Bad fixes attempted | Prior GET remap; `get(parseJSON(...))`; ifempty chains |
| Permanent rule | If stored type is wrong, fix the writer. Refuse further downstream unwrap/parse patches as repeats of this lesson |
| Required test | Gate: no new reader-only patches while `verified_live` for object storage is false |
| Status | Open |
| Evidence link | `artifacts/agent-runs/integrator/20260801T230505Z-form1-config-unwrap-fix-e2e09.md` |

---

## LESSON-010 — No GHL/real E2E until synthetic CREATE/LINK/REPLAY/CONFLICT green

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Pressure to start GHL Form 1 while null-retention / config type still failing |
| Root cause | Coupling product CRM wiring to unfinished synthetic gate |
| Bad fixes attempted | Planning GHL field IDs / webhook wiring in parallel as if Form1 gate were closed |
| Permanent rule | CREATE / LINK / REPLAY / IDENTITY_CONFLICT must be green before GHL/real E2E. Form1 synthetic gate (incl. E2E-09) still open → GHL remains blocked |
| Required test | Matrix gate + EXECUTION_STATE must show synthetic GO before GHL auth |
| Status | Mitigated |
| Evidence link | `docs/EXECUTION_STATE.md` |

---

## LESSON-011 — Every activation restores inactive + active-count baseline

| Field | Value |
|---|---|
| Date | 2026-07-31 |
| Observed failure | Risk of leaving scenario active or consuming permanent capacity |
| Root cause | Temporary activate without hard restore checklist |
| Bad fixes attempted | Relying on memory / chat to deactivate |
| Permanent rule | Every activate window ends with `isActive=false`, `nextExec=null`, active-count restored, residue 0 — recorded in evidence |
| Required test | E2E cleanup section + EXECUTION_STATE idle confirmation |
| Status | Mitigated |
| Evidence link | `artifacts/agent-runs/integrator/20260801T230505Z-form1-config-unwrap-fix-e2e09.md` |

---

## LESSON-012 — Do not weaken UNIQUE for unreachable `review_required`

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Multi-match `review_required` hard to force under UNIQUE slug/key |
| Root cause | DB uniqueness prevents the multi-row fixture the branch needs |
| Bad fixes attempted | Proposals to drop UNIQUE to make E2E-07 pass |
| Permanent rule | Do not weaken UNIQUE constraints to chase a test. Owner may **Waive** E2E-07 with residual risk documented |
| Required test | Waiver recorded in matrix; multi branches retained statically |
| Status | Waived |
| Evidence link | `artifacts/agent-runs/integrator/20260801T221625Z-form1-e2e-03-04-08-09-and-waiver.md` |

---

## LESSON-013 — One canonical repo/branch only

| Field | Value |
|---|---|
| Date | 2026-07-30 |
| Observed failure | Agents targeting wrong remotes / legacy `ssaofficial` / local `website-template-2.0` |
| Root cause | Multiple clones and remotes with similar names |
| Bad fixes attempted | Proceeding when remote “looks right” |
| Permanent rule | Origin must be `increaseroasir/website-template-2.0`. Wrong remote → **WRONG REPOSITORY** stop. Branch from integrator direction (`factory/p2-integration-reconcile` for this work) |
| Required test | AGENTS.md + safety hooks; CI agent check if/when present (then promote Enforced) |
| Status | Mitigated |
| Evidence link | `AGENTS.md` |

---

## LESSON-014 — Do not trust stale checklists over live evidence

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Docs claimed green paths while live E2E-09 still FAIL / gate open |
| Root cause | Checklists updated aspirationally or left stale after FAIL |
| Bad fixes attempted | Closing gates from static blueprint quality alone |
| Permanent rule | Live evidence > checklists. Hierarchy: Constitution → BUILD_BRAIN → EXECUTION_STATE → matrix → LESSONS → artifacts |
| Required test | Agent ingest rule + BUILD_BRAIN conflict rule |
| Status | Mitigated |
| Evidence link | `docs/BUILD_BRAIN.md` |

---

## LESSON-015 — Supabase owns durable state; Make orchestrates; not yet one atomic transaction

| Field | Value |
|---|---|
| Date | 2026-07-31 |
| Observed failure | Multi-module write sequences can leave partial state if a later module fails |
| Root cause | Make orchestrates several Supabase writes; they are not one DB transaction today |
| Bad fixes attempted | Treating Make scenario success as atomic durability |
| Permanent rule | Supabase owns durable factory state. Make orchestrates the current flow. The current Form 1 path is **not** one atomic transaction (multi-write orchestration risk remains). Target architecture moves critical multi-write logic into a transactional RPC or backend operation |
| Required test | Document multi-write risk; future transactional RPC acceptance |
| Status | Mitigated |
| Evidence link | `docs/FACTORY_CONSTITUTION.md` |

---

## LESSON-016 — Architectural bugs need regression assertions

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Same config-type / null-clear class resurfaced across patches |
| Root cause | Fixes without durable invariant records that can block false green |
| Bad fixes attempted | Narrative-only “we won’t do that again” |
| Permanent rule | Architectural bugs require machine-readable invariants + tests. `verified_live` stays false until exec ID + evidence exist |
| Required test | `config/form1-runtime-invariants.json` (`verified_live=false` until proven) |
| Status | Open |
| Evidence link | `config/form1-runtime-invariants.json` |

---

## LESSON-017 — Classify failure local vs systemic vs architectural before next patch auth

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Local expression patches authorized against an architectural double-encode bug |
| Root cause | Skipping failure classification before asking for the next patch |
| Bad fixes attempted | Immediate remap after each FAIL without asking “wrong layer?” |
| Permanent rule | Before next patch authorization: classify **local** (one module), **systemic** (pattern across modules), or **architectural** (wrong storage/boundary). Architectural → write-boundary package, not another reader tweak |
| Required test | Agent startup/completion rule; integrator records classification in evidence |
| Status | Mitigated |
| Evidence link | `docs/BUILD_BRAIN.md` |

---

## LESSON-018 — Documentation assertions are not runtime proof

| Field | Value |
|---|---|
| Date | 2026-08-01 |
| Observed failure | Risk of promoting Form 1 gate on docs/tests that never touch live Make/DB |
| Root cause | Confusing repository contract checks with runtime proof |
| Bad fixes attempted | Scanning historical Markdown/evidence for forbidden patterns as if that proved the live blueprint |
| Permanent rule | Proof levels for config object storage / null retention: (1) contract says JSON object, (2) blueprint sends JSON object, (3) database reports `jsonb_typeof(config)='object'`, (4) E2E-09 proves null retention. Never promote a live gate on documentation tests alone. Do not scan historical evidence/Markdown for forbidden patterns as live proof |
| Required test | Invariant record with `verified_live=false` until levels 3–4 attach; limited static scan only on canonical *current* blueprint snapshots |
| Status | Open |
| Evidence link | `config/form1-runtime-invariants.json` |

---

## Status index

| ID | Status |
|---|---|
| LESSON-001 | Mitigated |
| LESSON-002 | Mitigated |
| LESSON-003 | Mitigated |
| LESSON-004 | Mitigated |
| LESSON-005 | Open |
| LESSON-006 | Open |
| LESSON-007 | Open |
| LESSON-008 | Open |
| LESSON-009 | Open |
| LESSON-010 | Mitigated |
| LESSON-011 | Mitigated |
| LESSON-012 | Waived |
| LESSON-013 | Mitigated |
| LESSON-014 | Mitigated |
| LESSON-015 | Mitigated |
| LESSON-016 | Open |
| LESSON-017 | Mitigated |
| LESSON-018 | Open |
