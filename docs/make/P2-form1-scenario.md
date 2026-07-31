# Make — Form 1 Intake scenario (dev_test)

**Scenario name:** `HTL Factory — Form 1 Intake (dev_test)`  
**Team:** My Team (`442605`) · Org Increase ROAS (`1111422`)  
**Supabase:** `htl-factory-dev` / `epeddfdifckzzmskhdsz` only  
**Status:** Design + inventory complete; live blueprint create waits on Supabase connection

## Modules (verified)

| Step | Module id | Purpose |
|---|---|---|
| 1 | `gateway:CustomWebHook` v1 | Instant webhook trigger (dedicated hook) |
| 2 | (router / filter) | Fail closed: required fields, forbidden aliases, protected slug |
| 3 | `supabase:searchRows` v1 | Idempotency lookup on `intake_submissions` by `form=form1` + `submission_id` |
| 4 | `supabase:createARow` v1 | Insert `clients` (fake dealer only) |
| 5 | `supabase:createARow` v1 | Insert `onboarding_cases` (`status=submitted`, `version=1`) |
| 6 | `supabase:createARow` / API | Link `clients.active_onboarding_case_id`; insert `intake_submissions`; optional `config_versions` |
| 7 | `supabase:makeAnApiCall` v1 | `POST /rest/v1/rpc/request_client_transition` → `under_review` as `make_service` |
| 8 | `gateway:WebhookRespond` v1 | JSON result (`client_id`, `onboarding_case_id`, `status`, `idempotent`) |

Connection type: Make app connection `supabase` (basic). Prefer official Supabase modules over raw `http:MakeRequest` so auth stays in Make credentials.

## Required webhook JSON (test / fake dealer)

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
- Any project_ref other than `epeddfdifckzzmskhdsz` in connection metadata checks

## Idempotency

Key: `intake:form1:{ghl_contact_id}:{submission_id}`  
Also rely on unique `(form, submission_id)` on `intake_submissions`.

Duplicate → return prior `client_id` / `onboarding_case_id` without second inserts.

## RPC (optional on first path)

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

## Non-goals in this scenario

- GHL sub-account create
- Cloudflare / hydrate / deploy
- Make data store as status SoT
- Forms 2/3 (separate scenarios after Form 1 verified)

## Create order

1. Owner completes Make credential request for Supabase → project `epeddfdifckzzmskhdsz` only.
2. Create dedicated `gateway-webhook` named `HTL Factory Form 1 Intake (dev_test)`.
3. `scenarios_create` inactive blueprint wired to that hook + Supabase connection id.
4. Activate only for controlled test runs; deactivate after evidence.
