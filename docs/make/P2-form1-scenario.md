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
| Blueprint | Wired to contract **0.2.0** / onboarding schema **1.1.0** (inactive upgrade 2026-07-31) |
| Connection | `4834536` `HTL Factory Dev (epeddfdifckzzmskhdsz)` |
| Executions / runs | **none observed** |
| Client data processed | **none** |
| E2E verification | **blocked** — Make at 26 active scenarios; no capacity increase yet |
| Activation | **not authorized** until capacity + synthetic E2E authorization |
| Capacity note | Prefer **raise Make active-slot capacity**; do not pause live lead/SMS/Typeform scenarios |

**GHL forms:** Not authorized in this pass. Later install in an owner-named existing location — see [`P2-ghl-forms-dependency.md`](./P2-ghl-forms-dependency.md).

## Modules (live blueprint shape)

| Step | Module | Purpose |
|---|---|---|
| 1 | `gateway:CustomWebHook` v1 | Hook `2785703` |
| 2 | `supabase:makeAnApiCall` v1 | Idempotency GET `intake_submissions` (`form=form1`, `submission_id`) via conn `4834536` |
| 3 | `builtin:BasicRouter` | Dup vs new |
| 4a | `gateway:WebhookRespond` | Idempotent 200 when prior row exists |
| 4b | `supabase:createARow` × clients / onboarding_cases / intake_submissions / config_versions | Create path (link path not in this blueprint) |
| 5 | `supabase:makeAnApiCall` | PATCH `clients.active_onboarding_case_id`; RPC `request_client_transition` → `under_review` |
| 6 | `gateway:WebhookRespond` | JSON result including `contract_version` / `onboarding_schema_version` |

Connection type: Make app connection `supabase` (basic). Prefer official Supabase modules so auth stays in Make credentials.

## Versions written by blueprint

| Location | Value |
|---|---|
| `onboarding_cases.onboarding_schema_version` | `1.1.0` |
| `intake_submissions.schema_version` | `1.1.0` |
| `config_versions.config.contract_version` | `0.2.0` |
| `config_versions.config.onboarding_schema_version` | `1.1.0` |
| Response body | includes both version fields |

## Required webhook JSON (synthetic / fake dealer — E2E not authorized yet)

```json
{
  "schema_version": "1.1.0",
  "contract_version": "0.2.0",
  "submission_id": "test-form1-001",
  "correlation_id": "corr-test-form1-001",
  "ghl_contact_id": "test-contact-fake-001",
  "ghl_opportunity_id": "test-opp-fake-001",
  "business_name": "HTL Factory Synthetic Test",
  "client_slug": "htl-factory-synthetic-test",
  "deployment_key": "htl-factory-synthetic-test-deploy",
  "domain": "synthetic.htl-factory.test",
  "owner_name": "Synthetic Owner",
  "owner_email": "synthetic.form1.e2e@example.invalid",
  "owner_phone": "+15555550199",
  "offer_summary": "synthetic test payload only",
  "market": "synthetic-dev-test",
  "website_reported_status": "no_website",
  "website_reported_url": null,
  "domain_reported_name": null,
  "domain_reported_ownership_status": "unknown",
  "dns_reported_provider": "unknown",
  "dns_reported_owner": "unknown"
}
```

Form 1 identity fields persist into `intake_submissions.payload` and `config_versions.config`.  
Form 2 operational fields (`website_url`, `dns_provider`, `dns_owner`, etc.) are **not** written here.

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
- Pause any live Make scenario to free a slot
- GHL sub-account **create** / provisioning
- Forms 2/3 Make scenarios
- Cloudflare / hydrate / deploy
- Make data store as status SoT

## Create order

1. ~~Owner completes Make credential request for Supabase → project `epeddfdifckzzmskhdsz` only.~~
2. ~~Create dedicated `gateway-webhook` named `HTL Factory Form 1 Intake (dev_test)`.~~
3. ~~Inactive blueprint wired to that hook + Supabase connection id.~~
4. ~~Owner legalizes inactive objects as current baseline (docs + EXECUTION_STATE).~~
5. ~~Align inactive blueprint to contract `0.2.0` / schema `1.1.0`.~~
6. **Later (separate auth):** increase Make active capacity → activate → synthetic E2E only → verify Supabase → deactivate.
7. **Later (separate auth):** owner provides target GHL location + current forms → wire submit to webhook `2785703`.
