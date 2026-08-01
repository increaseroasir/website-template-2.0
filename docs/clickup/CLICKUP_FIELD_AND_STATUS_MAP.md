# ClickUp Field and Status Map

**Evidence labels:** mostly `repository_derived`; all live IDs `pending_live_inventory`.  
**No live creates.** Supabase remains lifecycle authority.

## 1. Identity keys

| ClickUp field (proposed name) | Type | Supabase / contract source | Writer | Live field ID | Evidence |
|---|---|---|---|---|---|
| HTL Client ID | text (UUID) | `clients.client_id` | Make sync after intake | `pending_live_inventory` | `repository_derived` |
| Onboarding Case ID | text (UUID) | `onboarding_cases.onboarding_case_id` | Make sync after intake | `pending_live_inventory` | `repository_derived` |
| (title) public DBA + slug | task title | `public_dba_name`, `client_slug` | Create path | n/a | `repository_derived` |

Idempotency for ClickUp obligations: `onboarding_case_id + obligation_type + obligation_instance` (`repository_derived`).

## 2. Operating status map

ClickUp task status is an **ops queue** state. It must not silently overwrite Supabase lifecycle. Transitions that change authoritative client/case status go through `request_client_transition` (`repository_derived` from CANONICAL_CONTRACT).

| ClickUp status | Meaning | Typical Waiting On | Timer | Overall Health hint | Evidence |
|---|---|---|---|---|---|
| New | Created; not yet actionable by CSM | — | off | New | `repository_derived` |
| Waiting on Client | Client owes form/access/asset | Client | off | On Track or At Risk if overdue | `repository_derived` |
| Ready for CSM | Queue for human pickup | HTL | off | On Track | `repository_derived` |
| In Progress | Active human labor | HTL | **on** | On Track | `repository_derived` |
| Waiting on HTL | Internal dependency, not actively timed | HTL | off | On Track / At Risk | `repository_derived` |
| Waiting on Third Party | Carrier / Meta / DNS / vendor | Third Party | off | On Track / At Risk | `repository_derived` |
| Blocked | Cannot proceed without decision/unblock | Blocker Owner | off | **Blocked** | `repository_derived` |
| Ready for Call | Call 1 or Call 2 ready | HTL / Client | off | On Track | `repository_derived` |
| QA | Internal or client QA in flight | HTL / Client | on when actively testing | On Track / At Risk | `repository_derived` |
| Complete | Engagement ops closed in ClickUp | — | must be off | — | `repository_derived` |
| Cancelled | Abandoned / paused closed | — | off | — | `repository_derived` |

Live status IDs and board colors: `pending_live_inventory`.

### Allowed status transitions (ops guidance)

```
New → Waiting on Client | Ready for CSM | Cancelled
Waiting on Client → Ready for CSM | Blocked | Cancelled
Ready for CSM → In Progress | Waiting on Client | Blocked
In Progress → Waiting on Client | Waiting on HTL | Waiting on Third Party | Blocked | Ready for Call | QA | Complete
Waiting on HTL → Ready for CSM | In Progress | Blocked
Waiting on Third Party → In Progress | Ready for CSM | Blocked
Blocked → Ready for CSM | In Progress | Waiting on Client | Waiting on Third Party | Cancelled
Ready for Call → In Progress | Waiting on Client | QA
QA → In Progress | Waiting on Client | Complete | Blocked
Complete → (terminal; reopen only via owner decision)
Cancelled → (terminal; reopen only via owner decision)
```

This is ClickUp queue guidance only (`repository_derived` synthesis). Authoritative case status remains in Supabase.

## 3. Health / wait / blocker fields

| ClickUp field | Allowed values | Trigger examples | Evidence |
|---|---|---|---|
| Overall Health | New / On Track / At Risk / Blocked | Form 1 immediately overdue → At Risk; open blocker → Blocked | `repository_derived` |
| Waiting On | Client / HTL / Third Party | Matches waiting statuses | `repository_derived` |
| Primary Blocker | free text | Required when status = Blocked | `repository_derived` |
| Blocker Owner | ClickUp user | Required when status = Blocked | `repository_derived` |
| Next Action | free text | Always after work starts | `repository_derived` |
| Next Action Due | datetime | Set from orchestration schedule | `repository_derived` |

## 4. Phase field

| ClickUp field | Values | Sync rule | Evidence |
|---|---|---|---|
| Current Phase | 1 Intake and Forms … 9 Launch Readiness | Mirror of operational phase; advance when phase entry criteria met in ops process — does not alone move Supabase lifecycle | `repository_derived` |

Phase names (exact):

1. Intake and Forms  
2. Call 1 and Access  
3. GHL Setup  
4. A2P and Compliance  
5. Meta and Tracking  
6. Website Build  
7. CRM Testing  
8. Call 2 and Training  
9. Launch Readiness  

## 5. Milestone status enums (minimal)

Exact option sets for live ClickUp dropdowns: `pending_live_inventory` (must match existing list if any). Proposed semantic values:

| Field | Proposed options | Notes |
|---|---|---|
| Form 1 Status | not_sent / sent / completed / csm_review / accepted | Mirror only |
| GHL Setup Status | not_started / in_progress / snapshot_verified / complete / blocked | Milestone, not every GHL object |
| A2P Status | not_started / form_sent / submitted / pending / approved / rejected / blocked | Passive-exempt while pending |
| Meta Setup Status | not_started / in_progress / complete / blocked / not_applicable | |
| Website Build Status | not_started / building / qa / client_review / live / blocked | |
| CRM Test Status | not_started / in_progress / pass / pass_with_issue / fail / blocked | Aligns with registry test enums (`repository_derived`) |
| Launch Readiness | not_ready / ready / approved / launched / paused | Gate mirror |

## 6. Call date fields

| Field | Source | Evidence |
|---|---|---|
| Call 1 Date | Scheduling system / CSM entry | `repository_derived` |
| Call 2 Date | Scheduling system / CSM entry | `repository_derived` |

## 7. Form field → ClickUp policy

From onboarding field registry pattern (`repository_derived`):

- Default: `clickup_destination: none_unless_operational_milestone`  
- Only operational milestones, blockers, and due dates appear in ClickUp  
- Do not create one custom field per questionnaire answer  

## 8. Sync lag policy (mirror)

| Metric | Value | Evidence |
|---|---|---|
| Authoritative system | Supabase | `repository_derived` |
| Mirror | ClickUp | `repository_derived` |
| Delayed after | 300 seconds | `repository_derived` |
| sync_failure after | 900 seconds | `repository_derived` |
| Authoritative rollback on mirror failure | false | `repository_derived` |
| Stale mirror replay | forbidden | `repository_derived` |

## 9. Escalation → ClickUp field effects

| Escalation event (orchestration) | ClickUp effect | Evidence |
|---|---|---|
| Form 1 immediately overdue | Overall Health → At Risk | `repository_derived` |
| Blocker overdue | Status remains Blocked or Waiting; surface Overdue; notify CSM | `repository_derived` |
| Second missed deadline | Manager Slack (external); ClickUp stays At Risk/Blocked | `repository_derived` |
| Resolved / waived | Clear Primary Blocker; cancel future reminders; restore On Track when appropriate | `repository_derived` |
| Complete / cancel / pause | Suppress reminders | `repository_derived` |

## 10. Proposed `config/onboarding-clickup.json` structure (propose only)

Writable config is **forbidden this pass**. Proposed shape for integrator later:

```json
{
  "design_freeze_version": "0.1.0-design",
  "clickup_mcp_connected": false,
  "workspace_id": "pending_live_inventory",
  "space_id": "pending_live_inventory",
  "list_id": "pending_live_inventory",
  "template_id": "pending_live_inventory",
  "master_task_pattern": "Onboarding — {public_dba_name} — {client_slug}",
  "statuses": ["New", "Waiting on Client", "Ready for CSM", "In Progress", "Waiting on HTL", "Waiting on Third Party", "Blocked", "Ready for Call", "QA", "Complete", "Cancelled"],
  "phases": ["Intake and Forms", "Call 1 and Access", "GHL Setup", "A2P and Compliance", "Meta and Tracking", "Website Build", "CRM Testing", "Call 2 and Training", "Launch Readiness"],
  "custom_fields": {
    "htl_client_id": "pending_live_inventory",
    "onboarding_case_id": "pending_live_inventory",
    "current_phase": "pending_live_inventory",
    "overall_health": "pending_live_inventory",
    "waiting_on": "pending_live_inventory",
    "primary_blocker": "pending_live_inventory",
    "blocker_owner": "pending_live_inventory",
    "next_action": "pending_live_inventory",
    "next_action_due": "pending_live_inventory",
    "form_1_status": "pending_live_inventory",
    "ghl_setup_status": "pending_live_inventory",
    "a2p_status": "pending_live_inventory",
    "meta_setup_status": "pending_live_inventory",
    "website_build_status": "pending_live_inventory",
    "crm_test_status": "pending_live_inventory",
    "launch_readiness": "pending_live_inventory",
    "call_1_date": "pending_live_inventory",
    "call_2_date": "pending_live_inventory"
  },
  "idempotency_key_pattern": "onboarding_case_id + obligation_type + obligation_instance",
  "sync_policy_ref": "config/sync-policy.json"
}
```

## 11. Unverified / pending

| Claim | Label |
|---|---|
| Existing production ClickUp space already matches these status names | `unverified` |
| Custom fields already exist with these names | `pending_live_inventory` |
| Any prior live inventory artifact for this workspace | `prior_evidence_only` — none found under `artifacts/agent-runs/clickup/` at run start |
