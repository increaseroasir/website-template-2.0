# Make — Form 1 Intake scenario (dev_test)

**Scenario name:** `HTL Factory Form 1 Intake (dev_test)`  
**Live IDs (verified 2026-07-31):** scenario `4852018` · webhook `2785703` · Supabase connection `4834536`  
**Team:** My Team (`442605`) · Org Increase ROAS (`1111422`)  
**Supabase:** `htl-factory-dev` / `epeddfdifckzzmskhdsz` only  

**Status (verified 2026-08-01T19:02Z):**

| Field | Value |
|---|---|
| Scenario active | **false** (inactive); `nextExec=null` |
| Blueprint | Create-or-link; contract **0.2.0** / schema **1.1.0** |
| Idempotency router | `length(2.body)` `text:equal` 0/1 + `numeric:greater` 1 — **no Router 3 fallback** |
| Nested identity filters | `length(5\|6\|7\|8.body)` empty=`text:equal "0"` / single=`text:equal "1"`; multi keeps `numeric:greater "1"` |
| Module 9 | `builtin:BasicIfElse` (17 branches; first-match); Else → module 78 only; **no BasicMerge** |
| Module 78 | Else branch only (`identity_resolution_unclassified`) |
| Connection | `4834536` `HTL Factory Dev (epeddfdifckzzmskhdsz)` |
| `config_versions` grants | service_role SELECT=**true**, INSERT=**true** (remote migration `20260801181727`) |
| CREATE smoke | **PASS** — exec `289d3d945a2645b688ee96b4a18fb50e`; ops **13**; module **76** `outcome=created`; module 78 absent |
| Next owner gate | Authorize LINK / REPLAY / IDENTITY_CONFLICT synthetic E2E |
| Evidence | `artifacts/agent-runs/integrator/20260801T190200Z-form1-module9-exclusivity-and-create-smoke.md` |

## Matching order (company create-or-link)

1. Valid `client_id` (exactly one)  
2. `deployment_key` (exactly one)  
3. Normalized `client_slug` (exactly one)  

**Never auto-link using** `ghl_contact_id`, owner email/phone, `business_name`, `domain`, or fuzzy matching.

| Result | Outcome |
|---|---|
| Zero high-confidence matches | `created` |
| Exactly one agreed match | `linked` (reuse immutable `client_id`; new onboarding case) |
| Conflicting identifiers | `identity_conflict` (no create) |
| Multiple rows for one identifier | `review_required` (no create) |
| Same `submission_id` replay | `replayed` (no writes) |

## Modules (live shape)

```text
webhook → idempotency GET → router(not_replay length=0 | replay length=1 | integrity length>1)
not_replay → lookup client_id → deployment_key → client_slug → opportunity
         → BasicIfElse(review_required | identity_conflict | link_* | create_new | Else module 78)
link/create → onboarding case → PATCH active case → intake → config → RPC → respond
```


Link path does **not** create a client row and does **not** overwrite clients operational fields. Form 1 reported website/domain fields persist into intake/config only (Form 2 operational fields untouched).

## Versions written

| Location | Value |
|---|---|
| `onboarding_cases.onboarding_schema_version` | `1.1.0` |
| `intake_submissions.schema_version` | `1.1.0` |
| `config_versions.config.contract_version` | `0.2.0` |
| Response | includes `outcome`, contract + schema versions |

## Required webhook JSON (synthetic — E2E not authorized yet)

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

Optional for link tests: `client_id` of an existing synthetic client.

## Idempotency

Key pattern: `intake:form1:{ghl_contact_id}:{submission_id}`  
DB unique: `(form, submission_id)` on `intake_submissions`.  
Duplicate → `outcome=replayed` before any create/link writes.

## Non-goals / still unauthorized

- Activate scenario `4852018`
- Send webhook / process submissions
- Pause any live Make scenario
- GHL / ClickUp wiring
- Forms 2/3 Make scenarios

## Evidence

- `artifacts/agent-runs/integrator/20260801T173241Z-form1-nested-length-filter-fix-smoke.md`
- `artifacts/agent-runs/integrator/20260731T203300Z-form1-create-or-link-blueprint.md`
- Before/after filter/proof JSON beside the nested-length evidence file
