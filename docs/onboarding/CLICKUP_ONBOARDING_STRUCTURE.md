# ClickUp Onboarding Operating Model (spec only)

**ClickUp MCP:** not connected. All workspace/list/template/custom-field/automation IDs = `pending_live_inventory`. Do not fabricate IDs.

## Roles

- ClickUp = human task queue, milestone tracker, blocker tracker, due-date surface, evidence surface, **manual labor timer**
- Supabase = identity + lifecycle status authority
- Reminder **scheduling** = orchestration-owned (Make later); ClickUp displays due dates

## One master task per client

Title pattern: `Onboarding — {public_dba_name} — {client_slug}`

Custom fields (minimal — create later):

| Field | Purpose | Live ID |
|---|---|---|
| HTL Client ID | Supabase `client_id` | pending_live_inventory |
| Onboarding Case ID | Supabase `onboarding_case_id` | pending_live_inventory |
| Current Phase | 1–9 phase enum | pending_live_inventory |
| Overall Health | New / On Track / At Risk / Blocked | pending_live_inventory |
| Waiting On | Client / HTL / Third Party | pending_live_inventory |
| Primary Blocker | Text | pending_live_inventory |
| Blocker Owner | User | pending_live_inventory |
| Next Action | Text | pending_live_inventory |
| Next Action Due | DateTime | pending_live_inventory |
| Form 1 Status | enum | pending_live_inventory |
| GHL Setup Status | enum | pending_live_inventory |
| A2P Status | enum | pending_live_inventory |
| Meta Setup Status | enum | pending_live_inventory |
| Website Build Status | enum | pending_live_inventory |
| CRM Test Status | enum | pending_live_inventory |
| Launch Readiness | enum | pending_live_inventory |
| Call 1 Date | DateTime | pending_live_inventory |
| Call 2 Date | DateTime | pending_live_inventory |

## Task statuses

New → Waiting on Client → Ready for CSM → In Progress → Waiting on HTL → Waiting on Third Party → Blocked → Ready for Call → QA → Complete → Cancelled

## Phase subtasks (checklists for simple milestones)

1. Intake and Forms  
2. Call 1 and Access  
3. GHL Setup  
4. A2P and Compliance  
5. Meta and Tracking  
6. Website Build  
7. CRM Testing  
8. Call 2 and Training  
9. Launch Readiness  

### Milestone checklist groups

**INTAKE:** payment confirmed; onboarding form sent; onboarding form completed; CSM review completed; inventory received; employee forms received  

**GHL:** sub-account created; snapshot installed; snapshot verified; users invited; calendars created; pipeline verified; phone assigned; email domain connected  

**A2P:** form sent → completed → reviewed → submitted → pending → approved / rejected  

**META:** Page / Portfolio / ad account / billing / Pixel / HTL partner / client admin retained  

**WEBSITE:** domain → DNS → assets → inventory import → generate → QA → client review → revisions → final QA → live  

**CRM TESTING:** test lead → routing → SMS → email → calendar → pipeline → phone → AI  

**LAUNCH:** Call 1/2 complete; training; blockers resolved; launch approved; launched; post-launch check  

## Separate tasks only when work needs

Owner + due date + manual timer + reminders + escalation + evidence.

Do **not** map every form question into ClickUp.

## Machine config stub

See [`config/onboarding-clickup.json`](../../config/onboarding-clickup.json).
