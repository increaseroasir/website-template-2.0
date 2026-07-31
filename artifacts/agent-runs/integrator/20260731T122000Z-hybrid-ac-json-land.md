# Agent run — Hybrid A+C JSON/registry land

**Run id:** `20260731T122000Z-hybrid-ac-json-land`  
**Agent:** integrator  
**Repo:** `increaseroasir/website-template-2.0` (local `website-template-premium-redesign`)

## Done

1. Contract-delta already APPROVED Hybrid A+C (docs)
2. Extracted proposed SQL twins under `docs/onboarding/proposed-migrations/*.sql` (not under `supabase/migrations/`)
3. Aligned `config/onboarding-field-registry.json`, `config/onboarding-field-mappings.json`, form specs 1–3
4. Six reported fields present in registry/mappings/form-1
5. Employees → `onboarding_employees`; inventory → `inventory_submissions`
6. Acceptance suite regenerated: **46/46 passed**
7. `npm run brand:guard` passed
8. Stopped — versions still proposals

## Version guardrail

| Item | Value |
|---|---|
| Live `contract_version` | **0.1.1** (unchanged) |
| Live `onboarding_schema_version` | **1.0.0** (unchanged) |
| Proposed | `0.2.0` / `1.1.0` in docs only |
| Reported fields in live `field_policies` | **No** (await publish approval) |
| `apply_authorized` | **false** |

## Not done / forbidden

- Publish `0.2.0` / `1.1.0` into `identity-fields.json`
- Apply migrations
- Live Make / GHL / ClickUp / Supabase object create
- `EXECUTION_STATE`
- Production / Paradise / Sun Pool / Retainer Snapshot

## Confirmations

- Sun Pool untouched
- No production systems contacted
- No secret values exposed
