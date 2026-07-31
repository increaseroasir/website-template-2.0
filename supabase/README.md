# Supabase control plane (P0)

Migrations in `migrations/` implement the HTL factory fulfillment schema and the controlled `request_client_transition` RPC.

## Migration status

**COMPLETE BUT NOT APPLIED**

Do not apply these migrations to production Supabase from the P0 / P0.5 sprint. Cloud agents must not use production credentials.

## Verification

Contract behavior is covered by mocked unit/contract tests:

```bash
npm run test:factory-contract
```

Those tests exercise optimistic concurrency, duplicate/out-of-order Form 1/2/3 handling, and transition rules without live GHL, Make, or Supabase.

## Canonical names

See `docs/CANONICAL_CONTRACT.md`, `config/identity-fields.json`, and `config/state-machine.json`.
