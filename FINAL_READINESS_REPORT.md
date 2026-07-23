# FINAL READINESS REPORT — website-template-2.0 (premium-redesign)

July 23, 2026. Closeout of `FINAL_DIAL_IN_AND_LAUNCH_GATE.md` Part A plus the
client-site-build skill pack. **Definition of done met:** certification all
PASS/MANUAL, gate green on the hostile dist, `brand:guard` green, working
tree committed clean.

## 1. Certification summary

Full row-by-row evidence in `TEMPLATE_CERTIFICATION.md`.

| Area | Result |
|---|---|
| A1 — Reveal audit (financing/contact) + image manifest | PASS (manifest 12/12; contact reveal verified firing live) |
| A2 — Cross-browser | PASS at code level (webkit twins, dvh fallbacks, clip-path prefix, scrollbar hiding — 6 defects fixed); real-device pass MANUAL |
| A3 — Hostile hydration rehearsal | PASS — gate exit 0, zero `{{`, zero fingerprints, evergreen active, 68-char name clean at 390/320, empty/404 images render as gradient wells; 24 screenshots archived |
| A4 — Mechanical sweeps | PASS — console-clean interaction pass, links green (favicons + admin `#settings` fixed), duplicate-ID clean incl. post-injection, forms fit 390×650/320, reduced-motion static, robots honored, 404 page + neutral favicon set shipped |

## 2. Skill pack status

- `npx skills-ref validate skills/client-site-build` → **Valid skill**; SKILL.md **140 lines** (≤500).
- Token reference: **328 unique tokens** documented (46 config-mapped, 298 scaffolded in `tokens.env.template`, 68 with `|defaults`).
- Scripts: `new-client.mjs` (init/validate — hostile config now validates PASS with 2 intended warnings), `gate.mjs` (8 automated checks + 7 honest MANUALs), `check-assets.mjs` (new: PNG/JPEG/WebP header parsing, label→token mapping, PASS/SOFT/FAIL grading — smoke-tested).
- Gate demos: Paradise build correctly **FAILS fingerprints** (detector proven); hostile build **exits 0**.
- Asset intake: `assets/CLIENT_UPLOAD_CHECKLIST.md` (customer-facing, 6 must-haves + nice-to-haves), label→token mapping + intake procedure in `references/images.md`, upscaling rules (≤2×, half-minimum floor, LCP-hero flag) in `references/decision-table.md`.

## 3. Six-conflict resolution ledger (owner rulings applied)

| # | Conflict | Ruling applied |
|---|---|---|
| 1 | 8 imgs missing width/height | Template fixed — dims added at true rendered aspect (4:3 = 1200×900, 1:1 = 1200×1200); gate rule stays |
| 2 | "Exactly one preload" too strict | gate.mjs amended: at most one; must reference the page's LCP hero; zero = PASS on hero-less pages |
| 3 | No hydrated origin-dealer config for validate demo | Tokenized template config is the canonical demo target (fails loudly, as a mis-validated artifact should) |
| 4 | build-config hydrates in place | rsync-to-`clients/<name>/dist/` is the permanent pipeline (SKILL.md step 5); template script frozen per Law 1; dist now also prunes `scripts/` |
| 5 | Fingerprint file would trip brand:guard | Base64 store is the standing format; gate decodes at runtime; detector re-verified against the origin site |
| 6 | Canon gate doc tripped brand:guard | Guard re-scoped (not allowlisted): buildable sources only (html/js/css/toml/json), never *.md; ruling noted in the canon doc header |

Also logged in `SKILL_PACK_REPORT.md`.

## 4. Template defects found and fixed during closeout

1. Explicitly-empty config values leaked raw `{{TOKENS}}` into shipped pages (two in visible text) → build-config hydrates explicit `""`; `img[src=""]`/`iframe[src=""]` hidden in all four top-level stylesheets; validator downgraded from error to Checkpoint-1 warning.
2. Legacy `#paradise-lead-error` selector in `lead-form.js` (dead code, template fingerprint) → removed.
3. Admin nav `#settings` anchor had no target → Settings info card added.
4. No 404 page; favicon files referenced but never shipped (4 pages), missing entirely (8 pages) → `404.html` created; neutral navy/gold favicon set generated; icon links on all 13 pages.
5. WebKit: 2 missing `-webkit-backdrop-filter` twins, 2 `dvh`-only gate panels (Safari <15.4 fallback), unprefixed shield clip-path → fixed.

## 5. MANUAL list for Alex (everything a script can't do)

1. **Cross-browser device pass** (A2): Safari macOS + iOS simulator and one real Android/iPhone at 390/1440 — glass blur, gradient text, shield hexagon, gate behavior over the iOS toolbar, rail snap, input chrome.
2. **Lighthouse** on a deployed build: Perf ≥85 mobile / ≥95 desktop, A11y ≥95, SEO ≥95, CLS <0.1.
3. **Per-client launch gate (Part B)** — every new build: the 8-ID live wiring verification (GA4 Realtime, Pixel test events, Clarity, GHL webhook + chat inbox routing, Closebot, Turnstile submit, phone/SMS routing), one real test lead from a phone on cellular, gate unlock end-to-end, OG/share-preview validation, DNS/SSL/redirect checks.
4. **AVIF/HEIC uploads**: `check-assets.mjs` parses PNG/JPEG/WebP headers only — dims for other formats need a manual look.

## 6. Commits

- `ec3b49c` — skill pack v1 (pre-closeout baseline)
- Closeout commit(s) — owner rulings, asset intake, hostile rehearsal artifacts, certification + this report (see `git log`)
