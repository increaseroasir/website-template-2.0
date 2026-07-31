# HTL Canonical Custom Field Registry

## Build this before the forms

## Core identity fields

| Canonical field | Type |
|---|---|
| client_id | hidden text / UUID |
| onboarding_case_id | hidden text / UUID |
| client_slug | hidden text |
| legal_business_name | text |
| public_dba_name | text |
| primary_domain | URL |
| owner_name | text |
| owner_email | email |
| owner_cell | phone |
| primary_timezone | dropdown |
| primary_business_address | address |

## Shared option sets

### boolean_status
yes / no / unknown

### existence_status
yes_verified / yes_unverified / no / unknown

### access_status
verified_full_access / verified_limited_access / invite_sent_pending / client_action_required / previous_agency_blocked / ownership_unclear / not_applicable / not_verified

### test_result
pass / pass_with_issue / fail / blocked / not_tested / not_applicable

### evidence_status
verified / submitted_pending_review / missing / unsupported / not_applicable

### blocker_status
open / waiting_on_client / waiting_on_htl / waiting_on_third_party / resolved / waived

## AI-friendly rules

- One concept per field.
- No free-text status fields.
- Explicit negative states.
- Always include unknown/not_verified.
- Explanation required for other, blocked, failed, or unknown.
- Use stable machine values and friendly human labels.
- Do not reuse one label for multiple concepts.
