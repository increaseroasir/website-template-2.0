---
name: dealer-site-intake
description: >
  Collect dealer intake from a CLIENT_INTAKE_SHEET (CSV/Google Sheet), a messy
  text/JSON brief, or guided questions; scaffold clients/<name>/; validate
  client.config.js and tokens.env; rush profile for 1–2 day launches. Use when
  starting a new client site, filling branding/copy/phones/tracking IDs, or
  when the user says build is urgent / rush. Part of the dealer-site Manus set.
compatibility: Node.js 18+. Run scripts from the website template repo root.
metadata:
  author: Start Scale Automate
  version: "2.2"
---

# Dealer Site Intake

Scaffold and validate the client plan. **Config is the plan; `--validate` checks the plan.** Never skip validation.

## From intake sheet (preferred)

1. Owner provides filled **CLIENT_INTAKE_SHEET** (CSV export or readable Google Sheet) — 6 sections, tiers `REQUIRED` / `48h` / `nice`.  
2. Load **`references/intake-sheet-mapping.md`** — row→config/token table keyed on **What we need**.  
3. `map-intake.mjs --sheet <export.csv> --client <name> --write-wiring`  
4. Any **REQUIRED** blank → stop at Checkpoint 1 listing exactly those rows.  
5. **48h** blanks → build proceeds; rows land in `WIRING.md` **48-HOUR FIX LIST** (Client/HTL + checkboxes).

Canonical blank sheet: `templates/CLIENT_INTAKE_SHEET.csv`.

## From plain text / JSON brief (no sheet)

Same tiering. Normalize into `intake.json` or run
`map-intake.mjs --brief <file> --client <name> --write-wiring`.
First clients often arrive messy — extract facts; never invent NAP or IDs.

## Scripts (run from repo root)

```bash
node manus-skills/dealer-site-intake/scripts/new-client.mjs --init <name>
node manus-skills/dealer-site-intake/scripts/map-intake.mjs --sheet export.csv --client <name> --write-wiring
node manus-skills/dealer-site-intake/scripts/new-client.mjs --validate <name>
node manus-skills/dealer-site-intake/scripts/new-client.mjs --validate <name> --profile rush
node manus-skills/dealer-site-intake/scripts/check-assets.mjs --dir clients/<name>/uploads
```

`--validate` exits `0` PASS / `1` FAIL. REQUIRED empties **hard-fail** (incl. hero, domain, financing, offer, GA4, Pixel, lead endpoint). `--profile rush` keeps that hard set; routes everything else onto `fixList48h[]` + WIRING.md.

## Rush build (1–2 day target)

See orchestrator SKILL for compressed checkpoints. Law: **rush reduces scope, never skips a gate, a validation, or the post-launch test lead.**

## Before writing copy or tokens

Load on demand (Level 3):

1. `references/intake-sheet-mapping.md` — sheet/brief path + mapping table  
2. `references/content-rules.md` — length ceilings + honesty rules  
3. `references/token-reference.md` — token dictionary  
4. `references/images.md` — dims, `_ALT` pairs, LCP  
5. `references/promo-labels.md` — promo-label pick-list + no-price card behavior  
6. `templates/CLIENT_UPLOAD_CHECKLIST.md` — photo labels for the dealer  

Templates used by `--init` live in `templates/`.

## Workflow

```
- [ ] --init <name> (never overwrite without --force)
- [ ] Sheet or brief → map-intake / fill config + tokens
- [ ] Write copy only after content-rules.md
- [ ] Place images per images.md; run check-assets.mjs
- [ ] --validate <name> [--profile rush] → PASS + review defaults[] + 48h list
- [ ] HUMAN CHECKPOINT 1 before hydrate
```

## Gotchas

- Quote every `tokens.env` value (spaces/apostrophes).  
- `|` inside a token **value** breaks `{{TOKEN|default}}` parsing.  
- No captcha anywhere (TVD-025): the template ships without Turnstile — never add a security checker to a client form.  
- Empty booking calendar ID = `/book/` request-mode (OK, warn / 48h).  
- Missing hero still blocks in rush.
