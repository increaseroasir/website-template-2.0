# Website Template 2.0 — Template Decisions Log

**This file, at the root of `increaseroasir/website-template-2.0` (`premium-redesign`), is the single source of truth for template decisions.** It consolidates the former fulfillment-workspace ledger (TVD-001–027) and the command-center ledger (renumbered TVD-028–029, plus the TVD-023 addendum). Copies elsewhere are read-only mirrors.

This file records why the template is built the way it is. Every architectural decision, design choice, and "should I ask?" ruling that has been made. Never contradict a recorded decision without flagging it to Alex first.

**Write-back rule:** After any session where a template decision was made, a ruling was issued, or a "should I ask?" case was resolved — append a new entry before closing. Commit it to this repo.

**Read rule:** At the start of every client build session, read this file. If a client request contradicts a recorded decision, escalate to Alex — do not silently override it.

---

## Entry Format

```
### [TVD-NNN] Short title
- **Date:** YYYY-MM-DD
- **Context:** what situation prompted the decision
- **Decision:** what was decided
- **Reasoning:** why
- **Applies to:** all builds | specific client | specific component
```

---

## Entries

### [TVD-001] Hydrate, never rebuild
- **Date:** (template certification date)
- **Context:** Client builds should be fast and consistent
- **Decision:** A client build touches ONLY config, token values, and image assets. Shared CSS/JS/markup is frozen.
- **Reasoning:** Rebuilding from scratch introduces drift, inconsistency, and regression risk. The template is the product — client customization is configuration, not engineering.
- **Applies to:** All builds

### [TVD-002] Navy + gold palette is non-negotiable
- **Date:** (template certification date)
- **Context:** Brand identity for the Hot Tub Launch fleet
- **Decision:** Navy and gold are load-bearing. Logo, copy, photos, and market change per client; the palette does not.
- **Reasoning:** Fleet consistency is the brand. Individual client palette requests are escalated to Alex as template-repo requests, never applied to a single client build.
- **Applies to:** All builds

### [TVD-003] No aggregateRating schema under 10 reviews
- **Date:** (template certification date)
- **Context:** Review count varies by client
- **Decision:** Never add JSON-LD aggregateRating if the client has fewer than 10 reviews. Omit the schema entirely rather than fabricate or inflate.
- **Reasoning:** Fabricated schema data is a hard prohibition. Fewer reviews than the layout expects → ship what's real.
- **Applies to:** All builds

### [TVD-004] Client builds live inside the canonical template workspace
- **Date:** 2026-07-25
- **Context:** The project stores Website Template v2 under `templates/website-template-v2/`, while its client scaffold and intake scripts previously wrote to a top-level `clients/` directory.
- **Decision:** Store every client build at `templates/website-template-v2/clients/<client-slug>/`; resolve all scaffold, intake-mapping, hydration, and client-note paths relative to the Website Template v2 directory.
- **Reasoning:** The client configuration, maintenance logs, and source template must remain co-located so a client build inherits the certified template and does not create a parallel, untracked project structure.
- **Applies to:** All builds

### [TVD-005] Retrieve connected identifiers before asking the human
- **Date:** 2026-07-25
- **Context:** Client setup requires platform identifiers such as GHL location IDs, analytics IDs, and public integration keys. Connected systems can often provide these values directly.
- **Decision:** Never ask the human for an identifier a connected tool can retrieve. Ask only after retrieval fails or the match is ambiguous, and then present the exact failure or the candidate records for confirmation.
- **Reasoning:** This removes avoidable client-side work while preserving accuracy, traceability, and protection against assigning a wrong account, location, or tracking destination.
- **Applies to:** All builds


### [TVD-006] Retrieve the Pages staging hostname; never derive it from a slug — **Turnstile portion SUPERSEDED by TVD-025**
- **Date:** 2026-07-25
- **Context:** Turnstile hostname management requires the actual Cloudflare Pages staging hostname before the widget can be created.
- **Decision:** Query the connected Cloudflare account for the client’s Pages project and use its returned `subdomain` or project domains. Never assume a hostname from the client slug; if no project exists, create or link the deployment project first, then create the Turnstile widget.
- **Reasoning:** A guessed hostname leaves staging forms unprotected and violates the no-silent-guessing rule for launch-critical wiring.
- **Applies to:** All builds


### [TVD-007] Turnstile secrets never enter repository or ClickUp records — **SUPERSEDED by TVD-025 (Turnstile removed entirely)**
- **Date:** 2026-07-25
- **Context:** A client build needs the public Turnstile site key in browser code but the private secret key only at the verification endpoint.
- **Decision:** Record the public `0x…` site key in intake, tokens, configuration, and WIRING.md. Never copy the Turnstile secret key into Git, ClickUp, task comments, screenshots, or operator notes; the owner sets it directly as `TURNSTILE_SECRET_KEY` in the Pages/Worker secret store.
- **Reasoning:** The public key is required for client-side rendering; the secret grants server-side verification authority and must remain in the approved secret store.
- **Applies to:** All builds

### [TVD-008] GA4 properties are client-specific: reuse only after exact verification
- **Date:** 2026-07-25
- **Context:** An agency Analytics account can contain properties for multiple clients, but a new client may have no verified property or production-domain stream.
- **Decision:** Search the authorized agency account for an exact client property and a stream tied to the verified production domain. Reuse only that verified exact match; otherwise create a separate client-named property and Web stream. Never repurpose another client’s property or infer an ID from generic application markup.
- **Reasoning:** Client-specific properties preserve ownership, reporting isolation, and accurate Measurement ID capture.
- **Applies to:** All builds

### [TVD-009] Meta tracking assets remain client-owned unless an explicit exception is approved
- **Date:** 2026-07-25
- **Context:** Meta Pixel access can be missing even when a client website build is otherwise ready for staging.
- **Decision:** First inspect whether the client already owns a Meta Pixel or Business portfolio. If so, request agency partner access and verify the client-owned Pixel. If not, create the asset under the client’s Business portfolio and grant agency partner access. Creating under the agency Business Manager, or migrating ownership later, requires explicit written approval and a documented migration plan.
- **Reasoning:** Client ownership prevents avoidable migrations, preserves continuity, and avoids silently placing a client’s tracking asset under the wrong Business Manager.
- **Applies to:** All builds

### [TVD-010] A native ClickUp mirror is mandatory before a client build can claim operational readiness
- **Date:** 2026-07-25
- **Context:** The Sun Pool & Spa audit found a master-client task without the required native `Wiring IDs` and `48-hour fix list` checklists or a ledger comment.
- **Decision:** Before or at client-workspace initialization, create or link one client-specific ClickUp mirror task. Its status, native `Wiring IDs` checklist, native `48-hour fix list` checklist, owner notes, and timestamped ledger comment must mirror WIRING.md. Git and WIRING.md remain the source of truth. Record only public IDs and secret-store references; never place secret values in ClickUp.
- **Reasoning:** A task without native checklists cannot reliably communicate launch blockers or ownership. The mirror must be auditable rather than inferred from a generic master-client record.
- **Applies to:** All builds


### [TVD-011] Offline Meta stage events are a secured shared-template feature
- **Date:** 2026-07-25
- **Context:** Sun Pool & Spa required the documented `/api/meta-offline` route for GHL opportunity-stage conversion events, but the certified template contained only browser-lead CAPI handling. This is an explicit, user-approved shared-template enhancement rather than a standard client configuration edit.
- **Decision:** Implement the route once in Website Template v2 as an authenticated Pages Function. Accept only a Cloudflare-held Bearer secret, validate the GHL location when supplied, map only `Qualified`, `Booked`, `Showed`, and `Won` to approved Meta event names, and return a non-error skip for unsupported stages. Keep `META_CAPI_ACCESS_TOKEN` exclusively in Cloudflare; GHL receives only `META_OFFLINE_WEBHOOK_SECRET`.
- **Reasoning:** This retains client-specific tracking ownership and permits reliable offline conversion reporting without leaking the Meta token into GHL, Git, ClickUp, or a URL. Centralizing the function avoids every client independently inventing an insecure webhook receiver.
- **Applies to:** All builds that opt into GHL opportunity-stage offline conversion tracking.


### [TVD-012] Hydration is a safe, environment-explicit build step
- **Date:** 2026-07-25
- **Context:** Client token values can contain ordinary business copy and asset paths that are unsafe to evaluate as shell syntax, while staging and production require different robots directives.
- **Decision:** Use `scripts/hydrate-client.mjs <client-slug> --env staging|prod` for every client artifact. It must parse `tokens.env` as data, never source or execute it, build into `clients/<slug>/dist`, and set robots behavior explicitly for the selected environment.
- **Reasoning:** This prevents configuration text from becoming executable input, keeps artifacts isolated from the template source, and makes index-control behavior testable.
- **Applies to:** All builds

### [TVD-013] Public R2 delivery must be verified before admin uploads are enabled
- **Date:** 2026-07-25
- **Context:** The Sun Pool & Spa R2 bucket binding exists, but its public development URL or custom delivery domain has not been verified under the deployment account.
- **Decision:** Mark `R2_PUBLIC_BUCKET_ID` as `UNCONFIGURED` until a verified public R2 URL is available. The admin upload endpoint must return a controlled configuration error rather than upload an image and return a non-public key.
- **Reasoning:** Inventory images must be displayable after upload; silently accepting uploads without a usable URL produces broken inventory media and hides a launch blocker.
- **Applies to:** All builds using R2-backed inventory images

### [TVD-014] increase-roas-os is the MEMORY repo — NEVER a build source
- **Date:** 2026-07-25
- **Context:** The Sun Pool & Spa staging build was generated by running `scripts/hydrate-client.mjs` against the template files inside `increase-roas/increase-roas-os` (commit `55c47fe`). The resulting dist shipped hardcoded template meta-text ("Category pages pull matching inventory from D1, then route product leads with product-level tags." and "{{CLIENT_MARKET}} dealer website template. Inventory, pricing, CRM routing, and tracking are client-configured.") as visible copy, and the gate.mjs script was never run against the output. The owner identified the defect on visual review.
- **Root cause:** The agent treated `templates/website-template-v2/` inside `increase-roas-os` as a certified build source. It is not. That directory is a **memory artifact** — it holds brain-loop notes, WIRING.md, NOTES.md, client intake, and reference docs. The HTML files there contain unfixed template meta-text and are not the certified production template.
- **Decision:** The **only** permitted build source is the `website-template-2.0` repo (certified, latest commit on its `main` branch). The build path is: `new-client.mjs --init` → `map-intake.mjs` → fill `client.config.js` + `tokens.env` → `gate.mjs --env staging` → deploy. The `increase-roas-os` repo is read for brain loop (KNOWN_ISSUES, TEMPLATE_DECISIONS, client NOTES/WIRING) and written for session write-backs — it is never a hydration source or a dist output target.
- **Applies to:** All builds. Any agent that cannot locate the `website-template-2.0` repo must STOP and ask Alex for the repo URL before touching any dist.

### [TVD-015] Deploy exclusively via wrangler CLI — never the raw CF Pages API
- **Date:** 2026-07-28
- **Context:** Six consecutive Sun Pool & Spa deployments via the raw Cloudflare Pages direct-upload API returned HTTP 500 on every route. The CF Pages API requires a two-phase protocol (manifest registration + blob upload). The Python scripts used completed only phase 1, leaving deployments with registered file names but no actual file content. URL normalization 308 redirects worked (proving the manifest registered) but all asset fetches returned empty 500 responses.
- **Decision:** All CF Pages deployments must use `npx wrangler@3 pages deploy <dist-path> --project-name <name> --branch <branch> --commit-dirty=true`. Wrangler handles the full manifest + blob upload protocol correctly. Raw API deployment is forbidden regardless of circumstances.
- **Applies to:** All builds.

### [TVD-016] All multi-word token values in tokens.env must be double-quoted
- **Date:** 2026-07-28
- **Context:** `ROBOTS_DIRECTIVE=noindex, follow` (unquoted) caused the shell to interpret `, follow` as a separate command when the file was sourced with `set -a && . tokens.env`. The variable resolved to empty, and `build-config.mjs` fell back to `index,follow`, producing a production robots directive on a staging build.
- **Decision:** Every token value in `tokens.env` that contains spaces, commas, em-dashes, or other shell-special characters must be wrapped in double quotes. Agents populating `tokens.env` must quote all values defensively.
- **Applies to:** All builds.

### [TVD-017] HOME_HERO_SUBHEAD must be distinct from HOME_HERO_PROOF_LINE
- **Date:** 2026-07-28
- **Context:** `HOME_HERO_SUBHEAD` was absent from the initial Sun Pool & Spa `tokens.env`. `build-config.mjs` fell back to the `client.config.js` `subhead` value, which matched `HOME_HERO_PROOF_LINE` ("Serving East County since 1979"). The homepage hero rendered the same sentence twice — once bold, once plain.
- **Decision:** `HOME_HERO_SUBHEAD` is a required token and must always contain copy that is distinct from `HOME_HERO_PROOF_LINE`. The proof line is the credibility anchor (founding year, years in business). The subhead must be a supporting value proposition built only from verified intake facts (showroom location, product categories, financing). Agents must populate both tokens explicitly and verify they differ before hydration.
- **Applies to:** All builds.

### [TVD-018] functions/db/ must be excluded from all dist artifacts
- **Date:** 2026-07-28
- **Context:** The `functions/db/` directory contains D1 migration SQL. It was copied into the dist during hydration because the `find+cp` exclusion list did not include it. CF Pages may attempt to route requests through the Worker pipeline for files in `functions/`, causing unexpected behavior.
- **Decision:** `functions/db/` must be removed from the dist as a mandatory post-build step (`rm -rf dist/functions/db/`). The directory is only needed at D1 setup time and must never ship in a deployed artifact.
- **Applies to:** All builds.

### [TVD-019] wrangler.toml tokens must be hydrated in a post-build step
- **Date:** 2026-07-28
- **Context:** `build-config.mjs` substitutes `{{TOKEN}}` placeholders in `.html` files but does not process `wrangler.toml`. The dist `wrangler.toml` shipped with six unresolved tokens, causing the gate's wrangler.toml check to fail.
- **Decision:** After `build-config.mjs` completes, agents must apply `sed` substitutions for all six wrangler.toml tokens: `{{CLOUDFLARE_PAGES_PROJECT}}` (slug), `{{D1_DATABASE_NAME}}`, `{{D1_DATABASE_ID}}`, `{{R2_BUCKET_NAME}}`, `{{ALLOWED_ORIGIN}}` (production domain), and `{{R2_PUBLIC_BUCKET_ID}}` (or `UNCONFIGURED` if not yet set).
- **Applies to:** All builds.

### [TVD-020] Verify template freshness before EVERY hydrate
- **Date:** 2026-07-28
- **Context:** A two-part work order (pull template `24a700c` + fix GA4 ID) was executed from a stale on-disk template checkout: the config fix shipped, the ordered template fix silently didn't (WTV-024).
- **Decision:** Before hydrating, `git fetch` the certified template remote and confirm checkout HEAD equals the remote branch HEAD — or the exact commit SHA named in the work order. Mismatch or failed pull = STOP and report. Record the hydrated SHA in WIRING.md and the completion report.
- **Applies to:** All builds.

### [TVD-021] Deploy the gated dist byte-exact — never a re-assembled subset
- **Date:** 2026-07-28
- **Context:** Deploy assemblies dropped `functions/` on one deploy (WTV-022: every /api/* dead) and `_redirects` + `404.html` on all deploys (WTV-023: product URLs and 404s served the homepage). The gate had passed the dist; what shipped was not the dist.
- **Decision:** The directory given to `wrangler pages deploy` must be the exact artifact the gate passed — same file set, including `functions/`, `_redirects`, `404.html`. gate.mjs (≥ `e348891`) hard-FAILs artifacts missing these. Post-deploy smoke must confirm: `/api/inventory` returns JSON, `/hot-tubs.html` 301s, a nonsense path 404s, one real product slug serves the product template.
- **Applies to:** All deploys, staging and production.

### [TVD-022] Completion reports must embed evidence — a claim without proof is not done
- **Date:** 2026-07-28
- **Context:** A deployment with zero working APIs was reported as "13 PASS / 0 FAIL" because the static gate passed and the required post-deploy smoke was skipped (WTV-022). Every unevidenced report costs a full verify-correct-redo round trip.
- **Decision:** Every build/deploy completion report must include: the hydrated template SHA, the gate JSON summary, raw post-deploy smoke curl output, and any specific grep/check the work order requested. Reports missing evidence are incomplete by definition.
- **Applies to:** All client work sessions.

### [TVD-023] GHL_BASE_TAGS=new-lead is the website↔snapshot handshake
- **Date:** 2026-07-28
- **Context:** `functions/lib/ghl.js` stamps the `GHL_BASE_TAGS` env var onto every contact the website creates. The snapshot's intake workflow triggers on a tag. If the two diverge, leads reach GHL but start zero automations — a silent failure where everything looks wired.
- **Decision:** Every website build sets the Cloudflare env var `GHL_BASE_TAGS` to the standard entry tag `new-lead` on BOTH Production and Preview. Every snapshot's intake workflow triggers on that same `new-lead` tag. Neither side may rename ad hoc. Live verification: a test lead's contact carries `new-lead` AND the intake workflow shows a run in Execution Logs.
- **Addendum (2026-07-28, snapshot-test):** Also set in the template's `wrangler.toml` under `[vars]` so future builds inherit it. It is not sensitive — use a plain env var, never a secret. Live-verified: GHL contact `tbq74RtiqklXk7UPYGNv` created with tags `['src-organic', 'new-lead', 'intent - send price and availability']`. Retroactively applied to live clients `snapshot-test`, `paradise-spas`, `sun-pool-spa`, `hottublaunch` on 2026-07-28 via CF Pages API. If the trigger tag ever changes, update `wrangler.toml` (template) + each client's Pages env vars — no code changes required.
- **Applies to:** All builds and all snapshots.
### [TVD-024] Turnstile is fail-open — a security check may never zero out lead flow
- **Date:** 2026-07-28
- **Context:** With `TURNSTILE_SECRET_KEY` set, the server rejected any submission without a token. Every widget-rendering failure (missing sitekey, blocked/slow api.js, injection race — the WTV-017/019/020 class) therefore silently rejected 100% of leads while the page looked fine. Build #1 lost live leads to this twice.
- **Decision:** As of template `511fa37`, `verifyTurnstile` fails open: a MISSING token (or a siteverify outage) accepts the lead and tags the GHL contact `security-unverified` for client-side filtering; only a token Cloudflare explicitly rejects returns the security error. A lost human lead costs more than a spam row. Widgets stay on the forms — the tag preserves the spam signal without gating capture.
- **Applies to:** All builds from `511fa37` onward. Snapshots may add a `security-unverified` review step but must not auto-discard those contacts.
### [TVD-025] No captcha / security checker anywhere — Turnstile removed entirely (supersedes TVD-024)
- **Date:** 2026-07-28
- **Context:** Even after the fail-open change (TVD-024), the owner ruled that customer-facing forms must never show a security checker: broken widgets burned live leads twice on build #1 and the widget adds friction with no business upside. Fail-open kept the widget as a spam label; the owner wants it gone.
- **Decision:** Turnstile is removed from the template completely: no `.cf-turnstile` widgets, no `challenges.cloudflare.com` api.js loader, no `TURNSTILE_SITE_KEY` token/config key, no server-side verification (`verifyTurnstile` deleted). NEVER set `TURNSTILE_SECRET_KEY`/`TURNSTILE_SITE_KEY` on a Pages project — delete them from legacy projects. Spam control = the off-screen honeypot (server rejects `website_url`-filled posts) + 24h duplicate detection. gate.mjs hard-FAILs any artifact containing a turnstile reference (stale-template detector).
- **Applies to:** All builds from template `premium-redesign` HEAD after 2026-07-28. The intake sheet/validator no longer collects or requires a Turnstile key.
### [TVD-026] Financing page is a locked full-screen funnel → /book/, tagged `financing-request`
- **Date:** 2026-07-28
- **Context:** The financing survey card floated on a mostly-empty page with full nav/footer — visitors could wander off mid-quiz, and financing leads carried no stable tag for snapshot workflows to route on.
- **Decision:** `/financing.html` is now a distraction-free funnel: no nav, no footer, page scroll locked (`html:has(body.financing-lock)` + card scrolls internally on short viewports). The only exits are the phone number and completing the survey, whose success redirect goes to `/book/` (`data-thank-you-url="/book/"`, inline success mode removed). Server-side, `functions/lib/ghl.js` stamps **`financing-request`** on any lead whose `lead_source` contains `financing` — snapshots must trigger financing workflows on that tag, not on campaign text.
- **Applies to:** All builds from template `premium-redesign` HEAD after 2026-07-28. Survey markup/IDs/data-attributes are unchanged; only the shell, success routing, and tagging changed.
### [TVD-027] Product detail page = Paradise-style sales layout, driven by five new D1 content fields
- **Date:** 2026-07-28
- **Context:** The old `/active-inventory/<slug>/` page was three thin generic sections — it looked premium but sold nothing. The owner ruled the proven paradisespas.com product-page structure (benefit headline → quick facts → why-bullets → about → best-for → inline pinned form → FAQ) converts and must become the template layout, in the premium navy/gold skin.
- **Decision:** `active-inventory/SLUG/index.html` rebuilt: slim strip (back link + urgency line, token `PRODUCT_STRIP_NOTE`), dark ambient hero (kicker = `promo_label`, H1 = `headline` || name, sub = `hero_description`), two-column body with a sticky glass price card (recipe C; ask-treatment when no price; financing CTA → `/financing.html`), Quick Facts grid (all `quick_facts`), "Why This One Stands Out" gold-check list (`why_bullets`), "About the <name>" (`long_description`), gold Best For callout (`best_for`), inline lead form pinned to the exact unit, and a 5-item generic-honest FAQ. Five new optional `products` columns back it: `headline`, `hero_description`, `why_bullets` (JSON), `long_description`, `best_for` — in schema.sql for new DBs, `functions/db/migrations/2026-07-product-content.sql` for existing DBs. Sections auto-hide when their field is empty; admin form + API accept the new fields. Also fixed: assigning a non-option value (e.g. availability intent "Price Request") to the visible `form_intent` select blanked it — `setHidden` now appends the value as a real option.
- **Applies to:** All builds from template `premium-redesign` HEAD after 2026-07-28. Existing client D1 databases need the one-time migration before their next deploy from this HEAD.
- **Addendum (same day):** Owner review against the Paradise reference added the remaining conversion elements: (1) sixth optional column `positioning_label` (≤60, e.g. "VALUE / FAMILY COMFORT") — hero kicker segment tag, falls back to `promo_label` then category; included in the same migration file. (2) Gold model-name subtitle under the H1 when `headline` is set. (3) Pending/sold **status callout box** in the price card ("This unit is pending pickup" / "This exact unit recently sold") with backup-inquiry / restock-list copy; all page CTAs swap to the status `formButton` from product-data.js. (4) Available-status CTA renamed to **"Get Out-the-Door Price"** and an out-the-door promise line ("taxes, delivery & startup quoted in writing") added to the price card, form lead-in, and FAQ. (5) **Sticky mobile CTA bar** (`.pdp-mbar`: Call + status CTA, night-glass canon) that appears once the hero scrolls away and hides while the form is on screen. (6) Post-submit **booking invite**: on inline form success, lead-form.js reveals any `[data-lead-reveal]` element in the form's section — the product page ships one ("Want to see it in person?" → `/book/`, address/hours from `CLIENT_MAP_URL`/`CLIENT_ADDRESS`/`CLIENT_HOURS` tokens). (7) Pulsing scarcity stock line in the price card from the real `quantity` field; breathing gold orbit frame on the hero photo; gold sweep hairline on the strip's bottom edge.

### [TVD-028] Meta Pixel is hardcoded into HTML at build time, not injected at runtime via CLIENT_CONFIG
- **Date:** 2026-07-28
- **Context:** WTV-026 — a missing or cached `client.config.js` silently killed the pixel (and all runtime tracking) with no console error. Cloudflare Rocket Loader could additionally defer inline scripts.
- **Decision:** `build-config.mjs` → `injectMetaPixel()` writes the full pixel snippet (`<script data-cfasync="false">` + `fbq('init', PIXEL_ID)` + PageView + noscript img) directly into every HTML file's head during the build, immediately before the `client.config.js` script tag. Runs after token replacement; skipped only if `META_PIXEL_ID` is empty or still a `{{TOKEN}}`. `tracking.js` keeps its config-based init strictly as a fallback — it skips when `fbq` already exists, so PageView never fires twice.
- **Reasoning:** Pixel initialization must be unconditional. Pixel Helper and Test Events need `fbq` present on page load; dynamic injection inside a deferred script can miss that window. `data-cfasync="false"` eliminates the Rocket Loader failure mode.
- **Gate enforcement:** `scan-placeholders.mjs` and skill-pack `gate.mjs` hard-fail if `client.config.js` is missing from the dist root or any page loads `tracking.js` without `fbevents.js`.
- **Applies to:** All builds.

### [TVD-029] Purchase workflow uses `{{opportunity.lead_value}}` directly; no contact-field mirror needed
- **Date:** 2026-07-28
- **Context:** WTV-028 — GHL-007 says opportunity fields send empty in webhook bodies, but live testing proved `{{opportunity.lead_value}}` resolves correctly (`"5000"` received) while `{{opportunity.monetary_value}}` and `{{opportunity.date_updated}}` send empty.
- **Decision:** The GHL Sold/Purchase stage-change webhook sends `"value": "{{opportunity.lead_value}}"` in the body; the Worker reads `body.value`, converts to number, and sends to Meta. No intermediate contact-field mirror. The Worker's value fallback chain (`body.value → body.lead_value → body.actual_sale_value → META_VALUE_*`) covers other events; Purchase alone hard-fails on missing value (correct per Meta spec).
- **Reasoning:** The mirror pattern adds workflow complexity with no benefit when the source field resolves. GHL-007 is now scoped to **system** opportunity fields only — any other opportunity field must be tested against the diagnostic endpoint before use in a webhook body.
- **Applies to:** All snapshots/workflows using the Purchase offline event.

### [TVD-030] Homepage offer/guide/massage/floor-count/response-promise sections are optional — build-time IF-blocks hide them when their control token is unset
- **Date:** 2026-07-28
- **Context:** The Sun Pool rebuild hard-blocked on 19 no-default tokens (`OFFER_*` ×13, `GUIDE_*` ×5, plus `FLOOR_COUNT_LABEL`, `HOME_RESPONSE_PROMISE`, `MASSAGE_CATEGORY_SUMMARY`) because those homepage sections were unconditional HTML: a client with no live promo, no guide asset, no massage products, no floor count, or no response-time commitment had no compliant way to ship — the only options were inventing copy (forbidden) or shipping literal placeholders (gate-fail).
- **Decision:** `build-config.mjs` now processes `<!-- IF:TOKEN -->…<!-- /IF:TOKEN -->` blocks before token replacement: if the control token has a usable value the markers are stripped and the section ships; if not, the entire block is removed. Controls and their members: `OFFER_NAME` → all offer surfaces (announcement marquee, drawer nav link, hero offer chip, `#offer` section, final-CTA countdown + ends-label, footer offer link; leftover `OFFER_*` occurrences outside blocks, e.g. the body's `data-offer-ends` attribute, are blanked); `GUIDE_HEADLINE` → guide band; `MASSAGE_CATEGORY_SUMMARY` → massage category card; `FLOOR_COUNT_LABEL` → floor-count line; `HOME_RESPONSE_PROMISE` → the "— {{promise}}" clause after the hero call/text line. If a control IS set but a member token is blank, the placeholder survives and `scan-placeholders` fails the build — partial sections are not allowed.
- **Reasoning:** Same empty-hydration philosophy as the product page (TVD-027 sections auto-hide) and the GSC meta strip: real content or no section, never filler. A fabricated countdown/promo is a trust liability; a permanently empty "–d –h –m" clock is broken-looking. Hiding is the only honest default.
- **Applies to:** All builds from `premium-redesign` HEAD after this commit. Token registry rows for these tokens are marked `optional-section (CONTROL)`. Validators must not count member tokens as required when the control is unset.

### [TVD-031] Copy tokens ship with prefilled defaults — only client facts are required
- **Date:** 2026-07-28
- **Context:** The template had 211 no-default tokens. Most were generic marketing copy (step titles, FAQ answers, comparison rows, promise points, benefit blurbs, form microcopy) that forced every build to source ~150 values from the owner even though dealer-neutral copy works for any client. This bloated intake, produced long NEEDS_OWNER_INPUT lists, and blocked builds on trivia like a response-time promise.
- **Decision:** Every generic-copy token now carries a professional default directly in the HTML via the existing `{{TOKEN|default}}` syntax (151 tokens across 11 pages). All defaults are claim-free: no invented years-in-business, review counts, staffing, giveaways, or service promises. Card-template internals that JavaScript overwrites at runtime (`PRODUCT_*`, `ADMIN_STAT_*`) also got render-safe defaults so raw placeholders can never ship even with JS disabled. The required no-default set is now **60 tokens, all client facts**: `CLIENT_*` identity/contact, hero/category/visit images, `REVIEW_*` (real reviews only), `STAT_*` (real numbers only), and SEO titles/meta for indexed pages. Both token registries mark prefilled rows with their default and `required: no`.
- **Reasoning:** Facts must come from the client; copy is our craft. A default is template canon, not invented client claims — overriding it per client is an upgrade, not a requirement. This shrinks intake to what only the owner can provide.
- **Applies to:** All builds from `premium-redesign` HEAD after this commit. Intake validators should hard-require only the 60 fact tokens; prefilled tokens are override-optional.
