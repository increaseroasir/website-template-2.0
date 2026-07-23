# Handoff: Premium redesign

## Paths
- Work here: `/Users/alexlobaito/website-template-premium-redesign`
- Leave alone: `/Users/alexlobaito/website-template-2.0`
- Repo: https://github.com/ssaofficial/website-template-2.0 (`premium-redesign` branch)

## Done
Premium homepage + inventory (see `PROJECT.md`).

## Critical mobile UX (Alex feedback from screenshots)
1. **Overflow:** Headlines/kickers with long `{{TOKENS}}` were clipping off the right edge. Fix with page `overflow-x: clip`, headline `overflow-wrap: anywhere` / `word-break: break-word`, `max-width: 100%`, never `white-space: nowrap` on hero titles.
2. **Bottom sticky (`cat-mbar` / `.mbar`):** Must start hidden; show only after scrolling past hero CTA (IntersectionObserver). Homepage already hides mbar over `#lead` — category pages need the inverse: hide until hero CTAs leave the viewport.
3. **Nav sticky button:** When bottom bar is visible, change mobile nav CTA from Call → **Get Directions** (`{{CLIENT_MAP_URL}}`). Avoid duplicate Call CTAs.

## Design system
Reuse `assets/home.css` + `assets/inventory.css` tokens (navy/gold, Bricolage / Instrument / Spline).

## Wiring
`client.config.js`, `tracking.js`, traffic-attribution, view-content, call-tracking, pricing-tracking, lead-form → `/api/lead`. D1 via `data-inventory-source`.

## Guard
`npm run brand:guard` — no Paradise/Minot/phone hardcodes.
