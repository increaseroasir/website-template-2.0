# ClickUp Manual Timer Rules (spec only)

## Purpose

Measure **active CSM / fulfillment labor** only. Not employee surveillance scoring.

## Required behavior

1. Move task to **In Progress**.
2. Start timer when active work begins.
3. Stop timer when switching tasks, waiting, blocked, or finished.
4. Move task to correct Waiting / Blocked status.
5. Restart timer when work resumes.
6. Stop timer before **Complete**.
7. Add evidence or completion note where required.

## Timer-required work

CSM intake review; call preparation; GHL setup; snapshot verification; A2P review/submission; Meta setup assistance; website build/QA; CRM setup/testing; training; launch QA; internal blocker resolution.

## Timer-exempt work

Client obligations; automated reminders; passive A2P/Meta review waits; passive DNS propagation; automated checks.

## Timing signals (not the labor timer)

Use task history/status for: time to start, waiting time, blocked time, overdue time, total cycle time.

## Basic flags only

- Completed human task with **zero** tracked time
- Timer still running after Complete
- Timer running while Waiting or Blocked

No performance scorecards in this phase.
