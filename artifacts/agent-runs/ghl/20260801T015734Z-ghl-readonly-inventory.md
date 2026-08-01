# Agent run — GHL read-only onboarding inventory

| Key | Value |
|---|---|
| Run ID | `20260801T015734Z-ghl-readonly-inventory` |
| UTC | `20260801T015734Z` |
| Agent | HTL Factory GHL inventory + forms architecture |
| Worktree | `/Users/alexlobaito/wt-ghl-inventory` |
| Branch | `factory/p2-ghl-inventory-spec` |
| BASE SHA (locked) | `b7212fcce21130a08c16d7fafa325066ed6a49b0` |
| Remote | `increaseroasir/website-template-2.0` |
| Mode | Read-only GHL MCP; docs/specs only; create NOTHING |

## BASE-SHA LOCK

```
git rev-parse HEAD → b7212fcce21130a08c16d7fafa325066ed6a49b0
git branch --show-current → factory/p2-ghl-inventory-spec
git status -sb → clean at start
```

Hard-stop conditions not triggered.

## Location lock

| Check | Result |
|---|---|
| `get_current_location` | Hot Tub Launch Success `wTkbEAsxM73C2gLNpdi8` |
| Switch to other locations | **Not performed** |
| Paradise / Retainer Snapshot / AI Agent Test / Sun Pool | Untouched |

Label: `live_verified_readonly`

## MCP reads performed (read-only)

| Tool | Scope | Result summary |
|---|---|---|
| `get_current_location` | active | HTL Success |
| `list_registered_locations` | registry | 6 locations listed; active = Success |
| `get_forms` | `wTkbEAsxM73C2gLNpdi8` | 3 forms |
| `get_form_full` | `m0crENESrVvozjmHIunZ` | Store Onboarding builder; 50 custom + 4 standard |
| `get_custom_fields` | same | 50 Store Onboarding contact fields |
| `get_workflows` | same | 4 published workflows |
| `get_pipelines` | same | `[]` |
| `get_location_tags` | same | 14 tags incl. `store-onboarding-form-completed` |

**Not called:** any create/update/delete/switch to forbidden locations.

## Live inventory snapshot

### Forms

1. `m0crENESrVvozjmHIunZ` — Store Onboarding Form (Hot Tub Launch Success) — `exists_needs_change`
2. `HPb3oFLlZ4vYD2lqNgjf` — Notify Test Form — `not_required`
3. `BOza6EMJRt9ZwUzG3TIr` — Form 0 — `not_required`

Product package forms (`main_client_onboarding`, `employee_crm_access`, `initial_inventory_upload`, `csm_call_1`, `csm_call_2`): **`missing`**.

### Workflows

- Notify Test Form | Internal SMS Notification | v1 — `cd3d6559-7618-41f7-9c1d-8c2bcbfab8d9`
- Store Onboarding | Send Service Agreement Contract | v1 — `57118a4c-ec5d-43e0-a2b8-e80b9a5de285`
- Store Onboarding | Submission Thank You SMS | v1 — `911a6bcf-1568-45a0-bb78-d18aa94b011d`
- Store Onboarding | Tag on Form Completion | v1 — `ba425b5b-5c19-4c24-9aba-d0e9829b4098`

### Custom fields

50 contact fields, parent `1ayzDw6zjfrctGjmwVji`, prefix `Store Onboarding |`. Full table in `docs/ghl/GHL_ONBOARDING_INVENTORY.md`.

## Contract mapping (repo)

| Item | Value | Label |
|---|---|---|
| Contract version | `0.2.0` | `repository_derived` |
| Onboarding schema | `1.1.0` | `repository_derived` |
| Direction | Hybrid A+C | `repository_derived` |
| Form1 reported fields | six `*_reported_*` | `repository_derived` |
| Employees / inventory | child tables; not form2/form3 | `repository_derived` |
| Mapping JSON GHL IDs | all `pending_live_ids` | `repository_derived` |
| Make Form 1 | scenario `4852018` inactive; hook `2785703` | `prior_evidence_only` |

## Outputs written (writable paths only)

| Path | Non-empty |
|---|---|
| `docs/ghl/GHL_ONBOARDING_INVENTORY.md` | yes |
| `docs/ghl/GHL_FORM_BUILD_SPEC.md` | yes |
| `docs/ghl/GHL_FIELD_MAPPING.md` | yes |
| `artifacts/agent-runs/ghl/20260801T015734Z-ghl-readonly-inventory.md` | yes |
| `tests/ghl/live_inventory_snapshot.json` | yes (static fixture) |

## Evidence label summary

| Label | Used for |
|---|---|
| `live_verified_readonly` | Location, forms, fields, workflows, pipelines, tags |
| `repository_derived` | Contract 0.2.0 / schema 1.1.0, Hybrid A+C, form JSON field lists, ownership |
| `prior_evidence_only` | Make scenario/hook IDs from `docs/make/P2-ghl-forms-dependency.md` |
| `pending_live_inventory` | New form/field/tag/pipeline IDs after future authorized create; ClickUp |
| `unverified` | Not used for primary claims |

## Safety confirmations

1. Sun Pool untouched (no switch, no inventory, no mutate).
2. No production systems contacted.
3. No secret values written to Git or logs (API key truncated by MCP; not copied into docs).
4. No GHL creates/updates/deletes.
5. No edits under `config/**`, `docs/EXECUTION_STATE.md`, `docs/make/**`, `supabase/**`, `clients/**`.

## Verdict

HTL Success has a **legacy Store Onboarding** surface suitable as a reuse/candidate map, but **none** of the five Hybrid A+C product forms exist. Build specs are ready; live create remains **`blocked`** pending owner authorization. Make E2E remains blocked per prior Make org slot evidence.
