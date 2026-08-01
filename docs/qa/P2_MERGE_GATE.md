# P2 Merge Gate (QA)

**UTC:** 20260801T015851Z  
**Agent:** qa  
**Review base:** `b7212fcce21130a08c16d7fafa325066ed6a49b0`  
**Companion docs:** `P2_RED_TEAM_REVIEW.md`, `FORM1_E2E_ACCEPTANCE_MATRIX.md`

---

## Recommendation

### `HOLD_P2_COMPLETE`

Do **not** mark P2 complete and do **not** treat Form 1 create-or-link as production-ready until the E2E matrix is green (or the owner records written risk acceptance to defer E2E).

### QA lane PR (`factory/p2-qa-redteam`)

**ALLOW_MERGE** of this branch’s QA-only paths (`docs/qa/**`, `artifacts/agent-runs/qa/**`, `tests/qa/**`) into the integrator-directed integration branch. This PR adds gates and evidence; it does not close P2.

---

## Gate checklist

| Gate | Required for | Status | Notes |
|---|---|---|---|
| Clean expected base for QA run | QA credibility | PASS | SHA match + clean tree |
| Local onboarding tests | merge hygiene | PASS | 54/54 |
| Factory-contract tests | merge hygiene | PASS | 46/46 |
| Safety tests | merge hygiene | PASS | 31/31 |
| `brand:guard` | merge hygiene | PASS | |
| Form1 match order static | P2B | PASS | prior AFTER snapshot |
| Forbidden auto-link static | P2B | PASS | |
| Fail-closed + replay-before-write static | P2B | PASS | |
| Reported ≠ Form2 ops in contract | P2A | PASS | |
| `null_does_not_clear` in mappings + mocks | P2A | PASS | |
| Child RLS SQL + prior live verify | P2A | PASS (prior) | not re-polled this run |
| Make inactive fresh poll | P2B freshness | FAIL / pending | last evidence 2026-07-31 |
| Form1 E2E five outcomes + cleanup | P2C | FAIL | blocked capacity/auth |
| GHL Form1 path | P2D | FAIL | unauthorized |
| Stale SoT residual docs | hygiene | WARN | proposed-patch still says 0.1.1 |
| Secrets in Git scan | security | WARN | tracked `tokens.env` paths; protected contents unverified |

---

## Decision table

| Question | Answer |
|---|---|
| Can integrator merge QA red-team docs/tests? | **Yes** (scoped paths) |
| Can owner call P2 done? | **No** |
| Can Make Form1 be activated for real clients? | **No** |
| Can synthetic E2E proceed when capacity+auth land? | **Yes** — follow `FORM1_E2E_ACCEPTANCE_MATRIX.md` |
| Any stop-the-line safety breach found in static review? | **No** for create-or-link policy; E2E gap is completeness, not a static mismatch |

---

## Required owner actions before flipping P2 complete

1. Raise Make active-slot capacity by ≥1 (prefer over pausing live lead/SMS scenarios).  
2. Authorize synthetic E2E window (activate → cases E2E-01… → deactivate).  
3. File evidence under `artifacts/agent-runs/` with before/after `isActive`, outcomes, and cleanup.  
4. Optionally authorize integrator cleanup of residual stale “0.1.1 remains” banners outside QA writable scope.  
5. Confirm offline whether protected-client tracked `tokens.env` contains only non-secret hydration values.

---

## Confirmations

- Sun Pool untouched  
- No production contact  
- No secret values exposed  
- EXECUTION_STATE not edited by QA
