# Website Template 2.0 — Known Issues Log

**This file, at the root of `increaseroasir/website-template-2.0` (`premium-redesign`), is the single source of truth for template-level bugs.** It consolidates the former fulfillment-workspace ledger (WTV-001–025) and the command-center ledger (2026-07-28 entries, renumbered WTV-026–028). Copies elsewhere are read-only mirrors.

This file is the permanent record of bugs found and fixed across all client builds. Every entry was paid for once. It must never be paid for again.

**Write-back rule:** After any session where a bug was found and fixed, append a new entry before closing. Include the date, what broke, what fixed it, and which client it was found on. Commit it to this repo.

**Read rule:** At the start of every client build session, read this file and apply every fix before touching any code.

---

## Entry Format

```
### [WTV-NNN] Short title
- **Date:** YYYY-MM-DD
- **Client:** which client it was first found on (or "template" if found during template work)
- **Symptom:** what broke or behaved unexpectedly
- **Root cause:** why it happened
- **Fix:** exactly what was changed to resolve it
- **Status:** FIXED | WORKAROUND | OPEN
```

---

## Entries

### [WTV-001] Client scaffold wrote outside the canonical template directory
- **Date:** 2026-07-25
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** `new-client.mjs` created `clients/<slug>/` at the repository root and `map-intake.mjs --write-wiring` wrote its output there, instead of in the Website Template v2 client workspace.
- **Root cause:** Both scripts resolved the top-level project root but treated its `clients/` directory as the template client directory; this conflicts with the canonical `templates/website-template-v2/clients/<slug>/` layout.
- **Fix:** Updated both scripts to resolve, write, and report the template-relative client directory; moved the Sun Pool & Spa scaffold to that canonical location and reran intake mapping.
- **Status:** FIXED


### [WTV-002] ClickUp ledger tables can render as `undefined` through the connector
- **Date:** 2026-07-25
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** A Markdown-table ledger comment created through the ClickUp connector rendered its table content as `undefined`, making the initial comment unusable as audit evidence.
- **Root cause:** The connected ClickUp comment renderer does not reliably preserve Markdown table syntax in task comments.
- **Fix:** Post a compact plain-text ledger comment with labeled lines, then re-read the live comment and quote its timestamped first lines. Use native checklist controls only when they are actually available; do not represent Markdown checkboxes as native checklists.
- **Status:** WORKAROUND


### [WTV-003] Documented Meta offline-stage endpoint was absent from the Pages Functions bundle
- **Date:** 2026-07-25
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** WIRING.md and launch materials required a GHL Opportunity Stage webhook to `POST /api/meta-offline`, but no `functions/api/meta-offline.js` route or GHL configuration guide existed. Activating the workflow would have posted to a nonexistent endpoint.
- **Root cause:** Browser-lead CAPI handling was implemented in `functions/api/lead.js` and `functions/lib/meta-capi.js`, while the distinct offline-stage route and its deployment contract were documented but never added to the template.
- **Fix:** Added an authenticated Pages Function with location validation, a whitelisted stage-to-event mapping, seven-day timestamp validation, hashed customer identifiers, safe unknown-stage skipping, and a secret-free Cloudflare/GHL setup guide. The CAPI token remains Cloudflare-only.
- **Status:** FIXED


### [WTV-004] Hydration sourced token files as shell code
- **Date:** 2026-07-25
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** The initial hydration approach attempted to `source` the client `tokens.env` file. Legitimate unquoted content containing spaces, ampersands, or parentheses was interpreted by the shell, preventing a reliable staging artifact from being built.
- **Root cause:** A configuration data file was treated as executable shell input instead of parsed as `KEY=VALUE` records.
- **Fix:** Added `scripts/hydrate-client.mjs`, which parses token records without executing them, copies a clean client artifact outside the source tree, supplies tokens to `build-config.mjs` as process environment values, and writes environment-appropriate robots rules.
- **Status:** FIXED

### [WTV-005] Static template pages failed launch-gate link, image, and staging-robots checks
- **Date:** 2026-07-25
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** The first hydrated staging artifact failed mechanical checks because static image tags lacked intrinsic dimensions, the admin navigation linked to a missing `#settings` anchor, and staging pages/robots retained production indexing directives.
- **Root cause:** The shared markup omitted required layout-stability attributes and the hydration process did not apply an explicit environment-specific robots policy.
- **Fix:** Added width/height attributes to static image tags, restored the admin Settings target, and made the safe hydrator inject `noindex, follow` plus a disallowing `robots.txt` for staging (with production-safe behavior retained for production hydration).
- **Status:** FIXED

### [WTV-006] Staging build sourced from memory repo — template meta-text shipped as visible copy, gate never run
- **Date:** 2026-07-25
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** The deployed staging site at `https://staging.sun-pool-spa.pages.dev` showed "Category pages pull matching inventory from D1, then route product leads with product-level tags." as visible lede copy in the category section, and "East County San Diego dealer website template. Inventory, pricing, CRM routing, and tracking are client-configured." in the footer. The homepage lead form was absent. The design system was not the certified navy+gold build.
- **Root cause:** The agent used `scripts/hydrate-client.mjs` inside `increase-roas/increase-roas-os` (commit `55c47fe`) as the build source. That repo is the **memory repo** — its `templates/website-template-v2/` directory holds brain-loop notes and reference files, not the certified production template. The "Category pages pull matching inventory from D1..." string is hardcoded in the memory repo's `index.html` and was never a token, so it passed through hydration unchanged. The `gate.mjs` script from the `client-site-build` skill was never run against the output; a bespoke `check-fulfillment-artifacts.mjs` was used instead, which does not check for template fingerprints.
- **Fix:** (1) Write TVD-014 to TEMPLATE_DECISIONS.md: `increase-roas-os` is the memory repo and is never a build source. (2) Locate the certified `website-template-2.0` repo and rebuild Sun Pool & Spa from its `main` branch using `new-client.mjs → map-intake.mjs → gate.mjs --env staging`. (3) Never deploy a dist without a PASS from `skills/client-site-build/scripts/gate.mjs`.
- **Status:** FIXED — template source HTML corrected ({{CATEGORY_SECTION_LEDE}} and {{CLIENT_TAGLINE}} tokens replace hardcoded strings across all 11 HTML files); dist rebuilt via `scripts/hydrate-client.mjs sun-pool-spa --env staging`; gate.mjs PASS (12 PASS, 0 FAIL, 9 MANUAL); deployed to `https://staging.sun-pool-spa.pages.dev` (deployment `91822f0b`). Standing rule written to TVD-014.

### [WTV-007] Template HTML had two hardcoded meta-text strings that were never tokens
- **Date:** 2026-07-25
- **Client:** Sun Pool & Spa (`sun-pool-spa`) — found during WTV-006 rebuild
- **Symptom:** Even after a correct hydration, two strings would have shipped as visible copy: (1) "Category pages pull matching inventory from D1, then route product leads with product-level tags." in the homepage category section lede, and (2) "{{CLIENT_MARKET}} dealer website template. Inventory, pricing, CRM routing, and tracking are client-configured." in the footer of all 11 HTML pages.
- **Root cause:** Both strings were hardcoded in the template HTML source. The first was never a token at all. The second was a partial token ({{CLIENT_MARKET}} resolved, but the suffix " dealer website template..." was hardcoded literal text). Neither was caught by the previous gate because the bespoke gate did not scan for template meta-text fingerprints.
- **Fix:** Replaced the category section lede with `{{CATEGORY_SECTION_LEDE}}` in `index.html`. Replaced the footer description with `{{CLIENT_TAGLINE}}` in all 11 HTML files. Added `CATEGORY_SECTION_LEDE` to `clients/sun-pool-spa/tokens.env` with client-appropriate copy. The `client-site-build` gate.mjs fingerprint list should be extended to catch these patterns in future builds.
- **Status:** FIXED

### [WTV-008] WTV-006 "fix" re-patched the foreign template instead of switching source
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** The WTV-006 remediation (commit `f4700b3`) tokenized `{{CATEGORY_SECTION_LEDE}}` and `{{CLIENT_TAGLINE}}` and rebuilt from `increase-roas-os` again using `hydrate-client.mjs`. These tokens do not exist in the certified `website-template-2.0` template. The gate passed because it checks hygiene, not lineage. The deployed site was still sourced from the foreign memory repo.
- **Root cause:** Symptom-fixing (patching the foreign template) instead of source-switching (cloning the certified repo). TVD-014 was written but not yet enforced in that same session.
- **Fix:** Identified `increaseroasir/website-template-2.0` on branch `premium-redesign` as the certified source. Rebuilt Sun Pool & Spa entirely from that repo using the certified skill workflow (`new-client.mjs → map-intake → --validate --profile rush → hydrate → gate.mjs`). All prior `increase-roas-os`-sourced deployments replaced.
- **Status:** FIXED

### [WTV-009] Raw Cloudflare Pages API deployment creates manifest-only shells (blobs never uploaded)
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** Six consecutive deployments via the raw CF Pages direct-upload API returned HTTP 500 on every route (including static assets like `/assets/theme.css`). URL normalization 308 redirects worked (proving the manifest registered), but all asset fetches returned empty 500 responses.
- **Root cause:** The raw CF Pages API requires a two-phase protocol: (1) register a manifest of file hashes, (2) upload the actual file blobs. The Python deployment scripts only completed phase 1. CF Pages accepted the manifest but had no blobs to serve.
- **Fix:** Deploy exclusively via `npx wrangler@3 pages deploy <dist> --project-name <name> --branch <branch>`. Wrangler handles the full manifest + blob upload protocol correctly. Added TVD-015 to TEMPLATE_DECISIONS.md.
- **Status:** FIXED

### [WTV-010] ROBOTS_DIRECTIVE unquoted value with comma+space causes shell parse failure
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** When `tokens.env` contained `ROBOTS_DIRECTIVE=noindex, follow` (unquoted), sourcing the file with `set -a && . tokens.env && set +a` caused the shell to treat `, follow` as a separate command, leaving `ROBOTS_DIRECTIVE` empty. `build-config.mjs` then fell back to the `|default "index,follow"` value, producing a production robots directive on a staging build.
- **Root cause:** Token values containing spaces, commas, or special characters must be quoted in `tokens.env`. The template's `tokens.env.template` did not enforce this.
- **Fix:** All multi-word token values in `clients/sun-pool-spa/tokens.env` are now double-quoted. Added TVD-016 to TEMPLATE_DECISIONS.md.
- **Status:** FIXED

### [WTV-011] HOME_HERO_SUBHEAD missing from tokens.env causes doubled hero line
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** The homepage hero rendered "**Serving East County since 1979** Serving East County since 1979." — the bold proof line and the subhead were identical because `HOME_HERO_SUBHEAD` was not in `tokens.env`. `build-config.mjs` fell back to the `client.config.js` `subhead` value, which was set to the same copy as `HOME_HERO_PROOF_LINE`.
- **Root cause:** `HOME_HERO_SUBHEAD` is a required token in the certified template's `index.html` but was absent from the initial `tokens.env` population. The validator did not catch it because the fallback value was non-empty.
- **Fix:** Added `HOME_HERO_SUBHEAD="Visit our Lakeside showroom — hot tubs, swim spas, and saunas in stock, with financing for all credit types."` to `tokens.env`. Added TVD-017 to TEMPLATE_DECISIONS.md: `HOME_HERO_SUBHEAD` must always be distinct from `HOME_HERO_PROOF_LINE`.
- **Status:** FIXED

### [WTV-012] functions/db/schema.sql included in dist causes CF Pages routing confusion
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** The `functions/db/schema.sql` file was copied into the dist during hydration. CF Pages may attempt to route requests matching `/functions/db/schema.sql` through the Worker pipeline, causing unexpected behavior.
- **Root cause:** The rsync-equivalent `find+cp` hydration did not exclude `functions/db/`. The certified template's `functions/db/` directory contains migration SQL that is only needed at D1 setup time, not in the deployed artifact.
- **Fix:** Added `rm -rf functions/db/` as a post-build step. Added TVD-018 to TEMPLATE_DECISIONS.md: `functions/db/` must be excluded from all dist artifacts.
- **Status:** FIXED

### [WTV-013] wrangler.toml tokens not hydrated by build-config.mjs
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** The dist `wrangler.toml` contained unresolved `{{TOKEN}}` placeholders after `build-config.mjs` ran. The gate's `wrangler.toml` check failed.
- **Root cause:** `build-config.mjs` substitutes tokens in `.html` files but does not process `wrangler.toml`. The wrangler.toml template uses `{{CLOUDFLARE_PAGES_PROJECT}}`, `{{D1_DATABASE_NAME}}`, `{{D1_DATABASE_ID}}`, `{{R2_BUCKET_NAME}}`, `{{ALLOWED_ORIGIN}}`, and `{{R2_PUBLIC_BUCKET_ID}}`.
- **Fix:** Added `sed` substitution of all wrangler.toml tokens as a post-build step using known client values. Added TVD-019 to TEMPLATE_DECISIONS.md.
- **Status:** FIXED

### [WTV-014] native-form.js injected .cf-turnstile without data-sitekey → 100% lead rejection
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`) — applies to all 7 native-form pages
- **Symptom:** With `TURNSTILE_SECRET_KEY` set in Cloudflare, the server rejected 100% of submitted leads from every native-form page while the site appeared fully functional. Console error: "Invalid or missing type for parameter sitekey". No visible user-facing error.
- **Root cause:** `native-form.js` injected the `.cf-turnstile` widget element without a `data-sitekey` attribute. The Turnstile client rendered silently; the server-side verification call received an empty sitekey and rejected every token.
- **Fix:** Fixed in certified template at `increaseroasir/website-template-2.0@3e2fadd`. Detection method: console error check + POST test lead through a category-page form after secrets are set.
- **Status:** FIXED at source. Post-deploy smoke test (console errors + test lead POST) is now a gate MANUAL row.

### [WTV-015] D1 schema drift: pre-existing Pages project can carry old products schema missing `featured` column
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** `/api/inventory` returned HTTP 500 (Worker error 1101) on every request after deployment to a Pages project that predated the certified build.
- **Root cause:** The live D1 database `sun-pool-spa-inventory` was created before the certified template added the `featured` column to the products schema. The Worker queried `featured` but the column did not exist, causing a runtime SQL error.
- **Fix:** Diff live `sqlite_master` against `functions/db/schema.sql`; apply additive `ALTER TABLE` only (never drop or recreate). Applied to `sun-pool-spa-inventory` on 2026-07-28. Decision-table row added to certified skill pack at `increaseroasir/website-template-2.0@82d453d`.
- **Status:** FIXED for sun-pool-spa. All future builds against pre-existing D1 databases must run the schema diff before first deploy.

### [WTV-016] GOOGLE_SHEETS_ID is an env var, not a secret — omission causes /api/lead 503
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** All 9 Cloudflare secrets were confirmed set, yet `/api/lead` returned 503 with body "Lead vault is not configured."
- **Root cause:** `GOOGLE_SHEETS_ID` is not a secret value — it is a plain environment variable that must be set on **both** Production and Preview environments in the Pages project settings. It was not included in the secrets checklist and was never set.
- **Fix:** Set `GOOGLE_SHEETS_ID` as an environment variable (not a secret) on both Production and Preview. Added to launch checklist in certified skill pack at `increaseroasir/website-template-2.0@82d453d`.
- **Status:** FIXED for sun-pool-spa. All future builds must set `GOOGLE_SHEETS_ID` as an env var on both environments.

### [WTV-017] Raw CF Pages API deployment: manifest registered, blobs never uploaded → all assets 500
- **Date:** 2026-07-28 (duplicate of WTV-009 — retained as cross-reference with expanded diagnosis)
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** Six consecutive deployments via raw CF Pages API returned HTTP 500 on every route including static assets. URL normalization 308 redirects worked (manifest registered); every actual asset fetch returned empty 500.
- **Root cause:** Raw CF Pages direct-upload API requires two phases: (1) register manifest of file hashes, (2) upload actual file blobs. Python scripts completed only phase 1.
- **Fix:** Use `npx wrangler@3 pages deploy <dist> --project-name <name> --branch <branch>` exclusively. After deploy, verify `curl / && curl /assets/theme.css` both return 200 before reporting deployed. Added TVD-015 and a decision-table row in certified skill pack at `increaseroasir/website-template-2.0@82d453d`.
- **Status:** FIXED.

### [WTV-018] Featured grid empty: freshly migrated products default featured=0
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** Homepage "Showroom Selection" grid rendered empty after D1 schema migration. `/api/inventory?featured=true` returned zero results.
- **Root cause:** Products inserted or migrated before the `featured` column existed default to `featured=0`. No products were marked featured at migration time.
- **Fix:** Mark at least 3 products `featured=1` in D1 immediately after schema migration. Applied to `sun-pool-spa-inventory` on 2026-07-28 (3 products marked featured; client to confirm final picks — on 48h list). Added to post-deploy smoke checklist in certified skill pack at `increaseroasir/website-template-2.0@82d453d`.
- **Status:** FIXED for sun-pool-spa. Client to confirm featured product selection.

### [WTV-019] False alarm: *.pages.dev deployment-hash URLs carry automatic x-robots-tag: noindex from Cloudflare
- **Date:** 2026-07-28
- **Client:** All builds
- **Symptom:** Deployment-hash URLs (e.g. `12ef0d6f.sun-pool-spa.pages.dev`) return `x-robots-tag: noindex` in response headers, which can appear to indicate a robots misconfiguration.
- **Root cause:** Cloudflare automatically sets `x-robots-tag: noindex` on all `*.pages.dev` deployment-hash URLs. This is Cloudflare platform behavior, not a build artifact.
- **Fix:** Never diagnose SEO or robots configuration from a deployment-hash URL. Always verify robots behavior from the production custom domain or the named branch alias (e.g. `staging.sun-pool-spa.pages.dev`). Added as a decision-table note in certified skill pack at `increaseroasir/website-template-2.0@82d453d`.
- **Status:** Informational — no code fix required.

### [WTV-020] Static Turnstile widgets on homepage + booking page shipped without sitekey; homepage lacked the api.js loader
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`) — template defect, applies to all builds
- **Symptom:** The homepage "Get Local Pricing" hero form and the `/book/` form rejected every submission with "Please complete the security check" and rendered NO visible verification widget — no way for a user to pass. Category/product native forms (fixed earlier, see WTV-014) worked fine, masking this.
- **Root cause:** Unlike `inventory.html` (which carries `data-sitekey="{{TURNSTILE_SITE_KEY}}"`), the static `.cf-turnstile` divs hardcoded in `index.html` and `book/index.html` had no `data-sitekey`, both `<body>` tags lacked `data-turnstile-site-key`, and `index.html` never loaded `challenges.cloudflare.com/turnstile/v0/api.js` at all. The widget could not render; with `TURNSTILE_SECRET_KEY` set the server rejects tokenless posts.
- **Fix:** Fixed in certified template at `increaseroasir/website-template-2.0@24a700c` (labelled WTV-019 in template-side commit/docs — numbering diverged from this ledger). Any build must hydrate from template HEAD ≥ `24a700c`. Post-deploy check: homepage HTML must contain `data-sitekey` on the widget AND the turnstile api.js script tag.
- **Status:** FIXED at source. Verified end-to-end on `50545ed7` (owner-submitted homepage lead reached Sheets + GHL).

### [WTV-021] GA4 measurement ID transcribed with a typo — all traffic sent to a nonexistent property
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** GA4 property showed "Data collection isn't active" and zero Realtime users for 48+ hours while the site's tag fired correctly on every page view.
- **Root cause:** The web stream's real Measurement ID is `G-KSJ8N5GZZJ`; the config recorded `G-KSJ8N5G2ZJ` (`2` vs `Z` — visually near-identical in Google's font). Client-side gtag accepts any ID silently, so every hit went into the void.
- **Fix:** Corrected config, re-hydrated, redeployed. Rule: NEVER transcribe measurement IDs by eye — use the copy control in GA4 Web stream details and paste. Verify GA4 Realtime shows a live visit as part of wiring verification (owner confirmed 2026-07-28 ~11:04 EDT).
- **Status:** FIXED for sun-pool-spa.

### [WTV-022] "Patch-only" redeploy dropped functions/ — every /api/* route served homepage HTML while the gate reported all-PASS
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** `GET /api/inventory` returned the homepage HTML (200) instead of JSON on freshly deployed prod + staging. No inventory, no lead endpoint, no meta-offline — every form and grid dead while the static site looked perfect and the gate said "13 PASS".
- **Root cause:** The redeploy uploaded static files without the `functions/` directory. The static gate cannot see missing server code, and the post-deploy API smoke (a required MANUAL row) was skipped.
- **Fix:** Deploy the gated dist byte-exact (functions/ included) with `wrangler pages deploy` from the artifact root. gate.mjs ≥ `increaseroasir/website-template-2.0@5b85152` now hard-FAILs an artifact missing `dist/functions/api/{lead,inventory,meta-offline,booking}.js`. The post-deploy smoke is mandatory and its raw curl output must be pasted in the completion report.
- **Status:** FIXED for sun-pool-spa (deployment `50545ed7`). Gate check prevents recurrence.

### [WTV-023] _redirects + 404.html dropped from every deployment — product slug URLs, .html redirects, and 404s all silently served the homepage
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`) — present on ALL deployments to date
- **Symptom:** `/active-inventory/<slug>/` served the homepage (blocking Product schema / rich-results testing), `/hot-tubs.html` did not 301, and nonsense paths returned 200 homepage instead of 404.
- **Root cause:** The deploy assembly omitted `_redirects` and `404.html` from the upload. Without `_redirects` the slug rewrite (`/active-inventory/:slug/` → SLUG template) never runs; without `404.html` Cloudflare Pages enters SPA fallback and serves `index.html` for every unmatched path with a 200.
- **Fix:** Deploy the gated dist byte-exact. gate.mjs ≥ `increaseroasir/website-template-2.0@e348891` hard-FAILs an artifact missing either file. Post-deploy smoke: `/hot-tubs.html` → 301, nonsense path → 404, one real slug URL → product template.
- **Status:** OPEN for sun-pool-spa (redeploy ordered). Gate check prevents recurrence.

### [WTV-024] Two-part work order executed from a stale template checkout — one part silently dropped
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** An order to (1) pull template `24a700c` and (2) fix the GA4 ID produced a deployment with only the GA4 fix. The report claimed completion; the homepage Turnstile fix was absent because hydration ran from the stale on-disk template copy.
- **Root cause:** Template freshness was never verified before hydrating.
- **Fix:** Standing rule (hydrate skill + launch checklist ≥ `5b85152`): before EVERY hydrate, `git fetch` and confirm checkout HEAD equals the remote HEAD or the exact SHA named in the work order. Mismatch or failed pull = STOP and report; never build from whatever is on disk. Record the hydrated SHA in WIRING.md build provenance and in the completion report.
- **Status:** FIXED (rule encoded; subsequent deploy correctly verified HEAD).

### [WTV-025] Lead vault append landed shifted right of the All Leads table
- **Date:** 2026-07-28
- **Client:** Sun Pool & Spa (`sun-pool-spa`)
- **Symptom:** A verified homepage test lead was appended to the right of the expected All Leads columns instead of aligned at column A.
- **Root cause:** `appendLeadVault` targets `All Leads!A:AI` and relies on Google Sheets table detection. The Sun Pool sheet's layout drifted from the Paradise vault template — stray filled cells outside the table (e.g. a TEST marker written into an arbitrary cell) corrupt the detected table for subsequent appends. The code is unchanged from Paradise, where appends align correctly.
- **Fix:** Fix the SHEET, not the code: layout must match the Paradise vault template exactly (headers in row 1 from column A; no stray filled cells outside the table; markers/notes go in a designated table column). Re-verify with one marked TEST lead after correcting.
- **Status:** OPEN — sheet correction + re-test pending.

### [WTV-026] Meta Pixel silent failure on manual dist builds
- **Date:** 2026-07-28
- **Client:** snapshot-test (first exposed)
- **Symptom:** Meta Pixel Helper showed "no pixel on page" even though `client.config.js` contained the correct `metaPixelId`. The pixel never initialized; GA4/Clarity/GHL external tracking were equally dead.
- **Root cause (3 compounding issues):** (1) `client.config.js` was not copied into the dist — every page loads it at runtime as `<script src="/client.config.js">`, so `window.CLIENT_CONFIG` was `undefined` and `tracking.js` silently skipped all pixel/GA4/Clarity init. (2) `tracking.js` pixel init depended entirely on `window.CLIENT_CONFIG.tracking.metaPixelId` being truthy at runtime — a fragile dependency on a separate file loading. (3) Cloudflare Rocket Loader can defer inline scripts, so even a present pixel block could be reported as "no pixel."
- **Fix:** (1) `build-config.mjs` → `injectMetaPixel()` now hardcodes the full pixel snippet (`<script data-cfasync="false">` + `fbq('init', …)` + PageView + noscript img) into every HTML file at build time — no runtime dependency, `data-cfasync="false"` defeats Rocket Loader. (2) `scan-placeholders.mjs` and skill-pack `gate.mjs` hard-fail if `client.config.js` is missing from the dist root or any page loads `tracking.js` without `fbevents.js`. (3) `tracking.js` retains its config-based init only as a fallback (`if (window.fbq) skip`) so PageView never fires twice.
- **Status:** FIXED — enforced by gate on every build.

### [WTV-027] GHL `meta_offline_webhook_secret` custom value out of sync with Cloudflare Worker secret
- **Date:** 2026-07-28
- **Client:** snapshot-test (first exposed)
- **Symptom:** GHL offline webhook reached the Worker but returned `{"ok":false,"error":"Unauthorized"}`; GHL execution log showed Failed.
- **Root cause:** The Cloudflare secret was set with `printf` after an earlier attempt used `echo`. `echo` appends a trailing newline that gets encoded into the secret value; the GHL custom value retained the first (mangled) value. Both sides held valid-looking strings that silently diverged.
- **Fix:** Read the GHL custom value via `GET /locations/{id}/customValues`, compared character-by-character, updated GHL to match. **Prevention rules:** (1) always `printf '%s' "$SECRET" | wrangler pages secret put …`, never `echo`; (2) after setting the secret, immediately read back the GHL custom value and assert equality; (3) fire a test POST to `/api/meta-offline` with the GHL-stored value and assert it returns `"skipped"` (unknown event_name), not `"Unauthorized"`:

```bash
GHL_SECRET=$(curl -s "https://services.leadconnectorhq.com/locations/{LOCATION_ID}/customValues" \
  -H "Authorization: Bearer {PIT}" -H "Version: 2021-07-28" | \
  python3 -c "import sys,json; cvs=json.load(sys.stdin).get('customValues',[]); \
  print(next((c['value'] for c in cvs if 'webhook_secret' in c.get('name','')), 'NOT_FOUND'))")
curl -s -X POST "https://{DOMAIN}/api/meta-offline" \
  -H "Authorization: Bearer $GHL_SECRET" -H "Content-Type: application/json" \
  -d '{"event_name":"__ping__","email":"ping@test.com","phone":"5550000000"}' | grep -o '"skipped"\|"Unauthorized"'
```
- **Status:** FIXED — printf rule + read-back verification now in wiring/launch skill references.

### [WTV-028] GHL-007 clarification: `opportunity.lead_value` resolves; `opportunity.monetary_value` / `opportunity.date_updated` do not
- **Date:** 2026-07-28
- **Client:** snapshot-test (confirmed via live Purchase workflow execution)
- **Symptom / Finding:** GHL-007 (opportunity fields send empty in webhook bodies) applies to **system opportunity fields only**. Confirmed: `{{opportunity.monetary_value}}` and `{{opportunity.date_updated}}` send empty; `{{opportunity.lead_value}}` resolves (live evidence: `value_received: "5000"`, fbtrace `AskN5NlQTpp1olRVQ-mtUG-`, 2026-07-28 6:40pm ET).
- **Fix / Rule:** `{{opportunity.lead_value}}` is safe as the Purchase webhook `value` field — no contact-field mirror needed. Do not assume any other opportunity field resolves without testing it against the diagnostic endpoint first (`value_received` must be non-null).
- **Status:** Informational — rule encoded in TVD-029.
