# Sun Pool & Spa Supply — client inputs

Canonical inputs for hydrate. Checked into the template repo so one SHA has
everything Manus needs (WTV-062 / redirects.extra handoff).

| File | Purpose |
|---|---|
| `tokens.env` | Content tokens (sourced at hydrate). No runtime secrets. |
| `client.config.js` | Identity, brand, tracking IDs used by `build-config.mjs`. |
| `redirects.extra` | Appended to `dist/_redirects` after hydrate. |

**Secrets stay in Cloudflare Pages** (`GHL_*`, `META_CAPI_*`, `ADMIN_*`, Sheets
private key). Never commit those values here.
