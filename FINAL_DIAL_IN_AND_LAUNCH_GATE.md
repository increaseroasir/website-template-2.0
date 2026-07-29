# FINAL DIAL-IN + CLIENT LAUNCH GATE — website-template-2.0

> **Guard scoping note (owner ruling, closeout):** `npm run brand:guard`
> scans only buildable sources (html/js/css/toml/json) and built output —
> never `*.md` docs. Documentation like this file may name fingerprints;
> shipped pages may not.

This document has three parts. **Part A runs once, right now**, to certify the
template itself. **Parts B and C are permanent**: they run on every client
build inside the website creator, forever. `SITE_MASTER_SPEC.md` remains canon
for all visuals — nothing in this pass may change how the site looks.

Rules of engagement: work on a branch, screenshot-before/after any change,
and for every checklist item below report **PASS / FAIL / FIXED (what+where)**.
No item may be skipped silently. Output two artifacts when done:
`TEMPLATE_CERTIFICATION.md` (Part A results) and keep this file at repo root
as the standing gate.

---

## PART A — FINAL DIAL-IN SWEEP (run once, now)

### A1. Close the open audit questions
- [ ] **Reveal audit, financing + contact:** list every `<section>` on both
      pages and justify per-section why it does or doesn't carry `.reveal`.
      Static below-the-fold sections (steps, night bands, form cards) are
      exactly what Law 5 allows — "no section-level containers" is not a
      credible answer for these two pages. Add reveals where the law permits.
- [ ] **Image token manifest:** `grep -rho '{{[A-Z0-9_]*_IMAGE[A-Z0-9_]*' --include='*.html'`
      across the repo, dedupe, and verify every result has a row in
      `/assets/image-tokens.md` (page, purpose, aspect ratio, min px). Add
      missing rows. Report final count: tokens found vs rows.

### A2. Cross-browser (the audit ran in one browser)
Test index, financing, active-inventory/SLUG, and thank-you in **Safari
(macOS + iOS sim)** and Chrome/Android profile:
- [ ] Glass panels blur (backdrop-filter + `-webkit-` twin) — no gray slabs
- [ ] Gradient text renders (`.deg`, stat numerals, monthly figures) — no
      invisible or solid-black text
- [ ] Shield clip-path hexagon renders with its drop-shadow
- [ ] `100dvh` gates/panels don't jump behind the iOS toolbar
- [ ] Rails scroll-snap and hide their scrollbars
- [ ] Date input, select chevrons, and checkbox accent colors acceptable

### A3. Stress hydration with a hostile fake client (dress rehearsal)
Create `client.config.example-hostile.js` and hydrate the whole site with it:
- Business name: "Smoky Mountain Hot Tub & Swim Spa Superstore of Greater
  Knoxville" (long — tests header, footer, drawer, JSON-LD)
- 3 Google reviews, rating 4.2 (tests stats honesty + layouts built for 170)
- **No active offer** (`OFFER_ENDS_AT` empty — marquee/countdowns/fair band
  must render sane: no `00:00:00` urgency theater, no `NaN`)
- Market: TN zips (tests that the zip rule reads from config, not `/^5[89]/`)
- One image token deliberately empty, one pointing at a 404 (gradient wells +
  `onerror` must keep cards clean)
- A token value containing `|` and one containing an apostrophe (pipe parser
  + attribute escaping)
- [ ] Screenshot every page at 1440/390 with this config; nothing broken,
      nothing Paradise, nothing `{{`
- [ ] `grep -r "Paradise\|7018382614\|Minot\|paradisesm" dist/` returns only
      intentional default-config files, never built pages

### A4. Mechanical sweeps (whole repo, built output)
- [ ] Zero `{{` in built output under the real example config
- [ ] Zero console errors/warnings on every page: load + scroll + one
      interaction pass (drawer, FAQ, form step 1, a card CTA)
- [ ] Link check: every `href` resolves (internal pages exist, `#anchors`
      exist **on that page**, tel:/sms: are E164 tokens)
- [ ] Duplicate-ID scan after hydration AND after inventory injection
- [ ] Forms fit 390×650 and 320px wide, consent visible, no internal scroll
- [ ] Reduced-motion: every page fully static, final values shown
- [ ] `robots` meta honors `{{ROBOTS_DIRECTIVE}}`; preview/staging is noindex
- [ ] 404 page exists and is on-brand; favicon set is tokenized, not Paradise's

Write `TEMPLATE_CERTIFICATION.md` with a table of every item above. The
template is not "client-ready" until every row is PASS.

---

## PART B — CLIENT LAUNCH GATE (run for EVERY new client build)

Copy this checklist into the client build's repo as `LAUNCH_GATE.md` and check
items off literally. A build cannot go live with an unchecked box.

### B0. Intake → config (never hand-type)
- [ ] `client.config.js` + token values generated from the intake brief
      (GHL intake form → normalized brief → config), not typed from memory
- [ ] Config validated: required keys present, phone in E164, hours parseable,
      offer date ISO with timezone or explicitly empty
- [ ] `WIRING.md` created for this client recording every ID below

### B1. Hydration
- [ ] `grep -r "{{" dist/` → zero hits
- [ ] List every token that shipped on its `|default` value → client/owner
      signs off on each (defaults shipping unnoticed is how "Book my visit"
      ends up on a sauna store)
- [ ] Long-value spot-check: header, footer, drawer, hero with the client's
      real business name and headline at 390px

### B2. Wiring — the eight IDs (each one: present, NOT a template/Paradise
value, and verified firing live)
- [ ] GA4 measurement ID — Realtime shows your test visit
- [ ] Meta Pixel ID — Pixel Helper / Test Events shows PageView + ViewContent
- [ ] Clarity project ID
- [ ] Lead endpoint / GHL webhook — points at THIS client's sub-account
- [ ] GHL chat widget ID — widget appears after the 20s deferral, routes to
      this client's inbox
- [ ] Closebot source ID
- [ ] Turnstile sitekey — form submits succeed with it present (empty key =
      silent lead loss if the form JS requires it)
- [ ] Phone + SMS in E164 everywhere (header, mbar, footer, TCPA line, schema)

### B3. Market logic
- [ ] Zip validation matches the client's market (config-driven)
- [ ] Offer timezone = client's timezone
- [ ] Service-area chips = client's real towns
- [ ] JSON-LD: address, hours, phone, areaServed, and **aggregateRating is the
      client's real GMB numbers or removed entirely** — never inherited
- [ ] Offer state sane: active offer with a valid FUTURE date, or evergreen
      mode (no countdown corpses, urgency copy removed/neutral)

### B4. Content reality
- [ ] Stats band values are true for THIS client (years, deliveries, rating,
      review count)
- [ ] All image tokens filled per `/assets/image-tokens.md` dims; `_ALT`
      tokens written; LCP hero is a real optimized image
- [ ] Reviews are this client's real reviews (names/months/source)
- [ ] TCPA disclaimer names THIS business and THIS phone; privacy/opt-out
      language present; consent visible at 390×650

### B5. QA gates (hydrated build)
- [ ] SITE_MASTER_SPEC Part 6 four-gate pipeline passes on every page
- [ ] Lighthouse: Perf ≥65 mobile / ≥90 desktop, A11y ≥95, SEO ≥90, CLS <0.1 (PSI, TVD-048)
- [ ] Safari + Chrome + one real Android or iPhone, 390 and 1440
- [ ] Zero console errors sitewide

### B6. Pre-launch tech
- [ ] Production `ROBOTS_DIRECTIVE` = index,follow; staging = noindex
- [ ] Canonicals point at the client's production domain
- [ ] OG/Twitter tags filled; share-preview checked in a validator
- [ ] Client favicon set; sitemap generated + referenced; SSL green;
      www/non-www redirect chosen and enforced; 404 live

### B7. Post-launch verification (within 1 hour of DNS)
- [ ] **Submit one real test lead from a phone on cellular** → lands in the
      client's GHL sub-account with correct source/campaign/tags → automation
      fires (use `verify_funnel` where available)
- [ ] Unlock the inventory gate end-to-end once; confirm the unlock persists
- [ ] Call the tracked number; text the SMS link; confirm routing
- [ ] GA4 Realtime + Meta Test Events show the session on the CLIENT's IDs
- [ ] Screenshot archive of every page (1440/390) stored with `WIRING.md`

---

## PART C — STANDING LAWS FOR EVERY CLIENT BUILD

1. **Hydrate, never rebuild.** Shared CSS/JS is frozen and versioned. A client
   build touches ONLY: config, token values, and image assets. If a client
   wants a styling change, it happens in the template repo, ships as a
   version bump, and rolls out to the fleet — never patched in one copy.
2. **No unversioned copies.** Every client site records the template version
   it was built from.
3. **Palette is the product.** Navy+gold is load-bearing (it lives in hundreds
   of gradient stops and data-URI SVGs). Client branding = logo, copy, photos,
   market — not palette — unless a deliberate re-theming project derives every
   tint from tokens first.
4. **Fail loudly before launch, never after.** Anything ambiguous during a
   build gets flagged in the gate report, not guessed. An unchecked box is a
   blocked launch, no exceptions — including "the client is in a hurry,"
   which is precisely when B2 mistakes ship.
