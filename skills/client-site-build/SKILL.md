---
name: client-site-build
description: >
  Build and launch a hot-tub dealer client website from the premium template:
  intake sheet or messy brief, rush 1–2 day profile, hydrate dist, wire tracking
  (incl. Meta CAPI offline), gate, and handoff. Use when asked to build a site
  for a dealer, fulfill a client website, or "build the site for X, here's their
  info, it's urgent". Prefer manus-skills/ composable pack when installed in Manus;
  this folder is the single-zip supervised pack (Modules A–E).
compatibility: Node.js 18+. Run from the website-template repo root.
metadata:
  author: Start Scale Automate
  version: "3.0"
  manus: single-zip-pack
---

# Client Site Build (single-zip pack)

Supervised fulfillment in one skill folder. For Manus progressive disclosure,
install `manus-skills/*` instead — behavior matches.

## Laws

1. Hydrate, never rebuild (config/tokens/images only).  
2. Record template version in `WIRING.md`.  
3. Palette is the product (navy + gold).  
4. Fail loudly — gate FAIL or unchecked REQUIRED intake blocks launch.  
5. **Rush reduces scope, never skips validate, gate, or post-launch test lead.**
6. **The fetched commit is the only skill source.** Read these skills out of the
   certified SHA you fetched — never an uploaded zip, a local workspace copy, or
   memory of a previous build. Process fixes ship as commits just like code
   fixes, and a stale pack silently reintroduces a solved failure. If a document
   references a section your copy lacks, your pack is stale — re-fetch.

## Scripts

```bash
node skills/client-site-build/scripts/new-client.mjs --init <name>
node skills/client-site-build/scripts/map-intake.mjs --sheet export.csv --client <name> --write-wiring
node skills/client-site-build/scripts/map-intake.mjs --brief notes.txt --client <name> --write-wiring
node skills/client-site-build/scripts/new-client.mjs --validate <name> [--profile rush]
node skills/client-site-build/scripts/check-assets.mjs --dir clients/<name>/uploads
node skills/client-site-build/scripts/gate.mjs --env staging|prod --dist clients/<name>/dist
node skills/client-site-build/scripts/indexnow.mjs --init|--submit <domain> --dist clients/<name>/dist
```

Hydrate: copy template → `clients/<name>/dist/`, run `scripts/build-config.mjs` inside dist only (see manus-skills hydrate SKILL for rsync excludes).

Run `npm run check:tokens clients/<name>/tokens.env` first and treat a non-zero
exit as a blocker. That file is sourced by bash, so an unquoted value containing
a space or `&` exports nothing; since tokens carry `|default` in the markup, the
page renders the default and every gate still passes (WTV-061). The same command
also fails when any hard-required token is missing (no `|default`, not
IF-guarded, not supplied by `client.config.js`) — those would ship as literal
`{{TOKEN}}` (WTV-062).

Client inputs may be committed under `clients/<name>/` (`tokens.env`,
`client.config.js`, `redirects.extra`) so one checkout SHA is enough to hydrate.
Cloudflare runtime secrets stay in Pages env only — never in git.

`_redirects` is copied verbatim and never token-hydrated, so client rules live in
`clients/<name>/redirects.extra` and are appended to `dist/_redirects` after the
copy. That covers legacy 301s from the site being replaced and any nav slot
repointed away from its default page, which otherwise leaves the original URL
built but unlinked (TVD-052). Hand-editing `dist/_redirects` loses the rules on
the next hydrate.

## Load on demand

| File | When |
|---|---|
| `references/intake-sheet-mapping.md` | Sheet or brief arrives |
| `references/token-reference.md` / `content-rules.md` / `images.md` | Writing tokens/copy/photos |
| `references/promo-labels.md` | Filling product `promo_label` / pricing fields |
| `references/wiring.md` | Live-verify IDs 1–13 |
| `references/decision-table.md` | Ambiguous situation |
| `references/launch-checklist.md` | Pre/post launch humans |
| `assets/CLIENT_INTAKE_SHEET.csv` | Blank sheet for owner |
| `assets/hostile.config.js` | Stress rehearsal |

## 10-step workflow

1. `--init <name>`  
2. Sheet **or** brief → map-intake / fill config+tokens (REQUIRED blanks → stop)  
3. Photos per `images.md` + upload checklist; `check-assets`  
4. `--validate` or `--validate --profile rush` → PASS + 48h list  
5. **CP1** (rush = one message: config + defaults + photos + 48h)  
6. Hydrate `dist/` — FIRST `git fetch` + confirm template HEAD = remote HEAD
   (or the exact SHA in the work order; mismatch = STOP, never build stale);
   after hydrate confirm `dist/functions/api/` exists  
7. `gate --env staging` then wiring live-verify  
8. **CP2** (rush = gate table + screenshots)  
9. Prod gate → DNS; IndexNow/GSC per checklist; deploy = `wrangler pages
   deploy` from the dist root; smoke-curl `/api/inventory` (JSON, not HTML)
   + `/api/lead` (not 503) and paste output in the report  
   DNS follows `dealer-site-launch/references/dns-cutover.md` — a two-day
   procedure, since the TTL drop precedes the record change by 24h. `www` is
   canonical unless Cloudflare owns the zone, and the client's `MX` records are
   never touched.  
10. Post-launch cellular test lead + day-7 crawl log  

## Gotchas

- NO captcha anywhere (TVD-025): Turnstile is fully removed — widgets, api.js,
  sitekey token, secret, server verification. Never set `TURNSTILE_*` on a
  Pages project (delete on legacy ones). Spam control = honeypot + 24h dedupe.  
- Offline Meta needs 6 GHL fields + stage webhook; CAPI token only in Cloudflare secrets.  
- Missing hero blocks even in rush; non-hero photos → gradient wells + 48h list.  
- `/api/*` answering with HTML = `functions/` missing from the deploy —
  gate.mjs FAILs an artifact without `dist/functions/api/`.  
- Product slug URLs / unknown paths serving the homepage = `_redirects` +
  `404.html` missing — deploy the gated dist byte-exact; smoke
  `/hot-tubs.html` → 301 and a nonsense path → 404.  
- Reports claiming done without evidence (template SHA, gate JSON, smoke
  curls) get sent back — paste the proof.
