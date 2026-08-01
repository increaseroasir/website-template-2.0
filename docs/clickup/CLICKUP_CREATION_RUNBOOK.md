# ClickUp Creation Runbook

**Mode this pass:** specification only — **no live creates**.  
**Evidence:** `repository_derived` + `pending_live_inventory`.

## Preconditions (hard gates)

Fail closed unless all are true:

1. Canonical repo remote is `increaseroasir/website-template-2.0`.  
2. Integrator authorized ClickUp write scope (not this docs-only pass).  
3. ClickUp MCP or API credential available for the **target non-production / staging list** first.  
4. Live inventory completed and filed under `docs/clickup/CLICKUP_LIVE_INVENTORY.md` with `live_verified_readonly` labels on IDs.  
5. Target client is **not** protected (`sun-pool-spa`) unless a valid break-glass artifact exists.  
6. Supabase already holds authoritative `client_id` + `onboarding_case_id` for the engagement (ClickUp never invents identity).  
7. Idempotency key computed: `onboarding_case_id + obligation_type + obligation_instance`.

If any gate fails → **BLOCKED**. Do not create.

## Authority reminder

1. Accept intake in Supabase first.  
2. Commit authoritative rows + outbox/workflow events.  
3. Process ClickUp as a side effect.  
4. On ClickUp failure → retry via `sync_failures`; **do not** roll back intake.  

Sources: `docs/onboarding/RELIABILITY.md`, `config/sync-policy.json` (`repository_derived`).

## Ordered creation sequence

Execute only after live inventory and authorization. Order is mandatory.

### Step 0 — Read-only inventory (required before any create)

1. Confirm workspace / space / folder / list IDs.  
2. Diff live statuses vs `CLICKUP_FIELD_AND_STATUS_MAP.md`.  
3. Diff live custom fields vs minimal field set.  
4. Record results with `live_verified_readonly`.  
5. Stop if names collide with unrelated lists.

### Step 1 — List configuration (one-time setup)

1. Ensure statuses exist in the exact order/names from the field map.  
2. Create missing custom fields (minimal set only).  
3. Save live field IDs into `config/onboarding-clickup.json` (**integrator write**; out of scope for this agent pass).  
4. Create or update the master **task template** with nine phase checklist groups.  
5. Store `template_id`.

### Step 2 — Per-case master task create (runtime)

For each new `onboarding_case_id`:

1. Lookup idempotency key; if master already exists → update mirror fields only.  
2. Create from template (or clone) on the onboarding list.  
3. Set title: `Onboarding — {public_dba_name} — {client_slug}`.  
4. Set HTL Client ID + Onboarding Case ID.  
5. Set status `New` or `Waiting on Client` (if Form 1 already sent).  
6. Set Overall Health `New` or `On Track`.  
7. Set Current Phase `1` (Intake and Forms) unless intake already advanced in Supabase.  
8. Set Next Action + Next Action Due from orchestration schedule.  
9. Do **not** start timer on create.

### Step 3 — Phase subtasks / checklists

1. Ensure all nine phase groups exist under the master.  
2. Check off only milestones proven by Supabase/GHL evidence or human confirmation.  
3. Do not invent completion.

### Step 4 — Conditional separate tasks

Create a child/linked task only when work needs owner + due + timer + reminder/escalation + evidence. Examples:

| Obligation type (example) | When |
|---|---|
| `csm_intake_review` | Form 1 completed |
| `a2p_submission` | A2P packet ready for human submit |
| `website_qa` | Build ready for QA |
| `crm_test_run` | CRM testing window |
| `launch_approval` | Launch readiness review |

Each uses the same idempotency pattern with distinct `obligation_type` / `obligation_instance`.

### Step 5 — Waiting / blocked handling

1. When waiting: stop timer → set Waiting status → set Waiting On → set Next Action Due.  
2. When blocked: stop timer → status Blocked → Primary Blocker + Blocker Owner → Overall Health Blocked.  
3. Never leave timer running in Waiting/Blocked/Complete.

### Step 6 — Escalation surface (display only)

Orchestration owns reminder sends. ClickUp runbook actions:

1. Apply Overall Health At Risk when orchestration signals overdue.  
2. Keep due dates current when rescheduled.  
3. On resolve/waive: clear blocker fields; restore health; do not delete audit comments.

### Step 7 — Completion

1. Stop timer.  
2. Confirm evidence notes on timer-required work.  
3. Set status Complete only when ops close is intentional.  
4. Authoritative “client live / cancelled” remains a Supabase transition — ClickUp Complete is the human queue close, not the factory SoT.

## Explicit non-actions

| Action | This pass | Future authorized pass |
|---|---|---|
| Create ClickUp tasks | **No** | Yes after gates |
| Create custom fields | **No** | One-time setup |
| Create automations | **No** | Separate approval |
| Write secrets into ClickUp | **Never** | **Never** |
| Roll back Supabase on ClickUp error | **Never** | **Never** |
| Bulk operate `clients/*` | **No** | Restricted |
| Touch Sun Pool without break-glass | **No** | Break-glass only |

## Rollback / repair

| Failure | Repair |
|---|---|
| Duplicate master tasks | Prefer task with matching Onboarding Case ID + earliest create; close extras as Cancelled with note; fix idempotency store |
| ClickUp down during intake | Leave outbox event; retry; intake stays accepted |
| Mirror lag > 5 min | Mark delayed |
| Mirror lag > 15 min | `sync_failure` + alert; continue Supabase authority |
| Wrong client linked | Halt; reconcile via Supabase IDs; do not “fix forward” by guessing |

## Verification checklist (after a future create)

- [ ] Master title matches pattern  
- [ ] `onboarding_case_id` custom field set and unique on list  
- [ ] Nine phase groups present  
- [ ] Status is valid  
- [ ] Timer not running  
- [ ] No secret values in description/attachments  
- [ ] Sun Pool untouched (or break-glass cited)  
- [ ] Idempotency key recorded  

## Related specs

- `docs/clickup/CLICKUP_LIVE_INVENTORY.md`  
- `docs/clickup/CLICKUP_ONBOARDING_TEMPLATE_SPEC.md`  
- `docs/clickup/CLICKUP_FIELD_AND_STATUS_MAP.md`  
- `docs/onboarding/CLICKUP_TIMER_RULES.md`  
- `docs/onboarding/REMINDERS_AND_ESCALATIONS.md`
