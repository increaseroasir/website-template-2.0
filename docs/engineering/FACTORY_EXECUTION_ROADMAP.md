# Factory Execution Roadmap

**Checkpoint:** 20260801T014500Z  
**Integration tip:** `e89ba944` on `factory/p2-integration-reconcile`  
**Status:** Form 1 foundation nearly complete; P2 incomplete until synthetic E2E  
**Do not treat this file as authorization** to activate Make, create GHL/ClickUp objects, apply migrations, or provision.

Companion docs:
- [`P2_COMPLETION_CHECKLIST.md`](P2_COMPLETION_CHECKLIST.md)
- [`PARALLEL_AGENT_WORK_PLAN.md`](PARALLEL_AGENT_WORK_PLAN.md)
- Evidence: `artifacts/agent-runs/integrator/20260801T014500Z-factory-checkpoint-audit.md`

---

## Where we are

| Done on integration | Not done |
|---|---|
| Contract `0.2.0` / schema `1.1.0` published in Git | Form 1 synthetic E2E |
| Child tables applied+verified on `htl-factory-dev` | Merge into `factory/p0-safety-lock` |
| Make Form 1 inactive create-or-link blueprint | GHL factory Forms 1/2/3 |
| Safety/contract/onboarding tests green | ClickUp live template |
| | P3+ provisioning |

**Hard gate:** Make org at capacity (last verified **26 active**). Prefer +1 capacity upgrade; do not pause live lead/SMS/Typeform without an owner-named disposable scenario.

---

## Critical path (sequential)

1. Make capacity +1
2. Authorize + run Form 1 synthetic E2E (create / link / replay / conflict / review)
3. Cleanup + return scenario inactive
4. GHL Form 1 product build/optimize → webhook `2785703`
5. Forms 2 and 3
6. ClickUp connect + minimal template
7. Reminders / CSM review wiring
8. Fake-client full onboarding
9. Approve P3 → fake-client provision only

---

## NEXT 24 HOURS

| Item | Owner | Agent | Prerequisite | Deliverable | Acceptance | Risk | Duration |
|---|---|---|---|---|---|---|---|
| Decide Make capacity path | Owner | — | — | +1 slot purchased **or** named disposable scenario ID | Written decision | Pausing wrong live scenario | 15m |
| Export / set Make API token for agents | Owner | integrator | token in env/1P | Read-only poll of `4852018` + active count | `isActive=false`; capacity known | Token leakage | 15m |
| Prepare E2E matrix (no activate) | Owner | Make readiness | capacity decision pending OK | Matrix doc under `artifacts/agent-runs/` | 5 cases defined | Scope creep | 1–2h |
| Launch parallel lanes B/C/D/E worktrees | Owner | integrator | this roadmap | 4 worktrees + branch prompts | No shared writable files | Agents collide on SoT | 30m |
| Stale-doc note only (optional) | — | QA | — | List of stale banners in QA artifact | No silent “fixes” to contract files | Drive-by edits | 30m |

## NEXT 3 DAYS

| Item | Owner | Agent | Prerequisite | Deliverable | Acceptance | Risk | Duration |
|---|---|---|---|---|---|---|---|
| Form 1 synthetic E2E | Owner auth | Make readiness + integrator | capacity + auth | Evidence md + cleanup proof | All 5 outcomes; inactive after; zero residue | Webhook-only regression | 2–4h |
| GHL Form1/2/3 build spec | — | GHL inventory | live inventory (done baseline) | Spec: fields to keep/map/create | No live creates | Wrong form meaning | 4–8h |
| ClickUp template spec | — | ClickUp | connector confirm | Master task + statuses + fields | IDs still pending until auth | Inventing IDs | 3–6h |
| QA red-team Form1 blueprint | — | QA | AFTER snapshot | Findings file | Fail-closed rules intact | False confidence | 3–6h |
| P3 fake-client checklist | — | P3 readiness | design docs | Checklist only | No provision | Premature P3 | 2–4h |

## NEXT 7 DAYS

| Item | Owner | Agent | Prerequisite | Deliverable | Acceptance | Risk | Duration |
|---|---|---|---|---|---|---|---|
| Merge integration → safety-lock | Owner | integrator | E2E green | PR merged | Tests green; base SHA ok | Merging unproven E2E | 1h |
| Authorize GHL Form 1 create/optimize | Owner | GHL | E2E green preferred | Live Form 1 + mapping IDs | Submit→Make→Supabase synthetic | Overwrite Store Onboarding blindly | 1–2d |
| Forms 2/3 design freeze → build | Owner | GHL + Contract | Form1 live path | Forms + Make stubs | Ownership preserved | Form meaning collision | 2–3d |
| ClickUp connect + minimal template | Owner | ClickUp | connector | Live template IDs in config | Supabase remains SoT | ClickUp treated as SoT | 1d |

## LATER / P3+

| Item | Owner | Agent | Prerequisite | Deliverable | Acceptance | Risk |
|---|---|---|---|---|---|---|
| Fake-client full onboarding | Owner | integrator | Forms+ClickUp+Make | End-to-end case | Clean teardown | Real client data |
| P3 provision auth | Owner | — | P2 complete | Signed approval | Scoped fake client only | Production/Sun Pool |
| P4 hydrate / P5 staging / P6 prod | Owner | dedicated | P3 success | Environment gates | Production approval artifact | Fleet premature |
| Close merged feature branches | Owner | integrator | post-merge | Branch cleanup | Remotes tidy | Deleting unique work |

---

## Immediate owner decision (exactly one)

**Increase Make active scenario capacity by one slot**, then authorize the synthetic Form 1 E2E package on scenario `4852018` (no real client data; do not pause live workflows unless you explicitly name a disposable scenario ID).

---

## Merge gate (exact)

Merge `factory/p2-integration-reconcile` → `factory/p0-safety-lock` **after** Form 1 synthetic E2E is green and the scenario is inactive again.  
Do **not** create a release tag at that merge. Keep integration open for GHL/ClickUp follow-on if needed, or open lane branches from the new safety-lock tip.
