# Break-glass approval artifacts

Protected clients (see `config/protected-clients.json`) require a **named JSON
approval artifact** in this directory before mutation. A CLI flag alone is never
sufficient authorization.

## Filename

`artifacts/break-glass/<client_slug>.json`

Override path with `HTL_BREAK_GLASS_PATH` (or pass `breakGlassPath` to
`assertClientMutationAllowed`).

## Schema

```json
{
  "version": 1,
  "client_slug": "sun-pool-spa",
  "client_id": null,
  "actor": "owner@example.com",
  "approved_by": "owner@example.com",
  "reason": "why this mutation is required",
  "scope": ["hydrate"],
  "expires_at": "2026-08-01T00:00:00.000Z"
}
```

`scope` must include the operation name, or `*` / `all`.

Never commit live break-glass approvals that grant production Sun Pool access
without owner intent. Never put secret values in these files.
