# Form 2 — Employee CRM Access Request

## Audience and timing

Client-facing. One submission per employee. Due by 12:00 PM local time, 1 business day before Call 2.

| Label | Canonical field | Type | Required |
|---|---|---|---|
| HTL Client ID | client_id_display | hidden/prefilled | Yes |
| Employee Full Name | employee_full_name | text | Yes |
| Employee Work Email | employee_email | email | Yes |
| Mobile Number | employee_mobile | phone | Yes |
| Job Title | employee_job_title | dropdown | Yes |
| Other Job Title | employee_job_title_other | text | Conditional |
| Primary Location | employee_location_id | dropdown | Yes |
| Required CRM Role | required_crm_role | dropdown | Yes |
| Lead Assignment Role | lead_assignment_role | dropdown | Yes |
| Can View All Leads | can_view_all_leads | radio | Yes |
| Can Edit Opportunities | can_edit_opportunities | radio | Yes |
| Can Send SMS/Email | can_send_communications | radio | Yes |
| Can Manage Calendar | can_manage_calendar | radio | Yes |
| Calendar Needed | calendar_needed | radio | Yes |
| Calendar Name | calendar_name | text | Conditional |
| Working Days | working_days | multi_select | Yes |
| Working Hours | working_hours | structured schedule | Yes |
| Timezone | employee_timezone | dropdown | Yes |
| Required CRM Functions | required_crm_functions | multi_select | Yes |
| Approving Manager Name | approving_manager_name | text | Yes |
| Approval Date | manager_approval_date | date | Yes |

Job title options:
owner / general_manager / sales_manager / salesperson / csm / receptionist / marketing / service / finance / other

CRM role options:
admin / manager / sales_user / appointment_setter / view_only / custom

Conditional logic:
- If role = custom, require custom_role_notes.
- If calendar needed = yes, require calendar name and schedule.
- If can_send_communications = yes, Call 2 must include SMS/email tests.

Confirmations:
- No credentials shared.
- Information is accurate.
- Manager approval received.
