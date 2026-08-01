# ClickUp Onboarding Template Spec

**Evidence base:** `repository_derived` + `pending_live_inventory`  
**Live creates this pass:** none  
**Authority:** Supabase owns lifecycle; ClickUp is the human ops surface (mirror / queue / timer / evidence).

## Purpose

One ClickUp **master task per onboarding engagement**, keyed by Supabase `onboarding_case_id`, with nine phase subtasks and optional separate work tasks only when ownership, due date, timer, reminder, escalation, or evidence requires it.

## Authority boundaries

| Concern | System of record | ClickUp role |
|---|---|---|
| `client_id`, `onboarding_case_id` | Supabase | Custom fields (mirror) |
| Case / client lifecycle status | Supabase (`request_client_transition`) | Status + health fields (mirror / request only) |
| Due dates / reminder schedule | Orchestration (Make later) | Display due dates; receive reminder flags |
| Manual labor time | ClickUp timer | Authoritative for human labor minutes only |
| Secrets | 1Password | Never store secret values in ClickUp |
| Form answers / config payloads | Supabase + GHL | Milestones only — not every form field |

Sources: `docs/CANONICAL_CONTRACT.md`, `docs/FACTORY_CONSTITUTION.md`, `config/sync-policy.json` — all `repository_derived`.

## Master task

### Identity

| Attribute | Spec | Evidence label |
|---|---|---|
| Cardinality | Exactly one master task per `onboarding_case_id` | `repository_derived` |
| Title | `Onboarding — {public_dba_name} — {client_slug}` | `repository_derived` |
| Idempotency key | `onboarding_case_id + obligation_type + obligation_instance` with `obligation_type=master_onboarding_task` | `repository_derived` |
| List / template IDs | `pending_live_inventory` | `pending_live_inventory` |

### Required custom fields (minimal set)

Create later in ClickUp; IDs remain `pending_live_inventory`.

| Field | Type | Maps from | Required |
|---|---|---|---|
| HTL Client ID | text | `client_id` | yes |
| Onboarding Case ID | text | `onboarding_case_id` | yes |
| Current Phase | enum 1–9 | phase index | yes |
| Overall Health | New / On Track / At Risk / Blocked | ops health | yes |
| Waiting On | Client / HTL / Third Party | wait owner | when waiting |
| Primary Blocker | text | open blocker summary | when blocked |
| Blocker Owner | user | assignee for unblock | when blocked |
| Next Action | text | next human action | yes after start |
| Next Action Due | datetime | orchestration due | yes after start |
| Form 1 Status | enum | intake progress mirror | yes |
| GHL Setup Status | enum | provisioning milestone | yes after phase 3 start |
| A2P Status | enum | compliance milestone | yes after phase 4 start |
| Meta Setup Status | enum | tracking milestone | yes after phase 5 start |
| Website Build Status | enum | website milestone | yes after phase 6 start |
| CRM Test Status | enum | CRM QA milestone | yes after phase 7 start |
| Launch Readiness | enum | launch gate | yes after phase 9 start |
| Call 1 Date | datetime | scheduled Call 1 | when known |
| Call 2 Date | datetime | scheduled Call 2 | when known |

Do **not** map every Form 1/2/3 question into ClickUp. Registry fields use `clickup_destination: none_unless_operational_milestone` (`repository_derived` from field registry).

## Phase subtasks (always under master)

Create as checklist groups or subtasks of the master — prefer checklists for simple milestones; promote to separate tasks only when timer/owner/due/escalation/evidence is required.

| # | Phase name | Checklist group focus |
|---|---|---|
| 1 | Intake and Forms | payment; form sent/completed; CSM review; inventory; employee forms |
| 2 | Call 1 and Access | Call 1 prep/complete; access verification milestones |
| 3 | GHL Setup | sub-account; snapshot; users; calendars; pipeline; phone; email |
| 4 | A2P and Compliance | form → review → submit → pending → approved/rejected |
| 5 | Meta and Tracking | Page / Portfolio / ad account / billing / Pixel / partner access |
| 6 | Website Build | domain → DNS → assets → inventory → generate → QA → live |
| 7 | CRM Testing | lead, routing, SMS, email, calendar, pipeline, phone, AI |
| 8 | Call 2 and Training | Call 2 + training complete |
| 9 | Launch Readiness | blockers cleared; launch approved; launched; post-launch check |

### Milestone checklist groups (content)

**INTAKE:** payment confirmed; onboarding form sent; onboarding form completed; CSM review completed; inventory received; employee forms received  

**GHL:** sub-account created; snapshot installed; snapshot verified; users invited; calendars created; pipeline verified; phone assigned; email domain connected  

**A2P:** form sent → completed → reviewed → submitted → pending → approved / rejected  

**META:** Page / Portfolio / ad account / billing / Pixel / HTL partner / client admin retained  

**WEBSITE:** domain → DNS → assets → inventory import → generate → QA → client review → revisions → final QA → live  

**CRM TESTING:** test lead → routing → SMS → email → calendar → pipeline → phone → AI  

**LAUNCH:** Call 1/2 complete; training; blockers resolved; launch approved; launched; post-launch check  

Source: `docs/onboarding/CLICKUP_ONBOARDING_STRUCTURE.md` (`repository_derived`).

## Separate child tasks (conditional)

Spawn a separate ClickUp task (still linked to master via Onboarding Case ID) only when the work needs **all or most of**:

- Named owner  
- Distinct due date  
- Manual timer  
- Reminder / escalation path  
- Evidence attachment or completion note  

Examples: CSM intake review block, A2P submission packet, website QA pass, CRM test run, launch approval packet.

## Status model (master + work tasks)

Ordered operating statuses (`repository_derived` from structure + config stub):

1. New  
2. Waiting on Client  
3. Ready for CSM  
4. In Progress  
5. Waiting on HTL  
6. Waiting on Third Party  
7. Blocked  
8. Ready for Call  
9. QA  
10. Complete  
11. Cancelled  

Exact ClickUp status IDs/colors: `pending_live_inventory`.

## Timer rules (summary)

Full rules: `docs/onboarding/CLICKUP_TIMER_RULES.md` (`repository_derived`).

1. Move to **In Progress** → start timer when active work begins.  
2. Stop timer when switching, waiting, blocked, or finished.  
3. Move to correct Waiting / Blocked status.  
4. Restart timer when work resumes.  
5. Stop timer before **Complete**.  
6. Add evidence/completion note where required.

**Timer-required:** CSM review, call prep, GHL/A2P/Meta/website/CRM/training/launch QA, internal blocker resolution.  
**Timer-exempt:** client obligations, automated reminders, passive waits (A2P/Meta review, DNS), automated checks.

**Basic flags only:** zero time on completed human task; timer running after Complete; timer running while Waiting/Blocked. No performance scorecards this phase.

## Waiting / blocked / escalation

| Condition | ClickUp surface | Escalation (orchestration-owned) | Evidence label |
|---|---|---|---|
| Waiting on client | Status `Waiting on Client`; Waiting On = Client; due date set | Reminders per REMINDERS doc; overdue → Overall Health At Risk | `repository_derived` |
| Waiting on HTL | Status `Waiting on HTL`; Waiting On = HTL | Internal Slack / manager paths | `repository_derived` |
| Waiting on third party | Status `Waiting on Third Party` | Track Next Action Due; escalate on second miss | `repository_derived` |
| Blocked | Status `Blocked`; Primary Blocker + Blocker Owner | Overdue blocker → client/CSM/manager per REMINDERS | `repository_derived` |
| Form 1 overdue | Overall Health → At Risk | SMS/email/Slack ladder | `repository_derived` |
| 3 business days no response | Owner decision / pause (not auto-cancel in ClickUp) | Owner decision | `repository_derived` |

Reminder scheduling remains orchestration-owned; ClickUp displays due dates and health (`repository_derived`).

## Sync / failure isolation

From `config/sync-policy.json` (`repository_derived`):

- Supabase authoritative; ClickUp is mirror.  
- Normal sync target 300s; delayed after 300s; `sync_failure` after 900s.  
- Never roll back Supabase because ClickUp failed.  
- Stale mirror replay forbidden.  
- Intake acceptance must succeed even if ClickUp is down (`docs/onboarding/RELIABILITY.md`).

## Template packaging (for later live build)

When authorized (not this pass):

1. Create list statuses matching the status model.  
2. Create minimal custom fields.  
3. Create task template with title pattern + nine phase checklists.  
4. Store live IDs into `config/onboarding-clickup.json` (integrator-owned write).  
5. Verify idempotent create against a non-production test case.  
6. Never include Sun Pool without break-glass.

## Out of scope this pass

- Live ClickUp API calls  
- Creating templates, fields, statuses, or tasks  
- Editing `config/onboarding-clickup.json`  
- Make scenario builds  
- Production credentials
