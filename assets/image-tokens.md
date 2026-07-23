# Image token registry

One row per image token used in the template. When onboarding a client, fill every
token (or leave it blank — every `<img>` degrades to a gradient placeholder / removes
itself via `onerror`). Alt-text tokens follow the `*_ALT` convention where present.

| Token | Page | Section | Purpose | Aspect ratio | Min pixels |
|---|---|---|---|---|---|
| `{{HOME_HERO_IMAGE}}` | `index.html` | Hero | LCP hero backdrop (preloaded, `fetchpriority="high"`) | 16:10 | 1600×1000 |
| `{{HOT_TUBS_CATEGORY_IMAGE}}` | `index.html` | Categories | Hot Tubs category tile background | 4:5 | 1000×1250 |
| `{{SWIM_SPAS_CATEGORY_IMAGE}}` | `index.html` | Categories | Swim Spas category tile background | 4:5 | 1000×1250 |
| `{{SAUNAS_CATEGORY_IMAGE}}` | `index.html` | Categories | Saunas category tile background | 4:5 | 1000×1250 |
| `{{VISIT_IMAGE_1}}` / `{{VISIT_IMAGE_1_ALT}}` | `index.html` | Visit showroom | Showroom photo card 1 | 4:3 | 1200×900 |
| `{{VISIT_IMAGE_2}}` / `{{VISIT_IMAGE_2_ALT}}` | `index.html` | Visit showroom | Showroom photo card 2 | 4:3 | 1200×900 |
| `{{CLIENT_LOGO_URL}}` | nav (all premium pages with navbar) | Nav bar | Header logo (falls back to text) | ~4:1 | 320×80 |
| `{{CLIENT_LOGO_FOOTER_URL}}` | footer (inventory + category pages) | Footer | Footer logo on dark | ~4:1 | 320×80 |
| `{{HOT_TUBS_HERO_IMAGE}}` | `hot-tubs/` | Hero | Category LCP hero (preloaded) | 16:10 | 1600×1000 |
| `{{SWIM_SPAS_HERO_IMAGE}}` | `swim-spas/` | Hero | Category LCP hero (preloaded) | 16:10 | 1600×1000 |
| `{{SAUNAS_HERO_IMAGE}}` | `saunas/` | Hero | Category LCP hero (preloaded) | 16:10 | 1600×1000 |
| `{{PRODUCT_PRIMARY_IMAGE}}` / `{{PRODUCT_IMAGE_ALT}}` | `index.html`, `active-inventory/`, `active-inventory/SLUG/` | Product cards / detail gallery | Primary product photo. Cards use 4:3 wells; detail hero uses 1:1 well. Hydrated at runtime from D1 inventory. | 4:3 (card) · 1:1 (detail) | 1200×900 (card) · 1200×1200 (detail) |

Notes
- Every static `<img>` carries `onerror` handling so unfilled tokens still look clean
  over the gradient placeholder base (`linear-gradient(155deg,#eef2f8,#e2e9f4)`).
- All imgs are `loading="lazy" decoding="async"` except LCP heroes, which use
  `fetchpriority="high"` plus a `<link rel="preload">` in the head.
- Append a new row here for every image token you create.
