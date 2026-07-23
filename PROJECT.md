# Premium Template Redesign Project

**Open this folder in Cursor — not `website-template-2.0`.**

| | |
|---|---|
| **This project (safe copy)** | `/Users/alexlobaito/website-template-premium-redesign` |
| **Do not edit** | `/Users/alexlobaito/website-template-2.0` |
| **Upstream** | https://github.com/ssaofficial/website-template-2.0 |
| **Branch** | `premium-redesign` |

No GitHub fork required for Cursor agents — just open this folder. Fork only if you need a separate remote for another person/machine.

**Design/motion source of truth: `SITE_MASTER_SPEC.md` (repo root).** Read the
relevant Parts before every batch and run its Part 6 audit gates before
reporting a page shipped. It supersedes the earlier handoff docs.

---

## Mobile UX rules (required on every premium page)

### 1. No text falling off screen
Unresolved `{{PLACEHOLDERS}}` and real headlines must wrap on ~390px mobile. Never clip horizontally.

### 2. Bottom sticky bar only after hero CTA
`Call` / `Text` / `See Models` starts **hidden**. Show only after the user scrolls past the above-the-fold primary CTA group.

### 3. Nav CTA swaps when bottom bar shows
- Top of page: nav can say **Call Us 24/7**
- After scroll (bottom bar visible): nav becomes **Get Directions**
- Never two Call buttons on screen at once

---

## Already done
- `index.html` + `assets/home.css` / `home.js`
- `inventory.html` + `assets/inventory.css` / `inventory-page.js`
- `hot-tubs/` · `swim-spas/` · `saunas/` + `assets/category.css` / `category.js`
  - Overflow-safe text, sticky bar after hero scroll, nav Call → Get Directions
- Pages 6–11 (styling-only premium pass, batches 2–4):
  `active-inventory/`, `active-inventory/SLUG/`, `financing.html`, `contact.html`,
  `thank-you.html`, `admin/` + shared `assets/theme.css` (token layer) /
  `assets/premium-pages.css` (shell reskin). Image tokens logged in `assets/image-tokens.md`.
- Supporting: `lead-form.js` (unlock), `template.js` (inv cards), `ghl-modal.js`, `client.config.js`

## Still to do
All template pages redesigned. Remaining work is polish/QA on request.

Notes for future edits:
- `assets/theme.css` is the single premium token layer for pages 6–11 — do not fork tokens per page.
- Pages 6–11 keep their original markup/IDs/`data-*`/scripts; only fonts link, CSS links,
  class/style/img attrs were changed.

---

## Guard
```bash
npm run brand:guard
```

Forbidden hardcodes: Paradise Spas, paradisespas.com, Minot, fair names, 701-838-2614, Hot Tub Launch recruitment copy.
