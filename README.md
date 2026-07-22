# Hot Tub Dealer Site Template HTML Map

This folder is the non-production, templatized HTML surface for the Increase ROAS hot tub dealer website system.

## Pages

| Page | File | Route | Data Source |
|---|---|---|---|
| Homepage | `index.html` | `/` | Static featured sections + `/api/inventory?featured=1` |
| Hot Tubs | `hot-tubs/index.html` | `/hot-tubs/` | `/api/inventory?category=hot-tub` |
| Swim Spas | `swim-spas/index.html` | `/swim-spas/` | `/api/inventory?category=swim-spa` |
| Saunas | `saunas/index.html` | `/saunas/` | `/api/inventory?category=sauna` |
| Inventory | `inventory.html` | `/inventory.html` | `/api/inventory` |
| Active Inventory | `active-inventory/index.html` | `/active-inventory/` | `/api/inventory?status=public` |
| Product Detail | `active-inventory/SLUG/index.html` | `/active-inventory/SLUG/` | `/api/inventory?slug={{PRODUCT_SLUG}}` |
| Financing | `financing.html` | `/financing.html` | Static + lead API |
| Contact | `contact.html` | `/contact.html` | Static + lead API |
| Thank You | `thank-you.html` | `/thank-you.html` | Static confirmation |
| Admin | `admin/index.html` | `/admin` | `/api/admin` authenticated CRUD |

## API Routes

API routes are Cloudflare Functions, not HTML pages:

- `/api/lead` receives form submissions, writes Sheets, upserts GHL, fires Meta CAPI.
- `/api/inventory` returns public D1 products as JSON.
- `/api/admin` handles authenticated inventory management and image upload.

## Manus Fulfillment Artifacts

This repo includes the durable files Manus should use to fulfill new client websites:

- `client.fulfillment.schema.json` — the required client intake shape. Manus should create a `client.fulfillment.json` per client and validate it against this schema before provisioning.
- `tracking.manifest.json` — the canonical browser, server, CRM, Sheets, and attribution event contract for every client website.
- `verification.checklist.md` — the zero-defect launch gate. A client site is not launched until every required line passes or is explicitly documented as blocked.
- `docs/manus-fulfillment-skills.md` — the operating instructions for Manus skills: orchestrator, intake, provisioning, tracking, GHL/Sheets, inventory/admin, verification, and handoff.

Run `npm run fulfillment:check` to verify these fulfillment artifacts exist and parse correctly.

## Launch Automation

Use these commands in the generated client repo before any production handoff:

- `npm run placeholder:check` — fails if unresolved `{{TOKEN}}` values remain in deployable files.
- `npm run launch:check` — runs fulfillment artifact validation, brand guard, required config checks, placeholder scan, and optional live URL/API checks with `LAUNCH_CHECK_URL`.
- `npm run admin:smoke` — checks live inventory JSON, product page routing, `/admin` login, admin product JSON, and optional create/hide/delete with `ADMIN_SMOKE_MUTATE=1`.
- `npm run ghl:fields:check` — verifies required GHL custom fields exist.
- `npm run ghl:fields:create` — creates missing GHL custom fields after approval.
- `npm run ga4:funnel` — writes a GA4 funnel JSON report from the client property.
- `npm run leads:reimport-missed` — reimports failed rows from the `Missed Leads` sheet into GHL.

`npm run deploy` now runs the launch gate before Cloudflare Pages production deploy.

## No-Hardcoding Rule

Client-specific values stay in `client.config.js` or build-time tokens: dealer name, address, phone, market, offers, tracking IDs, GHL tags, inventory records, product images, CRM custom fields, and API secrets.
