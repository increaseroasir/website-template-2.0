# Contract 0.2.0 / schema 1.1.0 publish + child migrations landed

**UTC:** 20260731T184800Z
**Agent:** integrator (owner-authorized publish pass)
**Branch:** `factory/p2-integration-reconcile`
**Scope:** Publish contract/schema in Git; land child-table SQL; validate only. No remote database write.

## SHAs (committed evidence — no Commit-2 self-SHA)

| Item | SHA |
|---|---|
| Base (pre-publish tip) | `866d7889c719f32f8e322a5d097e29eddda50bde` |
| Commit 1 (`feat(contract): publish onboarding contract 0.2.0`) | `d7d93bc942a138366d0cee55cfab9c8d81e76f7e` |
| Final branch tip | recorded in execution response after Commit 2 push |

## Versions

| | Before | After |
|---|---|---|
| `contract_version` | `0.1.1` | **`0.2.0`** |
| `onboarding_schema_version` | `1.0.0` | **`1.1.0`** |

## Six reported fields (form1-owned)

- `website_reported_status`
- `website_reported_url`
- `domain_reported_name`
- `domain_reported_ownership_status`
- `dns_reported_provider`
- `dns_reported_owner`

Operational unchanged: `website_url`, `domain`, `dns_provider`, `dns_owner` remain form2.

## Migrations landed (NOT APPLIED)

Remote history max verified: `20260731081314` (see `20260731T081500Z-dev-test-migration-apply.md`).
Local author filenames `20260731000100` / `20260731000200` reconciled as same P1 content under later remote versions.

| File | SHA-256 |
|---|---|
| `supabase/migrations/20260731184500_create_onboarding_employees.sql` | `b72cdf80b76a99d0afafac492a254f2f9a7aa3c154492eef7dcce79f87518402` |
| `supabase/migrations/20260731184600_create_inventory_submissions.sql` | `170f04a7db8560790c161e077b1737dd829d4fba109a78b5bd203840678cd5e3` |

Order: employees → inventory. Both create public child tables, turn on row-level security with zero policies, and assign no privileges to anon/public. `inventory_items` not landed.

**Applied status: NOT APPLIED**

## Row-level security posture

Fail-closed: each new public table explicitly turns on row-level security. Zero permissive policies. Service/Postgres execution only. Not comment-only. Proven by SQL text and factory-contract / acceptance checks.

## Tests / validation

| Command | Result |
|---|---|
| `python3 tests/onboarding/test_design_freeze_acceptance.py` | **53/53** passed |
| `node --test tests/factory-contract/*.test.mjs` | **46/46** passed |
| `node --test tests/safety/*.test.mjs` | **31/31** passed |
| `npm run brand:guard` | pass |
| Config JSON parse | ok |
| Static SQL review | RLS on; no table destruction; no statement-level anon privileges; versions after remote max |

## Confirmations

- No remote database apply / push / MCP write
- Make remains inactive (scenario `4852018`)
- No E2E / webhook payloads
- No GHL or ClickUp live writes
- No production or protected-client changes
- Cursor plan file not committed
- **Published in Git ≠ applied in Supabase**

## Next owner decision

Authorize applying the two child-table migrations to `htl-factory-dev` only, followed by read-only verification and smoke testing.

## VERDICT

**GO**
