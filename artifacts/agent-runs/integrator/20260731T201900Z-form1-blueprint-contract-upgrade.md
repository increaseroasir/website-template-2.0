# Form 1 blueprint upgraded to contract 0.2.0 / schema 1.1.0 (inactive)

**UTC:** 20260731T201900Z  
**Agent:** integrator  
**Branch tip before:** `f512c4a922d51e94d299880ff5e3886205e61cf9`  
**Scenario:** `4852018` `HTL Factory Form 1 Intake (dev_test)`  
**Webhook:** `2785703`  
**Connection:** `4834536` `HTL Factory Dev (epeddfdifckzzmskhdsz)`

## Pre-change snapshot

| Item | Value |
|---|---|
| `isActive` | `false` |
| Hook | `2785703` |
| Conn | `4834536` on every Supabase module |
| Packages | `gateway`, `supabase`, `builtin` only |
| Scenario runs | **0** (no webhook executions) |
| `onboarding_schema_version` | `1.0.0` |
| intake `schema_version` | `1.0.0` |
| intake `payload` | `{}` |
| config | `{}` |
| Rollback file | `artifacts/agent-runs/integrator/20260731T201800Z-form1-blueprint-BEFORE-rollback.json` |

Module order (unchanged):  
1 webhook → 2 idempotency GET → 3 router → 4 dup respond / 5 create client → 6 case → 7 PATCH active case → 8 intake → 9 config → 10 RPC transition → 11 respond

## Contract mapping (Form 1 identity set)

Source of truth: `config/identity-fields.json` → `forms.form1.fields` (contract **0.2.0**).  
Normalized destination: `config_versions.config` jsonb.  
Raw destination: `intake_submissions.payload` jsonb.  
Case column: `onboarding_cases.onboarding_schema_version = 1.1.0`.  
Intake column: `intake_submissions.schema_version = 1.1.0`.

| Incoming field | Destination | Owner | Nullable / default | Null clears? | Provenance | Idempotency |
|---|---|---|---|---|---|---|
| `business_name` | `clients.business_name` + `config.business_name` + payload | form1 | required | no (`null_does_not_clear`) | form1 create | unique `(form, submission_id)` + dup route |
| `owner_name` | `config` + payload | form1 | required | no | form1 | same |
| `owner_email` | `config` + payload | form1 | required | no | form1 | same |
| `owner_phone` | `config` + payload | form1 | required | no | form1 | same |
| `offer_summary` | `config` + payload | form1 | required | no | form1 | same |
| `market` | `config` + payload | form1 | optional / deferrable | no | form1 | same |
| `ghl_contact_id` | clients + case + intake + config + payload | form1 | required | no | external id store | same |
| `ghl_opportunity_id` | case + config + payload | form1 | optional | no | external id store | same |
| `website_reported_status` | `config` + payload | form1 | optional | no | reported | same |
| `website_reported_url` | `config` + payload | form1 | optional | no | reported | same |
| `domain_reported_name` | `config` + payload | form1 | optional | no | reported | same |
| `domain_reported_ownership_status` | `config` + payload | form1 | optional | no | reported | same |
| `dns_reported_provider` | `config` + payload | form1 | optional | no | reported | same |
| `dns_reported_owner` | `config` + payload | form1 | optional | no | reported | same |
| `contract_version` | fixed `0.2.0` in config + payload + response | system | const | n/a | blueprint | n/a |
| `onboarding_schema_version` | case col + config/payload `1.1.0` | system | const | n/a | blueprint | n/a |
| `client_slug` / `deployment_key` / `domain` | `clients.*` (+ envelope in payload) | infra identity for create path | required for create | n/a | webhook | client_slug unique |

**Intentionally excluded:** Form 2 operational fields (`website_url`, `domain` as Form 2 owned, `dns_provider`, `dns_owner`, `logo_url`, `address`, `hours`, `phone_e164`); Form 3 fields; employees; inventory; GHL/ClickUp modules.

**Create-or-link:** Contract purpose is create-or-link. Live blueprint remains **create-only** (unchanged). Link path not added (no redesign).

## Modules changed

| Module ID | Change |
|---|---|
| 6 | `onboarding_schema_version` `1.0.0` → `1.1.0` |
| 8 | `schema_version` → `1.1.0`; `payload` → Form 1 identity JSON + versions |
| 9 | `config` → Form 1 identity JSON + `contract_version` / schema versions |
| 11 | Response includes `contract_version` / `onboarding_schema_version` |

Unchanged: webhook `2785703`, connection `4834536`, name, activation state, RPC, router, client create, GHL/ClickUp absent.

## Static verification

| Check | Result |
|---|---|
| `isActive` after | **false** |
| Active scenarios org | still **26** (nothing paused) |
| GHL / ClickUp modules | none |
| Packages | gateway / supabase / builtin only |
| Project connection name | `HTL Factory Dev (epeddfdifckzzmskhdsz)` |
| Webhook executions | still **0** |
| Rollback snapshot | present |

## Capacity

Still **blocked** for E2E: 26 active / no free slot. No scenarios paused. Recommendation remains: increase Make capacity, then authorize synthetic E2E.

## Confirmations

- No activation  
- No webhook send  
- No GHL / ClickUp / production / Sun Pool touch  
- No employee / inventory writes  
- Scenario stayed inactive  
