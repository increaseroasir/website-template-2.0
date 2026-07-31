# Agent D — Adversarial review of PR #1

| Field | Value |
|---|---|
| Run ID | `2026-07-31-pr1-adversarial-review` |
| Agent | D (Adversarial Reviewer-Fixer) |
| Reviewed PR | https://github.com/increaseroasir/website-template-2.0/pull/1 |
| Head | `285a2354307e46b077358ac3e073a304367e907f` (`cursor/p0-agent-a-safety-224e`) |
| Base | `factory/p0-safety-lock` @ `c63b3dd597c83802f1386fa82fcdd80834c9b31b` |
| Date | 2026-07-31 |
| Merge recommendation | **REQUEST CHANGES** (until hook-bypass fix merges) |

## Repository lock

- Origin: `increaseroasir/website-template-2.0` — PASS
- `required_base_sha` `309ac92d226b14cafd0bee6130606c3fcf1b5195` is ancestor of PR head — PASS
- Sun Pool tree OID on PR head: `f3da831b2c31d37693f6022340b2d2f936bb4f72` — PASS (unchanged vs base)
- Diff under `clients/sun-pool-spa`: empty — PASS

## Checklist results

| # | Check | Result |
|---|---|---|
| 1 | Architecture vs AGENTS.md / constitution / contract | PASS (scoped safety deliverable; monorepo; manus-skills SoT; no Supabase rewrite) |
| 2 | Protected-client fail-closed | PASS (library covers unknown / mismatch / protected / expired / wrong-scope) |
| 3 | CLI flag alone cannot bypass | PASS (`cliForceFlag`/`force` still require break-glass) |
| 4 | Hooks actually block | **FAIL (HIGH)** — proven shell-hook bypasses (see findings) |
| 5 | No Sun Pool file changes / OID | PASS |
| 6 | No secrets in code/logs/artifacts | PASS |
| 7 | No unrestricted `clients/*` ops introduced | PASS (denylist + helper; inventory notes legacy unwired) |
| 8 | Diff budget | PASS (17 files, +1384/−1; safety-scoped) |
| 9 | Ownership (no Supabase/identity contract rewrite) | PASS |
| 10 | Tests real and passing; CI sane | PASS (28/28 on PR head; CI green); gaps in hook adversarial coverage |
| 11 | Semantic conflicts with constitution | PASS with nits (see MEDIUM) |
| 12 | `required_base_sha` ancestor | PASS |

## Findings

### HIGH — Shell hook allows `find …/clients/sun-pool-spa -delete`

**Evidence:** `evaluateShellCommand('find /workspace/clients/sun-pool-spa -delete')` → `deny: false` on PR head.
Root cause: sun-pool path hit a “read-only” allowlist that included `find`, and `-delete` was not excluded. Bulk `find clients` regex also missed absolute/`./` prefixes.

### HIGH — Shell hook allows `wrangler pages deploy --branch preview|staging`

**Evidence:** `wrangler pages deploy dist --branch preview` → `deny: false` on PR head.
Root cause: deploy deny only when branch is main/prod **or** `--branch` absent; non-main branches were allowed. Contradicts inventory claim and agent “no deploy/preview:deploy” policy.

### HIGH — Shell hook allows `wrangler pages secret put` / `wrangler secret put`

**Evidence:** both evaluate to `deny: false` on PR head. Contacts real secret-install paths.

### MEDIUM — Production authorization via bare env

`HTL_PRODUCTION_AUTHORIZED=true` alone authorizes `environment: 'production'` for non-protected clients. Analogous to a CLI flag; not fixed in this pass (would broaden auth contract). Protected clients still need break-glass.

### MEDIUM — Identity mismatch weak when `client_id: null` in config

Real `protected-clients.json` has `client_id: null` for sun-pool-spa. Passing a wrong `clientId` with slug `sun-pool-spa` yields `BREAK_GLASS_REQUIRED`, not `IDENTITY_MISMATCH`. Still fail-closed for mutation.

### LOW / NIT

- Legacy `skills/` mutators intentionally unwired (documented risk).
- Shell hook never consults break-glass (always denies sun-pool mutations) — acceptable fail-closed for agents; library is the break-glass path for wired mutators.
- `dev-preview.sh` default client remains `sun-pool-spa` (now rejected without break-glass).

## Fix PR

- Branch: `cursor/p0-agent-d-hook-bypass-fixes-1276` (stacked on PR #1 head)
- URL: https://github.com/increaseroasir/website-template-2.0/pull/4
- Comment posted on PR #1 with REQUEST CHANGES + evidence

## Confirmations

1. Sun Pool untouched — OID `f3da831b2c31d37693f6022340b2d2f936bb4f72`
2. No production systems contacted
3. No secret values exposed
4. Did not edit `docs/EXECUTION_STATE.md`
5. Did not mutate `clients/sun-pool-spa`
