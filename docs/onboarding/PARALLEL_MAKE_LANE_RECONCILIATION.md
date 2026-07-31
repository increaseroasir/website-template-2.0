# Parallel Make Lane Reconciliation

**Status (historical):** Written during onboarding design freeze as inspect-only documentation for interrupted Make work.  
**Superseded (2026-07-31):** Make lane legalized inactive on `factory/p2-make-intake` @ `cb4cc58`, then merged into `factory/p2-integration-reconcile`. Live IDs below are now **verified inactive** (not activated). See [`docs/make/P2-form1-scenario.md`](../make/P2-form1-scenario.md) and [`docs/EXECUTION_STATE.md`](../EXECUTION_STATE.md).

**Still true:** activation, E2E, GHL wiring, and Forms 2/3 remain unauthorized / incomplete.

Related inventory: [`EXISTING_WORKFLOWS_REVIEW.md`](./EXISTING_WORKFLOWS_REVIEW.md).

## Authorization conflict (design-freeze snapshot — superseded)

At design freeze, [`docs/EXECUTION_STATE.md`](../EXECUTION_STATE.md) still stated P2 Make intake **NOT STARTED**. That wording was corrected when the Make lane was legalized inactive. The conflict below is retained as the freeze-time record only.

## Local branch `factory/p2-make-intake`

| Field | Value |
|---|---|
| Upstream | none (local-only) |
| Tip | `d003a71` |
| Base relative to `9b51c64` | one unique commit ahead of integration tip |

### Unique commit

`d003a71` — `docs(p2): Make inventory, aligned intake spec, Form 1 design`

| File | Classification |
|---|---|
| `artifacts/agent-runs/integrator/20260731T084800Z-p2-make-inventory.md` | verified committed design / evidence |
| `artifacts/agent-runs/integrator/20260731T085000Z-p2-form1-blocker.md` | verified committed design / evidence |
| `docs/make/P2-form1-scenario.md` (as of `d003a71`) | verified committed design — status then: live blueprint create waits on Supabase connection |
| `docs/work-packages/P2-intake-identity.md` | verified committed design (package alignment) |

**Disposition this pass:** safe to preserve as local branch; **unsuitable for merge** into onboarding design-freeze without a later authorized Make reconciliation; **blocked pending live verification**.

## Stash `stash@{0}`

| Field | Value |
|---|---|
| Message | `On factory/p2-make-intake: wip-p2-make-intake-before-design-freeze` |
| Files | `docs/make/P2-form1-scenario.md` only |
| Git ops this pass | none — do not pop / apply / drop |

### Claimed external state in stash delta (unverified live)

| Claim | ID / note | Classification |
|---|---|---|
| Scenario name | `HTL Factory Form 1 Intake (dev_test)` | claimed external state |
| Scenario ID | `4852018` | claimed external state / unverified live state |
| Webhook ID | `2785703` | claimed external state / unverified live state |
| Supabase connection ID | `4834536` | claimed external state / unverified live state |
| Status text | Blueprint wired; inactive; E2E blocked on Make max active scenarios | claimed external state |
| Capacity | Org previously noted ~26 active / 43 total in design inventory | claimed external state |

These IDs also appear in [`EXISTING_WORKFLOWS_REVIEW.md`](./EXISTING_WORKFLOWS_REVIEW.md) as **inactive** documented prototype. That document is inventory, not authorization to activate.

| Item | Classification |
|---|---|
| Stash as unofficial branch tip | authorization conflict with EXECUTION_STATE |
| Merge of stash onto onboarding branch | unsuitable for merge this pass |
| Activation of scenario `4852018` | blocked pending live verification + owner authorization |

## Recommended disposition (this pass)

1. Leave `factory/p2-make-intake` intact.
2. Leave `stash@{0}` intact.
3. Do not merge into `factory/p2-onboarding-forms-and-workflows` or `factory/p0-safety-lock`.
4. Do not activate any Make scenario.
5. Later, under a separately authorized Make lane task: verify live org state against claimed IDs, reconcile docs with EXECUTION_STATE, then decide keep / supersede / archive.

## What this onboarding commit does **not** claim

- Make implementation is complete — **false / not claimed**
- Make is authorized — **false**
- Scenario IDs are production-ready — **false**
- Stash content is the canonical Make design — **no**; committed `d003a71` is the last branch tip; stash may be newer and unverified
