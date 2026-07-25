# Provisioning checklist (Cloudflare + client repo)

Closes the “Repository And Cloudflare Provisioning” capability from the
legacy fulfillment narrative. Run after intake PASS; before or with hydrate.

| Step | Action | Evidence |
|---|---|---|
| 1 | Client repo from public template (`website-template-2.0` / this checkout) | Repo URL in WIRING.md |
| 2 | Fill `clients/<name>/client.config.js` + `tokens.env` | `--validate` PASS |
| 3 | Cloudflare Pages project (framework None when serving a prebuilt `dist/`) | Project name in WIRING notes |
| 4 | D1 database bound as `DB`; apply `functions/db/schema.sql` | `npm run db:init:remote` (or local) |
| 5 | R2 bucket bound as `PRODUCT_IMAGES` | Bucket name recorded |
| 6 | Set CF vars/secrets: `GHL_API_TOKEN`, `GHL_LOCATION_ID`, `TURNSTILE_SECRET_KEY`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_OFFLINE_WEBHOOK_SECRET`, `ADMIN_PASSWORD`, … | Secrets checklist in WIRING (values never pasted) |
| 7 | `npm run placeholder:check` / gate leftovers = PASS | No `{{TOKEN` in dist |
| 8 | Preview deploy only until Verification / gate PASS | Preview URL |

Stop if template is private, CF access missing, D1/R2 cannot be created, or
required secrets unavailable.
