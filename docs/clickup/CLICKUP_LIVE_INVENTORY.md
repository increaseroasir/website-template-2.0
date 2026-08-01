# ClickUp Live Inventory

**Run:** `20260801T015707Z`  
**Agent:** clickup operations architect  
**Branch:** `factory/p2-clickup-operations-spec`  
**Base SHA:** `b7212fcce21130a08c16d7fafa325066ed6a49b0`

## Connector status

| Check | Result | Evidence label |
|---|---|---|
| ClickUp MCP / connector in Cursor | **Not available** (no matching MCP server or tools) | `pending_live_inventory` |
| Live workspace API read | **Not performed** | `pending_live_inventory` |
| Live creates / updates | **Forbidden this pass — none executed** | `repository_derived` |

## Inventory summary

All live ClickUp object IDs remain unresolved. Specs below are derived from repository sources only. Do not treat any ID as real until a read-only live inventory pass succeeds.

| Object | Value | Evidence label |
|---|---|---|
| Workspace ID | `pending_live_inventory` | `pending_live_inventory` |
| Space ID (HTL Onboarding) | `pending_live_inventory` | `pending_live_inventory` |
| Folder ID | `pending_live_inventory` | `pending_live_inventory` |
| List ID (client onboarding) | `pending_live_inventory` | `pending_live_inventory` |
| Master task template ID | `pending_live_inventory` | `pending_live_inventory` |
| Custom field IDs (all) | `pending_live_inventory` | `pending_live_inventory` |
| Status IDs / colors | `pending_live_inventory` | `pending_live_inventory` |
| Automation IDs | `pending_live_inventory` | `pending_live_inventory` |
| View IDs | `pending_live_inventory` | `pending_live_inventory` |
| Assignee / team IDs | `pending_live_inventory` | `pending_live_inventory` |

## Repository sources used (read-only)

| Source | Role | Evidence label |
|---|---|---|
| `docs/onboarding/CLICKUP_ONBOARDING_STRUCTURE.md` | Master task, fields, statuses, phases | `repository_derived` |
| `docs/onboarding/CLICKUP_TIMER_RULES.md` | Manual labor timer rules | `repository_derived` |
| `docs/onboarding/REMINDERS_AND_ESCALATIONS.md` | Waiting / overdue / escalation | `repository_derived` |
| `docs/onboarding/RELIABILITY.md` | Idempotency + ClickUp failure isolation | `repository_derived` |
| `config/onboarding-clickup.json` | Machine stub (IDs pending) | `repository_derived` |
| `config/sync-policy.json` | Supabase authority + mirror lag | `repository_derived` |
| `docs/CANONICAL_CONTRACT.md` | Lifecycle authority, mirror rules | `repository_derived` |
| `docs/FACTORY_CONSTITUTION.md` | ClickUp = human checklist UI | `repository_derived` |

## Config stub (read-only snapshot)

From `config/onboarding-clickup.json` (`repository_derived`):

- `clickup_mcp_connected`: `false`
- `workspace_id` / `space_id` / `list_id` / `template_id`: all `pending_live_inventory`
- Master title pattern: `Onboarding — {public_dba_name} — {client_slug}`
- Idempotency: `onboarding_case_id + obligation_type + obligation_instance`

## Proposed config change (DO NOT APPLY THIS PASS)

File `config/onboarding-clickup.json` is **out of write scope**. Proposed future patch only:

1. Keep `clickup_mcp_connected: false` until live inventory succeeds.
2. After live read-only inventory, fill real `workspace_id`, `space_id`, `list_id`, `template_id`.
3. Replace string `"custom_fields": "..."` with a structured map of field key → live field ID.
4. Add `sync_policy_ref: "config/sync-policy.json"`.
5. Bump `design_freeze_version` only when integrator approves.

## What a future live_verified_readonly pass must capture

1. Workspace / space / folder / list names and IDs  
2. Existing statuses on the target list (exact spellings)  
3. Existing custom fields (name, type, options, IDs)  
4. Any existing onboarding templates or sample tasks  
5. Automations that touch onboarding lists  
6. Confirmation that no Sun Pool protected client tasks are mutated  

## Hard stops

- No fabricated ClickUp IDs  
- No live task/template/field creation this pass  
- No writes to `config/**`, `docs/EXECUTION_STATE.md`, GHL/Make/QA/provisioning docs, Supabase, or `clients/**`
