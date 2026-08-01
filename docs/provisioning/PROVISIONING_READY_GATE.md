# `provisioning_ready` Gate (design)

**Status:** INFORMATIONAL ONLY — design gate; do not build Make scenarios or provision from this doc alone  
**Authority inputs:** `docs/onboarding/PROVISIONING_READY.md`, `docs/CANONICAL_CONTRACT.md`, `config/state-machine.json`, `config/protected-clients.json`  
**Evidence classes:** see [`P3_READINESS_AUDIT.md`](./P3_READINESS_AUDIT.md)

---

## Hard rule

Do **not** emit `provisioning_ready` (and do **not** start P3) from raw `main_client_onboarding` submission alone.  
(`TRACKED_DOC` — `PROVISIONING_READY.md`)

Provisioning is a **separate owner-authorized phase** after intake identity + CSM approval + payment + duplicate/slug checks.

---

## Signal definition (design)

`provisioning_ready` is a **boolean eligibility signal** (event or derived view), not a fulfillment status.

| Item | Design |
|---|---|
| Emitted when | All predicates below are true |
| Consumed by | P3 provision job (Make garage / tech operator) — **separate authorization** |
| Does not set | `live`, hydrate, staging, production |
| Idempotency | Re-evaluation with same inputs returns same readiness; does not re-create resources |
| Transition coupling | Only cases in `approved` (or explicitly re-enterable `provision_failed` after re-approval) may proceed to `provisioning` via `request_client_transition` |

**Evidence class:** `DESIGN_ONLY` for emitter implementation; transition names are `TRACKED_DOC` in `state-machine.json`.

---

## Predicate matrix (all must be true)

| # | Predicate | Owner / source | Fail-closed behavior | Evidence class |
|---|---|---|---|---|
| 1 | `payment_confirmed = true` | Billing / CSM system of record (field TBD in contract bump if missing) | No emit | `DESIGN_ONLY` + `MISSING` field proof |
| 2 | `main_client_onboarding = complete` | Form 1 (+ required children) complete for case | No emit | `TRACKED_DOC` intent; E2E `BLOCKED` |
| 3 | `csm_review_status = approved` | CSM review before `approved` status | No emit | `TRACKED_DOC` (state machine `requires_approval_readiness`) |
| 4 | Canonical client identity validated | `client_id` + `onboarding_case_id` agree; no forbidden aliases | No emit; log `identity_conflict` | `TRACKED_DOC` |
| 5 | `client_slug` reserved | Unique reserved slug; folder name will match | No emit | `TRACKED_DOC` (slug rules) |
| 6 | Required GHL provisioning fields present | Minimum set below | No emit; open human task | `DESIGN_ONLY` |
| 7 | Duplicate client/location check passed | See duplicate detection | No emit | `DESIGN_ONLY` |
| 8 | No blocking identity or ownership conflict | Form1 conflict outcomes | No emit | `TRACKED_DOC` Form1 outcomes |
| 9 | Owner-approved snapshot selected | Explicit snapshot ID + approval record | No emit | `DESIGN_ONLY` / `MISSING` |
| 10 | Case status eligible | `approved` (or authorized retry from `provision_failed`) via RPC only | No emit / reject transition | `TRACKED_DOC` |
| 11 | Not a protected client without break-glass | `sun-pool-spa` denylist | Hard reject | `TRACKED_DOC` |
| 12 | Environment is non-production for first P3 | `development` \| `test` only until P6 auth | Hard reject | `TRACKED_DOC` + `DESIGN_ONLY` |

---

## Required IDs before emit

| ID | Required at emit? | Notes |
|---|---|---|
| `client_id` | Yes | Canonical UUID |
| `onboarding_case_id` | Yes | Immutable engagement |
| `client_slug` | Yes | Reserved; not locked yet |
| `deployment_key` | Yes | Immutable machine key |
| `ghl_contact_id` | Recommended | External person; not company PK |
| `ghl_opportunity_id` | Optional | Unique when set |
| `ghl_location_id` | **No** | Null until P3 creates location |
| `approval_id` (provision) | Yes before **consume** | Distinct from CSM review; binds fake-client scope |

---

## Required GHL provisioning fields (minimum — design)

These are **inputs to create/link**, not proof that a sub-account already exists:

| Field | Why |
|---|---|
| Business / trading name | Location naming |
| Primary owner email | Invite / ownership |
| Primary phone | Contact + A2P later |
| Timezone | Location defaults |
| Country / address (or deferred with approved deferral) | Location create payload |
| Snapshot selection ID | Install target |

Deferral rules: expired deferrals do not satisfy readiness (`TRACKED_DOC` — CANONICAL_CONTRACT).

---

## Duplicate detection (design)

Run **before** emit and again at job start (TOCTOU).

| Check | Match keys | On hit |
|---|---|---|
| Existing client by `client_id` | Exact | Continue only if same case eligible |
| Existing slug | `client_slug` unique | Reject emit; human rename before lock |
| Existing `deployment_key` | Exact | Reject double provision |
| Existing `ghl_location_id` on client | Non-null | Treat as create-if-missing → verify/reconcile, do not create second |
| GHL agency search (design) | Normalized business name + primary email domain | `review_required`; no auto-merge |
| Protected slug | `sun-pool-spa` | Fail closed |
| Test / incomplete submissions | Flags / incomplete Form1 | Never emit |

**Evidence class:** `DESIGN_ONLY` (implementation absent).

---

## Slug reservation vs slug lock

| Stage | Rule | Evidence class |
|---|---|---|
| Reservation | System proposes from business name; human-editable until lock | `TRACKED_DOC` |
| Lock trigger | Explicit `slug_locked` when **first managed resource** reaches `created` | `TRACKED_DOC` |
| Lock payload | `slug_locked`, `slug_locked_at`, `slug_locked_by_resource_id`, `slug_locked_reason` | `TRACKED_DOC` |
| Unlock | **Never** on failure, rollback, or status change | `TRACKED_DOC` |
| Business rename | Does **not** rename slug | `TRACKED_DOC` |

P3 must record which resource caused the lock (Pages project preferred as first managed CF resource, or GHL location if it lands first — **pick one factory rule before build**).

**Proposed factory rule (design):** first of `{ghl_location, pages_project}` to reach `created` wins the lock; subsequent resources must use the locked slug. (`DESIGN_ONLY`)

---

## Approvals model (design)

| Approval | Binds to | TTL | Consumed when | Evidence class |
|---|---|---|---|---|
| CSM / approval readiness | Case → `approved` | Per state machine / readiness | Transition to `approved` | `TRACKED_DOC` |
| Owner P3 provision approval | `client_id` + `onboarding_case_id` + `client_slug` + environment (`test`) + snapshot ID | Propose 24h (align with prod approval pattern) | Successful transition into `provisioning` **or** successful job create — **choose one and freeze before build** | `DESIGN_ONLY` |
| Production approval | Deployment candidate | 24h | Prod success | `TRACKED_DOC` — **not used in P3** |
| Rollback authorization | Distinct artifact | Scoped | Rollback job success | `TRACKED_DOC` pattern; P3 detail in failure plan |

CLI flags alone are never authorization (`TRACKED_DOC` — AGENTS.md / protected-clients).

---

## Consumer sequence (later P3 — unauthorized today)

```text
provisioning_ready
→ verify approval_id + idempotency key provision:{client_id}:{approval_id}
→ request_client_transition: approved → provisioning
→ create-if-missing GHL sub-account → store ghl_location_id
→ install approved snapshot → verify
→ create-if-missing CF Pages / D1 / R2 → store IDs
→ create-if-missing Lead Vault sheet → store google_sheets_id
→ slug_lock if first managed resource created
→ request_client_transition: provisioning → infrastructure_ready
→ ClickUp mirror (sub-account created / snapshot installed / verified) — non-authoritative
→ human tasks on any failed step
```

(`TRACKED_DOC` consumer sketch in PROVISIONING_READY.md; expanded CF/sheet steps from P3-provision.)

---

## Fail-closed test matrix (design — for future automated tests)

| Case | Expected |
|---|---|
| Incomplete Form1 | Never `provisioning_ready` |
| Duplicate Form1 / same identity | Idempotent case; no second provision emit |
| Test / synthetic flag without P3 auth | Never provision |
| Bad / conflicting `client_id` vs slug | Fail closed |
| `sun-pool-spa` | Fail closed without break-glass |
| Missing snapshot approval | No emit |
| `payment_confirmed` false | No emit |
| CSM not approved | No emit |
| Free-form SQL status update attempt | Forbidden (RPC only) |
| Second job same idempotency key | Return original job; no double-create |

**Evidence class:** `DESIGN_ONLY` until `tests/provisioning/**` implements static fixtures (see fake-client plan).

---

## Explicit non-emit / non-start conditions

- P2 E2E not green and owner has not explicitly deferred E2E for P3 design-only work (docs may proceed; **live P3 may not**)
- Production credentials detected in agent environment
- Protected client in scope
- `apply_authorized` / production apply used as substitute for P3 auth (invalid)
- Any urge to hydrate or mark `live` from this gate

---

## Implementation ownership (when authorized)

| Piece | Owner lane | Notes |
|---|---|---|
| Predicate evaluation | Contract/DB + Make | Prefer Supabase-derived view + Make check |
| Emit event | Make / system | Must not create infra itself |
| Transition RPC | Supabase | Already named `request_client_transition` |
| Resource create | Make garage (P3) | Create-if-missing only |
| Docs for this gate | Provisioning readiness | This folder |

Do not invent canonical field names; extend via contract bump if `payment_confirmed` / `csm_review_status` need formalization (`TRACKED_DOC` — do not invent).
