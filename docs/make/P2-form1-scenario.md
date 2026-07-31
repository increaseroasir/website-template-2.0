# Make — Form 1 Intake scenario (dev_test)

**Scenario name:** `HTL Factory Form 1 Intake (dev_test)`  
**Live IDs (verified 2026-07-31):** scenario `4852018` · webhook `2785703` · Supabase connection `4834536`  
**Team:** My Team (`442605`) · Org Increase ROAS (`1111422`)  
**Supabase:** `htl-factory-dev` / `epeddfdifckzzmskhdsz` only  
**Legalization:** Owner legalized these inactive dev/test objects as the current baseline (2026-07-31).  

**Status (verified):**

| Field | Value |
|---|---|
| Scenario active | **false** (inactive) |
| Blueprint | Wired: webhook → idempotency GET → router (dup respond / create path) → RPC → respond |
| Connection | `4834536` `HTL Factory Dev (epeddfdifckzzmskhdsz)` |
| Executions / runs | **none observed** |
| Client data processed | **none** |
| E2E verification | **not complete** |
| Activation | **not authorized** |
| Capacity note | Org ~26 active / 43 total — free a slot before any future authorized activate |

**GHL forms:** Not authorized in this pass. Later install in an owner-named existing location — see [`P2-ghl-forms-dependency.md`](./P2-ghl-forms-dependency.md).

## Modules (live blueprint shape)

| Step | Module | Purpose |
|---|---|---|
| 1 | `gateway:CustomWebHook` v1 | Hook `2785703` |
| 2 | `supabase:makeAnApiCall` v1 | Idempotency GET `intake_submissions` (`form=form1`, `submission_id`) via conn `4834536` |
| 3 | `builtin:BasicRouter` | Dup vs new |
| 4a | `gateway:WebhookRespond` | Idempotent 200 when prior row exists |
| 4b | `supabase:createARow` × clients / onboarding_cases / intake_submissions / config_versions | Fake-dealer path only when authorized to run |
| 5 | `supabase:makeAnApiCall` | PATCH `clients.active_onboarding_case_id`; RPC `request_client_transition` → `under_review` |
| 6 | `gateway:WebhookRespond` | JSON result |

Connection type: Make app connection `supabase` (basic). Prefer official Supabase modules so auth stays in Make credentials.

## Required webhook JSON (test / fake dealer — not authorized to send yet)

```json
{
  "schema_version": "1.0.0",
  "submission_id": "test-form1-001",
  "correlation_id": "corr-test-form1-001",
  "ghl_contact_id": "test-contact-fake-001",
  "ghl_opportunity_id": "test-opp-fake-001",
  "business_name": "HTL Factory Fake Dealer",
  "client_slug": "htl-factory-fake-dealer",
  "deployment_key": "htl-factory-fake-dealer-deploy",
  "domain": "fake-dealer.htl-factory.test"
}
```

## Fail closed

- Missing `submission_id`, `correlation_id`, `business_name`, `client_slug`, `deployment_key`
- Forbidden aliases (`ghlLocationId`, `location_id`, …)
- `client_slug` = protected Sun Pool slug
- Any project_ref other than `epeddfdifckzzmskhdsz`

## Idempotency

Key: `intake:form1:{ghl_contact_id}:{submission_id}`  
Also rely on unique `(form, submission_id)` on `intake_submissions`.

Duplicate → return prior `client_id` / `onboarding_case_id` without second inserts.

## RPC

```text
POST /rest/v1/rpc/request_client_transition
{
  "p_onboarding_case_id": "<uuid>",
  "p_expected_current_status": "submitted",
  "p_requested_status": "under_review",
  "p_expected_version": 1,
  "p_actor": "make_service",
  "p_correlation_id": "<from payload>",
  "p_reason": "form1_intake_auto_review",
  "p_idempotency_key": "transition:<case_id>:under_review:<correlation_id>"
}
```

## Non-goals / still unauthorized

- Activate scenario `4852018`
- Send webhook / process submissions (fake or real)
- GHL sub-account **create** / provisioning
- Forms 2/3 Make scenarios
- Cloudflare / hydrate / deploy
- Make data store as status SoT

## Create order

1. ~~Owner completes Make credential request for Supabase → project `epeddfdifckzzmskhdsz` only.~~
2. ~~Create dedicated `gateway-webhook` named `HTL Factory Form 1 Intake (dev_test)`.~~
3. ~~Inactive blueprint wired to that hook + Supabase connection id.~~
4. ~~Owner legalizes inactive objects as current baseline (docs + EXECUTION_STATE).~~
5. **Later (separate auth):** free one active-scenario slot → activate → smoke fake dealer only → verify Supabase → deactivate.
6. **Later (separate auth):** owner provides target GHL location + current forms → wire submit to webhook `2785703`.
