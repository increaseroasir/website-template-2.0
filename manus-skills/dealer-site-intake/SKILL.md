---
name: dealer-site-intake
description: >
  Collect dealer intake, scaffold clients/<name>/, validate client.config.js
  and tokens.env, and check uploaded images. Use when starting a new client
  site, filling branding/copy/phones/tracking IDs, or validating config before
  build. Part of the dealer-site Manus skill set.
compatibility: Node.js 18+. Run scripts from the website template repo root.
metadata:
  author: Start Scale Automate
  version: "2.0"
---

# Dealer Site Intake

Scaffold and validate the client plan. **Config is the plan; `--validate` checks the plan.** Never skip validation.

## Scripts (run from repo root)

```bash
node manus-skills/dealer-site-intake/scripts/new-client.mjs --init <name>
node manus-skills/dealer-site-intake/scripts/new-client.mjs --validate <name>
node manus-skills/dealer-site-intake/scripts/check-assets.mjs --dir clients/<name>/uploads
```

`--validate` exits `0` PASS / `1` FAIL. Critical empties (name, phones, address/hours/market, GA4, Meta Pixel, Turnstile, lead endpoint) **hard-fail**. Cosmetic empties (logo, offer date, Clarity, GSC, GHL external tracking, booking calendar) **warn** only.

## Before writing copy or tokens

Load on demand (Level 3):

1. `references/content-rules.md` — length ceilings + honesty rules  
2. `references/token-reference.md` — token dictionary  
3. `references/images.md` — dims, `_ALT` pairs, LCP  
4. `templates/CLIENT_UPLOAD_CHECKLIST.md` — what to collect from the dealer  

Templates used by `--init` live in `templates/` (`intake.template.json`, `client.config.template.js`, `tokens.env.template`, `WIRING.template.md`).

## Workflow

```
- [ ] --init <name> (never overwrite without --force)
- [ ] Fill intake from brief / guided questions
- [ ] Write copy only after content-rules.md
- [ ] Place images per images.md; run check-assets.mjs
- [ ] --validate <name> → PASS + review defaults[]
- [ ] HUMAN CHECKPOINT 1 before hydrate
```

## Gotchas

- Quote every `tokens.env` value (spaces/apostrophes).  
- `|` inside a token **value** breaks `{{TOKEN|default}}` parsing.  
- Empty Turnstile = silent lead loss — treat as critical.  
- Empty booking calendar ID = `/book/` request-mode (OK, warn only).
