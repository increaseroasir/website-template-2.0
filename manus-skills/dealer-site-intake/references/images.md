# Images — sourcing, sizing, and placement rules

Read this BEFORE sourcing or placing any image. The authoritative per-token
registry is `/assets/image-tokens.md` in the template repo — keep it open
while filling image tokens; append a row there for any new token.

## The token pairs

Every image is a **pair**: `{{X_IMAGE}}` (src) + `{{X_IMAGE_ALT}}` (alt).
Filling the src without writing the alt fails the gate (every `<img>` must
have a non-empty alt).

| Token | Page / purpose | Aspect | Min px |
|---|---|---|---|
| `HOME_HERO_IMAGE` (+`_ALT`) | Homepage LCP hero backdrop | 16:10 | 1600×1000 |
| `HOT_TUBS/SWIM_SPAS/SAUNAS_HERO_IMAGE` | Category LCP heroes | 16:10 | 1600×1000 |
| `HOT_TUBS/SWIM_SPAS/SAUNAS_CATEGORY_IMAGE` | Homepage category tiles | 4:5 | 1000×1250 |
| `VISIT_IMAGE_1/2` (+`_ALT`) | Showroom photo cards | 4:3 | 1200×900 |
| `CLIENT_LOGO_URL` | Header logo (falls back to text) | ~4:1 | 320×80 |
| `CLIENT_LOGO_FOOTER_URL` | Footer logo on dark navy | ~4:1 | 320×80, light/knockout version |
| `PRODUCT_PRIMARY_IMAGE` (+`PRODUCT_IMAGE_ALT`) | Product cards (4:3 wells) + detail hero (1:1 well) — hydrated at runtime from D1 | 4:3 / 1:1 | 1200×900 / 1200×1200 |

## Rules

- **Naming**: client assets live under the client's storage prefix
  (`CLIENT_STORAGE_PREFIX`), kebab-case, content-descriptive
  (`smoky-mountain-showroom-exterior.webp`), never `IMG_4021.jpg`.
- **Optimization**: WebP (or AVIF) at quality ~80; hero ≤300KB, cards ≤150KB,
  logos as SVG when available. Strip EXIF.
- **LCP handling**: hero images use `fetchpriority="high"` + a
  `<link rel="preload">` in the head — the preload href must match the
  hydrated hero src exactly or you pay for the image twice. All other images
  stay `loading="lazy" decoding="async"`.
- **Empty-token behavior** (by design, do not "fix"): an unfilled image token
  leaves the `<img>` pointing at a literal `{{...}}`/empty src; `onerror`
  removes or hides the element and the wrapper shows the gradient placeholder
  well (`linear-gradient(155deg,#eef2f8,#e2e9f4)`). This looks intentional —
  an empty token is acceptable at Checkpoint 1 **only if flagged**; a 404 URL
  is never acceptable at launch.
- **Dark-surface logos**: `CLIENT_LOGO_FOOTER_URL` sits on navy-night — a
  dark logo disappears. Request/derive a light version; if none exists, leave
  the token empty (text fallback renders) and flag it.
- **No palette-clashing brand art**: photography is neutral; brand color
  arrives via the logo only (Law 3 — palette is the product).
- **Alt text**: ≤125 chars, describes the scene ("Family soaking in a
  7-person hot tub on a snowy deck"), not keywords.

## Customer upload intake (Google Drive → tokens)

Customers upload files labeled per `assets/CLIENT_UPLOAD_CHECKLIST.md`.
Label → token mapping:

| Filename label (prefix) | Token | Min px |
|---|---|---|
| `HERO` | `HOME_HERO_IMAGE` | 1600×1000 |
| `HOTTUBS` | `HOT_TUBS_CATEGORY_IMAGE` | 1000×1250 |
| `SWIMSPAS` | `SWIM_SPAS_CATEGORY_IMAGE` | 1000×1250 |
| `SAUNAS` | `SAUNAS_CATEGORY_IMAGE` | 1000×1250 |
| `SHOWROOM1` | `VISIT_IMAGE_1` | 1200×900 |
| `SHOWROOM2` | `VISIT_IMAGE_2` | 1200×900 |
| `LOGO` | `CLIENT_LOGO_URL` | 320×80 |
| `LOGOLIGHT` | `CLIENT_LOGO_FOOTER_URL` | 320×80 |
| `HEROHOTTUBS` | `HOT_TUBS_HERO_IMAGE` | 1600×1000 |
| `HEROSWIMSPAS` | `SWIM_SPAS_HERO_IMAGE` | 1600×1000 |
| `HEROSAUNAS` | `SAUNAS_HERO_IMAGE` | 1600×1000 |
| `PRODUCT` | `PRODUCT_PRIMARY_IMAGE` (per-product via admin/D1) | 1200×900 |

Ambiguity note: `HEROHOTTUBS/HEROSWIMSPAS/HEROSAUNAS` are matched BEFORE
`HERO` and `HOTTUBS/...` (longest label wins).

**Procedure:**

1. **Inventory** every uploaded file: name, format, true pixel dimensions —
   run `node skills/client-site-build/scripts/check-assets.mjs --dir <folder>`
   (parses PNG/JPEG/WebP headers, no dependencies; emits the mapping table
   as JSON with per-file PASS/SOFT/FAIL).
2. **Match by filename prefix**, case-insensitive, ignoring trailing
   numbers/words (`Hero_backyard_2.JPG` → `HERO`). Longest label wins.
3. **Multiple matches for one token** → the file with the largest pixel
   dimensions wins; the rest are noted as spares.
4. **Under-minimum files** → apply the upscaling rules in
   `references/decision-table.md` (≤2× with the approved scaler; below half
   the minimum → request a better original).
5. **Every mapping + every flag** (unmatched files, missing must-haves,
   upscales, spares) goes in the Checkpoint 1 table — the owner sees exactly
   which photo landed where before the build proceeds.

## D1 product photos (runtime images — different rules than token images)

Product images are **not** tokens. They live in the D1 `products.primary_image`
column and are injected at runtime by `assets/template.js`, so the build and the
gates cannot see them. Everything below is therefore verified against the live
API, not the artifact.

- **Absolute paths only.** `safeImageUrl()` accepts `/`-rooted paths,
  `data:image/`, and `https:` URLs. Anything else — `../photo.png`,
  `photo.png` — fails `new URL()` and falls back to the built-in navy
  "Inventory Photo" placeholder **silently**. No error, no log, 200 response.
  This is the single easiest way to ship a site that looks unfinished while
  every gate passes (WTV-032).
- **Delivery path at launch: static assets, not R2.** Put files in the client
  artifact at `assets/PRODUCT_<slug>.webp` and set `primary_image` to
  `/assets/PRODUCT_<slug>.webp`. R2 needs a verified public custom domain
  before uploads work at all, and it is slower than edge-cached static assets.
  Configure R2 post-launch for client self-service (WTV-033).
- **Naming binds to the slug**, not the model name:
  `PRODUCT_hydropool-self-cleaning-495.webp`.
- **Optimization:** WebP quality ~80, ≤1600px long edge, 4:3 crop preferred
  (cards are 4:3 wells, the detail hero is 1.25:1). Target ≤120KB, hard cap
  200KB. Strip EXIF/GPS. Convert HEIC/PNG/JPEG sources.
- **Match by model, never by vibe.** One photo per unit, matched to the actual
  model. If a photo cannot be confidently tied to a specific unit, leave that
  row NULL and flag it — the placeholder reads as "photo coming," whereas a
  different unit's photo is a misrepresentation on a dealer site. Never
  substitute a category or hero photo for a specific product.
- **Enumerate slugs from the database before touching product data or running
  any product-page test.** Never construct a slug from manufacturer knowledge;
  plausible model numbers that the dealer does not stock are fabricated
  inventory (WTV-031):
  ```
  wrangler d1 execute <db-name> --remote \
    --command "SELECT slug, status, featured, price, primary_image FROM products"
  ```
  Run it from a directory **without** a tokenized `wrangler.toml` (the repo's
  copy contains `{{CLOUDFLARE_PAGES_PROJECT}}` and fails config parsing).
  Prefer a `featured=1`, `status=available` row for schema tests so the same
  check also exercises the homepage grid.
- **Verify rendering, not the status code:**
  ```
  curl -s https://<domain>/api/inventory | grep -o '"primary_image":"[^"]*"'
  ```
  Every value must start with `/` or `https:`. Then load one product page and
  confirm a real photo, not the placeholder.
- **Category enum is fixed at three:** `hot-tub`, `swim-spa`, `sauna`
  (`functions/api/admin.js` `CATEGORIES`). Photos arriving in any other
  category folder (e.g. "Cold Plunge") have nowhere to go — adding a category
  is a template decision with a new category page, homepage card, enum value,
  and filter. Never map an unsupported category onto an existing one.
