# Git and multi-agent architecture audit

**Run id:** `20260731T174550Z-git-and-agent-architecture-audit`  
**Agent:** integrator  
**Baseline:** after COMMIT 1 `docs(onboarding): preserve Hybrid A+C design freeze`  
**Branch:** `factory/p2-onboarding-forms-and-workflows`  
**Remote:** `increaseroasir/website-template-2.0`  
**UTC:** 2026-07-31T17:45:50Z

## Scope

Part 2–3 only. Did **not** re-audit onboarding Hybrid A+C content. Did **not** restructure branches, create worktrees, merge, or update `EXECUTION_STATE`.

Deliverables:

- [`docs/engineering/MULTI_AGENT_DELIVERY_MODEL.md`](../../../docs/engineering/MULTI_AGENT_DELIVERY_MODEL.md)
- [`docs/engineering/BRANCH_RECONCILIATION_PLAN.md`](../../../docs/engineering/BRANCH_RECONCILIATION_PLAN.md)
- [`docs/engineering/AGENT_FILE_OWNERSHIP.md`](../../../docs/engineering/AGENT_FILE_OWNERSHIP.md)

## Reconciliation baseline (Part 1 result)

| Item | Value |
|---|---|
| COMMIT 1 SHA | `3ced7803980dba63717510a3dc4f26dbcad092ed` |
| Push | `origin/factory/p2-onboarding-forms-and-workflows` |
| Onboarding tests | 46/46 |
| Factory contract | 44/45 — remaining fail = working-tree break-glass only |
| Brand guard | pass |
| Break-glass | preserved untracked, unmodified |
| Make branch/stash | untouched |

## Git verdict

**Acceptable with changes** — high drift risk if stashes and local-only Make branch continue as unofficial state.

Not unsafe for continued design work on the pushed onboarding branch. Unsafe to activate Make or publish contracts without the next owner packages.

## Repository structure

### Strengths

- Clear `config/` contract pin + `supabase/migrations/` for applied schema
- `docs/onboarding/` design pack separated from live platforms
- Safety hooks + protected-client registry
- Agent evidence path convention

### Weaknesses

- Monorepo mixes dealer HTML site + factory control plane (cognitive load)
- Root doc sprawl (many audit markdown files)
- Evidence and packaging artifacts easily pollute working tree
- Dual skill trees (`skills/` vs `manus-skills/`)

### Must-fix (near term)

1. Working-tree Sun Pool break-glass polluting tests  
2. Make stash/branch reconciliation under authorization  
3. Hook false positives on path tokens containing `main` / `premium-redesign` substrings (operational friction)

### Later

- `docs/engineering/` as home for operating model (started this pass)
- CI scope validation per agent branch
- Trim merged remote factory branches

## Source-of-truth map

| Concern | Authoritative | Non-authoritative |
|---|---|---|
| Canonical identity / field policies | `config/identity-fields.json` | Onboarding registry (draft until publish) |
| Lifecycle states | `config/state-machine.json` + Supabase RPC | ClickUp statuses (mirror) |
| Applied schema | `supabase/migrations/**` + live `htl-factory-dev` | `docs/onboarding/proposed-migrations/**` (draft) |
| Form definitions (design) | `config/forms/**` + source pack | Live GHL forms (legacy) |
| Field mappings (design) | `config/onboarding-field-mappings.json` | GHL field keys (inventory) |
| GHL live state | GHL location APIs | Docs inventory snapshots |
| Make scenario state | Make org (live) | `docs/make/**`, stash claims |
| ClickUp work / timers | ClickUp (when connected) | `config/onboarding-clickup.json` design |
| Deployment / website | Cloudflare + git deploy SHA | Local hydrate drafts |
| Secrets | 1Password | Never git |
| Contract versions | Live config pins | Proposed amendment docs |
| Execution status | `docs/EXECUTION_STATE.md` (integrator) | Chat / todos / stashes |
| Release status | Git tags + owner | Agent run markdown |

### Conflicts flagged

- `EXECUTION_STATE` says Make not started; inventory/stash claim scenario `4852018` inactive  
- Stash may be newer than `factory/p2-make-intake` tip docs  
- Working-tree break-glass vs fail-closed tests  

## Commit quality (recent factory)

| Commit | Class |
|---|---|
| P0/P0.5/P1 series | clean / acceptable |
| Onboarding design freeze (COMMIT 1) | acceptable (large but scoped docs+config+tests) |
| Historical `pr-*` locals | mixed / stale |

No history rewrite performed.

## Agent usage

| Pattern | Classification |
|---|---|
| Design freeze JSON/docs | ideal for autonomous agents with tests |
| Contract version publish | human-operated owner decision |
| Migration apply | human-operated + agent-assisted verify |
| Make/GHL/ClickUp create | unsafe for autonomous without auth |
| Architecture audits after reconcile | agent-assisted; avoid looping |
| Sun Pool packaging | blocked / fail closed |

## Immediate next execution package

**Resolve Sun Pool break-glass working-tree artifact** (archive/revoke/move under separate owner-authorized safety task). Do not broaden scope. Do not start Make activation.

## Confirmations

- Sun Pool break-glass not modified  
- No production systems contacted  
- No secrets exposed  
- No merges into `factory/p0-safety-lock`  
- Paradise / Retainer Snapshot untouched  
