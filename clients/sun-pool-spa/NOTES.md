# Sun Pool & Spa — Client Notes & Preflight Blockers

**Date:** 2026-08-01  
**Certified SHA:** `42ba6eda625afbcea9e0f10da070d3c309e763ad` (`premium-redesign`)

This file records the baseline readiness blockers and required actions for the Sun Pool & Spa release. It fulfills the requirement from `SUN_POOL_BASELINE_READINESS.md` to classify every open item.

## Preflight Blocker Summary

| # | Category | Item | Evidence | Required Before |
|---|---|---|---|---|
| **B-1** | **Code Defect** | `ga4Id` in `client.config.js` is `G-KSJ8N5G2ZJ` (typo). Correct value is `G-KSJ8N5GZZJ`. All GA4 traffic goes to a nonexistent property without this fix. | WTV-021; character diff at position 9 (`'2'` vs `'Z'`); commit `6f7bc39` predates the fix | Hydration |
| **B-2** | **Deployment / Runtime** | No `dist/` exists for `sun-pool-spa`. The artifact has not been hydrated from the certified SHA. | `ls clients/sun-pool-spa/` shows no `dist/` directory | Deployment |
| **B-3** | **Deployment / Runtime** | Runtime secrets (`GHL_API_TOKEN`, `GHL_LOCATION_ID`, `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`) cannot be verified until a deployment exists and `/api/readiness` is called. | TVD-050; WTV-047; WTV-051; WTV-053 | Post-deploy smoke |
| **B-4** | **Attribution Warning** | Meta CAPI server-side token was previously found empty (WTV-051). Cannot be re-verified without a deployment. | WTV-051; WTV-053; WTV-055 | Post-deploy `secrets:verify` |
| **B-5** | **Owner Credential** | `GHL_BOOKING_CALENDAR_ID` is empty by design (request-mode). If the owner wants live booking slots, they must provide a verified calendar ID with confirmed `openHours` and assigned-user availability (WTV-048, WTV-052). | `client.config.js` line 49; `tokens.env` has no `GHL_BOOKING_CALENDAR_ID` | Owner decision — not a launch blocker |
| **B-6** | **Owner Action** | Google Sheets Lead Vault layout: WTV-046 documents that the `All Leads` sheet header must be widened to 35 columns and any stray right-hand data blocks normalized. Code fix is in place; sheet repair requires owner authorization. | WTV-046 status: "Code FIXED. Sheet repair pending owner authorization." | Post-deploy, before lead volume scales |

## Current Configuration State
- **Booking Mode:** Intentional request-mode (no calendar ID provided).
- **Sauna Navigation:** Repointed to `/quiz/` via `redirects.extra` (TVD-052).
- **D1 Inventory:** `sun-pool-spa-inventory` verified with 9 products (8 available, 1 sold, 4 featured). No schema migration needed.
- **R2 Bucket:** `sun-pool-spa-product-images` verified with public delivery active (`pub-24055549503540b0b5ff19237b87d146.r2.dev`).
- **Token Lint:** 144 tokens, 69/69 hard-required covered, no duplicates. PASS.
