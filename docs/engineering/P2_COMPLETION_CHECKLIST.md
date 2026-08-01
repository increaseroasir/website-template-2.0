# P2 Completion Checklist

**Checkpoint:** 20260801T014500Z  
**Rule:** P2 is **not complete** until Form 1 synthetic E2E is green and GHL intake path is authorized/built (or explicitly deferred by owner with risk accepted).  
**Integration tip at checklist creation:** `e89ba944`

Legend: `[x]` verified this checkpoint · `[ ]` open · `[~]` partial/stale docs · `[!]` blocked

---

## P2A — Form 1 contract and database support

- [x] Contract version `0.2.0` in Git (`config/identity-fields.json`, `docs/CANONICAL_CONTRACT.md`)
- [x] Onboarding schema `1.1.0` in Git
- [x] Six reported fields present:
  - [x] `website_reported_status`
  - [x] `website_reported_url`
  - [x] `domain_reported_name`
  - [x] `domain_reported_ownership_status`
  - [x] `dns_reported_provider`
  - [x] `dns_reported_owner`
- [x] Ownership: Form1 company create-or-link + reported; Form2 operational; Form3 tracking; employees → `onboarding_employees`; inventory → `inventory_submissions`; `inventory_items` deferred
- [x] Child migrations landed in Git
- [x] Child tables applied on `htl-factory-dev` (`20260731193347`, `20260731193358`)
- [x] RLS on, zero policies, no anon/auth row DML
- [x] Synthetic smoke cleaned (row counts 0)
- [x] `apply_authorized=false`
- [~] Stale “migrations_not_applied” / “0.1.1” notes in mappings/registry/docs — cleanup later
- [ ] Merged into `factory/p0-safety-lock`

**Acceptance gate:** contract+DB verified (met on integration). Merge gate separate.

---

## P2B — Form 1 Make blueprint

- [x] Scenario `4852018` exists, name HTL Factory Form 1 Intake (dev_test)
- [x] Webhook `2785703`, connection `4834536`
- [x] Inactive (`isActive=false` at last snapshot `2026-07-31T20:33:04Z`)
- [x] Contract `0.2.0` / schema `1.1.0` in blueprint
- [x] Create-or-link match order: `client_id` → `deployment_key` → `client_slug`
- [x] No auto-link from email/phone/GHL contact/business name/domain/fuzzy
- [x] Outcomes: `created` / `linked` / `replayed` / `identity_conflict` / `review_required`
- [x] Idempotency before create/link writes
- [x] No GHL/ClickUp modules; packages gateway/supabase/builtin only
- [x] Module count 46 (last snapshot)
- [ ] Live re-poll of scenario + capacity with Make API token in this environment

**Acceptance gate:** inactive blueprint statically proven (met).

---

## P2C — Form 1 E2E

- [x] Make capacity (Core; temporary +1 for 4852018; restored to 26)
- [x] Owner capacity / temporary activation authorized
- [x] Owner E2E authorization (synthetic 03/04/08/09 + E2E-07 waiver)
- [x] Synthetic **create** (E2E-01)
- [x] Synthetic **link** (E2E-02 client_id; E2E-03 deployment_key; E2E-04 client_slug)
- [x] Synthetic **replay** (E2E-05)
- [x] Synthetic **identity_conflict** (E2E-06)
- [x] Synthetic **review_required** — **WAIVED** (UNIQUE; not PASS)
- [x] Synthetic **forbidden auto-link** (E2E-08) **PASS**
- [!] Synthetic **null_does_not_clear** (E2E-09) **FAIL** — empty-string clear on new link config
- [x] Cleanup synthetic rows (clients/cases/intakes/config) — zero residue after 20260801T221625Z
- [x] Scenario returned inactive; no leftover schedules
- [x] Evidence artifact under `artifacts/agent-runs/` (`20260801T221625Z-form1-e2e-03-04-08-09-and-waiver.md`)

**Acceptance gate:** Make/Supabase Form 1 synthetic acceptance **NOT CLOSED** until E2E-09 PASS. **P2 cannot close** (GHL still unauthorized).

---

## P2D — GHL forms and wiring

- [x] Target location known: Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8`
- [x] Read-only inventory refreshed (20260801): 3 forms, 50 Store Onboarding custom fields, 4 workflows
- [ ] Factory product Form 1 built/optimized
- [ ] Forms 2 and 3 built (see P2F)
- [ ] Live GHL field IDs written into mappings (`ghl_ids` still `pending_live_ids`)
- [ ] Form 1 submit → Make webhook `2785703` wired
- [ ] Owner authorization for GHL creates/updates
- [ ] No accidental use of Paradise / Sun Pool / Retainer Snapshot

**Acceptance gate:** synthetic contact can submit Form 1 and land in Supabase via Make.

---

## P2E — ClickUp operations layer

- [x] Design docs exist
- [x] Config marks MCP disconnected / IDs pending
- [ ] Connector available
- [ ] Live inventory of space/list/template
- [ ] Minimal onboarding template created (owner auth)
- [ ] Live IDs filled in `config/onboarding-clickup.json`
- [ ] Confirmed ClickUp is **not** lifecycle SoT

**Acceptance gate:** one master task template usable for fake client without reversing Supabase status.

---

## P2F — Forms 2 and 3

- [ ] Form 2 operational website/domain/DNS/location enrichment — design freeze confirmed against live GHL
- [ ] Form 3 tracking IDs / provisioned IDs / access state / secret refs — no secrets in payloads
- [ ] Make scenarios for Form 2/3 (separate from `4852018`)
- [ ] Contract tests still green
- [ ] Owner authorization

**Acceptance gate:** fake client can complete Form2+Form3 onto one case without wiping Form1 reported fields.

---

## Cross-cutting before calling P2 “complete”

- [x] Onboarding tests 54/54
- [x] Factory-contract tests 46/46
- [x] Safety tests 31/31
- [x] `brand:guard` pass
- [!] Form 1 E2E green (P2C) — blocked on E2E-09
- [ ] GHL Form 1 path live or owner deferral recorded
- [ ] `EXECUTION_STATE` P2 overall flipped to complete by integrator only
- [ ] Integration merged to `factory/p0-safety-lock` (recommended after E2E)

---

## Explicit non-goals (still unauthorized)

- P3 GHL sub-account provisioning / snapshot apply
- Cloudflare project creation
- Production deploy
- Fleet operations
- Pausing live Make scenarios without owner-named ID
- Touching Sun Pool, Paradise Spas, Retainer Snapshot
