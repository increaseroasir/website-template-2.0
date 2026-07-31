# Conditional Logic (design freeze)

Source: [`docs/onboarding/source/01–05`](./source/). No invented branches.

## main_client_onboarding

| Trigger | Show / require | Side effects (design) |
|---|---|---|
| `website_status = no_website` | Hide website admin/access questions; require desired-domain path at Call 1 | Call 1 checklist; do not block Call 1 solely for no website; launch blocked if domain/DNS unresolved |
| `website_status` previous agency controls | — | Create blocker (asset transfer) |
| `facebook_page_status = no_page` | — | Call 1 setup checklist; real personal FB profile required later |
| `meta_business_portfolio_status = does_not_exist` | — | Call 1 Meta setup checklist (no passwords/cards in form) |
| `additional_locations_exist = yes` | Repeatable location block | — |
| `target_area_type = radius` | `target_radius_miles` | — |
| `target_area_type = mixed` | targeting notes | — |
| `active_promotion_status` active/planned | offers + dates | — |
| `financing_available` yes_* | provider + details | — |
| `implementation_lead_type != owner` | `implementation_lead_name` | — |
| `existing_crm_status` none | Hide migration questions | CRM creation = HTL setup work |
| `email_consent_status` mixed/no | — | Compliance blocker; no import |
| `previous_agency_involved` yes | Asset transfer fields | Blocker |

## employee_crm_access

| Trigger | Effect |
|---|---|
| `required_crm_role = custom` | Require `custom_role_notes` |
| `calendar_needed = yes` | Require calendar name + schedule |
| `can_send_communications = yes` | Call 2 must include SMS/email tests |
| Duplicate `employee_email` per client | Fail closed (design rule) |

## initial_inventory_upload

| Trigger | Effect |
|---|---|
| `ready_to_upload` | Require spreadsheet + approval owner + rights |
| `needs_template` | Task to send template |
| `no_current_inventory` | Call 1 allowed; launch blocked |
| `pending` | Require `inventory_expected_date` |

## csm_call_1

| Trigger | Effect |
|---|---|
| Confirmation checkboxes unchecked | Notes + blocker |
| `website_verified_status = no_website` | Desired domain / registrar / DNS fields; website_build_required |
| Meta portfolio does not exist | Guide checklist; verified Meta fields required |
| Evidence missing/unsupported | Owner + due date + evidence needed |
| Required access pending/blocked | Cannot set `access_approved = approved` |

## csm_call_2

| Trigger | Effect |
|---|---|
| Provisioned ≠ expected employees | Exception required |
| Any required test fail/blocked/not_tested | Notes + owner + retest; no advance without exception |
| Consent mixed/unclear/failed | Prohibit import |
| Training failed / employees absent | Do not mark training complete |
