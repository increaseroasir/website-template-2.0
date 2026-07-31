# Child-table migrations applied and verified on htl-factory-dev

**UTC:** 20260731T193500Z  
**Agent:** integrator  
**Branch:** `factory/p2-integration-reconcile`  
**Base SHA (pre-docs commit):** `1cd2c73e8556eecd422a10dd3eb0810ec0d0a3b2`  
**Project:** `htl-factory-dev` / `epeddfdifckzzmskhdsz`

## Pre-apply gate

| Check | Result |
|---|---|
| `current_user` | `postgres` |
| `transaction_read_only` | `off` |
| Project URL | `https://epeddfdifckzzmskhdsz.supabase.co` |
| Config target name | `htl-factory-dev` |
| History before apply | `20260731081207`, `20260731081314` only |
| File hashes | matched published SHAs |

## Apply

Temporary `apply_authorized=true` only for the apply window; reset to `false` before exit. Not committed while true.

| Order | Local file | MCP name | Remote version | Result |
|---|---|---|---|---|
| 1 | `20260731184500_create_onboarding_employees.sql` | `create_onboarding_employees` | `20260731193347` | success |
| 2 | `20260731184600_create_inventory_submissions.sql` | `create_inventory_submissions` | `20260731193358` | success |

SHA-256 (unchanged from publish):

- employees: `b72cdf80b76a99d0afafac492a254f2f9a7aa3c154492eef7dcce79f87518402`
- inventory: `170f04a7db8560790c161e077b1737dd829d4fba109a78b5bd203840678cd5e3`

No broad db push. No `inventory_items`. History inspected after each apply.

## Table verification

Both tables present with expected columns, PKs, FKs to `clients` / `onboarding_cases`, unique constraints, indexes, comments.

| Table | RLS | Policies | anon/auth DML (SELECT/INSERT/UPDATE/DELETE) |
|---|---|---|---|
| `onboarding_employees` | enabled | 0 | 0 |
| `inventory_submissions` | enabled | 0 | 0 |

Notes:

- `inventory_items` absent
- Platform-default `TRUNCATE` / `REFERENCES` / `TRIGGER` privileges for `anon`/`authenticated` match sister table `clients` (same factory posture). No row DML via Data API roles.
- MCP had intermittent Cloudflare 502s during smoke; migration history rechecked before retries; no re-apply of DDL

## Smoke tests

| Test | Result |
|---|---|
| Insert synthetic client + case + employee + inventory | PASS |
| Duplicate `(client_id, email_normalized)` uniqueness | PASS (unique_violation) |
| Invalid `client_id` FK on inventory | PASS (foreign_key_violation) |
| Delete all synthetic rows | PASS (`emp/inv/cases/clients` left = 0) |
| Anon SELECT under role switch | interrupted by MCP 502; compensated by RLS enabled + zero policies + zero DML grants |

Correlation id used: `smoke-child-20260731`. No Make / GHL / ClickUp / Form 1 scenario.

## Authorization close

| Item | Value |
|---|---|
| `apply_authorized` before | false |
| Temporary authorization | true during apply only |
| `apply_authorized` after | **false** |
| MCP URL restored with `read_only=true` | yes (project + user `~/.cursor/mcp.json`) |
| Post-close identity | `supabase_read_only_user` / `transaction_read_only=on` |
| Final project URL | `https://epeddfdifckzzmskhdsz.supabase.co` |

`.cursor/mcp.json` and `.agents/` not committed.

## Repository tests

| Command | Result |
|---|---|
| onboarding acceptance | **53/53** |
| factory-contract | **46/46** |
| safety | **31/31** |
| brand:guard | pass |

## Confirmations

- No production project touched
- No Make activation / webhook / E2E
- No GHL or ClickUp writes
- No protected-client mutation
- Synthetic data removed

## Next owner decision

Authorize a synthetic Form 1 E2E through inactive scenario `4852018`, including a temporary Make active-slot plan, with no real client data.

## VERDICT

**GO**
