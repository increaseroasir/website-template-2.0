# Form 1 — Main Client Onboarding Form

## Audience and timing

Client-facing. Send within 15 minutes after payment. Due by end of next business day. CSM reviews within 4 business hours.

## Section 1 — Business Identity

| Label | Canonical field | Type | Required | Options / logic |
|---|---|---|---|---|
| Legal Business Name | legal_business_name | text | Yes | Official legal name |
| Public DBA Name | public_dba_name | text | Yes | Customer-facing name |
| Primary Domain | primary_domain | URL | Conditional | Required unless website_status = no_website |
| Owner Name | owner_name | text | Yes | |
| Owner Email | owner_email | email | Yes | |
| Owner Cell | owner_cell | phone | Yes | |
| Submitted By Email | submitted_by_email | email | Yes | |
| Physical Business Address | primary_business_address | address | Yes | |
| Primary Timezone | primary_timezone | dropdown | Yes | IANA timezone list |
| Number of Locations | number_of_locations | number | Yes | Minimum 1 |
| EIN Available If Required | ein_availability | dropdown | Yes | available / unavailable / unknown |
| Implementation Lead | implementation_lead_type | dropdown | Yes | owner / employee / outside_partner |
| Implementation Lead Name | implementation_lead_name | text | Conditional | Show if lead is not owner |
| Primary Business Goals | primary_business_goals | multi_select | Yes | increase_leads / increase_appointments / increase_sales / improve_follow_up / improve_reporting / launch_new_location / other |
| Approximate Monthly Lead Volume | monthly_lead_volume_range | dropdown | Yes | 0_25 / 26_50 / 51_100 / 101_250 / 251_500 / 500_plus / unknown |
| Approximate Monthly Hot Tub Sales | monthly_sales_range | dropdown | Yes | 0_5 / 6_10 / 11_20 / 21_40 / 41_plus / unknown |
| Referral Source | referral_source | dropdown | Yes | referral / google / facebook / conference / partner / outbound / other |

## Section 2 — Locations and Service Area

| Label | Canonical field | Type | Required |
|---|---|---|---|
| Primary Location Name | primary_location_name | text | Yes |
| Primary Location Address | primary_location_address | address | Yes |
| Location Timezone | location_timezone | dropdown | Yes |
| Location Main Phone | location_main_phone | phone | Yes |
| Store Hours | location_store_hours | structured schedule | Yes |
| Appointment Availability | appointment_availability | structured schedule | Yes |
| Target Area Type | target_area_type | dropdown | Yes |
| Target Cities or ZIP Codes | target_areas | tags/multiline | Yes |
| Excluded Target Areas | excluded_target_areas | tags/multiline | No |
| Additional Locations Exist | additional_locations_exist | radio | Yes |

Target area options: cities / zip_codes / counties / radius / mixed.

Conditional logic:
- If additional locations = yes, show repeatable location block.
- If target area = radius, show target_radius_miles.
- If mixed, require targeting notes.

## Section 3 — Products, Offers, and Financing

| Label | Canonical field | Type | Required |
|---|---|---|---|
| Product Categories | product_categories | multi_select | Yes |
| Featured Products or Models | featured_products | paragraph | Yes |
| Active Promotion Status | active_promotion_status | dropdown | Yes |
| Current Offers or Promotions | current_offers | paragraph | Conditional |
| Offer Start Date | offer_start_date | date | Conditional |
| Offer End Date | offer_end_date | date | Conditional |
| Financing Available | financing_available | dropdown | Yes |
| Financing Provider | financing_provider | text | Conditional |
| Financing Details Available | financing_details_available | dropdown | Conditional |

Product categories: hot_tubs / swim_spas / saunas / cold_plunges / accessories / service / other.

Promotion status: active / planned / none / unknown.

Financing status: yes_verified / yes_unverified / no / unknown.

## Section 4 — Website and Brand

| Label | Canonical field | Type | Required |
|---|---|---|---|
| Website Status | website_status | dropdown | Yes |
| Website URL | website_url | URL | Conditional |
| Domain Ownership Status | domain_ownership_status | dropdown | Yes |
| Facebook Page Status | facebook_page_status | dropdown | Yes |
| Facebook Page URL | facebook_page_url | URL | Conditional |
| Instagram Status | instagram_status | dropdown | Yes |
| Google Business Profile Status | google_business_profile_status | dropdown | Yes |
| Logo Available | logo_available | dropdown | Yes |
| Photo and Video Assets | media_assets_status | dropdown | Yes |
| Awards or Certifications | awards_certifications | paragraph | No |

Website options:
- live_client_controls
- live_previous_agency_controls
- live_access_unclear
- no_website
- under_construction

Facebook options:
- exists_verified
- exists_unverified
- no_page
- unknown

Conditional logic:
- If no website, hide website admin questions and create Call 1 task to confirm desired domain and registrar.
- If no Facebook Page, create Call 1 setup checklist.
- If previous agency controls website/domain, create blocker.

## Section 5 — Systems Overview

| Label | Canonical field | Type | Required |
|---|---|---|---|
| Existing CRM Status | existing_crm_status | dropdown | Yes |
| CRM Platform | existing_crm_platform | text | Conditional |
| Approximate CRM Users | crm_user_count | number | Conditional |
| Meta Business Portfolio Status | meta_business_portfolio_status | dropdown | Yes |
| Meta Ad Account Status | meta_ad_account_status | dropdown | Yes |
| Meta Payment Method Status | meta_payment_method_status | dropdown | Yes |
| Phone Provider Status | phone_provider_status | dropdown | Yes |
| POS System Status | pos_system_status | dropdown | Yes |
| Inventory System Status | inventory_system_status | dropdown | Yes |
| Existing Chatbot or Voice AI | chatbot_ai_status | dropdown | Yes |
| Previous Agency Involved | previous_agency_involved | dropdown | Yes |

Meta Business Portfolio options:
- exists_client_owned
- exists_previous_agency_owned
- exists_ownership_unclear
- does_not_exist
- client_restricted
- unknown

Meta Ad Account options:
- exists_active
- exists_disabled
- does_not_exist
- unknown

Meta payment options:
- added
- not_added
- expired_or_failed
- unknown

## Section 6 — Contact Database and Marketing

| Label | Canonical field | Type | Required |
|---|---|---|---|
| Existing Contact Database | contact_database_status | dropdown | Yes |
| Database Source System | contact_database_source | text | Conditional |
| Email Consent Status | email_consent_status | dropdown | Conditional |
| Opt-Out Status Available | opt_out_status_available | dropdown | Conditional |
| Social Ads Currently Running | social_ads_status | dropdown | Yes |
| Current Reporting Setup | reporting_setup_status | dropdown | Yes |

Contact database options:
- exists_exportable
- exists_not_exportable
- none
- unknown

## Section 7 — Lead Routing

| Label | Canonical field | Type | Required |
|---|---|---|---|
| Sales Team Structure | sales_team_structure | dropdown | Yes |
| Primary Lead Recipient Email | primary_lead_recipient_email | email | Yes |
| Backup Lead Recipient Email | backup_lead_recipient_email | email | Yes |
| Backup Lead Recipient Mobile | backup_lead_recipient_mobile | phone | Yes |
| Default Lead Routing Method | default_lead_routing_method | dropdown | Yes |

Routing options:
- primary_only
- round_robin
- location_based
- product_based
- manual
- other

## Client help notes

- Meta Business Portfolio: “This is Meta’s business container that owns your Page and ad account. Do not create a fake Facebook profile.”
- Payment Method: “You will add your own payment method during screen share. Do not enter card details here.”
- Website Status: “Choose who currently controls the website.”
- Financing: “Only include lender-approved terms.”
