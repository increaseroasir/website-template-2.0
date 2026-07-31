# Form 3 — Initial Inventory Upload

## Audience and timing

Client-facing. Due by 12:00 PM local time, 1 business day before Call 1.

| Label | Canonical field | Type | Required |
|---|---|---|---|
| HTL Client ID | client_id_display | hidden/prefilled | Yes |
| Inventory Availability | inventory_availability | dropdown | Yes |
| Inventory Spreadsheet | inventory_spreadsheet | file upload | Conditional |
| Inventory System | inventory_source_system | dropdown | Yes |
| Approval Owner | inventory_approval_owner | text | Conditional |
| Accuracy and Rights Confirmation | inventory_rights_confirmed | checkbox | Conditional |
| Expected Delivery Date | inventory_expected_date | date | Conditional |

Inventory availability options:
- ready_to_upload
- needs_template
- no_current_inventory
- pending

Inventory source options:
- spreadsheet
- pos_export
- inventory_platform
- none

Conditional logic:
- If ready_to_upload, require .xlsx or .csv upload, approval owner, and rights confirmation.
- If needs_template, create task to send inventory template.
- If no_current_inventory, do not block Call 1, but block campaign launch.
- If pending, require expected delivery date.
- Do not accept product images in this form.
