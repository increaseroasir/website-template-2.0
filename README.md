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

## No-Hardcoding Rule

Client-specific values stay in `client.config.js` or build-time tokens: dealer name, address, phone, market, offers, tracking IDs, GHL tags, inventory records, product images, CRM custom fields, and API secrets.
