# SITE MASTER SPEC — website-template-2.0 (premium-redesign)

**This is the single source of truth for the ENTIRE template** — every page
already shipped, every remaining page, and any page added later. Treat it like
`PROJECT.md`: read it before every batch. It contains and supersedes the three
earlier docs (PREMIUM_STYLE_HANDOFF, VISUAL_PARITY_PUNCH_LIST, MOTION_SPEC).

How to use it, every batch:
1. Re-read Part 1 (laws) and the recipe for the page you're touching (Part 5).
2. Build using only Part 2/3 values — they are canon, never approximate.
3. Wire motion per Part 4.
4. Run the Part 6 audit loop on the page before reporting it shipped.

Where Parts 2 and 3 overlap, values are identical by construction; if you ever
think you see a conflict, Part 3 wins (it was verified against screenshots).

---

# PART 1 — LAWS (apply to every page, no exceptions)

1. Styling only. **Never change** `{{TOKENS}}` (incl. `{{TOKEN|default}}`),
   copy, IDs, `name` attributes, form fields, `data-*` attributes, script
   tags, or tracking. Two sanctioned markup exceptions: the compare-table
   header row (Part 3 §G) and image-token conversions (Part 2 §10).
2. One shared token layer (`/assets/theme.css` or one verbatim `:root` block)
   loaded before page CSS. Page CSS never redefines tokens. No Tailwind CDN,
   no new fonts, no icon fonts, no emoji-as-icons.
3. Lead forms and gates fit the viewport with **no internal scrolling**;
   consent/TCPA text shrinks but never hides (Part 2 §7).
4. Every page defines or inherits: `.text-center`, `.mx-auto`, `.max-w-md`,
   gold `::selection`, 3px gold `:focus-visible`, and the reduced-motion kill.
5. Reveal classes go on section containers only — never on cards or anything
   JS injects, filters, or toggles.

---

# PART 2 — DESIGN SYSTEM CANON
(from PREMIUM_STYLE_HANDOFF — tokens, fonts, components, forms, per-page notes, image tokens, QA)

## 0. Hard rules (never violate)

1. **Never change** `{{TOKENS}}` (including `{{TOKEN|default}}` pipes), copy,
   IDs, `name` attributes, form fields, `data-*` attributes, script tags, or
   tracking. Presentation layer only.
2. **No Tailwind CDN, no new fonts, no icon fonts, no emoji as icons.**
3. All shared values live in **one token layer** (e.g. `/assets/theme.css`
   loaded before page CSS, or a single `:root` block reused verbatim). Do not
   fork tokens per page.
4. Lead forms and gates must **fit the viewport with no internal scrolling**
   (see §7). TCPA/consent text may shrink but is **never hidden**.
5. The markup contains three utility classes that must exist in shared CSS or
   they silently no-op: `.text-center{text-align:center}`,
   `.mx-auto{margin-inline:auto}`, `.max-w-md{max-width:28rem}`.

---

## 1. Fonts

Google Fonts (already linked on done pages — reuse the same URL):

- Display / headings / buttons: **Bricolage Grotesque** (400–800, weight 800 for h1–h4)
- Body: **Instrument Sans**
- Eyebrows, labels, countdowns, badges: **Spline Sans Mono** (500–700, uppercase, wide tracking)

Headings: `font-weight:800; line-height:1.08; letter-spacing:-.02em; color:var(--navy-deep)`.

## 2. Color tokens (exact)

```css
:root{
  --navy-royal:#16469B; --navy-mid:#0F327A; --navy-deep:#0B2559;
  --navy-night:#06183D; --navy-abyss:#030C20;
  --gold:#FFB81C; --gold-soft:#FFCB57; --gold-deep:#E8A400; --gold-dark:#B98200;
  --red:#D7261E; --sand:#F8F4EC; --ink:#141927; --ink-soft:#4A5268;
  --line:rgba(11,37,89,.12);
  --ease-out:cubic-bezier(.22,.68,0,1);
}
```

Usage rules:
- Light sections alternate white and `--sand`. Hairline borders are always `var(--line)`.
- Dark "night water" sections use this layered background:
  `radial-gradient(900px 480px at 50% -10%, rgba(22,70,155,.55), transparent 60%), linear-gradient(180deg, var(--navy-night), var(--navy-abyss))`
  — optionally add a faint gold radial `rgba(255,184,28,.10–.13)` off one corner.
- Text on dark: white headings, body `#C9D5EE` / `#C6D4EF`, muted `#8FA6D2`.
- Gold text on white must use `--gold-dark` (#B98200) for contrast, never raw #FFB81C.
- `::selection{background:var(--gold);color:var(--navy-night)}`
- Focus: `outline:3px solid var(--gold); outline-offset:2px` on `:focus-visible`.

## 3. Signature details (verbatim CSS — copy exactly)

**Gold shimmer hairline** (top/bottom of marquee, stats band, final CTA, dark section edges):
```css
.gold-hairline{position:relative;height:1px;background:rgba(255,184,28,.28);overflow:hidden}
.gold-hairline::after{content:"";position:absolute;top:0;bottom:0;width:38%;
  background:linear-gradient(90deg,transparent,#FFD46A 50%,transparent);
  animation:sweep 5.5s ease-in-out infinite}
@keyframes sweep{0%{transform:translateX(-120%)}55%,100%{transform:translateX(300%)}}
```

**Gradient accent text** (one emphasized word in a headline, e.g. the `.deg` span):
```css
.deg{background:linear-gradient(94deg,#FFE29A 0%,#FFB81C 48%,#F0A400 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
```

**Buttons** — base + gold + sheen sweep. Every primary CTA gets all three:
```css
.btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:.95rem;letter-spacing:.01em;
  line-height:1.1;text-decoration:none;border-radius:14px;padding:16px 26px;min-height:54px;
  cursor:pointer;border:1px solid transparent;text-align:center;white-space:nowrap;
  overflow:hidden;isolation:isolate;
  transition:transform .3s var(--ease-out),box-shadow .3s var(--ease-out),background .3s,border-color .3s,color .3s}
.btn:hover{transform:translateY(-2px)}
.btn:active{transform:translateY(0) scale(.98)}
.btn-gold{color:var(--navy-night);
  background:linear-gradient(180deg,#FFD46A 0%,#FFB81C 52%,#F0A400 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 12px 28px -10px rgba(232,164,0,.7)}
.btn-gold:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.65),0 18px 38px -12px rgba(232,164,0,.85)}
.btn-gold::after{content:"";position:absolute;inset:0;z-index:1;
  background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.55) 50%,transparent 68%);
  transform:translateX(-130%);transition:transform .65s ease}
.btn-gold:hover::after{transform:translateX(130%)}
```
Ghost variants: transparent bg, `border:1px solid rgba(255,255,255,.3)` white text on dark
(`.btn-ghost`), or `border:1px solid var(--line)` + `color:var(--navy-royal)` on light
(`.btn-ghost-blue`); hover = border brightens + same -2px lift. `.btn-red` uses
`linear-gradient(180deg,#E8382F,#B71E17)`, white text.

**Mono eyebrow with gold leader line** (above every section heading):
```css
.eyebrow{display:inline-flex;align-items:center;gap:11px;font-family:'Spline Sans Mono',monospace;
  font-weight:600;font-size:.68rem;letter-spacing:.26em;text-transform:uppercase;
  color:var(--gold-dark);margin-bottom:16px}
.eyebrow::before{content:"";width:28px;height:1px;
  background:linear-gradient(90deg,var(--gold-deep),transparent);flex:none}
```
On dark sections eyebrow color becomes `var(--gold-soft)`.

**Glass panel** (lead cards, modals, gates — anything floating over imagery/dark):
```css
.glass-panel{position:relative;border-radius:26px;
  background:linear-gradient(168deg,rgba(255,255,255,.94),rgba(255,255,255,.84));
  backdrop-filter:blur(26px) saturate(1.3);-webkit-backdrop-filter:blur(26px) saturate(1.3);
  border:1px solid rgba(255,255,255,.7);
  box-shadow:0 44px 90px -28px rgba(3,12,32,.65),inset 0 1px 0 rgba(255,255,255,.9)}
.glass-panel::before{content:"";position:absolute;top:0;left:24px;right:24px;height:3px;
  border-radius:0 0 4px 4px;
  background:linear-gradient(90deg,var(--gold-soft),var(--gold) 40%,var(--gold-deep))}
```

**Steam / ambient blobs** on dark heroes:
```css
.steam{position:absolute;z-index:1;border-radius:9999px;filter:blur(72px);pointer-events:none}
.steam-1{width:520px;height:340px;left:-8%;bottom:-14%;background:rgba(22,70,155,.5);animation:drift1 16s ease-in-out infinite}
.steam-2{width:460px;height:300px;right:-6%;top:-16%;background:rgba(255,184,28,.13);animation:drift2 20s ease-in-out infinite}
@keyframes drift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(46px,-32px) scale(1.14)}}
@keyframes drift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-38px,26px) scale(1.1)}}
```

## 4. Cards, prices, badges

- Card shell: white, `border:1px solid var(--line)`, radius 18–20px,
  `box-shadow:0 8px 22px -14px rgba(6,24,61,.16)`.
- Card hover: `transform:translateY(-4px)`, border tint `rgba(232,164,0,.4)`,
  shadow deepens to `0 28px 54px -22px rgba(6,24,61,.32)`, and the card image
  zooms `scale(1.045)` over `.7s var(--ease-out)`.
- Image wells get a gradient placeholder base:
  `background:linear-gradient(155deg,#eef2f8,#e2e9f4)` so missing images look intentional.
- Badge pills (`.badge`, product tags): pill radius, Spline Sans Mono 600,
  `.6rem`, uppercase, tracking `.09em`. Variants: gold
  `linear-gradient(180deg,#FFD46A,#F5AD0E)` + navy-night text; dark
  `linear-gradient(180deg,#2A3244,#141927)` + white; blue
  `linear-gradient(180deg,var(--navy-royal),var(--navy-deep))` + white. Each with a
  soft matching drop shadow.
- Monthly-payment figures: Bricolage 800, gradient-gold text —
  `background:linear-gradient(180deg,#D9A50E 8%,#B98200 70%)` with background-clip:text.
- Prices: Bricolage 800 in `--navy-deep`; strikethrough MSRP muted at ~.75 opacity;
  "Save $X" in `#12603A`.

## 5. Icons

Inline stroke SVGs only (lucide style): `fill="none" stroke="currentColor"
stroke-width="1.75"` (2 for tiny 12–17px glyphs), sized 18px in spec pills,
color `var(--navy-royal)` on light / `var(--gold-soft)` accent on dark.
Labels next to icons: Spline Sans Mono 600, `.6rem`, uppercase, `--ink-soft`.

## 6. Forms & inputs

- Inputs/selects: `min-height:48px` (52px on desktop gates), `padding:11px 14px`,
  radius 13px, `border:1px solid rgba(11,37,89,.16)`, bg `rgba(255,255,255,.85)`,
  **font-size:16px** (prevents iOS zoom), custom chevron SVG on selects
  (`appearance:none`).
- Focus: `border-color:var(--navy-royal); box-shadow:0 0 0 4px rgba(22,70,155,.12)`.
- Labels: mono style from §3, `.6rem`, `margin:10px 0 6px`. Where placeholders
  already carry the field name (name/email/phone), labels may be visually
  hidden with an sr-only clip pattern — but stay in the DOM.
- Checkboxes `accent-color:var(--navy-royal)`; range sliders `accent-color:var(--gold-deep)`.
- Honeypots stay off-screen (`position:absolute;left:-9999px;opacity:0`).

## 7. No-scroll rule for lead forms/gates (conversion-critical)

Any gate/modal/lead card must show its submit button without internal
scrolling on a ~650px-tall phone viewport. Achieve it by compaction, then
progressive `@media (max-height:…)` steps that shed decoration in this order:
logo → stat chips/footer trust line → lead paragraph. The consent/TCPA text
only ever shrinks (down to ~.56rem), never hides. An `overflow-y:auto`
fallback is allowed **only** under ~480px height (short landscape phones).

## 8. Motion

- Scroll reveal: classes added **by JS** (no-JS users see everything).
  Section-level containers only — never on cards or anything filter/JS toggles.
  `.reveal{opacity:0;transform:translateY(22px);transition:opacity .75s ease,transform .75s var(--ease-out)}`
  `.reveal.in{opacity:1;transform:none}` via IntersectionObserver
  `{threshold:.08, rootMargin:'0px 0px -30px 0px'}`.
- Countdown ticks, count-ups, rail dots: keep existing JS hooks; style only.
- `@media (prefers-reduced-motion:reduce)`: kill all animations/transitions,
  reveal fully visible, `scroll-behavior:auto`.

## 9. Page-by-page (batches 2–4)

**6. `active-inventory/index.html`** — match the shipped inventory page:
white desktop shell with sticky filter sidebar (`top:~92px`), sand mobile bg,
horizontal card layout ≥901px (square image left ~42%, body right, spec pills
bottom-anchored above a hairline), vertical cards on mobile. Filter card =
white panel, mono gold group headings, navy filter-toggle button, gold slider.

**7. `active-inventory/SLUG/index.html`** (product detail) — dark ambient hero
strip optional; gallery well with gradient placeholder base; sticky
price/CTA card on desktop = glass panel (§3) with gold top hairline,
gradient-gold monthly, `.btn-gold` CTA; spec grid uses the icon+mono-label
pattern; trust/disclaimer in fine mono. Related-products rail reuses card shell.

**8. `financing.html`** — alternate white/sand sections; payment figures in
gradient-gold; lender/steps as numbered `01/02/03` Bricolage ghost numerals;
one dark "night water" band with hairlines for the big monthly-payment hook;
application CTA = `.btn-gold`. Disclaimers: `.7rem`, `--ink-soft`, centered.

**9. `contact.html`** — glass contact card over an ambient navy header band;
map in a rounded 16px frame with `border:1px solid rgba(255,255,255,.14)` on
dark (or `var(--line)` on light) + soft shadow; hours/address in the footer's
mono-heading pattern; phone number styled Bricolage 700 gold-on-dark /
navy-royal-on-light.

**10. `thank-you.html`** — full-viewport dark ambient scene with steam blobs,
centered glass panel: gold check/star mark, Bricolage headline, next-steps as
3 mini steps, `.btn-gold` back-to-inventory + `.btn-ghost` text-us. Hairlines
top and bottom.

**11. `admin/`** — utilitarian but on-brand: same tokens/fonts, white cards on
sand, navy table headers in mono style, gold primary actions. No steam, no
countdowns, no sheen sweeps here — keep it calm.

## 10. Image token protocol (do this on every page)

Every placeholder/hardcoded image becomes a named token pair, following the
existing convention (`HOME_HERO_IMAGE`, `VISIT_IMAGE_1` …):

- `src="{{PAGE_SECTION_PURPOSE_IMAGE}}"` and `alt="{{PAGE_SECTION_PURPOSE_IMAGE_ALT}}"`
  — e.g. `{{FINANCING_HERO_IMAGE}}`, `{{CONTACT_SHOWROOM_IMAGE}}`,
  `{{PRODUCT_GALLERY_IMAGE_1..4}}`, `{{THANKYOU_HERO_IMAGE}}`.
- Every `<img>` gets `onerror="this.remove()"` and sits in a wrapper with the
  gradient placeholder base (§4) so unfilled tokens still look clean.
- Add `loading="lazy" decoding="async"` except the LCP hero
  (`fetchpriority="high"` + `<link rel="preload">`).
- Maintain `/assets/image-tokens.md`: one row per token — page, section,
  purpose, recommended aspect ratio + min pixel size (e.g. hero 16:10
  1600×1000, product card 4:3 1200×900, detail gallery 1:1 1200×1200,
  category tile 4:5 1000×1250). Append every token you create so future
  client onboarding is a checklist.

## 11. QA gate before committing each page

- [ ] Zero diffs to tokens, copy, IDs, names, `data-*`, scripts (verify with a diff limited to class/style/svg/img attrs)
- [ ] Gold hairline sweep animating on every dark band edge that has one
- [ ] All primary CTAs: gradient + inner highlight + hover lift + sheen sweep
- [ ] Card hover lift + image zoom; badges pill-shaped mono
- [ ] Gold-on-white text uses #B98200; contrast passes AA
- [ ] Forms fit a 390×650 viewport, no internal scroll, consent visible
- [ ] Tap targets ≥44px; inputs 16px font
- [ ] prefers-reduced-motion kills all motion; no-JS shows all content
- [ ] `.text-center/.mx-auto/.max-w-md` defined in shared CSS
- [ ] New image tokens logged in `/assets/image-tokens.md`

Work one page per batch, run the QA gate, then report what shipped exactly as
you did for batch 1.

---

# PART 3 — FINISH DETAIL, SCREENSHOT-VERIFIED
(from VISUAL_PARITY_PUNCH_LIST — these are the details a rebuild loses first.
§A items are known open defects on the homepage; clear them first.)

## A. CRITICAL — visible bugs at :4173

**1. On-dark headings are invisible.** `{{PROMISE_HEADLINE}}`,
`{{FINANCING_HEADLINE}}`, and `{{FINAL_CTA_HEADLINE}}` render navy-on-navy.
The reference has global overrides your CSS is missing:
```css
.on-dark h2{color:#fff}
.on-dark .eyebrow{color:var(--gold-soft)}
```
Audit every `.on-dark` / `.section-night` / `.financing-band` / `.final-cta`
section for heading, body (`#C9D5EE`), and muted (`#8FA6D2`) text colors.

**2. How-it-works headline is clipped/overlapping the visit section** in the
capture. Likely a reveal-transform or margin collapse issue — verify section
top padding and that `.reveal` is on the section container, not the heading.

---

## B. HERO — flat vs. layered

**3. The hero is missing its texture stack.** Reference hero-bg is four
gradient layers **plus grain plus concentric rings**:
```css
.hero-bg{position:absolute;inset:0;z-index:1;background:
  linear-gradient(180deg,rgba(3,12,32,.94) 0%,rgba(6,24,61,.72) 48%,rgba(3,12,32,.42) 100%),
  radial-gradient(1000px 480px at 82% -6%,rgba(255,184,28,.14),transparent 62%),
  radial-gradient(900px 520px at 12% 30%,rgba(22,70,155,.65),transparent 62%),
  linear-gradient(160deg,rgba(6,24,61,.82) 0%,rgba(6,24,61,.7) 55%,rgba(3,12,32,.95) 100%)}
.hero-bg::before{content:"";position:absolute;inset:0;opacity:.05;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.hero-bg::after{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 18% 125%,rgba(255,255,255,.045) 0 2px,transparent 2px 96px);opacity:.7}
```
Also verify the two steam blobs (drift1/drift2 keyframes) exist and animate.

**4. Headline accent must be a gradient, not flat gold:**
```css
.deg{background:linear-gradient(94deg,#FFE29A 0%,#FFB81C 48%,#F0A400 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
```

**5. Offer chip** — red translucent glass with a pulsing dot:
```css
.offer-chip{display:flex;align-items:flex-start;gap:11px;background:rgba(215,38,30,.12);
  border:1px solid rgba(232,80,72,.45);border-radius:14px;padding:13px 15px;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.offer-chip .dot{width:9px;height:9px;border-radius:50%;background:#FF4A41;margin-top:6px;flex:none;animation:pulse 1.8s infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,74,65,.55)}55%{box-shadow:0 0 0 8px rgba(255,74,65,0)}}
```

**Lead card:** glass recipe (blur 26px gradient white), 3px gold hairline
inset 24px from the panel edges, and progress segments:
```css
.fdots i{height:4px;flex:1;border-radius:3px;background:rgba(11,37,89,.1);overflow:hidden;position:relative;transition:background .3s}
.fdots i.on{background:linear-gradient(90deg,var(--gold),var(--gold-deep))}
```

---

## C. MARQUEE, STATS, COUNTDOWNS

**Marquee:** offer tag = red gradient pill
(`linear-gradient(180deg,#E8382F,#B71E17)`, white, mono/bold uppercase, shadow
`0 6px 16px -6px rgba(215,38,30,.85)`). Countdown ticks are glowing gold boxes:
```css
.marquee .tick{background:rgba(255,255,255,.07);border:1px solid rgba(255,184,28,.35);
  border-radius:8px;padding:3px 9px;color:var(--gold-soft);font-weight:600;
  box-shadow:0 0 18px -6px rgba(255,184,28,.55)}
```

**Stats band:** numerals are gradient-gold with tabular figures, and stats are
separated by faded vertical dividers on desktop:
```css
.stat b{display:block;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:2rem;
  line-height:1.05;background:linear-gradient(180deg,#FFDB8A 8%,#FFB81C 60%,#EBA702 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px;
  font-variant-numeric:tabular-nums}   /* 2.5rem at desktop */
.stat span{font-family:'Spline Sans Mono',monospace;font-size:.6rem;font-weight:500;
  letter-spacing:.16em;text-transform:uppercase;color:#8FA6D2;line-height:1.5;display:block}
.stat + .stat{position:relative}
.stat + .stat::before{content:"";position:absolute;left:0;top:14%;bottom:14%;width:1px;
  background:linear-gradient(180deg,transparent,rgba(255,255,255,.14),transparent)}
```
Gold hairlines above and below the band.

**All countdown tiles** (offer side panel + final CTA) are glass, not flat:
```css
.count > div{flex:1;text-align:center;padding:15px 0 11px;border-radius:16px;
  background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03));
  border:1px solid rgba(255,184,28,.3);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 16px 32px -20px rgba(0,0,0,.85)}
```
Numbers: gold Bricolage; labels: mono uppercase muted.

---

## D. OFFER (FAIR) CARD

Red edge accent + gold-tint check bullets:
```css
.fair-card{position:relative;background:#fff;border:1px solid var(--line);border-radius:28px;
  box-shadow:0 30px 70px -30px rgba(6,24,61,.28);overflow:hidden}
.fair-card::before{content:"";position:absolute;top:0;bottom:0;left:0;width:5px;
  background:linear-gradient(180deg,#FF6A62,var(--red) 45%,#9E140E);z-index:2}
.fair-list li{padding-left:32px;position:relative;margin-bottom:11px;color:var(--ink-soft)}
.fair-list li::before{content:"✓";position:absolute;left:0;top:1px;width:21px;height:21px;
  border-radius:50%;background:linear-gradient(160deg,rgba(255,184,28,.28),rgba(232,164,0,.16));
  color:var(--gold-dark);font-weight:800;font-size:.72rem;
  display:flex;align-items:center;justify-content:center}
```
Desktop: card is a `grid-template-columns:1.2fr .8fr` split at ≥880px; the
right side is the dark navy countdown panel.

---

## E. PRODUCT CARDS (make sure D1-rendered cards get all of this)

- Badge: gold pill (`180deg,#FFD46A,#F5AD0E`, navy-night text, mono .6rem
  uppercase, radius 999px, gold shadow); sold variant `180deg,#2A3244,#141927`
  white text.
- Spec line: `font-family:'Spline Sans Mono';font-size:.68rem;color:var(--ink-soft)`.
- Price block: `.from` mono .62rem uppercase muted · `.num` Bricolage 800
  1.5rem navy-deep · strikethrough MSRP muted · `.mo{font-size:.84rem;font-weight:700;color:var(--gold-dark)}`.
- Hover: `translateY(-6px)`, border tint `rgba(232,164,0,.4)`, shadow
  `0 30px 56px -22px rgba(6,24,61,.34)`.
- Image well placeholder: `linear-gradient(155deg,#eef2f8,#e2e9f4)`.
- The "Inventory unavailable" empty state must be styled as a proper card
  (border, radius 20px, centered muted copy) — right now it reads unstyled.
- Floor pill with pulsing live dot:
```css
.floor{display:inline-flex;align-items:center;gap:9px;background:#EAF7EF;border:1px solid #C4E6D0;
  color:#12603A;border-radius:999px;padding:9px 15px;font-family:'Bricolage Grotesque',sans-serif;
  font-weight:600;font-size:.78rem}
.floor .live{width:8px;height:8px;border-radius:50%;background:#1EA653;animation:pulse-g 1.9s infinite;flex:none}
@keyframes pulse-g{0%,100%{box-shadow:0 0 0 0 rgba(30,166,83,.45)}55%{box-shadow:0 0 0 7px rgba(30,166,83,0)}}
```

---

## F. REVIEWS — missing the giant quote mark

Each card needs the oversized gold quotation glyph and hover lift:
```css
.rev{position:relative;background:#fff;border:1px solid var(--line);border-radius:20px;
  padding:26px 24px 24px;box-shadow:0 8px 22px -14px rgba(6,24,61,.12);
  display:flex;flex-direction:column;overflow:hidden;
  transition:transform .35s var(--ease-out),box-shadow .35s var(--ease-out)}
.rev:hover{transform:translateY(-4px);box-shadow:0 24px 46px -20px rgba(6,24,61,.26)}
.rev::before{content:"\201C";position:absolute;top:-24px;right:6px;
  font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:8rem;line-height:1;
  color:rgba(255,184,28,.12);pointer-events:none}
.rev .stars{color:var(--gold-deep);letter-spacing:3px;font-size:.92rem;
  text-shadow:0 1px 0 rgba(232,164,0,.2)}
```
Avatar: 40px circle, `linear-gradient(160deg,var(--navy-royal),var(--navy-deep))`, white initial.

---

## G. COMPARE TABLE — the template lost the desktop table treatment

The reference shows a real table at desktop: a header row with a **gold client
cell** and a **navy "everyone else" cell**, and every row aligned to those
columns. The template currently shows headerless stacked pairs at all widths.

Sanctioned markup addition — add this header row inside `.cmp`, before the rows:
```html
<div class="cmp-head" aria-hidden="true"><div></div><div>{{CLIENT_NAME}}</div><div>Everyone else</div></div>
```
CSS (verbatim from reference):
```css
.cmp{border-radius:20px;overflow:hidden;box-shadow:0 24px 56px -28px rgba(6,24,61,.3);border:1px solid var(--line)}
.cmp-head{display:none}
.cmp-row{background:#fff;padding:18px 18px 15px;border-bottom:1px solid rgba(11,37,89,.08)}
.cmp-row:nth-child(even){background:var(--sand)}
.cmp-row .q{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:.92rem;color:var(--navy-deep)}
.cmp-pair{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.cmp-cell{border-radius:11px;padding:11px 13px;font-size:.8rem;line-height:1.45}
.cmp-cell.us{background:linear-gradient(180deg,rgba(255,184,28,.18),rgba(255,184,28,.1));
  border:1px solid rgba(232,164,0,.42);color:#0E4A24;font-weight:700}
.cmp-cell.them{background:rgba(22,70,155,.045);border:1px solid rgba(11,37,89,.1);color:var(--ink-soft)}
@media(min-width:880px){
  .cmp-head{display:grid;grid-template-columns:1.1fr 1fr 1fr;background:#fff;
    border-bottom:1px solid rgba(11,37,89,.08)}
  .cmp-head div{padding:16px 20px;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;
    font-size:.8rem;letter-spacing:.07em;text-transform:uppercase}
  .cmp-head div:nth-child(2){background:linear-gradient(180deg,#FFD46A,#F5AD0E);color:var(--navy-night)}
  .cmp-head div:nth-child(3){background:linear-gradient(180deg,var(--navy-royal),var(--navy-deep));color:#fff}
  .cmp-row{display:grid;grid-template-columns:1.1fr 1fr 1fr;align-items:center;gap:9px}
  .cmp-row .q{margin-bottom:0}
}
```
The reference copy embedded ✓/✗ in the cell text; tokens won't include them,
so add them presentationally:
```css
.cmp-cell.us::before{content:"✓ ";font-weight:800}
.cmp-cell.them::before{content:"✗ ";font-weight:700;opacity:.7}
```

---

## H. NIGHT SECTIONS

- **Promise shield:** gold hex via clip-path with a real glow —
  `clip-path:polygon(50% 0,100% 12%,100% 68%,50% 100%,0 68%,0 12%)`,
  `background:linear-gradient(170deg,#FFD46A,var(--gold) 45%,var(--gold-deep))`,
  `filter:drop-shadow(0 22px 34px rgba(232,164,0,.35))`, navy-night text.
- **Pillars:** gold-ring circle checks —
  `content:"✓"; width/height:21px; border-radius:50%; background:rgba(255,184,28,.16);
  border:1px solid rgba(255,184,28,.4); color:var(--gold-soft)`; list text `#D6E1F6`;
  two columns at desktop.
- **Financing band background (exact):**
  `linear-gradient(160deg,var(--navy-royal) 0%,var(--navy-deep) 55%,var(--navy-night) 100%)`
  plus an overlay layer
  `radial-gradient(760px 420px at 50% -14%,rgba(255,184,28,.16),transparent 60%)`.
- **Final CTA kicker is a RED pill, not a gold eyebrow:** rounded-lg,
  `linear-gradient(180deg,#E8382F,#B71E17)`, white, mono .64rem, tracking .2em,
  uppercase, shadow `0 10px 24px -8px rgba(215,38,30,.7)`. Gold hairlines top
  and bottom of the section.

---

## I. STEPS, FAQ, GUIDE, FOOTER (verify — mostly present)

- Step cards: 3px gold gradient top bar
  (`.step::before{height:3px;background:linear-gradient(90deg,var(--gold-soft),var(--gold-deep))}`)
  and ghost gradient numerals
  (`.n{font-size:2.6rem;background:linear-gradient(180deg,rgba(255,184,28,.5),rgba(232,164,0,.18));background-clip:text;color:transparent}`),
  hover lift -4px.
- FAQ toggles: 26px gold-ring circle with a gold `+` SVG that rotates 45° to ×
  when `.open`. Verify the rotation transition (.3s ease-out).
- Guide inputs: 54px min-height, radius 13px, focus ring
  `0 0 0 4px rgba(22,70,155,.12)`.
- Footer service-area chips: outlined pills
  (`border:1px solid rgba(255,255,255,.18); radius:999px; padding:8px 14px`),
  hover → gold border/text.

---

## J. Global sanity

- `::selection{background:var(--gold);color:var(--navy-night)}`; `:focus-visible` 3px gold outline.
- `.text-center{text-align:center}` `.mx-auto{margin-inline:auto}` `.max-w-md{max-width:28rem}` must exist.
- `prefers-reduced-motion:reduce` kills all animation; reveal fully visible.
- Every `.btn-gold` has: gradient + inset top highlight + hover lift + `::after` sheen sweep.

## Acceptance

Screenshot the template at 1440px and 390px and compare side-by-side with the
reference capture, section by section. Done means: no invisible headings, hero
has visible grain/rings/glow, review quote marks present, compare table has the
gold/navy header at desktop, countdown tiles are glass with gold borders, the
final CTA kicker is red, and stat numerals are gradient gold with dividers.
Report each item as fixed/verified.

---

# PART 4 — MOTION CANON
(from MOTION_SPEC — durations, easings, delays, and thresholds are the design)

Global easing token used everywhere: `--ease-out: cubic-bezier(.22,.68,0,1)`.

## 1. Scroll reveal (sections)

```css
.reveal{opacity:0;transform:translateY(24px);transition:opacity .75s ease,transform .75s var(--ease-out)}
.reveal.in{opacity:1;transform:none}
```
```js
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
}
```
Rules: `.reveal` goes on **section-level containers only** — never on cards,
rails, or anything JS toggles/filters/injects. Adding `.reveal` to the stats
grid container is correct. Always unobserve after first fire.

## 2. Stat count-up

Reference implementation (1400ms, cubic ease-out, fires once at 40% visible,
reduced-motion jumps straight to the final value):
```js
(function(){
  const wrap = document.querySelector('.stats-grid'); // reference used .stats-in
  if(!wrap) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = ()=>{
    wrap.querySelectorAll('.stat b').forEach(el=>{
      // Template stats are hydrated tokens with no data attrs — parse the text:
      // prefix (e.g. "$"), numeric core (commas/decimals), suffix (e.g. "+", "★").
      const m = el.textContent.trim().match(/^([^0-9]*)([\d,]*\.?\d+)(.*)$/);
      if(!m) return;                       // no digits -> leave as-is
      const prefix = m[1], suffix = m[3];
      const hasComma = m[2].includes(',');
      const dec = (m[2].split('.')[1]||'').length;
      const target = parseFloat(m[2].replace(/,/g,''));
      const fmt = v=>{
        let out = dec ? v.toFixed(dec) : Math.round(v).toString();
        if(hasComma) out = Number(out).toLocaleString('en-US');
        el.textContent = prefix + out + suffix;
      };
      if(reduce || !('requestAnimationFrame' in window)){ fmt(target); return; }
      const dur = 1400, t0 = performance.now();
      const step = now=>{
        const p = Math.min(1,(now-t0)/dur), e = 1-Math.pow(1-p,3);
        fmt(target*e);
        if(p<1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };
  if('IntersectionObserver' in window){
    const io2 = new IntersectionObserver(([en])=>{ if(en.isIntersecting){ run(); io2.disconnect(); } }, {threshold:.4});
    io2.observe(wrap);
  } else { run(); }
})();
```
Also required so digits don't jitter while counting:
`.stat b{font-variant-numeric:tabular-nums}` (already in the punch list).

## 3. Hero entrance stagger

Children of the hero copy column cascade in on load:
```css
.hero-seq > *{animation:heroIn .8s var(--ease-out) backwards}
.hero-seq > *:nth-child(1){animation-delay:.05s}
.hero-seq > *:nth-child(2){animation-delay:.14s}
.hero-seq > *:nth-child(3){animation-delay:.23s}
.hero-seq > *:nth-child(4){animation-delay:.32s}
.hero-seq > *:nth-child(5){animation-delay:.41s}
@keyframes heroIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
```

## 4. Countdowns (marquee + offer band + final CTA)

One shared deadline (template: `body[data-offer-ends]`), one 1-second interval,
all clocks synced, zero-padded, clamped at 0. Seconds only on the final CTA:
```js
const end = new Date(document.body.dataset.offerEnds).getTime();
function tick(){
  const t = Math.max(0, end - Date.now());
  const d = Math.floor(t/864e5), h = Math.floor(t%864e5/36e5),
        m = Math.floor(t%36e5/6e4), s = Math.floor(t%6e4/1e3);
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v).padStart(2,'0')};
  set('mD',d);set('mH',h);set('mM',m);
  set('fD',d);set('fH',h);set('fM',m);
  set('cD',d);set('cH',h);set('cM',m);set('cS',s);
}
tick(); setInterval(tick,1000);
```

## 5. Ambient loops (CSS only)

Already in the punch list but part of the motion system — verify all four run:
- Gold hairline sweep: `sweep 5.5s ease-in-out infinite` (38%-wide light band).
- Steam blobs: `drift1 16s` / `drift2 20s` ease-in-out infinite.
- Offer-chip red dot: `pulse 1.8s infinite`
  (`0%,100%{box-shadow:0 0 0 0 rgba(255,74,65,.55)}55%{box-shadow:0 0 0 8px rgba(255,74,65,0)}`).
- Floor-pill green dot: `pulse-g 1.9s infinite`
  (`0%,100%{box-shadow:0 0 0 0 rgba(30,166,83,.45)}55%{box-shadow:0 0 0 7px rgba(30,166,83,0)}`).

## 6. Buttons & hovers (transitions)

- `.btn` transition: `transform .3s var(--ease-out), box-shadow .3s var(--ease-out)`;
  hover `translateY(-2px)`, active `translateY(0) scale(.98)`.
- Gold sheen sweep: `::after` gradient band, `transform:translateX(-130%)` →
  `translateX(130%)` on hover, `transition:transform .65s ease`.
- Cards (`.pcard`/`.rev`/`.step`/`.int`/`.vcard`): hover lift -4px (pcard -6px),
  shadow deepens, border tints gold `rgba(232,164,0,.4)`; transitions
  `.35–.4s var(--ease-out)`. Card images zoom `scale(1.045)` over
  `.7s var(--ease-out)`.
- Nav links: gold underline `transform:scaleX(0)→scaleX(1)`,
  `transition:transform .3s var(--ease-out)`, transform-origin left.
- Intent icon chips: hover `transform:scale(1.08) rotate(-4deg)`, `.35s`.

## 7. Multi-step lead form

```css
.fstep{display:none}
.fstep.on{display:block;animation:fin .35s var(--ease-out)}
@keyframes fin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.form-err{display:none;color:var(--red);font-size:.84rem;font-weight:600;margin:-4px 0 10px}
.form-err.on{display:block}
.fdots i{height:4px;flex:1;border-radius:3px;background:rgba(11,37,89,.1);transition:background .3s}
.fdots i.on{background:linear-gradient(90deg,var(--gold),var(--gold-deep))}
.lead-success{display:none;text-align:center;padding:24px 4px}
.lead-success.on{display:block;animation:fin .4s var(--ease-out)}
```
Behavior: advancing steps toggles `.on` on the matching `.fstep` and fills the
progress segments cumulatively (`d1..d3`). Chips: click sets `.sel` on one chip
(`.chip.sel` = navy gradient, white, shadow), clears errors. `visitType`
change shows/hides `#dateWrap` (hidden when value is the "text me" option).
On successful submit, the form + header + dots hide and `#leadDone` fades in.

## 8. Drawer (mobile menu)

```css
.drawer{transform:translateX(102%);transition:transform .38s var(--ease-out)}
.drawer.open{transform:none}
.drawer nav a{transition:padding-left .25s var(--ease-out),color .25s}
.drawer nav a:hover{padding-left:8px;color:var(--gold-soft)}
```
JS: toggling sets `aria-hidden` on the drawer, `aria-expanded` on the burger,
and locks body scroll (`document.body.style.overflow='hidden'`) while open;
any drawer link click closes it.

## 9. Mobile quick bar

Slides away while the lead form is on screen (no double CTA / covered submit):
```css
.mbar{transform:translateY(0);transition:transform .3s var(--ease-out)}
.mbar.hide{transform:translateY(110%)}
```
```js
const mbar=document.getElementById('mbar'), lead=document.getElementById('lead');
if (mbar && lead && 'IntersectionObserver' in window) {
  new IntersectionObserver(([en])=>mbar.classList.toggle('hide', en.isIntersecting), {threshold:.15}).observe(lead);
}
```

## 10. Rails (mobile carousels) + dots

```css
.rail{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch;padding:6px 20px 18px;margin:26px -20px 0;scrollbar-width:none}
.rail::-webkit-scrollbar{display:none}
.rail > *{flex:0 0 82%;scroll-snap-align:center}
.rail-dots i{width:7px;height:7px;border-radius:50%;background:rgba(11,37,89,.14);transition:background .2s,transform .2s}
.rail-dots i.on{background:var(--gold-deep);transform:scale(1.3)}
```
```js
document.querySelectorAll('.rail-dots').forEach(nav=>{
  const rail = document.getElementById(nav.dataset.for);
  if(!rail || !rail.children.length) return;
  nav.innerHTML = [...rail.children].map((_,i)=>`<i class="${i===0?'on':''}"></i>`).join('');
  const dots = [...nav.children];
  rail.addEventListener('scroll', ()=>{
    const w = rail.firstElementChild.getBoundingClientRect().width + 14;
    const i = Math.min(dots.length-1, Math.round(rail.scrollLeft / w));
    dots.forEach((d,x)=>d.classList.toggle('on', x===i));
  }, {passive:true});
});
```
**Template-specific:** `#prodRail` children are injected from D1/the API —
(re)generate its dots **after** inventory render, not on DOMContentLoaded.

## 11. FAQ accordion

```css
.faq .ans{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s var(--ease-out)}
.faq.open .ans{grid-template-rows:1fr}
.faq .ans > div{overflow:hidden}
.faq button::after{ /* gold +/× circle */ transition:transform .3s var(--ease-out) }
.faq.open button::after{transform:translateY(-50%) rotate(45deg)}
```
JS: one open at a time — clicking a question closes all (`.open` removed,
`aria-expanded="false"`), then opens the clicked one if it wasn't already open.

## 12. Reduced motion (mandatory)

```css
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation:none!important;transition:none!important}
  .reveal{opacity:1;transform:none}
}
```
Plus the count-up's explicit `reduce` check (jump to final value) — both layers.

## Acceptance

Reload at :4173 and verify: hero copy cascades in staggered; stats fade up and
count from 0 with tabular digits on first scroll; all three countdowns tick in
sync every second; marquee hairline light sweeps; steam drifts; red and green
dots pulse; chips/steps/FAQ/drawer/mbar/rails all animate per above; and with
OS reduced-motion enabled, the page is fully static with final values shown.

---

# PART 5 — PAGE RECIPES (how any page maps to the system)

Every page in the template resolves to one of six recipes. Future pages pick
the nearest recipe; if nothing fits, use D.

| Page | Recipe |
|---|---|
| `index.html` | A — Conversion landing |
| `hot-tubs/`, `swim-spas/`, `saunas/` | A (category variant) |
| `inventory.html`, `active-inventory/index.html` | B — Gated listing |
| `active-inventory/SLUG/index.html` | C — Product detail |
| `financing.html`, `contact.html` | D — Info/utility |
| `thank-you.html` | E — Terminal |
| `admin/` | F — Back office |

**A — Conversion landing.** Dark layered hero: full `hero-bg` gradient stack +
grain + rings (Part 3 §B) + two steam blobs + entrance stagger (Part 4 §3).
Glass lead card with gold top hairline and progress segments. Marquee +
synced countdowns when offer-driven. Stats band with gradient-gold count-up
numerals and dividers. Body rhythm: white/sand alternation with 1–2 night
bands, every dark band edge hairlined. Reveal on every section wrap. Mobile
quick bar with hide-over-lead-form behavior. Full motion set.

**B — Gated listing.** White desktop shell / sand mobile. Sticky filter
sidebar `top:92px`; horizontal cards ≥901px (square image left ~42%, pills
bottom-anchored over a hairline), vertical below. Gate = glass modal over
ambient navy with the no-scroll compaction ladder (Part 2 §7). Filter card
white with mono gold group headings; navy toggle button; gold slider accent.
Reveal on sections only — never cards (filter JS owns their display). No steam.

**C — Product detail.** Optional slim dark strip up top. Gallery wells with
gradient placeholder base. Desktop: sticky glass price/CTA card (gold top
hairline, gradient-gold monthly, `.btn-gold` CTA). Spec grid = stroke icon +
mono label pattern. Related-products rail reuses `.pcard` + rail dots
(generate dots after data render). GHL modal styled per Part 2.

**D — Info/utility.** White/sand rhythm, at most one night band (financing's
$-hook band uses the exact royal→night gradient in Part 3 §H). Numbered
`01/02/03` ghost-numeral steps. Forms in glass cards. Maps in rounded 16px
frames. Disclaimers `.7rem` muted, centered.

**E — Terminal (thank-you).** Full-viewport night scene: hero-bg stack +
steam, hairlines top/bottom, one centered glass panel (gold mark, Bricolage
headline, 3 mini next-steps, `.btn-gold` + `.btn-ghost`). No marquee, no mbar.

**F — Back office (admin).** Tokens + fonts only. White cards on sand, mono
navy table headers, gold primary buttons, standard focus states. **No** steam,
sweeps, countdowns, reveals, or sheen — calm and instant.

Global chrome on A–E: the shared header/nav treatment (white glass, gold
underlines), the navy gradient footer with mono gold column headings and
outlined service-area chips, gold selection/focus.

---

# PART 6 — SITE-WIDE AUDIT LOOP (run on EVERY page, including shipped ones)

Work order:
1. **Clear the known homepage defects** (Part 3 §A) and apply Parts 3–4 to
   `index.html`.
2. **Re-audit already-shipped pages** — `hot-tubs/`, `swim-spas/`, `saunas/`,
   `inventory.html` — against this spec. They shipped before it existed;
   assume they're missing finish details until proven otherwise.
3. Proceed through remaining pages one per batch, recipe-first.

Per-page pipeline (all four gates must pass before "shipped"):

**Gate 1 — Diff guard.** `git diff` the page: zero changes outside class/style
attributes, `<style>`/CSS files, SVG icon markup, and the two sanctioned
exceptions. Any token/copy/ID/name/data-*/script change = fail.

**Gate 2 — Checklist.** All of: on-dark headings white, eyebrows gold-soft on
dark; gold hairline sweep animating on every dark band edge; every `.btn-gold`
has gradient + inset highlight + hover lift + sheen sweep; card hover lift +
image zoom; badges pill mono; gold-on-white text is #B98200 and passes AA;
countdown tiles glass with gold borders; stats numerals gradient-gold,
tabular, divided; review quote marks present where reviews exist; compare
header row present ≥880px where the compare block exists; forms fit 390×650
with no internal scroll and visible consent; tap targets ≥44px; inputs 16px;
`.text-center/.mx-auto/.max-w-md` defined; new image tokens logged in
`/assets/image-tokens.md`; single shared token layer (no per-page `:root`
forks).

**Gate 3 — Motion.** The Part 4 acceptance run: reveals, count-up, synced
ticks, ambient loops, form/drawer/mbar/rail/FAQ transitions — then repeat with
OS reduced-motion on: page fully static, final values shown, nothing hidden.

**Gate 4 — Screenshots.** Capture 1440px and 390px, compare side-by-side with
the reference captures (homepage + inventory), section by section. Report a
pass/fail table per page.

**Definition of done for the site:** every page in the Part 5 table passes all
four gates; `/assets/image-tokens.md` covers every image token with page,
purpose, and recommended dimensions; brand guard green; one token layer; zero
undefined utility classes anywhere in markup.
