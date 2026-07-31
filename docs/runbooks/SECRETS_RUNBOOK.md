# Secrets Runbook (WTV-049)

**Authority:** 1Password holds secret *values*. Cloudflare Pages holds runtime copies. Supabase / Git / Make / logs / docs / `wiring.json` hold **refs or presence flags only — never values**.

**Status:** P0 documentation. No secret values are included in this file.

---

## Hard rules

1. **Install secrets only with** `wrangler pages secret put`.
2. **Never** use Cloudflare `deployment_configs` PATCH (or any read-modify-write of Pages env that echoes `secret_text`). The API masks values as `""` on read; writing them back blanks secrets (WTV-049).
3. **Never** `echo "$VALUE" | wrangler …` — `echo` appends a newline; with an unset variable it writes an *empty* secret and exits 0. Use `printf '%s'`.
4. **Never** put secret values in Git, Supabase columns, Make scenario fields, ClickUp, chat logs, PR bodies, or `tokens.env`.
5. **Never** run secret install or `secrets:verify` against production from a P0 cloud agent. Tech operators only, after project identity is confirmed from Supabase.
6. **Protected client** `sun-pool-spa` requires a valid break-glass artifact before any secret mutation.

---

## Allowed install procedure

Confirm the Pages project name from Supabase (`pages_project` / equivalent non-secret ID) — not from memory.

Run from a directory **without** an unhydrated template `wrangler.toml` that still contains `{{CLOUDFLARE_PAGES_PROJECT}}` (validation fails before the command runs). Prefer a temp empty directory.

```bash
# Production
printf '%s' "$VALUE" | npx wrangler pages secret put NAME --project-name <project>

# Preview (flag accepted even when absent from --help on wrangler 4.x)
printf '%s' "$VALUE" | npx wrangler pages secret put NAME --project-name <project> --env preview
```

Under OAuth-only login, only the first `put` may succeed; export the stored OAuth bearer as `CLOUDFLARE_API_TOKEN` for subsequent puts (WTV-054).

Secrets bind at **deploy time**. After puts: deploy the target environment, then verify against the **exact** deployment host:

```bash
ADMIN_PASSWORD='…' npm run secrets:verify -- https://<exact-deployment-host>
```

Exit 0 is required before any other runtime claim. A dashboard name or ticked checkbox is not proof (WTV-053).

---

## Forbidden operations

| Operation | Why |
|---|---|
| `PATCH /accounts/.../pages/projects/...` touching `deployment_configs` | Masked secret round-trip (WTV-049) |
| Make.com “update Cloudflare env” modules that PATCH configs | Same blanking class |
| Storing values in Supabase `clients` or job tables | Wrong authority; leak surface |
| Committing `.env` / private keys / PIT tokens | Git is not a vault |
| Bulk secret scripts over `clients/*` | Hits protected clients; no allowlist |

---

## Typical Pages secret *names* (values never documented here)

Operators maintain the live set per client. Names commonly required by this template include (non-exhaustive):

- `GHL_API_TOKEN`, `GHL_LOCATION_ID`, `GHL_BOOKING_CALENDAR_ID`
- `META_CAPI_ACCESS_TOKEN`, `META_OFFLINE_WEBHOOK_SECRET`
- `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (and related Sheets bindings as plain/text vars where applicable)

Non-secret IDs (pixel ID, GA4, sheets ID, pages project name) may live in client config / Supabase. Secret **refs** may appear as `op://…` in wiring docs — never resolved values.

---

## Recovery posture (no values)

| Class | Recoverability |
|---|---|
| GHL PIT / location / calendar IDs | Recoverable from client GHL sub-account |
| Meta Pixel ID | Often in client `tokens.env` (non-secret) |
| Admin password / session secret | Regenerable |
| GCP service-account private key | Not locally recoverable — mint new key in GCP |
| Meta CAPI token / offline webhook secret | Not locally recoverable — reissue in Meta + GHL |

CAPI token validity: probe with empty events payload per WTV-055 — do not trust `debug_token` scopes alone.

---

## Make / automation contract

Make may:

- Read **non-secret** IDs and status from Supabase
- Record that a secrets checklist item is pending / verified (timestamps, flags)

Make must not:

- Hold or transit secret values
- Call `deployment_configs` PATCH
- Mark a site live based on secret *name* presence alone

---

## Agent contract (P0)

Cloud / AI build agents in this sprint:

- Document and review this runbook only
- Do **not** execute `wrangler pages secret put` against real projects
- Do **not** run `npm run secrets:verify` against production hosts
- Do **not** print or request raw secret values into artifacts

---

## Related

- `KNOWN_ISSUES.md` — WTV-049, WTV-045, WTV-047, WTV-053, WTV-054, WTV-055
- `docs/FACTORY_CONSTITUTION.md` — secrets authority
- `docs/CANONICAL_CONTRACT.md` — secrets + deployment candidate
- `manus-skills/PROJECT_MASTER_INSTRUCTION.md` — operator-facing install notes
- `scripts/verify-runtime-secrets.mjs` — runtime presence proof
