# Parallel Agent Work Plan

**Checkpoint:** 20260801T014500Z  
**Purpose:** Save wall-clock while Make capacity is blocked — without five agents editing the same kitchen drawer.  
**Do not launch agents until owner confirms capacity decision path and worktrees are created.**

Supersedes overlapping sections of [`MULTI_AGENT_DELIVERY_MODEL.md`](MULTI_AGENT_DELIVERY_MODEL.md) for the next sprint. File ownership baseline: [`AGENT_FILE_OWNERSHIP.md`](AGENT_FILE_OWNERSHIP.md).

---

## Should Parallel CLI be used now?

**Yes — for research/extract and separate worktree agents after setup.**  
**No — do not launch a fleet during capacity chaos without exclusive branches.**

Parallel CLI (`parallel-cli` v0.7.1, org Increaseroas) is installed and authenticated. Use it for web/docs research inside lanes. Do **not** use it as a substitute for Make/GHL/ClickUp live APIs.

---

## Integrator-owned exclusives (never concurrent)

| Path / object | Only editor |
|---|---|
| `docs/EXECUTION_STATE.md` | integrator |
| `config/identity-fields.json` | integrator (or Contract lane after explicit handoff) |
| `config/onboarding-field-mappings.json` | integrator handoff only |
| `config/state-machine.json` | integrator / Contract |
| `supabase/migrations/**` | Contract/DB only with land-not-apply unless authorized |
| Make scenario `4852018` | Make readiness lane only (after owner auth) |

---

## Fleet shape (5 agents + integrator)

| # | Role | Branch | Worktree path (suggested) | Starts now? |
|---|---|---|---|---|
| 0 | Integrator | `factory/p2-integration-reconcile` | main checkout | yes (orchestration) |
| A | Make readiness | `factory/p2-make-e2e-readiness` | `../wt-p2-make-e2e` | yes (docs/matrix only) |
| B | GHL inventory | `factory/p2-ghl-inventory` | `../wt-p2-ghl` | yes (read-only + specs) |
| C | ClickUp inventory | `factory/p2-clickup-spec` | `../wt-p2-clickup` | yes (spec only) |
| D | QA / red team | `factory/p2-qa-form1` | `../wt-p2-qa` | yes (review artifacts) |
| E | P3 readiness | `factory/p2-p3-readiness` | `../wt-p2-p3` | yes (checklist only) |

Create worktrees from `e89ba944` (or later integration tip):

```bash
git fetch origin
git worktree add -b factory/p2-make-e2e-readiness ../wt-p2-make-e2e origin/factory/p2-integration-reconcile
git worktree add -b factory/p2-ghl-inventory ../wt-p2-ghl origin/factory/p2-integration-reconcile
git worktree add -b factory/p2-clickup-spec ../wt-p2-clickup origin/factory/p2-integration-reconcile
git worktree add -b factory/p2-qa-form1 ../wt-p2-qa origin/factory/p2-integration-reconcile
git worktree add -b factory/p2-p3-readiness ../wt-p2-p3 origin/factory/p2-integration-reconcile
```

---

## Lane definitions

### Lane A — Make capacity + E2E readiness

| | |
|---|---|
| Agent | Make readiness |
| Writable | `docs/make/**`, `artifacts/agent-runs/make-readiness/**` |
| Forbidden | Activate scenario; send webhooks; pause live scenarios; edit identity/mappings/migrations; EXECUTION_STATE |
| Inputs | `docs/make/P2-form1-scenario.md`, AFTER snapshot JSON, capacity evidence |
| Outputs | E2E matrix; capacity options brief; preflight checklist |
| Tests | Static path proofs only until auth |
| Dependencies | Owner capacity decision before activate |
| Owner gate | Capacity + synthetic E2E authorization |
| Merge order | After E2E evidence → integrator merges notes; scenario ops stay integrator-supervised |
| Duration | 0.5–1 day prep; 2–4h E2E when unblocked |

### Lane B — GHL read-only inventory + build spec

| | |
|---|---|
| Agent | GHL inventory |
| Writable | `artifacts/agent-runs/ghl-inventory/**`, `docs/make/P2-ghl-forms-dependency.md` (notes only), optional draft under `docs/onboarding/GHL_*_SPEC.md` |
| Forbidden | `create_form` / `update_form` / custom field creates; Paradise; Sun Pool; Retainer Snapshot; contract JSON |
| Inputs | Location `wTkbEAsxM73C2gLNpdi8`; checkpoint inventory (3 forms, 50 Store Onboarding fields, 4 workflows) |
| Outputs | Gap map vs Form1/2/3 contract; build/optimize plan; webhook wiring plan to `2785703` |
| Tests | None live; mapping completeness notes only |
| Dependencies | None for inventory; live create needs owner auth |
| Owner gate | GHL create/optimize authorization |
| Merge order | Spec PR before any live create PR |
| Duration | 4–8h |

### Lane C — ClickUp inventory + template spec

| | |
|---|---|
| Agent | ClickUp |
| Writable | `docs/onboarding/CLICKUP_*.md`, `config/onboarding-clickup.json` **only for non-live pending fields / comments**, `artifacts/agent-runs/clickup/**` |
| Forbidden | Inventing real workspace/list/template IDs; treating ClickUp as lifecycle SoT; live creates |
| Inputs | Existing ClickUp structure docs; connector status |
| Outputs | Master task + subtasks + statuses + timer rules + minimal fields ready to create |
| Tests | Spec review only |
| Dependencies | Connector availability |
| Owner gate | ClickUp connect + template create |
| Merge order | Spec before live IDs fill |
| Duration | 3–6h |

### Lane D — QA / red team

| | |
|---|---|
| Agent | QA |
| Writable | `artifacts/agent-runs/qa/**` only |
| Forbidden | All `config/**`, migrations, Make live, GHL live, EXECUTION_STATE |
| Inputs | AFTER blueprint, create-or-link evidence, safety tests, stale-doc list |
| Outputs | Red-team report: match order, fail-closed, idempotency, protected-client leakage, SoT contradictions |
| Tests | Re-run local suites; no live E2E |
| Dependencies | None |
| Owner gate | None for review; findings may block E2E auth |
| Merge order | Findings consumed by integrator before E2E |
| Duration | 3–6h |

### Lane E — P3 design readiness

| | |
|---|---|
| Agent | P3 readiness |
| Writable | `artifacts/agent-runs/p3-readiness/**`, notes on `docs/onboarding/PROVISIONING_READY.md` / `docs/work-packages/P3-provision.md` if clarifying only |
| Forbidden | Any provision, snapshot share, Cloudflare project, GHL sub-account create, production |
| Inputs | P3 work package; approval model; fake-client requirements |
| Outputs | Fake-client provisioning checklist + required IDs/approvals list |
| Tests | None live |
| Dependencies | P2 E2E preferred before any P3 auth |
| Owner gate | P3 authorization (later) |
| Merge order | Checklist only until P2 done |
| Duration | 2–4h |

---

## Integration order

1. QA findings (D) reviewed by integrator  
2. Make E2E (A) after owner capacity+auth — integrator supervises activate/cleanup  
3. GHL spec (B) merge → wait for GHL auth → live create on separate PR  
4. ClickUp spec (C) merge → wait for connect auth  
5. P3 checklist (E) held until P2 complete  
6. Integrator updates `EXECUTION_STATE` only after verified gates  

## Stop conditions (any agent)

- Sun Pool / Paradise / Retainer Snapshot appears in writable scope  
- Urge to edit integrator-exclusive files  
- Make activation without written owner auth  
- Same test fails twice without new evidence → **BLOCKED**  
- Secret value would be written to Git → stop  

## Expected time saved

| Parallel set | vs serial |
|---|---|
| B + C + D + E while waiting on Make capacity | **~1–2 days wall-clock** |
| Spec complete before E2E finishes | GHL/ClickUp start same day as E2E green |

## Exact starter prompts (copy when launching)

### Make readiness

```text
Lane A only. Branch factory/p2-make-e2e-readiness. Read docs/make/P2-form1-scenario.md and artifacts/.../20260731T203300Z-form1-create-or-link-*. Prepare synthetic E2E matrix (create/link/replay/identity_conflict/review_required) and capacity brief. Do not activate Make, send webhooks, or pause scenarios. Writable: docs/make/** and artifacts/agent-runs/make-readiness/** only.
```

### GHL inventory

```text
Lane B only. Branch factory/p2-ghl-inventory. Location wTkbEAsxM73C2gLNpdi8 read-only. Map existing Store Onboarding form/fields/workflows vs contract Form1/2/3. Produce build/optimize spec and webhook plan to Make 2785703. No creates/updates. Do not touch Paradise, Sun Pool, or Retainer Snapshot.
```

### ClickUp

```text
Lane C only. Branch factory/p2-clickup-spec. Confirm connector; do not invent live IDs. Produce minimal master-task template spec from docs/onboarding/CLICKUP_*.md. ClickUp is not lifecycle SoT. No live creates.
```

### QA

```text
Lane D only. Branch factory/p2-qa-form1. Red-team Form1 create-or-link blueprint and SoT contradictions. Writable artifacts/agent-runs/qa/** only. Re-run local tests. No live platforms. No config edits.
```

### P3 readiness

```text
Lane E only. Branch factory/p2-p3-readiness. Produce fake-client provisioning checklist from P3 docs. No live provisioning, snapshots, Cloudflare, or GHL sub-accounts.
```
