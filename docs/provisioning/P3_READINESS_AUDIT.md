# P3 Readiness Audit

**Status:** INFORMATIONAL ONLY — design / readiness audit  
**Not authorized:** GHL sub-account create, snapshot install, Cloudflare Pages/D1/R2 create, Lead Vault create, hydrate, staging/prod deploy, Make P3 scenarios  
**Branch intent:** `factory/p3-readiness-spec`  
**Audit base SHA (this worktree):** `b7212fcce21130a08c16d7fafa325066ed6a49b0`  
**UTC authored:** 2026-08-01T01:57:25Z  

---

## Evidence classes (label every claim)

| Class | Meaning |
|---|---|
| `live_verified_readonly` | Confirmed against a live system in a cited evidence artifact this sprint |
| `repository_derived` | Stated in committed factory docs / config on the audit base |
| `design_only` | Proposed here; not implemented / not authorized |
| `CHECKPOINT` | Taken from integrator checkpoint (may lag live Make capacity) |
| `MISSING` | Required for P3 but absent from repo or platforms |
| `BLOCKED` | Cannot proceed until named gate clears |

---

## Verdict

| Question | Answer | Evidence class |
|---|---|---|
| Is P3 authorized? | **No** | `CHECKPOINT` — `20260801T014500Z-factory-checkpoint-audit.md` |
| Is `provisioning_ready` implemented? | **No** — design gate only | `repository_derived` — `docs/onboarding/PROVISIONING_READY.md` |
| Are P3 migrations present? | **No** — `provisioning_jobs` / `infrastructure_resources` not in applied migrations | `MISSING` / `repository_derived` |
| Can this docs PR merge as design? | **Yes (docs-only)** — does not unlock P3 | `design_only` |
| Is P3 ready to execute? | **No** — wait for P2 E2E + owner P3 auth | `BLOCKED` |

**Overall label:** `informational_only` until P2 Form 1 synthetic E2E is green and owner signs P3 fake-client authorization.

---

## Upstream dependency map

```text
P2 Form1 E2E (blocked: Make capacity)
  → CSM review / approved case path
    → provisioning_ready gate (design)
      → Owner P3 auth (fake client only)
        → P3 provision sequence (not started)
          → P4 hydrate (out of P3 scope)
```

| Dependency | Status | Evidence class | Blocks P3? |
|---|---|---|---|
| Contract `0.2.0` / schema `1.1.0` on integration | Complete on integration tip (audit base is SoT reconcile) | `CHECKPOINT` | Soft — needed for identity fields |
| Form 1 Make blueprint create-or-link | Complete, inactive | `CHECKPOINT` | Soft |
| Form 1 synthetic E2E | **Blocked** (Make active slots) | `CHECKPOINT` / `BLOCKED` | **Hard preferred** before P3 auth |
| GHL factory Form 1/2/3 | Design only / unauthorized | `CHECKPOINT` | Soft for infra IDs; hard for CRM-complete fake client |
| ClickUp live template | Design only; MCP disconnected | `CHECKPOINT` | Soft (mirror only; not lifecycle SoT) |
| SECRETS_RUNBOOK accepted (no `deployment_configs` PATCH) | Documented | `repository_derived` | Hard before any CF secret install (P3+ wiring) |
| State machine provision transitions | Present in `config/state-machine.json` | `repository_derived` | Soft — RPC must enforce when live |
| Owner P3 authorization artifact | Absent | `MISSING` / `BLOCKED` | **Hard** |

---

## What P3 must produce (contract alignment)

Source: `docs/work-packages/P3-provision.md`, `docs/CANONICAL_CONTRACT.md`, `docs/FACTORY_CONSTITUTION.md`.

| Resource | Supabase fields (IDs only) | Idempotency key | Evidence class |
|---|---|---|---|
| Cloudflare Pages | `pages_project_name`, `pages_project_id` | `cf:pages:{client_slug}` | `repository_derived` |
| D1 | `d1_database_id` (+ binding `DB`) | `cf:d1:{client_id}` | `repository_derived` |
| R2 | `r2_bucket_name` (+ binding `PRODUCT_IMAGES`) | `cf:r2:{client_id}` | `repository_derived` |
| GHL location | `ghl_location_id` | `ghl:location:{client_id}` | `repository_derived` |
| Lead sheet | `google_sheets_id` | `sheets:vault:{client_id}` | `repository_derived` |
| Job row | `provisioning_jobs` status + timestamps | `provision:{client_id}:{approval_id}` | `repository_derived` |

**Non-goals (P3):** GitHub forks, site code generation, secret values in Make/Supabase/Git, marking `live`, hydrate/build/deploy (`repository_derived`).

---

## Gate surface: `provisioning_ready`

Design checklist lives in [`PROVISIONING_READY_GATE.md`](./PROVISIONING_READY_GATE.md). Summary:

| Prerequisite | Required? | Current readiness | Evidence class |
|---|---|---|---|
| `payment_confirmed = true` | Yes | Field/path not proven end-to-end | `MISSING` / `design_only` |
| `main_client_onboarding = complete` | Yes | Form1 path incomplete until E2E | `BLOCKED` |
| `csm_review_status = approved` | Yes | No synthetic approved case proven | `BLOCKED` |
| Canonical identity validated | Yes | Contract present; live create unproven | `repository_derived` + `BLOCKED` |
| `client_slug` reserved | Yes | Reservation RPC/path not P3-proven | `design_only` |
| Required GHL provisioning fields | Yes | Factory product forms absent | `CHECKPOINT` |
| Duplicate client/location check | Yes | Design only | `design_only` |
| No identity/ownership conflict | Yes | Form1 outcomes designed; E2E blocked | `BLOCKED` |
| Owner-approved snapshot selected | Yes | Snapshot ID not pinned for fake client | `MISSING` |
| Case status eligible via RPC only | Yes | Transitions exist in config | `repository_derived` |

---

## ID and approval inventory (required before first provision)

| Artifact / ID | Purpose | Present? | Evidence class |
|---|---|---|---|
| `client_id` | Canonical dealer UUID | Not for fake P3 client yet | `MISSING` |
| `onboarding_case_id` | Engagement UUID | Not for fake P3 client yet | `MISSING` |
| `client_slug` | Reserved slug (not `sun-pool-spa`) | Not reserved | `MISSING` |
| `deployment_key` | Immutable deploy key | Not issued | `MISSING` |
| `approval_id` / provision approval | Binds ready → provision | No P3 approval artifact schema live | `design_only` |
| Idempotency `provision:{client_id}:{approval_id}` | Single job | N/A until auth | `repository_derived` |
| Owner-approved GHL snapshot ID | Snapshot install target | Not selected for fake client | `MISSING` |
| CF test account / token scope | Pages/D1/R2 create in **test** only | Must be confirmed before auth | `MISSING` |
| GHL agency token (test) | Sub-account create | Must be confirmed before auth | `MISSING` |
| Google SA for Lead Vault (test) | Sheet create | Must be confirmed before auth | `MISSING` |
| Supabase service role (dev) | Job + resource ID writes | Dev project known | `repository_derived` (`htl-factory-dev`) |
| Break-glass for Sun Pool | Must remain **absent** for normal P3 | Absent (correct) | `CHECKPOINT` |

---

## Sequence overview (design — do not execute)

Full order and failure handling: [`P3_FAILURE_AND_ROLLBACK_PLAN.md`](./P3_FAILURE_AND_ROLLBACK_PLAN.md).  
Fake-client proof: [`P3_FAKE_CLIENT_TEST_PLAN.md`](./P3_FAKE_CLIENT_TEST_PLAN.md).

```text
1. Emit provisioning_ready (all gate checks true)
2. Transition approved → provisioning (RPC)
3. Create-if-missing GHL sub-account → store ghl_location_id
4. Install owner-approved snapshot → verify
5. Create-if-missing CF Pages / D1 / R2 → store IDs
6. Create-if-missing Lead Vault sheet → store google_sheets_id
7. Slug lock on first managed resource created
8. Transition provisioning → infrastructure_ready
9. ClickUp mirror milestones (non-authoritative)
```

Hydration (P4) and Cloudflare secret install are **after** `infrastructure_ready` and are out of P3 create scope (`repository_derived` — P3-provision + P4-hydrate).

---

## Missing prerequisites (hard list)

1. **P2 Form 1 synthetic E2E green** (create / link / replay / identity_conflict / review_required) — `BLOCKED`  
2. **Owner written P3 authorization** scoped to one fake client + test CF/GHL — `MISSING`  
3. **`provisioning_jobs` + `infrastructure_resources` migrations** authored and owner-authorized for apply — `MISSING`  
4. **`provisioning_ready` emitter** (Make/RPC/job) — `design_only` / `MISSING`  
5. **Pinned owner-approved snapshot ID** for fake-client install — `MISSING`  
6. **Duplicate-detection implementation** against clients + GHL locations — `design_only` / `MISSING`  
7. **Payment confirmed + CSM approved path** proven on a test case — `BLOCKED`  
8. **Test credential inventory confirmed** (CF test, GHL agency test, Google SA test) without production tokens — `MISSING`  
9. **Fake client slug reservation** (non-protected, explicit test naming) — `MISSING`  
10. **Reconcile job** for orphaned CF/GHL creates vs Supabase IDs — `design_only` / `MISSING`

---

## Safety boundaries (this audit)

| Rule | Status |
|---|---|
| Sun Pool (`sun-pool-spa`) untouched | Required; fail closed without break-glass |
| No production CF / GHL / Supabase apply | Required |
| No GitHub fork/create-repo | Required |
| No secret values in Git / Make / Supabase | Required |
| Docs-only lane may not provision | Enforced by authorization absence |

---

## Related docs

| Doc | Role |
|---|---|
| [`PROVISIONING_READY_GATE.md`](./PROVISIONING_READY_GATE.md) | Gate predicates + fail-closed matrix |
| [`P3_FAKE_CLIENT_TEST_PLAN.md`](./P3_FAKE_CLIENT_TEST_PLAN.md) | Fake-client P3 proof matrix |
| [`P3_FAILURE_AND_ROLLBACK_PLAN.md`](./P3_FAILURE_AND_ROLLBACK_PLAN.md) | Orphans, rollback, reconcile |
| `docs/onboarding/PROVISIONING_READY.md` | Original short gate (still authoritative intent) |
| `docs/work-packages/P3-provision.md` | Work package |
| `docs/CANONICAL_CONTRACT.md` | Identity, slug lock, correlation chain |
| Integrator checkpoint `20260801T014500Z` | Phase status SoT for this audit |
