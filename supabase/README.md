# Supabase control plane (P0 / P1)

Migrations in `migrations/` implement the HTL factory fulfillment schema and the controlled `request_client_transition` RPC.

## Migration status

**COMPLETE BUT NOT APPLIED**

Registered development/test target (identity only):

| Field | Value |
|---|---|
| Project name | `htl-factory-dev` |
| Project ref | `epeddfdifckzzmskhdsz` |
| Environment | `dev_test` |
| Apply authorized | **no** |
| Production apply authorized | **no** |

Source of truth: `config/supabase-targets.json`.  
Do not apply migrations until the owner separately authorizes apply against this exact project. Cloud agents must not use production credentials. No agent may infer or substitute another project.

## Verification

Contract behavior is covered by mocked unit/contract tests:

```bash
npm run test:factory-contract
```

Those tests exercise optimistic concurrency, duplicate/out-of-order Form 1/2/3 handling, transition rules, and Supabase target registration without live writes, Make, or migration apply.

## Canonical names

See `docs/CANONICAL_CONTRACT.md`, `config/identity-fields.json`, and `config/state-machine.json`.
