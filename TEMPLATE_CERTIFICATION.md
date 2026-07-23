# TEMPLATE CERTIFICATION — website-template-2.0 (premium-redesign)

Part A of `FINAL_DIAL_IN_AND_LAUNCH_GATE.md`, run July 23, 2026.
Verdict: **CERTIFIED — every row PASS or MANUAL, zero FAILs open.**

Evidence sources: `skills/client-site-build/scripts/gate.mjs` run against the
hostile-client build (`clients/hostile-rehearsal/dist/`, exit 0), a hooked
Chromium session (console collector installed pre-load on every page), code
audits of `assets/*.css`, and the 24-screenshot archive in
`clients/hostile-rehearsal/screenshots/`.

## A1 — Open audit questions

| Item | Status | Evidence |
|---|---|---|
| Reveal audit — financing.html | **PASS** | The page contains exactly one `<section>` (`.financing-survey-hero`): an above-the-fold conversion form. Law 5 permits reveals only on static below-the-fold sections; hiding a lead form behind a JS class would risk an invisible form. Zero reveals is the correct application of the law. |
| Reveal audit — contact.html | **PASS** | Two sections: `.hero` (above the fold — never revealed by design) and the below-the-fold info `.section`, which receives `.reveal` at runtime from `initSectionReveals()` in `template.js`. Verified live on the hostile build: the class is JS-added (no-JS users see everything), and scrolling it into view fired the observer (`opacity 0 → 1` transition observed mid-animation). The earlier "reveal not firing" report was a test artifact — an instant scroll to page bottom left only ~10% of the section visible, below the observer's 12% threshold; natural scrolling fires it. |
| Image token manifest | **PASS** | Markup scan found 12 image-src tokens (+3 `_ALT`); `/assets/image-tokens.md` has 12 matching rows — 12/12 reconciled. (`ADMIN_STAT_IMAGES` is a stat counter, excluded as a name-collision false positive.) |

## A2 — Cross-browser

Code-level WebKit audit (performed and fixed this pass):

| Item | Status | Evidence |
|---|---|---|
| `backdrop-filter` has `-webkit-` twin in every rule | **FIXED** | Two rules were missing twins — `.mbar` (home.css) and `.site-header` (template.css). Added; a per-rule scanner now reports zero missing twins across all css. |
| Gradient text (`background-clip:text`) prefixed | **PASS** | 7/7 declarations carry `-webkit-background-clip:text`. |
| Shield clip-path hexagon | **FIXED** | Added `-webkit-clip-path` twin to `.shield` (home.css) for older Safari; drop-shadow filter unchanged. |
| `100dvh` fallbacks | **FIXED** | The two `max-height:calc(100dvh - …)` gate panels in inventory.css had no fallback for Safari <15.4 — added `100vh` fallback lines before each. premium-pages.css already had the vh/dvh pair. |
| Rails hide scrollbars | **PASS** | `.rail` (home.css) has both `scrollbar-width:none` and `::-webkit-scrollbar{display:none}`. |
| Safari macOS + iOS simulator, Chrome/Android device pass (blur, gradient text, shield, dvh behavior, snap, input chrome) | **MANUAL** | Requires real browsers/devices — listed in the MANUAL section of `FINAL_READINESS_REPORT.md`. |

## A3 — Hostile hydration rehearsal

Config: `skills/client-site-build/assets/hostile.config.js` (68-char business
name, 3 reviews / 4.2 rating, TN market, no offer, empty logo + 404 footer
logo, apostrophes in copy) + 298 filler tokens in
`clients/hostile-rehearsal/tokens.env`.

| Assertion | Status | Evidence |
|---|---|---|
| gate.mjs --env staging exit 0 | **PASS** | 8 PASS / 0 FAIL / 7 MANUAL |
| Zero `{{` in built output | **PASS** | Gate token check + live DOM check on all 12 pages (`innerHTML.includes('{{') === false`) |
| Zero template fingerprints | **FIXED → PASS** | `grep -ri "paradise\|7018382614\|minot\|paradisesm" dist/` → 0 hits. Two leaks were found and fixed: a dead legacy `#paradise-lead-error` selector in `lead-form.js` (no markup ever used it — removed), and build tooling shipping in dist (`scripts/` now pruned post-hydration per SKILL.md). |
| Evergreen active, no dead countdown tiles | **PASS** | `body.offer-static` set; marquee shows text-only offer line; no `00:00:00` tiles; final CTA renders sane (see screenshots). |
| Empty/explicitly-blank tokens don't leak | **FIXED → PASS** | Real defect found: explicitly-empty config values (logo, map embed, offer label) stayed as raw `{{TOKENS}}` in shipped HTML — two in visible text. Fixed in the build layer: `build-config.mjs` now hydrates explicit empty strings to `""`, and all four top-level stylesheets hide `img[src=""]`/`iframe[src=""]` (alongside the existing unfilled-token hiding). |
| 68-char name doesn't break header at 390 | **PASS** | `document.documentElement.scrollWidth === 390` on every page at 390px (and 320 at 320px); header wraps to two lines cleanly (screenshots). |
| Empty/404 images render as clean gradient wells | **PASS** | All image tokens point at 404 URLs in the rehearsal; `onerror` + gradient wells + empty-src hiding keep every card clean (screenshots). |
| Screenshots 1440 + 390, every page | **PASS** | 24 full-page PNGs in `clients/hostile-rehearsal/screenshots/` (12 pages × 2 widths, incl. 404). |

## A4 — Mechanical sweeps

| Item | Status | Evidence |
|---|---|---|
| Zero `{{` in built output | **PASS** | See A3. Gate pattern is `{{TOKEN`-shaped, so the template's own leftover-detection literals (JS `indexOf('{{')`, CSS `[src*="{{"]`) don't false-positive. |
| Zero console errors/warnings, load + scroll + interaction | **PASS** | Error/warning collector injected pre-load on all 12 pages: zero entries. Interaction pass on the homepage (drawer open/close, FAQ toggle, lead-form step advance, CTA resolve): zero entries. |
| Link check (internal pages, #anchors on-page, tel:/sms: E164) | **FIXED → PASS** | Two real defects found by the gate: admin nav promised `#settings` with no target (a Settings info card now exists), and 4 pages linked favicon files that were never shipped. Gate links check now green across all 13 pages. |
| Duplicate-ID scan after hydration AND after inventory injection | **PASS** | Gate static scan: 0 dupes on 13 pages. Runtime DOM scan post-JS: 40 unique ids, 0 dupes. Injection renderers (`template.js`, `inventory-page.js`) emit zero `id` attributes, so injection cannot create duplicates. |
| Forms fit 390×650 and 320px, consent visible, no internal scroll | **PASS** | Inventory gate measured at 390×650: submit bottom 527px, consent bottom 594px (fully visible, shrunk to 9.9px ≥ floor), `scrollHeight === clientHeight`. No horizontal overflow at 320. |
| Reduced motion: fully static, final values | **PASS** | Emulated `prefers-reduced-motion: reduce`: hairline `animation-name: none`, `.reveal` opacity 1, stat count-up shows final value immediately. |
| `robots` honors `{{ROBOTS_DIRECTIVE}}`; staging noindex | **PASS** | Gate robots check green with `noindex, follow` on the staging build; token defaults to `index,follow`. |
| 404 page exists, on-brand | **FIXED → PASS** | Template had no 404. Created `404.html` (night-hero recipe, tokenized name/phone, absolute asset paths, noindex). Screenshotted at both widths. |
| Favicon set present, not client-branded | **FIXED → PASS** | Shipped a neutral navy/gold generated set (`favicon.ico`, 16/32 PNG, 180 apple-touch) and added the icon links to the 8 pages missing them. Per-client branding = replace the four files (documented in `references/images.md`); no client fingerprint in the template set. |
| Lighthouse budgets | **MANUAL** | Needs a real Lighthouse run against a deployed build. |

## Template fixes shipped by this certification pass

1. `width`/`height` on all 8 dimension-less imgs (owner ruling a).
2. Empty-config-value hydration + `img[src=""]` hiding (build layer + 4 css files).
3. Legacy `#paradise-lead-error` selector removed from `lead-form.js`.
4. Admin `#settings` anchor target added.
5. `404.html` + neutral favicon set + icon links on all pages.
6. WebKit twins ×2, `100vh` fallbacks ×2, `-webkit-clip-path` on the shield.
7. `brand:guard` re-scoped to buildable sources only (owner ruling c).
