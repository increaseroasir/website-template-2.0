# Form 1 synthetic E2E — BLOCKED (active-slot + blueprint)

**UTC:** 20260731T201500Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Tip at start:** `d47fdb88a49d0c4587ce0ba33a56f5b6f045a878`  
**Repo:** `increaseroasir/website-template-2.0`

## Gate checks (passed)

| Check | Result |
|---|---|
| Scenario ID | `4852018` |
| Scenario name | `HTL Factory Form 1 Intake (dev_test)` |
| `isActive` before | `false` |
| Webhook | `2785703` attached; URL present; `scenarioId=4852018` |
| Connection | `4834536` `HTL Factory Dev (epeddfdifckzzmskhdsz)` |
| Supabase MCP project URL | `https://epeddfdifckzzmskhdsz.supabase.co` |
| Supabase MCP identity | `supabase_read_only_user` / `transaction_read_only=on` |
| Executions before | none attempted this run |
| GHL / ClickUp modules in blueprint | **none** |
| Packages used | `gateway`, `supabase`, `builtin` only |

## Phase 1 — Capacity (BLOCKER)

| Metric | Value |
|---|---|
| Team scenarios total | 43 |
| Active | **26** |
| Inactive | 17 |
| Org `activeScenarios` | 26 |
| Safe free slot available without pausing something | **no** |

All 26 active scenarios are live client / lead / Discord / Typeform / SMS workflows (Acree, Elite, Momentum, Opt In, Hyros, Timbertalk, etc.). None can be proven noncritical from name/metadata alone.

Inactive list includes only one HTL Factory scenario (`4852018` itself). Other inactive scenarios are other clients’ paused automations — **not** candidates to “activate instead,” and pausing is irrelevant to them.

**No scenario was deactivated.**  
**Scenario 4852018 was not activated.**  
**No webhook payload was sent.**

Exact capacity issue: Make org is at **26 active / 43 total**; activating Form 1 requires temporarily pausing one active scenario. Owner must name an explicitly noncritical scenario ID before any pause. Agent will not pick one.

## Phase 2 — Blueprint (secondary blocker for full objective)

Module order (live, unchanged):

1. `gateway:CustomWebHook` → hook `2785703`
2. `supabase:makeAnApiCall` GET `intake_submissions` (idempotency) via conn `4834536`
3. `builtin:BasicRouter`
4a. `gateway:WebhookRespond` (dup / idempotent)
4b path: create `clients` → create `onboarding_cases` → PATCH active case → create `intake_submissions` → create `config_versions` → RPC `request_client_transition` → `WebhookRespond`

Matches the documented verified design in `docs/make/P2-form1-scenario.md`.

Material gaps vs **published contract 0.2.0 / schema 1.1.0** E2E acceptance:

| Expected by E2E objective | Live blueprint |
|---|---|
| `onboarding_schema_version = 1.1.0` | Hardcoded `1.0.0` on `onboarding_cases` |
| `contract_version = 0.2.0` | Not written |
| Six `*_reported_*` fields stored | `payload` / `config` are empty `{}` |
| Client create-or-link | Create-only (`createARow` on `clients`) |

Per authorization: do **not** patch the blueprint during the E2E task. Full objective cannot be met without a prior authorized blueprint update.

## Actions not taken

- No Make activate / deactivate
- No webhook POST
- No Supabase writes / cleanup
- No GHL / ClickUp / production contact
- No Sun Pool / Paradise / Retainer Snapshot touch

## Verdict

**BLOCKED**

## Next owner decision (exactly one)

Name one specific Make scenario ID that may be temporarily paused to free an active slot for Form 1 E2E (or raise Make plan capacity). Prefer also authorizing a blueprint update to contract `0.2.0` / schema `1.1.0` (reported fields + schema version) **before** the E2E, or explicitly accept E2E against the current 1.0.0 create-path blueprint with reduced acceptance criteria.
