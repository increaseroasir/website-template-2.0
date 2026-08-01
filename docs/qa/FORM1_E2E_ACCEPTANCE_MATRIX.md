# Form 1 E2E Acceptance Matrix

**UTC:** 20260801T015851Z  
**Agent:** qa  
**Scenario (target):** `4852018` · webhook `2785703` · connection `4834536`  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`  
**Contract / schema:** `0.2.0` / `1.1.0`  
**Current status:** Module 9 BasicIfElse exclusivity live; CREATE smoke PASS (ops=13, outcome=created, module 78 absent); see `artifacts/agent-runs/integrator/20260801T190200Z-form1-module9-exclusivity-and-create-smoke.md`  



Legend: `[ ]` not run · `[x]` pass · `[!]` blocked · `N/A`

Claim labels: `live_verified_readonly` · `repository_derived` · `prior_evidence_only` · `pending_live_inventory` · `unverified`

---

## Preconditions (must be green before any webhook send)

| # | Precondition | Status | Label |
|---|---|---|---|
| P1 | Scenario `4852018` exists; name HTL Factory Form 1 Intake (dev_test) | [x] static | `prior_evidence_only` |
| P2 | `isActive=false` before activation window | [x] last snapshot | `prior_evidence_only` |
| P3 | Fresh Make poll confirms inactive + free active slot (or +1 capacity) | [x] Core + activate OK | `live_verified_readonly` |
| P4 | Owner written authorization for synthetic E2E (activate → send → deactivate) | [x] | `live_verified_readonly` |
| P5 | Supabase target remains `epeddfdifckzzmskhdsz`; `apply_authorized=false` | [x] | `repository_derived` |
| P6 | No GHL / ClickUp modules in blueprint | [x] | `prior_evidence_only` |
| P7 | Synthetic IDs only (`example.invalid`, fake contact/opp) | [x] planned | `repository_derived` |
| P8 | Protected clients out of scope; no real client rows | [x] required | `repository_derived` |

---

## Match / safety invariants (assert on every case)

| Invariant | Assert |
|---|---|
| Match order | Lookups / link preference: `client_id` → `deployment_key` → `client_slug` |
| Forbidden auto-link | No company link from email, phone, `ghl_contact_id`, `business_name`, `domain`, fuzzy |
| Fail-closed | Conflict / multi-match → respond only; no client create |
| Replay-before-write | Idempotency GET before any create/link write |
| Link preservation | Link path does not overwrite clients `domain` / `business_name` / slug / key |
| Reported vs Form2 | Form1 writes `*_reported_*` into intake/config only; Form2 ops fields untouched |
| Null behavior | Null reported fields do not clear existing config values |
| Versions | Responses and rows carry contract `0.2.0` / schema `1.1.0` |
| Inactive return | Scenario returned to `isActive=false`; no leftover schedule |

---

## Case matrix

Use distinct `submission_id` / `correlation_id` per case. Cleanup after suite.

| Case ID | Intent | Key inputs | Expected `outcome` | Allowed writes | Forbidden writes | Status | Label |
|---|---|---|---|---|---|---|---|
| E2E-01 | **create** | New slug + deployment_key; no `client_id`; unique opportunity | `created` | clients insert; onboarding_cases; intake_submissions; config_versions; RPC | GHL/ClickUp; production | **PASS** | `live_verified_readonly` (exec `289d3d94…`; ops=13; module 76 `outcome=created`; module 78 absent; one client/case/intake/config; residue cleaned) |
| E2E-02 | **link by client_id** | Existing synthetic `client_id` (+ agreeing key/slug or omit) | `linked` | new case + intake + config + RPC; clients PATCH `active_onboarding_case_id` only | clients create; overwrite domain/business_name | **READY** | awaiting owner authorization |
| E2E-03 | **link by deployment_key** | Existing key; no `client_id` (or agreeing) | `linked` | same as E2E-02 | clients create; forbidden auto-link | **READY** | awaiting owner authorization |
| E2E-04 | **link by client_slug** | Existing slug; no id/key (or agreeing) | `linked` | same as E2E-02 | clients create | **READY** | awaiting owner authorization |
| E2E-05 | **replay** | Exact same `submission_id` as E2E-01 after success | `replayed` | respond only | any create/link/intake duplicate row | **READY** | awaiting owner authorization |
| E2E-06 | **identity_conflict** | Supplied `client_id` not found OR id/key/slug disagree OR opportunity already bound | `identity_conflict` | respond only | client create; case create | **READY** | awaiting owner authorization |
| E2E-07 | **review_required** | Force multi-row condition for one identifier (dev-only fixture) OR document skip if uniqueness makes multi impossible | `review_required` | respond only | client create | **NOT EXECUTABLE UNDER CURRENT CONSTRAINTS** | UNIQUE slug/key |
| E2E-08 | **forbidden auto-link negative** | Existing client shares owner_email / business_name / domain only; no id/key/slug | `created` (new client) **or** explicit non-link | must **not** `linked` to the email/name/domain peer | company auto-link | **DEFERRED** | not run |
| E2E-09 | **null_does_not_clear** | Link/create then second Form1 with null reported fields (new submission_id) | merge success; prior reported retained | intake append; config merge without clears | wipe Form2 ops; clear reported via null | **DEFERRED** | not run |
| E2E-10 | **cleanup** | Delete/mark synthetic clients/cases/intakes/config for suite IDs | N/A | cleanup only | leave active schedule; leave orphan real data | **PASS** (zero residue after CREATE PASS) | `live_verified_readonly` |

---

## Static proofs already available (not E2E)

| Proof | Location | Label |
|---|---|---|
| Route graph + outcomes list | `artifacts/agent-runs/integrator/20260731T203300Z-form1-create-or-link-AFTER.json` | `prior_evidence_only` |
| Narrative blueprint | `.../20260731T203300Z-form1-create-or-link-blueprint.md` | `prior_evidence_only` |
| Scenario doc | `docs/make/P2-form1-scenario.md` | `repository_derived` |
| Mocked Form1/2/3 merge + idempotency | `tests/factory-contract` | `repository_derived` |
| Design-freeze acceptance | `tests/onboarding/test_design_freeze_acceptance.py` | `repository_derived` |

---

## Pass criteria for “Form 1 E2E green”

1. P1–P8 satisfied with fresh evidence artifact under `artifacts/agent-runs/`.  
2. E2E-01, E2E-02 (or 03/04), E2E-05, E2E-06, and either E2E-07 or documented uniqueness waiver signed by owner.  
3. E2E-08 proves forbidden auto-link.  
4. E2E-09 proves null does not clear (or covered by authorized Form2 follow-up on same case).  
5. E2E-10 cleanup complete; scenario inactive; capacity restored.  
6. No protected-client rows; no production; no secret values in logs.

Until then: **P2 incomplete** regardless of static blueprint quality.
