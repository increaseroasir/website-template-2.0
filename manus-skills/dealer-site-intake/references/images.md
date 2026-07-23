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
