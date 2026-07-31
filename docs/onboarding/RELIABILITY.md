# Reliability (simple — design freeze)

## Idempotency keys

| Kind | Pattern |
|---|---|
| Form submission | `client_id + product_form_id + form_version + submission_id` |
| ClickUp obligation | `onboarding_case_id + obligation_type + obligation_instance` |
| Reminder | `obligation_id + reminder_stage + scheduled_at` |
| Workflow event | `onboarding_case_id + event_type + source_event_id` |
| Transition | existing RPC key + `onboarding_case_id + from + to + triggering_event_id` |

## Transaction boundary

1. Supabase accepts intake  
2. Commits authoritative rows  
3. Outbox/`workflow_events` in same logical acceptance  
4. Make later processes side effects  
5. ClickUp/notify failures retry via `sync_failures` — **do not roll back accepted intake**  
6. No enterprise DLQ product — use existing `sync_failures` / `workflow_events` / `idempotency_keys`

## Intake must not fail because ClickUp/notify is down
