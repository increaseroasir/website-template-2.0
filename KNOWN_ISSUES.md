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
### [WTV-029] Build-injected Meta Pixel noscript beacon had no `alt` — failed the launch gate's image-accessibility check on every page
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (blocked pre-deploy; defect is shared-template, affects every build since TVD-028)
- **Symptom / Finding:** `scripts/build-config.mjs` `injectMetaPixel()` emitted Meta's stock `<noscript>` beacon verbatim: `<img height="1" width="1" style="display:none" src="…/tr?id=…">`. Meta's published snippet carries no `alt` attribute, so once the pixel became hardcoded at build time (TVD-028) every emitted HTML page contained an image with no `alt` — the mechanical launch gate's image-accessibility check failed all pages. Client content and config were clean; the failure was 100% template-side and reproduced on any client.
- **Fix / Rule:** The beacon now emits `alt="" aria-hidden="true"`. An empty `alt` is the correct treatment for a 1x1 tracking pixel (no informational content, screen readers skip it); Meta ignores both attributes, so pixel delivery, the `noscript=1` parameter, and the `fbevents.js` gate check are unaffected. **Rule:** any markup this template *generates* must satisfy the same gates as markup it *ships* — third-party snippets are not exempt. When pasting vendor snippets into a build step, audit them against the gate checks before shipping.
- **Status:** FIXED in `premium-redesign` (see commit below).

### [WTV-030] Token semantics changed in `build-config.mjs` without mirroring into the validators — build and gate disagreed
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (blocked pre-hydration; defect was template-side)
- **Symptom / Finding:** TVD-030 added `<!-- IF:TOKEN -->` optional-section removal to `scripts/build-config.mjs`, but `new-client.mjs` in both skill packs still used the raw-token scanner. The build would correctly delete the unset offer/guide/floor-count/massage sections, while the certification validator still hard-failed their member tokens as "missing." The builder was left with a contradiction it could only resolve by bypassing the gate — which it correctly refused to do.
- **Fix / Rule:** Validators now call an `applyOptionalSections()` that mirrors `build-config.mjs` exactly. **Standing rule: token-resolution semantics live in four places that must change together —** `scripts/build-config.mjs` (the build), `scripts/scan-placeholders.mjs` (the structural gate), `manus-skills/dealer-site-intake/scripts/new-client.mjs` and `skills/client-site-build/scripts/new-client.mjs` (certification), plus the `token-reference.md` registry in both packs. Changing one without the others produces a build that passes and a gate that fails, or worse, the reverse.
- **Status:** FIXED in `0e1a5af`. Rule now enforced by review checklist, not yet mechanically.

### [WTV-031] Builder invented a product slug from manufacturer knowledge instead of querying live D1
- **Date:** 2026-07-29
- **Client:** sun-pool-spa
- **Symptom / Finding:** The required live Product-schema proof needs a real product URL. Lacking the inventory list, the builder constructed `hydropool-self-cleaning-879` from the brand seen in client copy plus a model number from Hydropool's real catalog, then requested a data migration to insert it. The 879 is a genuine manufacturer model but is **not** Sun Pool stock — it appears in zero approved client files. Actual stock is the Self-Cleaning **495** and **570**. The builder did correctly refuse to invent the record's price/specs.
- **Fix / Rule:** **Never construct a product slug.** Before any product-page, Product-schema, or routing test, enumerate real slugs from the bound database and pick from the result: `wrangler d1 execute <db> --remote --command "SELECT slug, status, featured, price FROM products"` (run from a directory without a tokenized `wrangler.toml`, or the config parse fails). Prefer a `featured=1`, `status=available` row so the same test also exercises the homepage grid. A plausible-looking slug from brand knowledge is a fabricated dealer product — worse than a failed check.
- **Status:** FIXED (process rule). Encoded in `references/images.md` + launch checklist.

### [WTV-032] Relative `primary_image` paths in D1 silently render the placeholder — no error anywhere
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (all 7 products affected)
- **Symptom / Finding:** Every product card and product hero rendered the built-in navy "Inventory Photo" placeholder. Cause: `safeImageUrl()` in `assets/template.js` accepts only `/`-rooted paths, `data:image/`, or `https:` URLs — anything else (including `../lifestyle-swim-spa.png`) fails `new URL()` and falls back to the placeholder **silently, by design**. Sun Pool's rows held four such relative paths (pointing at template demo filenames that did not exist in the artifact) and three NULLs. Gates pass, API returns 200, nothing logs — the site simply looks unfinished.
- **Fix / Rule:** `primary_image` must be an absolute path (`/assets/PRODUCT_<slug>.webp`) or an `https:` URL. Relative paths and bare filenames are invalid. After any inventory load, verify rendering rather than trusting a 200: `curl -s https://<domain>/api/inventory | grep -o '"primary_image":"[^"]*"'` and confirm every value starts with `/` or `https:`. Never "repair" a phantom path into an absolute one without confirming the file exists in the artifact — that converts a silent placeholder into a hard 404.
- **Status:** FIXED (rule + verification step). Mechanical gate check is an open follow-up.

### [WTV-033] R2 public delivery URL unconfigured — admin image uploads fail closed; static assets are the launch path
- **Date:** 2026-07-29
- **Client:** sun-pool-spa
- **Symptom / Finding:** The `sun-pool-spa-product-images` R2 binding exists but has no verified public delivery URL, so admin panel image uploads fail closed (correct behavior — better than writing unreachable URLs into D1). This blocks the obvious route for getting product photos onto the site.
- **Fix / Rule:** **Do not block launch on R2.** Ship product photos as static files inside the client artifact (`assets/PRODUCT_<slug>.webp`) and point `primary_image` at the absolute path. Static assets are edge-cached and faster than R2-through-a-custom-domain anyway. Configure the R2 custom domain post-launch, as a client self-service convenience for adding future units.
- **Status:** Rule adopted. R2 custom domain remains a 48-hour item per client.

### [WTV-034] Every product URL 404s because the `_redirects` 200-proxy targeted `index.html` — Pages normalizes the extension away and never chains
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (shared template defect — affects every client built from this template)
- **Symptom / Finding:** `https://<domain>/active-inventory/<real-slug>/` served the branded 404 page on Production while the rest of the site was perfect: the listing page rendered, `/api/inventory` returned 200, `_redirects` and `404.html` both shipped, and the rule looked correct on inspection. Only product detail pages were dead.
- **Root cause:** The rule was `/active-inventory/:slug/ /active-inventory/SLUG/index.html 200`. Cloudflare Pages 308-normalizes extensioned asset URLs to their canonical form (`/active-inventory/SLUG/index.html` → 308 → `/active-inventory/SLUG/`) and — per Cloudflare's documented behavior — **does not chain or flatten redirects**. So the proxy destination resolved to a *redirect*, not an asset, the proxy could not complete, and the request fell through to the 404 handler. Live proof on the broken deploy: `/active-inventory/SLUG/index.html` → `308`, `/active-inventory/SLUG/` → `200`, `/active-inventory/<slug>/` → `404`. Placeholder matching and 200-proxying were never the problem; both work exactly as documented.
- **Fix:** Destination changed to the directory form: `/active-inventory/:slug/ /active-inventory/SLUG/ 200`. Reproduced and verified locally against a real Pages runtime (`wrangler pages dev`) both ways — broken rule 404s, fixed rule serves the shell with 200, and the `/active-inventory/` listing is not shadowed.
- **Rule:** **A 200-proxy destination in `_redirects` must never end in `.html`.** Always target the directory. Now mechanically enforced by `scripts/scan-placeholders.mjs --launch` and gate check 15b, so this cannot ship again. Verify after every deploy with `node scripts/verify-product-route.mjs https://<domain>` — it resolves a real slug from the live API (never constructs one, per WTV-031) and asserts 200 + shell markers + listing not shadowed.
- **Caveat carried forward:** Product JSON-LD is injected at runtime by `assets/product-page.js`, so an HTTP fetch cannot see it. The script asserts the emitter is present and reachable; schema itself must be confirmed with a JS-rendering tool (Rich Results Test).
- **Status:** FIXED in `premium-redesign`. Mechanically gated.

### [WTV-035] Product shell pinned a build-time `data-product-slug` — every unit rendered "Product unavailable" behind a valid 200
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (shared template defect — affects every client built from this template)
- **Symptom / Finding:** With the WTV-034 route fix deployed, `/active-inventory/<real-slug>/` returned 200 and served the correct shell, but the page rendered the generic **Premium Spa** fallback plus an inserted **"Product unavailable"** notice, and emitted no Product JSON-LD. A direct same-origin `GET /api/inventory?slug=hydropool-aquatrainer-14fx` returned the valid D1 row, proving this was neither a D1 nor a routing problem.
- **Root cause:** The shell shipped `<body … data-product-slug="{{PRODUCT_SLUG|-}}">` and `slugForPage()` in `assets/product-page.js` read that attribute **before** falling back to the pathname. One shell serves every product URL via the `_redirects` 200-proxy, so whatever value the build hydrated (Sun Pool: `premium-spa`) became the slug for *every* unit. The renderer requested a product that does not exist, caught the failure, and printed the error state. On the raw template the attribute is `{{PRODUCT_SLUG|-}}`, which `clean()` strips to empty — so the bug is **invisible in unhydrated source and only appears in a built artifact**. Even the unset default (`-`) was broken.
- **Fix:** Three layers. (1) `data-product-slug` removed from `active-inventory/SLUG/index.html`. (2) `slugForPage()` now derives from the pathname **first** and treats the body attribute as a fallback only when the URL carries no real slug — so a stale attribute in an already-deployed artifact self-heals on the next JS update. (3) The `PRODUCT_SLUG` token is deleted from both `tokens.env.template` files and struck from both `token-reference.md` registries, so no builder can reintroduce it.
- **Verification:** Reproduced and fixed in a real browser against a real Pages runtime, with a slug-aware API. Stale attribute + original renderer → "Product unavailable", zero ld+json. Stale attribute + hardened renderer → correct product and schema. Canonical shell → correct product and schema.
- **Rule / prevention:** A page served for many URLs may never carry a build-time identifier for one of them. Enforced two ways: `scan-placeholders.mjs --launch` and gate check 15c FAIL on a non-empty `data-product-slug`; `scripts/verify-product-route.mjs` now drives headless Chrome and asserts the rendered name and JSON-LD match the live D1 record.
- **Process lesson (this one matters more than the bug):** The original WTV-034 proof passed against **unhydrated template source**, where the token stripped itself to empty. Routing was genuinely proven; rendering was not, and the shipped verifier only checked that the shell and `<script>` tag existed. **Verify against a built artifact, and assert rendered output — never just HTTP status and markup presence.** On the broken artifact all six HTTP checks still pass; only the render checks fail.
- **Status:** FIXED in `premium-redesign`. Mechanically gated (static + rendered).

### [WTV-036] Mobile Lighthouse accessibility capped at 84 — hidden drawer stayed focusable, gold price text failed AA, and headings skipped levels
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (shared template defect — affects every client built from this template)
- **Symptom / Finding:** Manus held the Sun Pool launch because manual Lighthouse runs missed the thresholds: mobile Performance 58 / Accessibility 84 / SEO 66, desktop 97 / 87 / 66. Four accessibility audits failed on the homepage — `aria-hidden-focus`, `label`, `heading-order`, `target-size` — and `color-contrast` failed on `.price-block .mo`.
- **Root cause:** Five independent defects, each a single attribute or token.
  1. **Drawer.** `.drawer` is hidden only by `transform:translateX(102%)`, which moves it off-screen but leaves every link keyboard-focusable and in the accessibility tree. `setDrawer()` toggled a class and `aria-hidden` but never removed focusability, so `aria-hidden="true"` wrapped focusable descendants — the exact contradiction `aria-hidden-focus` flags. The category/inventory menus were **not** affected because their CSS already sets `visibility:hidden`.
  2. **Honeypots.** The two `index.html` honeypots shipped bare — no label, no `aria-hidden` — so Lighthouse counted them as unlabelled form fields. The `financing.html` and JS-injected honeypots already had the correct pattern.
  3. **Headings.** Footer section headings were `<h4>` while the last content heading was `<h2>`, a level skip. `/book/`, `/contact.html`, `/thank-you.html`, `/404.html`, and `/active-inventory/` skipped `h1 → h3`. Three `<h3>`s injected at runtime by `assets/template.js` landed directly under the page `<h1>`.
  4. **Contrast.** `--gold-dark:#B98200` on a white card is **3.36:1**; `.price-block .mo` renders it at 13.4px bold, which is not "large text", so AA requires 4.5:1. The token was used as a text colour in 12 places and nowhere decorative. `.price-block .compare` at `rgba(74,82,104,.55)` computed to ~2.6:1.
  5. **Landmarks / names.** No page had a `<main>` landmark. Seven pages set `aria-label="{{CLIENT_NAME}} home"` on a logo link whose *visible* text is name **+ tagline**, so the accessible name omitted the tagline (`label-content-name-mismatch`). The product shell's `<select name="form_intent">` had no accessible name at all.
- **Fix:** `inert` on the drawer in markup and toggled in `home.js` (plus `visibility` fallback and Escape-to-close), with the same `inert` parity added to `category.js` and `inventory-page.js` so a future CSS refactor cannot reintroduce the bug. `aria-hidden="true"` on the bare honeypots. Footer headings → `<h2 class="footer-h">`; skipping `<h3>`s → `<h2 class="h3">`, with every `<parent> h3` CSS rule twinned to `<parent> .h3` so the type scale is pixel-identical. `--gold-dark` redefined to `#8F6400` (5.26:1 on white, 4.80:1 on sand) and `.compare` to `#5F6779` (5.67:1). `<main>` added to the four pages missing it; logo `aria-label` removed on all seven pages; `aria-label` added to the intent select.
- **Verification:** Reproducible, not hand-run. `scripts/lighthouse-check.mjs` was added and both trees served locally. Baseline reproduced Manus's finding exactly — **accessibility 85** with precisely the four named audits failing. After the fix, **all 13 pages score accessibility 100 with zero failing accessibility audits**. A browser diff of `/`, `/contact.html`, `/active-inventory/`, and `/book/` at 390×844 and 1440×900 confirmed the footer labels, type scale, and webfonts are visually unchanged.
- **Rule / prevention:** `scan-placeholders.mjs --launch` and the launch gate now hard-fail a `#drawer` without `inert` and any logo link that overrides its accessible name. Both were negative-tested. `npm run lh:mobile <url>` is the reproducible audit.
- **Caveat — do not chase this one:** `X-Robots-Tag: noindex` on every `*.pages.dev` host costs ~34 SEO points no matter what the markup says. The SEO threshold is therefore **only enforced on a canonical domain**; `lighthouse-check.mjs` marks it `EXEMPT` on a Pages hash and says so. SEO must be re-measured after DNS cutover. Likewise `is-crawlable` failing on `/admin/` and `/404.html` is intentional.
- **Status:** FIXED in `premium-redesign`. Accessibility mechanically gated; performance partially — see WTV-037.

### [WTV-037] Mobile performance 58 is dominated by client photography, not template code
- **Date:** 2026-07-29
- **Client:** sun-pool-spa
- **Symptom / Finding:** Lighthouse mobile Performance 58, attributed to 1.26s render-blocking from Google Fonts + `home.css`, 167KB of oversized hero/showroom imagery, 128KB unused GA/Meta JavaScript, and 13.2s main-thread work. This was reported as a shared-template defect.
- **Root cause:** Only partly template. **Fonts were genuinely template-owned:** the stylesheet was a render-blocking `<link rel="stylesheet">` requesting three families including a full italic axis for Instrument Sans, when `.sold-note` is the only italic consumer in the entire template. **The imagery is not template-owned** — the template ships no hero or showroom images at all; `{{HOME_HERO_IMAGE}}`, `{{VISIT_IMAGE_1}}`, and `{{VISIT_IMAGE_2}}` are client-supplied tokens, and the markup already does the right things (`width`/`height` to prevent CLS, `fetchpriority="high"` + `decoding="async"` on the hero, `loading="lazy"` below the fold). The 167KB is Sun Pool's uploads.
- **Fix:** Fonts are now loaded non-blocking (`rel="preload" as="style"` promoted on load, with a `<noscript>` fallback) and the unused italic axis was dropped; `.sold-note` falls back to synthetic oblique. Applied to all 13 pages.
- **Explicitly NOT fixed — GA4/Meta "unused JavaScript":** deferring these is refused. TVD-028 hardcodes the Meta pixel into every page at build time *specifically because* it was silently dying, and `tracking.js` documents that late-loading page-view tracking misses the page view. `gtag.js`, `fbevents.js`, and Clarity are already `async`. Trading a confirmed-working conversion signal for Lighthouse points is the wrong trade; the ~128KB is the cost of the tracking the business requires.
- **Remaining owner action:** recompress the Sun Pool hero and showroom photography (target ≤120KB each, WebP, no wider than 1600px). No template change will move this number.
- **Status:** FIXED (template share). Image weight is OPEN and owned by client assets.

### [WTV-038] Non-blocking fonts collided with the one-preload owner ruling — both gates failed on a correct artifact
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (shared template / gate conflict)
- **Symptom / Finding:** After the WTV-037 font fix, every hydrated page emitted two `<link rel="preload">` tags — one `as="style"` for the Google Fonts stylesheet and one `as="image"` for the LCP hero. Gate check 6 allows **at most one preload per page**, so both Production and Staging gates hard-failed on certified `12711b7` even though the artifact was correct. Manus correctly refused to patch the artifact or deploy.
- **Root cause:** Two decisions made at different times, neither wrong on its own. The one-preload ruling came from the `06fa070` closeout and is enforced as a raw count; its actual purpose is visible in the second half of the same check — *"if present it must reference that page's LCP hero"* — i.e. stop stray preloads competing with the hero for early bandwidth. The font fix then introduced a second preload that is not a stray: `rel="preload" as="style"` promoted on load is the standard way to make a stylesheet non-blocking. A count-based rule cannot tell those two cases apart.
- **Fix:** Gate check 6 is now enforced **by role instead of by number**, in both `gate.mjs` copies. At most one `as="image"` preload, which must still reference the page's LCP hero; at most one `as="style"` preload, which must be the fonts stylesheet **and** must carry both an `onload` promotion and a matching `<noscript>` fallback; any other preload still fails. This is net **stricter** than the count it replaces: a font preload that never promotes, or that would leave a JS-disabled visitor with no CSS at all, now fails, and the old rule could not have caught either.
- **Verification:** Six synthetic fixtures run through the real gate — the intended two-preload pattern PASSes; a stray `as="script"` preload, two image preloads, a missing `<noscript>`, a missing `onload`, and a stale hero href each FAIL with a specific message. The preload row then went PASS on a hydrated 13-page artifact.
- **Secondary defect found by the new rule:** `clients/hostile-rehearsal/dist` carried **two** stylesheet preloads per page. The sync script used earlier that day ran two regexes in sequence, and the second matched the `<noscript>` link *inside* the block the first had just inserted, nesting a duplicate. The shipping template was never affected (verified 1 per page across all 13). Collapsed.
- **Rule / prevention:** A gate that encodes a *count* instead of the *reason for the count* will eventually block correct work. When a rule fires on an artifact that is genuinely right, fix the rule to express its intent — do not patch the artifact and do not weaken the rule to a warning.
- **Status:** FIXED in `premium-redesign`. Both gate copies updated and negative-tested.

### [WTV-039] `clients/hostile-rehearsal/dist` is a committed build output that has drifted six fixes behind
- **Date:** 2026-07-29
- **Client:** template
- **Symptom / Finding:** Running the launch gate against `clients/hostile-rehearsal/dist` reports six failures that have nothing to do with current template state: Turnstile references (removed at TVD-025), a `.html` 200-proxy in `_redirects` (fixed at WTV-034), a pinned `data-product-slug` (fixed at WTV-035), a missing hardcoded Meta pixel, and prod robots values under `--env staging`.
- **Root cause:** It is a **generated artifact committed to git**. Every template fix since it was produced has made it staler, and nothing regenerates it. It was hand-patched twice on 2026-07-29 (accessibility fixes, then the duplicate font block above), which treats a build output as if it were source and does not scale.
- **Risk:** Anyone running the gate against it concludes the template is broken in six ways when it is not. It is a false alarm generator sitting in the repo.
- **Recommended fix:** Delete it and regenerate on demand from the hydration pipeline, or move it outside version control. Not actioned — it is owner's call whether anything still references that path.
- **Status:** OPEN (documented, low risk, no launch impact).

### [WTV-040] `client.config.js` and `tracking.js` were render-blocking head scripts — two serialized round trips before first paint
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (shared template)
- **Symptom / Finding:** Investigating a reported mobile Performance 62, Lighthouse's `render-blocking-insight` named three resources on the deployed artifact: `/client.config.js` at **565ms**, `/assets/tracking.js` at **565ms**, and `/assets/home.css` at 387ms. The two scripts together were a larger render-blocking cost than the stylesheet, and nobody had ever looked at them — every previous performance conversation had been about fonts, images, and CSS.
- **Root cause:** Both shipped in the head as plain `<script src>` with no `defer` and no `async`, so each cost a full serialized round trip before the parser could continue. They are 2.5KB and 2KB. The bytes were never the problem; the round trips were.
- **Fix:** `build-config.mjs` gains `inlineBlockingHeadScripts()`, which replaces both tags with the file contents inlined, on every HTML page, after `injectMetaPixel()` runs (the pixel injector anchors on the `client.config.js` tag, so order matters).
- **Why inlined and not deferred:** `defer` would have broken the site. Every end-of-body script reads `window.CLIENT_CONFIG`, and deferred head scripts execute *after* classic end-of-body scripts — `CLIENT_CONFIG` would have been undefined for all of them. Inlining preserves the exact execution order the page has today and removes only the network fetches, so tracking initializes **earlier** than before, which is the direction TVD-037 requires.
- **Verification:** Measured, not assumed. A production mirror was served twice through a latency-injecting server (180ms and 450ms per request) and A/B'd with 3 runs per arm. Inlining was the only arm that helped in both: at 450ms RTT, **FCP 2.41s → 2.11s** and score 94 → 95-96. On a built 13-page artifact: 13/13 pages inlined, 0 blocking head scripts remain, head order preserved (pixel → config → tracking), and a live browser check confirmed `CLIENT_CONFIG` defined, `fbq.loaded === true`, `gtag` defined with 4 dataLayer entries, and both `gtag.js` and `fbevents.js` injected.
- **Rule / prevention:** `scan-placeholders.mjs --launch` and both `gate.mjs` copies now hard-fail any built page that still carries either file as `<script src>`. The pre-existing pixel check was also widened to match the inlined form — keying it only on the `src` string would have silently turned that whole check into a no-op the moment this landed. Both were negative-tested: regressing one page back to `<script src>` produces `contact.html still loads tracking.js as a blocking <script src>`, and the clean build reports nothing.
- **Status:** FIXED in `premium-redesign`.

### [WTV-041] Mobile Performance 62 was real — the cold-edge explanation was wrong — **CORRECTED 2026-07-29**
- **Date:** 2026-07-29 (amended same day)
- **Client:** sun-pool-spa (measurement methodology)
- **Symptom / Finding:** A launch was blocked on mobile Performance 62 against a freshly deployed Pages hash, reported as a shared-template defect with a 5.4s LCP "dominated by render delay". The same URL measured 89 on a different machine, then 99 on that same machine minutes later.
- **What this entry originally concluded, and why it was wrong:** It concluded that the 62 was a cold Cloudflare edge measurement artifact and not a template defect. That conclusion was wrong. Google PageSpeed Insights, run against the same live URL (`https://sun-pool-spa.pages.dev/`), scores mobile performance **66** with **LCP 5.7s**. Our own local Lighthouse scored **99** on that identical URL. The operator's 62 was substantially correct.
- **Corrected conclusion:** The low mobile score is real, not a measurement artifact — the site genuinely does not meet the ≥ 70 mobile performance threshold on a representative device, and this entry's original dismissal of the operator's 62 let a real failure be treated as noise for a full working session.
- **Why the two numbers disagreed:** Runner speed, disclosed by Lighthouse's own `benchmarkIndex` — our dev machine **~3995**, Google's PSI runner **~738**. PSI deliberately emulates a mid-tier phone. Nothing about the site differed between the two measurements.
- **Process failure — state it plainly:** We explained away an inconvenient measurement using a mechanism we had confirmed existed, without checking whether that mechanism accounted for the size of the gap. The cold-edge effect is real and reproducible (**89 cold vs 99 warm on one unchanged URL, same machine**) and the warm-up logic in `scripts/lighthouse-check.mjs` is still correct. It was simply not the explanation for the operator's number.
- **Still true and retained:** A new Pages deployment hash has an **empty edge cache**, and the LCP element is the hero image, so the first request for it travels to origin. On one unchanged staging URL, one machine, identical settings: **cold → Performance 89, LCP 3.72s; warm run 2 → 99, LCP 1.73s; warm run 3 → 99, LCP 1.71s.** Holding the URL fixed and only raising CPU throttling walked the score 99 → 97 → 93 → 89 at 1×/8×/12×/16×. `scripts/lighthouse-check.mjs` primes the edge before scoring, runs 3 times and reports the median, prints `benchmarkIndex`, and keeps `--no-warm`. None of that is withdrawn. What is withdrawn is using it to explain a gap it cannot account for.
- **Measured diagnosis — PSI mobile, `benchmarkIndex` 738, LCP 5.7s, phases from `lcp-breakdown-insight`.** Read these as *relative weights only*, not as a decomposition of the headline LCP. Two reasons: this table comes from a single **cold** call (later warm calls on the same URL reported a 2ms TTFB phase, so the 3,188ms below is a cold-edge artifact, not a floor), and the four subparts do not sum to LCP in any run — Lighthouse 13's trace-based insight engine measures a different window than the LCP metric audit, and a "2ms time to first byte" is not physically meaningful. The signal that survives both problems is the *ranking*: element render delay dominates resource load delay and duration by an order of magnitude.

| phase | duration |
|---|---|
| Time to first byte | 3,188 ms |
| Resource load delay | 156 ms |
| Resource load duration | 172 ms |
| Element render delay | 2,012 ms |

- **Supporting audits:** FCP 3.6s, Total Blocking Time 190ms (passes), CLS 0, main-thread work 1.1s (passes), bootup time 0.4s (passes), render-blocking limited to `assets/home.css` at 175ms. The only flagged opportunity is `unused-javascript` at 890ms / 127KB, which is the GA4 and Meta Pixel third-party payload — refused under TVD-037.
- **Ruled out by measurement — do not re-investigate these:**
  1. **Document weight is not the problem.** The deployed HTML is 38KB raw / 11KB gzipped. The two head scripts inlined in TVD-041 add only 6.4KB, so that fix did not regress TTFB.
  2. **Our server is not the problem.** PSI's `document-latency-insight` passes with an observed 3ms server response, text compression applied, and no redirects. The 3.19s TTFB is PSI's emulated slow-4G network floor, which every site on that runner pays. It is not addressable by template code.
  3. **CPU is not the problem.** Main-thread work and Total Blocking Time both pass.
- **The one addressable lever — RESOLVED, see WTV-042:** the **2,012 ms of element render delay**. The hero image's bytes have arrived by roughly 3.5s but the element does not paint until 5.7s. The cause was neither an entrance animation nor an opacity gate: it was the `<link rel="preload" as="image">` on the hero delaying render-blocking `assets/home.css`. **The phase attribution was misleading.** The time sat in "Element render delay", which reads as paint or animation cost, but the decision that produced it was a *network priority* choice in the head. A phase label in `lcp-breakdown-insight` names when the time is spent, not what caused it — do not let it scope the investigation.
- **Four fixes that were tried and measured HARMFUL — now PROVISIONAL, re-verify on PSI before trusting:** every one of these was measured on the fast local runner (`benchmarkIndex` ~3995) that we now know is not representative. They are recorded as history, not as canon. See TVD-043, downgraded.
  1. **`fetchpriority="high"` on the hero `<link rel="preload">`.** Measured locally at **LCP 2.52s → 3.01s across 3 runs**. **Contradicted by PSI and pending re-test:** PSI's `lcp-discovery-insight` audit scores **0** on our page with `priorityHinted: false` and the explicit finding *"fetchpriority=high should be applied to the image preload request."*
  2. **Inlining `home.css`.** Best FCP of any arm (1.59s) and catastrophic LCP: **2.5s → 6.5s, score 74-76.** Not re-verified on PSI.
  3. **Removing the hero's `blur(72px)` steam blobs and the three above-the-fold `backdrop-filter` surfaces.** Style & Layout and Rendering moved less than 3%. Not re-verified on PSI.
  4. **Halving the hero image (88KB → 41KB, same dimensions).** No measurable change; the hero is *upscaled* on a 412px viewport (1600×1200 landscape covering a 412×947 portrait box). Not re-verified on PSI.
- **Rule / prevention:** A performance score is only evidence when it comes from a runner every party shares — see TVD-044. PSI is now the number of record for the launch threshold; a PSI checker is being added at `scripts/psi-check.mjs` with `npm run psi:mobile` / `psi:desktop`. Warming, median-of-three, and `benchmarkIndex` reporting remain required (TVD-042) but are no longer sufficient. When a measurement is dismissed by a known mechanism, size the mechanism against the gap before accepting the dismissal.
- **Status:** FIXED — cause found and removed in WTV-042. The measurement tooling was fixed here; the site defect this entry originally dismissed was real and is fixed there.

### [WTV-042] The hero `<link rel="preload" as="image">` was costing 2.3s of LCP — the preload was the defect
- **Date:** 2026-07-29
- **Client:** sun-pool-spa (shared template)
- **Symptom / Finding:** PSI mobile scored the homepage 66 with LCP 5.7s, of which 2,012ms sat in "Element render delay" (WTV-041). The hero image's bytes were fully arrived by roughly 3.5s and the element still did not paint until 5.7s. The phase name pointed at paint cost, animation, or an opacity gate. It was none of those.
- **Root cause:** The `<link rel="preload" as="image">` on the hero was the cause — under PSI's emulated slow 4G it takes the highest-priority slot and delays render-blocking `assets/home.css`, and the hero cannot paint until that CSS is parsed, so preloading the image delays the very resource the image depends on.
- **Why the preload bought nothing in exchange:** the hero `<img>` is in the initial HTML, so the preload scanner finds it regardless — the preload was not buying discovery. And `fetchpriority="high"` on the `<img>` tag itself supplies the priority the preload was there to buy. It was pure cost.
- **Method — a mirrored lab, not the live site:** a scratch Cloudflare Pages project `ir-perf-lab` was created and the live Sun Pool homepage mirrored to it as static files (HTML plus every same-origin subresource), giving a byte-faithful baseline that can be A/B'd. Each arm was scored with PageSpeed Insights, mobile, 5-7 API calls per arm, median reported. **The lab is validated by agreement, not by assertion:** the baseline mirror scored median 64, matching the operator's independently reported 61-64 on the real site.
- **Two caveats on the method, disclosed because they bound how much the numbers prove:**
  1. **API calls are not distinct analyses.** PSI silently serves a cached analysis for a repeated identical request, and it is indistinguishable from a fresh run in the response body — the only reliable tell is `lighthouseResult.fetchTime`. The ad-hoc script used for these arms did **not** dedupe on `fetchTime`, so the effective number of distinct analyses per arm is unknown and is lower than the call count. `scripts/psi-check.mjs` does dedupe and warns; the ad-hoc script did not exist to be corrected. **What this does not undermine:** the arms are six independently deployed URLs, each measured in its own batch, so within-arm caching cannot manufacture a between-arm difference. The load-bearing evidence is the LCP separation across those six deployments (5.47-5.73s with the preload, 3.19-3.39s without, no overlap) and the 11x drop in element render delay, not the per-arm run count.
  2. **The mirror shows "Inventory unavailable"** because Pages Functions were not mirrored. That is identical across all arms, so comparisons hold, but the real site does more work — expect the absolute score on the live artifact to land below the 87 measured here. The ~2.3s LCP win is the transferable result; the exact score is not.
- **Homepage results — median performance / median LCP:**

| arm | hero preload | median perf | median LCP |
|---|---|---|---|
| baseline mirror, batch 1 | present | 64 | 5.64s |
| baseline mirror, batch 2 (later window) | present | 72 | 5.57s |
| responsive `srcset` 800/1200/1600 + matching `imagesrcset` preload | present | 70 | 5.47s |
| the above + `will-change:transform;contain:paint` on the blurred `.steam` layers | present | 70 | 5.73s |
| responsive `srcset` + `fetchpriority`, preload REMOVED | absent | 84 | 3.39s |
| **original 1600×1200 hero, no `srcset`, preload REMOVED** | absent | **87** | **3.19s** |

- **Removing the preload cuts median LCP from ~5.6s to ~3.2s — roughly 2.3 seconds — and the score from 64 to 87 in the batches above.**
- **The responsive `srcset` work contributed nothing measurable:** 84 with it against 87 without, and the arm *without* `srcset` was the better of the two. The obvious "oversized image" hypothesis was wrong. The fix is deleting one line, not adding responsive-image infrastructure to the token system.
- **Read LCP, not the score, when ranking arms:** PSI's runner `benchmarkIndex` ranged from **135 to 1246** across batches and is not monotonic with the score — one baseline batch scored **68 at bench 1010** and **72 at bench 474**. The composite score could not separate the arms. LCP could: four batches with the preload landed at **5.47-5.73s**, two without at **3.19-3.39s**, no overlap.
- **Negative result — do not repeat this A/B on category pages:** the same test on the mirrored **hot-tubs category page** found the preload **neutral** — 82 / LCP 3.83s with it, 83 / LCP 3.79s without. The effect is homepage-specific in magnitude. The counter-intuitive part: the category hero is **larger** (138KB, 1200×1600) than the homepage hero (91KB, 1600×1200), so image weight is not what discriminates — the homepage's heavier critical path is.
- **Second, separate defect found along the way — `imagesizes` with viewport units double-downloads:** `<link rel="preload" as="image" imagesrcset="..." imagesizes="100vw">` paired with `<img srcset="..." sizes="100vw">` fetched the image twice on a wide desktop viewport. Measured in Chrome at 2842×1598, DPR 1: the preload fetched the **800w candidate at 138ms** and the `<img>` then fetched the **1600w at 222ms** — both, **28KB plus 89KB**. Under mobile emulation (412×823, DPR 1.75, needing 721px) it correctly fetched only the 800w at 28KB. Cause: the preload scanner resolves `imagesizes` viewport units before the real layout viewport is known, so it can pick a different candidate than the layout engine. This is why `imagesizes` with viewport units is not used in this template, independent of the preload ruling.
- **Fix:** `<link rel="preload" as="image">` removed from `index.html`, `hot-tubs/index.html`, `saunas/index.html`, and `swim-spas/index.html`. It was removed from all four rather than the homepage alone because it is neutral-to-positive everywhere and one consistent rule is enforceable in a gate where "homepage only" is not.
- **Verification:** Measured, not reasoned. Six arms in the table above, each 5-7 PSI mobile runs with the median reported, against a byte-faithful mirror whose baseline independently agrees with the operator's number on the real site. The split is clean on the variable under test: every preload-present arm landed at LCP 5.47-5.73s, every preload-absent arm at 3.19-3.39s, with no overlap, across batches whose `benchmarkIndex` varied from 135 to 1246.
- **Rule / prevention:** gate checks now **forbid** `as="image"` preloads outright, in `scripts/scan-placeholders.mjs` and both `gate.mjs` copies. This reverses the previous rule, which required exactly one `as="image"` preload referencing the LCP hero — see TVD-040, second revision, and TVD-045.
- **Status:** FIXED in `premium-redesign`. Closes the open lever in WTV-041.
