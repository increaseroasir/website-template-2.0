# Make lane reconciliation — read-only verification

**Run id:** `20260731T175936Z-make-lane-reconciliation`  
**Agent:** integrator  
**UTC:** 2026-07-31T17:59:36Z  
**Mode:** read-only — no merge, stash apply, activate, create, or EXECUTION_STATE update  
**Workspace branch:** `factory/p2-onboarding-forms-and-workflows` @ `9ba627d`  
**Remote:** `increaseroasir/website-template-2.0`

## CURRENT MAKE STATE

| Object | ID | Verified live |
|---|---|---|
| Scenario | `4852018` | **yes** |
| Name | `HTL Factory Form 1 Intake (dev_test)` | matches stash naming (no em-dash) |
| Team / org | `442605` / `1111422` | yes |
| Active | **`isActive: false`** | inactive; safe to preserve as inactive |
| Created | `2026-07-31T08:50:34.542Z` | |
| Last edit | `2026-07-31T09:01:36.585Z` | |
| Description | `Form 1 intake wired to htl-factory-dev` | |
| `islinked` | `false` | expected while inactive |
| Hook attachment (scenario) | `hookId: 2785703` | yes |
| Webhook | `2785703` | **yes** |
| Webhook name | `HTL Factory Form 1 Intake (dev_test)` | |
| Webhook URL | `https://hook.us1.make.com/3kbchattgqyafd0sqb8xdod3deayksto` | exists; `gone: false`; `enabled: true` |
| Webhook `scenarioId` | `4852018` | linked in hooks_get |
| hooks_ping `attached` | `false` | consistent with inactive scenario |
| Connection | `4834536` | **yes** |
| Connection name | `HTL Factory Dev (epeddfdifckzzmskhdsz)` | name encodes approved project ref |
| Connection app | Supabase (`accountName: supabase`, basic) | |
| Project ref in API metadata | empty string (credentials not readable) | **name-level verified**; URL secret not exposed |

### Blueprint modules (live)

Ordered flow (inactive):

1. `gateway:CustomWebHook` → hook `2785703`
2. `supabase:makeAnApiCall` GET `intake_submissions` (idempotency) via conn `4834536`
3. `builtin:BasicRouter`
   - dup path → `gateway:WebhookRespond` idempotent
   - new path → `supabase:createARow` clients → onboarding_cases → PATCH clients → intake_submissions → config_versions → RPC `request_client_transition` → WebhookRespond

Packages used: `gateway`, `supabase`, `builtin`.

### Execution history

`executions_list` for `4852018` returned **scenario modify/history events only** (create/edit timestamps). **No scenario run / operations execution records observed.**

| Assessment | Result |
|---|---|
| Test runs of the scenario | **none observed** |
| Real client data processed | **no evidence of runs** |
| DLQ | `dlqCount: 0` |

### Capacity

| Metric | Live count |
|---|---|
| Total scenarios (team `442605`) | **43** |
| Active | **26** |
| Inactive | **17** |

Capacity pressure remains: stash claim that E2E is blocked on max active scenarios is **plausible / still relevant**.

### Safety / authorization of live objects

| Question | Answer |
|---|---|
| Safe to preserve inactive? | **Yes** — do not activate |
| Violates current EXECUTION_STATE text? | **Yes — authorization conflict** (`P2 Make intake: NOT STARTED / NOT AUTHORIZED`) |
| Safe to merge into onboarding branch? | **No** without separate Make authorization + PR |

---

## GIT STATE

| Field | Value |
|---|---|
| Make branch | `factory/p2-make-intake` |
| Tip | `d003a71ce098e44b6bd7b8ff5be38b9198cb5bba` |
| Unique commits vs `origin/factory/p0-safety-lock` | **1** (`d003a71`) |
| Remote tracking branch | **none** (local-only) |
| Merge-base with current HEAD | `9b51c64` |
| Checkout performed | **no** |

### Branch-only files (`d003a71`)

| Path | Role |
|---|---|
| `artifacts/agent-runs/integrator/20260731T084800Z-p2-make-inventory.md` | inventory evidence |
| `artifacts/agent-runs/integrator/20260731T085000Z-p2-form1-blocker.md` | blocker + early live IDs |
| `docs/make/P2-form1-scenario.md` | design (pre-wire status) |
| `docs/work-packages/P2-intake-identity.md` | package alignment |

### Stash-only (`stash@{0}`)

| Field | Value |
|---|---|
| Message | `On factory/p2-make-intake: wip-p2-make-intake-before-design-freeze` |
| Files | `docs/make/P2-form1-scenario.md` only |
| Delta | Adds live IDs; marks create steps 1–3 done; notes inactive + capacity blocker; renames scenario (drops em dash) |

**Stash not popped/applied/dropped.**

---

## MISMATCHES

### Docs vs branch

| Claim | Classification |
|---|---|
| Committed `P2-form1-scenario.md`: “waits on Supabase connection” | **stale** vs live (connection + wired blueprint exist) |
| Inventory artifact: no Supabase connection yet | **stale** (true at inventory time; superseded) |
| Blocker artifact: credential pending; skeleton scenario | **partially stale** — webhook/scenario IDs still true; wiring advanced after blocker |

### Branch vs stash

| Claim | Classification |
|---|---|
| Scenario name with em dash (`HTL Factory — Form 1…`) on branch tip | **verified_false** vs live name without em dash |
| Stash name without em dash | **verified_true** |
| Stash: blueprint wired + inactive + capacity blocker | **verified_true** (inactive + capacity pressure confirmed; blueprint has Supabase modules) |
| Branch tip create-order still “to do” | **stale** |

### Stash vs live Make

| Claim | Classification |
|---|---|
| Scenario `4852018` exists | **verified_true** |
| Webhook `2785703` exists | **verified_true** |
| Connection `4834536` exists | **verified_true** |
| Inactive | **verified_true** |
| E2E blocked on max active | **unverified** as hard platform error; capacity **26/43** supports risk (**plausible**) |
| No real runs yet | **verified_true** (no run executions listed) |

### EXECUTION_STATE vs live

| Claim in `docs/EXECUTION_STATE.md` | Classification |
|---|---|
| `P2 Make intake: NOT STARTED / NOT AUTHORIZED` | **authorization_conflict** — live inactive Form 1 scenario + webhook + Supabase connection **already created** |
| “Decide whether to authorize Make intake” as next decision | **stale framing** — create already happened; decision is now legalize/document vs supersede |

### Onboarding docs (current branch)

| Claim | Classification |
|---|---|
| `EXISTING_WORKFLOWS_REVIEW.md` lists `4852018` inactive | **verified_true** |
| `PARALLEL_MAKE_LANE_RECONCILIATION.md` IDs as unverified | **stale** after this run — now verified |

---

## AUTHORIZATION ASSESSMENT

| Layer | Status |
|---|---|
| Designed | Form 1 inactive intake → Supabase `epeddfdifckzzmskhdsz` |
| Already created (live) | Scenario, webhook, Supabase connection, multi-module blueprint |
| Not done | Activation, E2E fake-dealer proof, GHL form wire-up, Forms 2/3 |
| Unauthorized relative to EXECUTION_STATE | Treating P2 as “not started”; any merge/activate/run without owner legalization |
| Remains unauthorized | Activate, run against real clients, GHL create, EXECUTION_STATE update without owner |

Note: inventory evidence claims prior `OWNER AUTHORIZATION: P2 MAKE INTAKE` for the create path; integrator `EXECUTION_STATE` was never updated to match. That gap is the core conflict.

---

## RECOMMENDED DISPOSITION

**Primary: E — block pending owner decision**

Interim behavior until that decision: **A — preserve branch and stash unchanged** (do not merge, pop, or delete).

### Exact next action (owner)

Choose one legalization path (do not do both casually):

1. **Legalize existing lane**  
   - Owner confirms P2 Make create was authorized  
   - Integrator updates `EXECUTION_STATE` accordingly (separate task)  
   - Then **B**: commit stash delta onto `factory/p2-make-intake` and push remote so docs match live IDs  
   - Keep scenario **inactive** until capacity + fake-dealer E2E authorized  

2. **Supersede**  
   - Leave inactive objects unused or delete under explicit Make cleanup auth  
   - **C**: new clean Make branch after contract `0.2.0` / migrations  
   - Do not activate `4852018` in the meantime  

**Do not** publish contract `0.2.0` as a substitute for resolving this Make authorization gap — they are related but sequential: Make lane legalization/docs first, then contract publish when ready.

### Not recommended now

| Option | Why not |
|---|---|
| B alone | Needs owner legalization + EXECUTION_STATE honesty first |
| C alone | Live objects are valid inactive prototypes; supersede only if owner rejects them |
| D delete | Premature; evidence + live IDs are useful |

---

## Confirmations

- No Make modifications / activations / runs  
- No stash/branch merge  
- No contract publish / migrations / EXECUTION_STATE update  
- GHL, ClickUp, Paradise, Retainer Snapshot, Sun Pool untouched  

## VERDICT

**GO WITH CHANGES** — live Make Form 1 lane exists and is inactive/safe to preserve; blocked for merge/activation until owner legalizes authorization vs `EXECUTION_STATE`.
