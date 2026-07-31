# HTL Onboarding Forms — Global Build Rules

## Business-day timeline

- Send Main Client Onboarding Form within 15 minutes after payment.
- Client deadline: end of next business day.
- CSM review: within 4 business hours after submission.
- Missing-information request: within 1 business day after review.
- Call 1 target: within 2 business days after Form 1 is complete.
- Initial Inventory Upload: due by 12:00 PM local time, 1 business day before Call 1.
- Employee CRM Access Forms: due by 12:00 PM local time, 1 business day before Call 2.
- Call 1 and Call 2 forms: completed live and submitted before the call ends.
- Default client blocker deadline: 2 business days.
- First overdue follow-up: 9:00 AM local time on the next business day.
- Escalation: after 2 missed business-day deadlines or 3 business days without response.

## Form ownership

- Main Client Onboarding Form: client-facing, after payment.
- Employee CRM Access Request: client-facing, one per employee.
- Initial Inventory Upload: client-facing.
- Call 1 Kickoff and Access Form: CSM-only, completed live.
- Call 2 CRM Setup and Team Training Form: CSM-only, completed live.

## Field rules

1. Prefer dropdowns, radio buttons, checkboxes, dates, URLs, numbers, email, and phone fields over free text.
2. Every status field must include `unknown` or `not_verified`.
3. Canonical values must use lowercase snake_case.
4. Never allow vague values like “kind of” or “sort of.”
5. If `other`, `blocked`, `failed`, or `unknown` is selected, require an explanation.
6. Every conditional field must define its trigger, shown fields, and requiredness.
7. Never collect passwords, API keys, verification codes, recovery codes, access tokens, or complete card details.
8. Clients provide facts once. CSMs verify them later.
9. Reuse canonical identity fields. Do not create duplicate versions of the same fact.

## Universal dropdowns

### Existence status
- `yes_verified`
- `yes_unverified`
- `no`
- `unknown`

### Access status
- `verified_full_access`
- `verified_limited_access`
- `invite_sent_pending`
- `client_action_required`
- `previous_agency_blocked`
- `ownership_unclear`
- `not_applicable`
- `not_verified`

### Test result
- `pass`
- `pass_with_issue`
- `fail`
- `blocked`
- `not_tested`
- `not_applicable`

### Evidence status
- `verified`
- `submitted_pending_review`
- `missing`
- `unsupported`
- `not_applicable`

### Approval status
- `approved`
- `approved_with_conditions`
- `pending`
- `rejected`
- `not_required`

## Required blocker fields

- blocker_type
- blocker_summary
- required_action
- responsible_party
- due_date
- evidence_required
- blocks_next_stage
- escalation_date
- resolution_status

## Cursor implementation order

1. Create canonical custom fields.
2. Create dropdown option sets.
3. Create client-facing forms.
4. Create CSM forms.
5. Add conditional logic.
6. Add workflows and deadlines.
7. Test with a fake dealer.
8. Confirm payloads use canonical field names.
