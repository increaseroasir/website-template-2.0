# Onboarding recovery manifest

**Run id:** `20260731T174238Z-onboarding-recovery-manifest`  
**Agent:** integrator  
**Mode:** repository drift reconciliation (Part 1) — preserve only  
**UTC:** 2026-07-31T17:42:38Z

## Repository snapshot (pre-commit)

| Field | Value |
|---|---|
| Repository root | `/Users/alexlobaito/website-template-premium-redesign` |
| Remote | `https://github.com/increaseroasir/website-template-2.0.git` |
| Current branch | `factory/p2-onboarding-forms-and-workflows` |
| HEAD | `9b51c64a808a5e041921c544272f56eab8d52fcb` |
| Upstream | `origin/factory/p0-safety-lock` (same SHA as HEAD before commit) |
| Worktrees | single: this root |
| Staged files | none |
| Expected base | `9b51c64` — **confirmed ancestor of HEAD** |

## Stashes (untouched)

| Stash | Message | Disposition |
|---|---|---|
| `stash@{0}` | On factory/p2-make-intake: wip-p2-make-intake-before-design-freeze | make_lane — inspect only; do not pop/apply/drop |
| `stash@{1}` | WIP on premium-redesign: financing page survey | unrelated — leave intact |

## Local-only / notable branches

| Branch | Upstream | Notes |
|---|---|---|
| `factory/p2-onboarding-forms-and-workflows` | `origin/factory/p0-safety-lock` | Target of this reconciliation |
| `factory/p2-make-intake` | _(none)_ | Local-only; tip `d003a71`; make_lane |
| `factory/p0-safety-lock` | matching origin | Integration branch |
| `pr-*` | _(none)_ | Historical agent PR branches — unrelated to this commit |

## Path classification (every untracked path at snapshot)

| Path | Classification | In COMMIT 1? |
|---|---|---|
| `docs/onboarding/**` (all files) | onboarding_design | **yes** |
| `config/onboarding-field-registry.json` | onboarding_design | **yes** |
| `config/onboarding-field-mappings.json` | onboarding_design | **yes** |
| `config/onboarding-option-sets.json` | onboarding_design | **yes** |
| `config/onboarding-clickup.json` | onboarding_design | **yes** |
| `config/onboarding-workflows.json` | onboarding_design | **yes** |
| `config/forms/**` | onboarding_design | **yes** |
| `config/form-state-transitions.json` | onboarding_design | **yes** |
| `tests/onboarding/test_design_freeze_acceptance.py` | onboarding_design | **yes** |
| `tests/onboarding/design_freeze_acceptance_results.json` | onboarding_evidence | **yes** |
| `tests/onboarding/__pycache__/**` | generated_temp | **no** |
| `artifacts/agent-runs/integrator/20260731T114500Z-onboarding-inventory.md` | onboarding_evidence | **yes** |
| `artifacts/agent-runs/integrator/20260731T120000Z-onboarding-design-freeze.md` | onboarding_evidence | **yes** |
| `artifacts/agent-runs/integrator/20260731T121500Z-hybrid-ac-contract-proposal.md` | onboarding_evidence | **yes** |
| `artifacts/agent-runs/integrator/20260731T122000Z-hybrid-ac-json-land.md` | onboarding_evidence | **yes** |
| `artifacts/agent-runs/integrator/20260731T174238Z-onboarding-recovery-manifest.md` | onboarding_evidence | **yes** (this file) |
| `docs/onboarding/PARALLEL_MAKE_LANE_RECONCILIATION.md` | make_lane (docs only) | **yes** |
| `artifacts/break-glass/sun-pool-spa.json` | sun_pool_or_break_glass | **no** — preserve unchanged |
| `artifacts/manus-packs/**` | sun_pool_or_break_glass | **no** |
| `scripts/package-manus-client-read-pack.mjs` | sun_pool_or_break_glass | **no** |
| `.agents/**` | local_tooling | **no** |
| `.cursor/mcp.json` | local_tooling | **no** |
| `skills-lock.json` | local_tooling | **no** |
| `supabase/.temp/**` | generated_temp | **no** |

## Sun Pool break-glass (read-only; not modified)

| Field | Value |
|---|---|
| Path | `artifacts/break-glass/sun-pool-spa.json` |
| Actor / approver | `alexander.lobaito@owner` |
| Scope | `read`, `package`, `export` only |
| Expiration | `2026-08-01T23:59:59.000Z` |
| Reason | Manus dealer-site read pack (homepage/UI packaging) |
| Mutation permitted | **no** |
| Why tests detect it | Protected-client suite discovers working-tree break-glass; incomplete `client_id` / scope without `mutate` causes fail-closed assertions to fail |
| Why excluded from COMMIT 1 | Not onboarding design; must not broaden or weaken tests |
| Recommended later disposition | Separate owner-authorized safety task: archive, revoke, or move outside working tree |

## Hard stops confirmed

- Remote is canonical factory repo — PASS
- Not legacy `ssaofficial` folder — PASS
- Base `9b51c64` — PASS
- No version publish / migration apply / EXECUTION_STATE / stash mutation in this pass

## Next in Part 1

1. Write `PARALLEL_MAKE_LANE_RECONCILIATION.md`
2. Stage include-set only
3. Commit `docs(onboarding): preserve Hybrid A+C design freeze`
4. Run fresh tests; push if clean
