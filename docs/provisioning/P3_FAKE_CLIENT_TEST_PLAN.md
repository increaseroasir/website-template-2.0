# P3 Fake-Client Test Plan

**Status:** INFORMATIONAL ONLY — do not provision until owner P3 authorization  
**Goal:** Prove create-if-missing infrastructure for one non-protected fake dealer on **test** accounts only  
**Depends on:** P2 Form 1 synthetic E2E preferred-green; [`PROVISIONING_READY_GATE.md`](./PROVISIONING_READY_GATE.md)  
**Evidence classes:** see [`P3_READINESS_AUDIT.md`](./P3_READINESS_AUDIT.md)

---

## Scope

| In scope (when authorized) | Out of scope |
|---|---|
| Fake client identity in `htl-factory-dev` | Sun Pool / Paradise / Retainer Snapshot |
| GHL **test** sub-account create + approved snapshot | Production GHL agency mutations beyond test |
| Cloudflare **test** Pages + D1 + R2 | Production CF account |
| Lead Vault sheet in test Google project | Production sheets / Paradise production vault misuse |
| Supabase ID writes + job row | Hydrate (P4), staging (P5), production (P6) |
| Idempotency + duplicate + slug-lock proofs | GitHub fork / new repo |
| Cleanup / residue proof | Marking `live` |

---

## Fake client identity (proposed — not reserved)

| Field | Proposed value | Notes |
|---|---|---|
| `business_name` | `HTL Factory Fake Dealer P3` | Display only |
| `client_slug` | `htl-fake-dealer-p3` | Must not collide; never `sun-pool-spa` |
| `deployment_key` | `dk_htl_fake_dealer_p3` | Immutable once issued |
| Domain (optional) | `fake-p3.htl-factory.invalid` | Non-resolving |
| Environment | `test` | Hard requirement |
| GHL contact/opp (intake) | Reuse Form1 synthetic pattern (`test-*-fake-*`) | After P2 E2E path |

**Evidence class:** `DESIGN_ONLY` — values not reserved in Supabase yet (`MISSING`).

---

## Preconditions checklist (hard)

| # | Precondition | Evidence required | Class |
|---|---|---|---|
| 1 | Owner written P3 auth artifact | Path + scope + expires_at + fake slug | `MISSING` until owner |
| 2 | P2 Form1 E2E green **or** explicit owner deferral | Integrator evidence | `BLOCKED` / `CHECKPOINT` |
| 3 | Case reaches `approved` with payment + CSM predicates | Supabase row + audit | `BLOCKED` |
| 4 | Snapshot ID owner-approved | Named snapshot + approval | `MISSING` |
| 5 | Test credentials only (CF / GHL / Google / Supabase dev) | Operator checklist (no values in Git) | `MISSING` |
| 6 | Migrations for `provisioning_jobs` + `infrastructure_resources` applied in **dev** under new auth | Migration list | `MISSING` |
| 7 | `provisioning_ready` true for case | Gate evaluation log | `DESIGN_ONLY` |
| 8 | Break-glass for Sun Pool **absent** | `artifacts/break-glass/` empty of live approvals | `CHECKPOINT` pattern |
| 9 | No production tokens in shell | Env audit | Operator |

---

## Test phases

### Phase A — Static / design (authorized now)

| Test | Method | Pass criteria |
|---|---|---|
| A1 Docs present | File existence | Four docs in `docs/provisioning/` |
| A2 Protected slug reject (design) | Spec review + future unit | `sun-pool-spa` never accepted |
| A3 No fork API | Spec asserts zero GitHub create-repo | Written in work package |
| A4 No secrets in docs | Grep artifacts | No API keys/tokens |
| A5 Design test stub | `tests/provisioning/*` | Static assertions on gate doc markers |

**Phase A label:** may run on this branch; does **not** mean P3 ready.

### Phase B — Gate evaluation (after P2 path + fake case)

| Test | Pass criteria |
|---|---|
| B1 Incomplete case | `provisioning_ready = false` |
| B2 Duplicate identity | No second ready emit; review path |
| B3 Payment false | Not ready |
| B4 CSM not approved | Not ready |
| B5 Missing snapshot | Not ready |
| B6 All predicates true | Ready emit once; idempotent re-eval |

### Phase C — Provision job (owner P3 auth required)

Use idempotency key: `provision:{client_id}:{approval_id}`.

| Step | Action | Record in Supabase | Pass |
|---|---|---|---|
| C1 | Transition `approved` → `provisioning` | status history | RPC only |
| C2 | GHL location create-if-missing | `ghl_location_id` | One location |
| C3 | Snapshot install + verify | job events | Snapshot verified |
| C4 | CF Pages create-if-missing | `pages_project_*` | One project named from locked/reserved slug |
| C5 | D1 create-if-missing | `d1_database_id` | Binding name `DB` planned |
| C6 | R2 create-if-missing | `r2_bucket_name` | Binding `PRODUCT_IMAGES` planned |
| C7 | Lead sheet create-if-missing | `google_sheets_id` | Non-secret ID only |
| C8 | Slug lock event | `slug_locked*` fields | Locked; no unlock on later failure |
| C9 | Transition → `infrastructure_ready` | status | Make must not set `live` |
| C10 | Re-run same idempotency key | same job result | No double-create |

### Phase D — Negative / safety

| Test | Pass |
|---|---|
| D1 Second provision different approval same client without reconcile policy | Rejected or no-op per frozen rule |
| D2 Protected slug in payload | Rejected; zero external creates |
| D3 Timeout after CF create before SB write | Reconcile restores ID; no second Pages project |
| D4 `deployment_configs` PATCH attempted | Forbidden / alert (`TRACKED_DOC` SECRETS_RUNBOOK) |
| D5 GitHub fork API | Zero calls |
| D6 Production project IDs | Rejected by target allowlist |

### Phase E — Cleanup / residue

| Test | Pass |
|---|---|
| E1 Soft cleanup plan executed | Fake resources tagged/named for deletion |
| E2 Dev tables | Synthetic rows removed or clearly quarantined |
| E3 GHL test location | Disabled/deleted per owner policy **or** retained with `fake` marker |
| E4 CF test project | Deleted or quarantined |
| E5 No Sun Pool / Paradise side effects | Diff evidence empty |

---

## Resource lifecycle assertions

Per resource: `not_requested` → `requested` → `creating` → `created` → `verified`  
Failure: `failed` | `orphaned` | `externally_missing`  
(`TRACKED_DOC` — P3-provision)

| Assertion | Expected |
|---|---|
| Unique `(client_id, resource_type)` | Enforced |
| Unique Pages per slug | Enforced |
| One GHL location per client | Enforced |
| Orphan external without SB row | Reconcile job adopts or marks `orphaned` for human |

---

## Hydration boundary (informational)

After `infrastructure_ready`, P4 may hydrate `clients/<slug>/` — **not part of this P3 test**.  
P3 pass does **not** require dist/, secrets install, or preview deploy.

(`TRACKED_DOC` — P4-hydrate; P3 non-goals)

---

## ClickUp mirror (optional soft assert)

If connector available: milestones for sub-account created / snapshot installed / verified may update.  
ClickUp failure must **not** roll back Supabase (`TRACKED_DOC` — sync policy). Open human task instead.

---

## Exit criteria

### Design-only (this PR)

- [x] Audit + gate + fake-client + failure/rollback docs landed  
- [x] Agent run artifact written  
- [ ] No live provision attempted  

### Ready for owner P3 auth (future)

- [ ] P2 E2E green (or written deferral)  
- [ ] Fake slug reserved  
- [ ] Snapshot ID approved  
- [ ] Migrations applied in dev under new auth  
- [ ] Test credential checklist signed (refs only)  

### P3 fake-client PASS (future)

- [ ] Phases B–E green with evidence artifacts under `artifacts/agent-runs/provisioning/`  
- [ ] `infrastructure_ready` for fake client  
- [ ] Idempotent re-run proven  
- [ ] Residue cleaned or quarantined  
- [ ] Sun Pool untouched confirmation  

---

## Explicit stop conditions during a future live run

- Any production credential detected  
- Sun Pool / Paradise / Retainer Snapshot in writable scope  
- Same failing external create twice without new evidence → **BLOCKED**  
- Secret value would be written to Git/Make/logs → stop  
- Urge to hydrate or go live → stop (wrong phase)
