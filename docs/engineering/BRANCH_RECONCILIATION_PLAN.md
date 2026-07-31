# Branch Reconciliation Plan

**Status:** Audit recommendation only — do not restructure in this pass  
**Baseline after COMMIT 1:** `factory/p2-onboarding-forms-and-workflows` @ preserved design freeze  
**Integration tip:** `factory/p0-safety-lock` @ `9b51c64`  
**Date (UTC):** 2026-07-31

## Current model verdict

**Hybrid / ad hoc feature branching** on top of a protected integration branch (`factory/p0-safety-lock`), with `premium-redesign` as the clean dealer-site baseline. Not pure trunk-based; not classic Git Flow.

## Branch table (audit snapshot)

| Branch | Purpose | Base / tip | Upstream | vs p0-safety-lock (behind/ahead) | Risk | Disposition |
|---|---|---|---|---|---|---|
| `factory/p0-safety-lock` | Protected integration | `9b51c64` | matching origin | 0/0 | Low | Keep as integration |
| `factory/p2-onboarding-forms-and-workflows` | Onboarding design freeze | based on `9b51c64` | origin (pushed) | 0/1 | Low | Keep; PR later when owner ready |
| `factory/p2-make-intake` | Make inventory + Form 1 design | `d003a71` | **none** | 0/1 | **High** — local-only + stash may claim live IDs | Leave intact; reconcile later; do not merge until authorized |
| `factory/p0-5-contract-freeze` | Merged P0.5 | `5040fa9` | origin | 7/0 | Low | Close after confirming merged |
| `factory/p1-register-supabase-dev-target` | Merged P1 | `df5708b` | origin | 4/0 | Low | Close after confirming merged |
| `premium-redesign` | Dealer-site baseline / tag line | older tip | origin | 14/0 behind factory tip | Medium if agents commit here | No factory commits |
| `main` | Archived SSA remote tracking | diverged | `ssaofficial-archived/main` | n/a | High confusion | Do not use |
| `pr-1-agent-a` … `pr-5-agent-d` | Historical agent PR branches | local-only | none | stale | Medium clutter | Archive/delete later |

## Stashes (unofficial branches)

| Stash | Risk | Disposition |
|---|---|---|
| `stash@{0}` Make Form 1 scenario delta with claimed live IDs | **Critical** — newer than branch tip docs | Leave; never pop during unrelated work; verify live Make later |
| `stash@{1}` financing page WIP on premium-redesign | Medium | Leave; unrelated |

## Recommended target model (lightweight)

1. **Integration branch:** `factory/p0-safety-lock` (protected; integrator merges only).
2. **Capability branches:** `factory/p2-<capability>-<short>` short-lived, one owner, declared writable paths.
3. **Baseline:** `premium-redesign` for dealer-site template only — not for factory contract work.
4. **PRs required** into integration; QA/red-team review before merge.
5. **No critical state in stashes** — promote to commits or discard with owner note.
6. **Tags** for verified phases (`htl-factory-pre-hardening-*`, contract freezes).
7. **Branch max lifetime:** ~5 working days or one owner decision cycle.
8. **Update policy:** rebase onto integration tip only with integrator approval; prefer merge commits for integration history.
9. **Abandoned branches:** label + delete after 14 days idle if merged or superseded.

## Cleanup order (later authorized tasks)

1. Resolve Sun Pool break-glass working-tree pollution.
2. Reconcile Make lane (`factory/p2-make-intake` + `stash@{0}`) under Make authorization.
3. Close merged `factory/p0-5-*` / `factory/p1-*` remotes if unused.
4. Delete or archive local `pr-*` branches.
5. Never merge onboarding into integration until contract publish decision + PR review.

## Worktrees (proposed; not created)

| Name | Branch |
|---|---|
| `wt-integrator` | `factory/p0-safety-lock` |
| `wt-contract-data` | `factory/p2-contract-*` |
| `wt-ghl-forms` | `factory/p2-ghl-*` |
| `wt-make` | `factory/p2-make-*` |
| `wt-clickup` | `factory/p2-clickup-*` |
| `wt-qa` | read-only review of PR tip |

No shared writable worktree. No agent branch-switching inside another agent’s tree.
