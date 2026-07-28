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
| Screenshots 1440 + 390, every page | **PASS** | 24 full-page JPEGs in `clients/hostile-rehearsal/screenshots/` — 12 pages × 2 widths, 1:1 with the 12 HTML files in dist: index, hot-tubs, swim-spas, saunas, inventory, active-inventory, product-slug (SLUG detail), financing, contact, thank-you, admin, 404. No page skipped; the 404 page is additive (11 template pages + the new 404 = 12). |

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
   **Template-only change — do NOT backport to the live paradise-spas-website
   repo,** where that ID is live on the inventory gate form and the selector
   drives its error display.
4. Admin `#settings` anchor target added.
5. `404.html` + neutral favicon set + icon links on all pages.
6. WebKit twins ×2, `100vh` fallbacks ×2, `-webkit-clip-path` on the shield.
7. `brand:guard` re-scoped to buildable sources only (owner ruling c).

---

## SEO + Indexing module (added 2026-07-23)

| Item | Status | Evidence |
|---|---|---|
| A1 robots.txt tokenized, generated at build | **PASS** | `build-config.mjs` emits it into the build root: staging (`noindex` directive) → `Disallow: /`; prod → `Allow: /` + `Disallow: /admin/` + `Sitemap: https://<domain>/sitemap.xml`. Domain from `DOMAIN` env or `client.websiteUrl` host; skipped with a loud warning when neither exists. Both paths exercised on the hostile build. |
| A2 sitemap.xml generated from dist page list | **PASS** | 8 absolute URLs, `lastmod` = build date; 404/thank-you/admin/SLUG-template excluded. New gate check verifies existence, well-formedness, URL→file resolution, exclusions — green in staging and prod runs. |
| A3 GSC verification meta | **PASS** | `<meta name="google-site-verification" content="{{GSC_VERIFICATION}}">` on all 12 page heads; empty token → tag stripped at build (0 metas in hostile dist). Config key `tracking.gscVerification`; documented in token-reference.md; gate check added. |
| A4 FAQPage JSON-LD | **PASS** | `assets/seo-schema.js` builds it from the rendered `.faq` blocks; hostile homepage emits a valid FAQPage with 4 questions; contact page (no FAQ) emits nothing. |
| A4 Product JSON-LD | **PASS** | Emitted by `product-page.js` from the same `/api/inventory` data the page renders (name/image/category/offer price+availability). Verified against a mock API: valid Product schema; with the API unavailable, nothing is emitted (never fabricates). |
| A4 BreadcrumbList | **PASS** | Category pages (Home > Category) and product detail (Home > Inventory > Product), from rendered H1s; skipped when text is missing/tokenized. |
| A4 JSON-LD validation | **PASS + MANUAL** | Gate parses all static ld+json blocks; runtime-emitted schema verified by JSON.parse in-browser on the hostile build; per-client Rich Results Test is a standing MANUAL gate row. |
| A5 Local-SEO formulas | **PASS** | Title/H1/meta-description formulas with reasons added to `references/content-rules.md` (service+city leads titles, one natural city mention, no stuffing, no invented geography). |
| B6 indexnow.mjs | **PASS** | Zero-dep Node 18+; `--init` idempotent (created → exists on rerun), `--submit` validates host vs sitemap, refuses staging dists (dry-run warns instead), `--dry-run` clean on hostile (8 URLs). `--help` states Google does not use IndexNow. |
| B7–B9 skill docs | **PASS** | launch-checklist.md "Search indexing" + "Day-7 crawl verification" sections; SKILL.md steps 10–11 + indexing-honesty note + scripts index; decision-table rows (GSC absent → proceed+48h, staging → never submit, no GBP → flag, upsell); WIRING template indexing table. |
| B10 hostile re-run | **PASS** | Rebuilt dist: gate exit 0 (12 PASS/0 FAIL/8 MANUAL), zero `{{`, zero fingerprints, evergreen active (`body.offer-static`), GSC meta absent, indexnow dry-run clean, zero aggregateRating anywhere, no schema where data is missing. |
| Gate fix surfaced by this work | **FIXED** | Pre-existing robots check flagged `404.html` as `noindex` in prod — a noindex 404 is correct, so the check now exempts it. Prod gate green after fix. |
| Admin noindex ruling (ratified 2026-07-23) | **PASS** | Prod robots.txt keeps `Disallow: /admin/` AND `admin/index.html` now carries a hardcoded `<meta name="robots" content="noindex">` regardless of `{{ROBOTS_DIRECTIVE}}` — both layers, because Disallow alone hides the noindex from crawlers while the URL can still be indexed by reference. Gate robots check exempts admin/ like 404.html; staging + prod gates green. |

## GHL External Tracking module (added 2026-07-23)

| Item | Status | Evidence |
|---|---|---|
| 1 Config + injection | **PASS** | `tracking.ghlExternalTracking` (script src URL) injected by `tracking.js` async+defer alongside the other pixels — immediate load, never on a deferral (late load misses the page view). Injected on every page incl. 404 (404.html now loads tracking.js). Empty/tokenized → nothing injected; new gate check `ghl-external-tracking` fails tokenized values and any REAL URL on staging (attribution pollution). |
| 2 Wiring ID #9 | **PASS** | wiring.md is now "the nine IDs": #9 live verification = anonymous 2–3 page browse + gate-form submit → prior page views stitched on the contact timeline AND exactly ONE contact (dedupe-merge on email/phone; twins = FAIL, investigate before launch). Row added to the WIRING.md template; gate MANUAL wiring row updated to 9 IDs. |
| 3 Fingerprint | **MANUAL (pending)** | The origin dealer has NO External Tracking snippet yet — verified by scanning that repo (only the chat-widget loader exists). A `pending` fingerprint entry documents this; gate.mjs skips pending entries with a stderr note. Populate the real ID the day it's created. |
| 4 Decision-table rows | **PASS** | Key absent → launch proceeds (cosmetic tier, attribution loss not lead loss), open wiring item, add within 48h alongside GSC; staging never carries a real ID (gate-enforced); duplicate contacts = FAIL ID #9. |
| 5 SKILL.md gotcha | **PASS** | "External tracking requires native DOM forms; an iframe/widget form silently stops tracking capture for it." |
| 6 Docs + hostile re-run | **PASS** | token-reference + launch-checklist updated. Hostile rebuild: `ghlExternalTracking: ''` in built config, zero tracking scripts in dist HTML, staging gate 13 PASS/0 FAIL. Negative tests: prod build with a fake https URL → PASS "injected from …"; same dist gated as staging → exit 1. Validator PASS with cosmetic warning. |

## Booking page module (added 2026-07-23)

| Item | Status | Evidence |
| --- | --- | --- |
| `/book/` native booking page | **PASS** | New conversion-minimal page: slim header (logo + phone, no nav exits), one glass card, three taps — day chips (next 7 days with availability, soonest preselected) → time chips → name/phone/email(optional) → confirm. Native DOM form (external tracking + attribution intact), Turnstile, TCPA fine print, inline success state. No images = no LCP payload. |
| `/api/booking` function | **PASS** | GET pulls real free slots from the GHL calendar (`GHL_BOOKING_CALENDAR_ID`, calendar API Version 2021-04-15), capped 10 days / 14 slots per day. POST reuses `validateLeadPayload` + `verifyTurnstile` + `upsertContact` (dedupe-merge; tags src-*, `Intent - Showroom Visit`, `Campaign - booking`) then creates the appointment as `confirmed`. |
| Lead-safety ordering | **PASS** | Contact upsert happens BEFORE the appointment write. Calendar unconfigured, no slots, or appointment API failure → `booked:false` confirm-by-text path; the lead is already in GHL. Slot fetch failure fails open into request-mode (preferred-day capture). A calendar outage can cost a timestamp, never a lead. |
| Config/token wiring | **PASS** | `tracking.ghlBookingCalendarId` (config template + hostile `''`) → `{{GHL_BOOKING_CALENDAR_ID}}` → `wrangler.toml` var; hydrates to `""` when empty. Validator: cosmetic warning (request-mode is a working fallback, not lead loss). All `BOOK_*` copy tokens carry `|defaults` — page ships with zero new intake requirements; rows added to token-reference. |
| Hostile rebuild | **PASS** | Staging gate 13/0, prod-token rebuild gate 13/0. `/book/` auto-included in sitemap (9 URLs). Request-mode fallback screenshotted at 390/1280 (hostile config has empty calendar ID — page degrades exactly as designed). Brand guard green. |

Analytics: booking submit fires `generate_lead` (GA4) and `Schedule` (Meta) so booking conversions are distinguishable from form leads.

### Booking module — live verification + adversarial pass (2026-07-23, snapshot sub-account)

| Test | Result |
| --- | --- |
| End-to-end booking via production function | **PASS** — appointment stored at exact store-local time (9:30–10:00 -04:00), status `confirmed`, team member auto-assigned, tags intact, GHL shows Source "Third party". |
| Slot removal after booking | **PASS** — booked slot vanished from free-slots immediately. |
| Double-booking | **PASS** — GHL rejects (`400 The slot you have selected is no longer available`); production code classifies via free-slots re-check → `slotTaken` retry UX. |
| Dedupe | **PASS** — same person submitting 3× = one contact (merge), never duplicates. |
| Malformed JSON / missing fields / bad phone / honeypot / PUT-DELETE | **PASS** — clean 400s, `Spam detected.`, 405s. |
| Fake / past / garbage slot strings | **PASS** — no phantom appointments possible; lead captured, safe fallback responses. |
| 50KB name | **FIXED → PASS** — validator now rejects names >120 chars (was: forwarded to GHL, which rejected it downstream). Message field truncated at 2000 chars. |
| Email-optional booking | **FIXED → PASS** — shared validator gains `emailOptional` opt-in (booking only; lead forms unchanged); GHL payload omits empty `email` key (GHL rejects `email:""`); duplicate search parameterized to skip empty email. Phone-only contacts create + dedupe correctly. |
| GET cache | **PASS** — repeat availability hits served ~2 ms from edge cache vs ~300 ms GHL round trip. |

Workflow trigger guidance (verified via GHL UI evidence): API-created appointments surface as Source "Third party" and DO reach the automation engine. Recommended trigger: **Customer Booked Appointment** filtered to the booking calendar; alternative **Appointment Status = confirmed**. Live Execution Logs verification remains a launch-checklist step per client.

## Module E — Meta CAPI / offline absorbed into skill + gate (2026-07-24)

Funnel code shipped in `69ffe02`; this module makes fulfillment (skill/gate/checklist) aware of it and hardens offline webhook behavior.

| Item | Status | Evidence |
|---|---|---|
| Wiring set 11–13 | **PASS** | `manus-skills/dealer-site-wiring/references/wiring.md` — `META_CAPI_ACCESS_TOKEN` + `META_OFFLINE_WEBHOOK_SECRET` (CF secrets, standing MANUAL like GHL token); 6 GHL field keys; Opportunity Stage → `/api/meta-offline`; live-verify block (Lead DEDUPED, Schedule on booking, QualifiedLead offline). WIRING.template + gate MANUAL row updated. |
| Launch checklist + GHL doc | **PASS** | Per-client onboarding: 6 fields, 3 CF secrets, stage webhook + merge fields, stage-name alignment, **Events Manager custom conversions** for QualifiedLead/Showed (also step 5 in `docs/GHL_META_OFFLINE_WORKFLOW.md`). |
| Hardening (`functions/lib/meta-capi.js`, `functions/api/meta-offline.js`) | **PASS** | `META_TEST_EVENT_CODE` \|\| `TEST_EVENT_CODE`; offline mints unique `event_id` (`meta_event_id` linkage only); unknown stage → **2xx skipped** (no GHL retry storm); `event_source_url` omitted when `action_source=system_generated`. |
| Decision table + SKILL gotcha | **PASS** | Missing custom fields → cosmetic / 48h (attribution loss); stage names → align before enabling workflow, never guess; orchestrator + wiring SKILL gotcha: silent skip + CAPI token never in GHL. |
| Fingerprints / secrets in docs | **PASS** | No live CAPI tokens in docs/templates; Pixel ID `1317738110513512` appears only as fingerprint/"leftover looks like" (gate detection), not as a client secret. |
| Hostile rebuild + gate | **PASS** | Hostile staging gate 13 PASS / 0 FAIL / 8 MANUAL; prod-token rebuild gate 13/0/8. Dist includes `functions/api/meta-offline.js` + hardened `meta-capi.js` from `69ffe02` + Module E. Skill zips refreshed under `manus-skills/*.zip` (gitignored). |

## WTV-016 — Footer meta-text hardcode (found by Manus during sun-pool-spa build, 2026-07-28)

| Item | Status | Evidence |
|---|---|---|
| Hardcoded footer copy on 7 pages | **FIXED** | `"{{CLIENT_MARKET}} dealer website template. Inventory, pricing, CRM routing, and tracking are client-configured."` shipped as visible copy on 404, thank-you, contact, financing, admin, active-inventory, active-inventory/SLUG. Replaced with `"Proudly serving {{CLIENT_MARKET}} with in-stock hot tubs, swim spas, and saunas."` (no new token — CLIENT_MARKET is REQUIRED tier; engine fallback syntax cannot nest tokens, verified in `scripts/build-config.mjs`). |
| Hostile dist re-verified | **PASS** | Same replacement applied hydrated in `clients/hostile-rehearsal/dist`; brand:guard green; prod gate 13 PASS / 0 FAIL / 8 MANUAL. |

## WTV-017 — native-form Turnstile widget missing sitekey (found via prod Lighthouse audit, sun-pool-spa, 2026-07-28)

| Item | Status | Evidence |
|---|---|---|
| Injected form widget had no `data-sitekey` | **FIXED** | `assets/native-form.js` injected `<div class="cf-turnstile" data-theme="light">` with no sitekey — widget never issued a token, so when `TURNSTILE_SECRET_KEY` is set the server rejects every lead from the 7 native-form pages ("Please complete the security check"). Now reads `data-turnstile-site-key` body attr or `tracking.turnstileSiteKey` config and omits the widget entirely when no key exists (server skips verification when secret unset — consistent). |
| Verification | **PASS** | `node --check` clean; brand:guard green; hostile prod gate 13 PASS / 0 FAIL / 8 MANUAL. Live console error on sun-pool-spa inventory page ("Invalid or missing type for parameter sitekey") was the symptom. |
