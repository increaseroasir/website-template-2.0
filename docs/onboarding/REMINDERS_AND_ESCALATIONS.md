# Reminders and Escalations (design freeze)

Authoritative due/reminder schedule is orchestration-owned. ClickUp shows due dates. Email = detail; SMS = urgent client; Slack = internal.

## Suppression

Stop on complete / cancel / waive / reschedule / pause. No duplicate reminders (idempotency: `obligation_id + reminder_stage + scheduled_at`). Never blast all channels for minor events.

## Form 1 (`main_client_onboarding`)

| When | Action |
|---|---|
| T+15m after payment | Send form (email; SMS optional if urgent) |
| Due | 5:00 PM next business day (client TZ) |
| 9:00 AM due date | SMS + email reminder |
| 3:00 PM due date | SMS reminder |
| Next business day 9:00 AM | Overdue email + SMS |
| Immediately overdue | ClickUp → At Risk |
| 10:00 AM overdue day | Slack to CSM |
| Second missed deadline | Slack → CSM manager |
| 3 business days no response | Owner decision / pause |

## CSM review

Due within 4 business hours (CSM TZ). 2h remaining → ClickUp reminder. 1h remaining → Slack DM. Overdue → Slack channel + manager. No SMS to staff unless opted in.

## Inventory

Due noon 1 business day before Call 1. Reminder 9:00 AM. CSM alert 12:05 PM. Call 1 may continue; launch blocked if missing.

## Employee forms

Due noon 1 business day before Call 2. Reminder 9:00 AM. CSM alert 12:05 PM.

## Blockers

Reminder 9:00 AM due date (client). CSM reminder 2 business hours before. Overdue → ClickUp Overdue + client email/SMS + CSM Slack. Second miss → manager. Resolved/waived → cancel future reminders.

## Missing information

One consolidated request (not per-field spam). Due 1 business day. Reminder 9:00 AM due date.

## Business calendar defaults

- Working days Mon–Fri unless holiday calendar says otherwise
- End of business day default: **5:00 PM client local**
- `business_calendar_id`: pending_live_config
- Client TZ for client deadlines; CSM TZ for internal
