# Intake — sheet / brief / JSON (same tiering)

Two paths, one mapping. Load this when the owner hands you a filled
**CLIENT_INTAKE_SHEET** (CSV export or readable Google Sheet) **or** a messy
plain-text / JSON brief with no sheet.

Canonical row definitions:
`templates/CLIENT_INTAKE_SHEET.csv` (columns: section, what_we_need, priority,
config_key, token_key, owner_default, notes).

## Paths

### A — From intake sheet
1. Export/copy the sheet as CSV (or paste the 6 sections into a CSV matching
   the header in `CLIENT_INTAKE_SHEET.csv`).
2. Run `node …/map-intake.mjs --sheet <path.csv> --client <name>`
   (or `--brief <path.txt|json>`).
3. Script prints REQUIRED blockers + 48h rows; writes the **48-HOUR FIX LIST**
   into `clients/<name>/WIRING.md` when `--write-wiring` is set.
4. Map filled "What we need" values → `config_key` / `token_key` in
   `client.config.js` + `tokens.env` using the table below (keyed on
   **What we need**).

### B — Plain text / JSON brief (no sheet)
1. Normalize into `clients/<name>/intake.json` (see `templates/intake.template.json`)
   **or** pass the brief file to `map-intake.mjs --brief`.
2. Same tier rules as the sheet. First client often arrives messy — extract
   every fact you can; leave blanks explicit; never invent NAP/IDs.

## Priority tiers

| Tier | Label in sheet | Build rule |
|---|---|---|
| REQUIRED | `REQUIRED` | Any blank → **stop at Checkpoint 1**; list exactly those rows. Rush does not waive the silent-lead-loss set. |
| Launch + fix in 48h | `48h` | Build proceeds; auto-copy into WIRING.md **48-HOUR FIX LIST** with owner (Client/HTL) + checkbox. |
| Nice to have | `nice` | Optional; omit without listing unless the brief promised them. |

## Mapping table (keyed on What we need)

| What we need | → config_key / secret | → token_key | Tier |
|---|---|---|---|
| Trading / business name | `client.name` | `CLIENT_NAME` | REQUIRED |
| Legal business name | `client.legalName` | `CLIENT_LEGAL_NAME` | nice |
| Phone display format | `client.primaryPhone` | `CLIENT_PHONE` | REQUIRED |
| Phone E.164 (tel:) | `client.primaryPhoneHref` | `CLIENT_PHONE_E164` | REQUIRED |
| SMS E.164 (sms:) | `client.smsHref` | — | REQUIRED |
| Street address | `client.address` | `CLIENT_ADDRESS` | REQUIRED |
| Business hours | `client.hours` | `CLIENT_HOURS` | REQUIRED |
| Primary market / service area | `client.market` | `CLIENT_MARKET` | REQUIRED |
| Timezone (IANA) | `intake.json` → `business.timezone` | — | REQUIRED |
| Domain / website URL | `client.websiteUrl` | `CLIENT_WEBSITE_URL` | REQUIRED |
| Financing promise line | `offers.financing` | `FINANCING_PROMISE` | REQUIRED |
| Primary offer OR evergreen | `offers.primary` (+ empty `offers.endsAt` = evergreen) | `PRIMARY_OFFER` | REQUIRED |
| Promo end date (if timed) | `offers.endsAt` | `OFFER_ENDS_AT` | nice |
| Lead form POST endpoint | `endpoints.lead` | `LEAD_ENDPOINT` | REQUIRED |
| Cloudflare Turnstile site key | `tracking.turnstileSiteKey` | `TURNSTILE_SITE_KEY` | REQUIRED |
| GA4 measurement ID | `tracking.ga4Id` | `GA4_ID` | REQUIRED |
| Meta Pixel ID | `tracking.metaPixelId` | `META_PIXEL_ID` | REQUIRED |
| Microsoft Clarity project ID | `tracking.clarityId` | `CLARITY_ID` | 48h |
| GHL chat widget ID | (WIRING.md #5) | — | 48h |
| Closebot source ID | (WIRING.md #6) | — | 48h |
| GHL External Tracking URL | `tracking.ghlExternalTracking` | `GHL_EXTERNAL_TRACKING` | 48h |
| GHL location ID | wrangler `GHL_LOCATION_ID` | — | REQUIRED |
| GHL Booking Calendar ID | `tracking.ghlBookingCalendarId` | `GHL_BOOKING_CALENDAR_ID` | 48h |
| Meta CAPI access token | CF secret `META_CAPI_ACCESS_TOKEN` | — | 48h |
| Meta offline webhook secret | CF secret `META_OFFLINE_WEBHOOK_SECRET` | — | 48h |
| GHL custom fields (6 keys) | GHL location fields | — | 48h |
| Opportunity Stage → /api/meta-offline | GHL workflow | — | 48h |
| Events Manager custom conversions | Meta Events Manager | — | 48h |
| Home hero photo | `home.heroImage` | `HOME_HERO_IMAGE` | REQUIRED |
| Logo (header) | `client.logoUrl` | `CLIENT_LOGO_URL` | 48h |
| Category photos (non-hero) | image tokens / uploads | (see images.md) | 48h |
| Google reviews (if thin) | review tokens | `REVIEW_*` | 48h |
| Inventory card photos | D1/admin / uploads | — | 48h |
| GSC verification token | `tracking.gscVerification` | `GSC_VERIFICATION` | 48h |

## Scripts

```bash
node manus-skills/dealer-site-intake/scripts/map-intake.mjs --sheet path/to/export.csv --client <name> --write-wiring
node manus-skills/dealer-site-intake/scripts/map-intake.mjs --brief path/to/brief.txt --client <name> --write-wiring
node manus-skills/dealer-site-intake/scripts/new-client.mjs --validate <name> --profile rush
```

`--validate --profile rush` enforces REQUIRED (incl. hero) as hard errors; everything
else becomes warnings + `fixList48h[]` written into WIRING.md.
