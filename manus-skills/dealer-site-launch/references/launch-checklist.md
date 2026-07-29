# Launch Checklist — human-only items (Part B)

These are the Part B items a script cannot verify — gate.mjs emits them as
MANUAL. Work them at workflow step 8, after the mechanical gate passes.
Copy the full Part B checklist from `FINAL_DIAL_IN_AND_LAUNCH_GATE.md` into
the client repo as `LAUNCH_GATE.md`; an unchecked box blocks launch (Law 4).

## Runtime secret verification — run FIRST, on every deployment (WTV-047)

This one **is** mechanical, and it goes ahead of everything else because a blank
secret invalidates every test that follows it.

- [ ] **`ADMIN_PASSWORD='...' npm run secrets:verify -- https://<deployment-host>`
      returns exit 0** for the exact hash you are about to test or promote.

A secret is **not** verified because the dashboard lists its key. Cloudflare's API
returns `"value": ""` for every `secret_text` binding — including ones that
demonstrably work — so a populated secret and a blank one are indistinguishable
from outside the deployment. `/api/readiness` reports what the Function actually
sees: `present`, `empty` (bound but blank/whitespace), or `missing` (not bound).

Two rules this exists to enforce:

1. **Never `echo` a secret.** Use `printf '%s' "$VALUE" | npx wrangler pages
   secret put NAME --project-name <project>`. `echo` appends a newline. Worse, a
   pipeline like `echo "$TOKEN" | wrangler ...` writes an **empty** secret and
   exits 0 when `$TOKEN` is unset in that shell — a completely silent success.
2. **Re-run after every deploy, per host.** Pages binds environment variables at
   **deploy time**, so saving a value does not reach a running Function until the
   next deployment, and a pass on one hash says nothing about the next one.

Cost of skipping it: a production lead reached the Lead Vault with
`ghl_error: GHL not configured` and no CRM contact, while every control-plane
check reported Production as correctly configured (WTV-045).

## Meta CAPI + offline funnel (per-client onboarding — before or with staging)

Code ships ready; these pieces are **location-specific** and silent when missing
(attribution loss, not lead loss — decision-table). Do not enable the stage
workflow until stage names match the snapshot.

- [ ] **Six GHL custom field keys** in the client snapshot/location (exact
      keys): `fbp`, `fbc`, `meta_event_id`, `event_source_url`, `external_id`,
      `store_pixel_id`.
- [ ] **Three Cloudflare secrets**: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`,
      `META_OFFLINE_WEBHOOK_SECRET` (CAPI token never in GHL).
      **Set secrets with `printf '%s' "$VALUE" | wrangler pages secret put NAME`
      — never `echo`**: echo appends a trailing newline that corrupts the
      Bearer comparison and produces silent 401s on `/api/meta-offline`.
- [ ] **Pixel is hardcoded at build**: `build-config.mjs` `injectMetaPixel()`
      writes the full pixel snippet into every HTML page (independent of
      `client.config.js` at runtime; `data-cfasync="false"` defeats Rocket
      Loader). The gate hard-fails if `client.config.js` is missing from the
      dist root or any page loads `tracking.js` without `fbevents.js`.
      Spot-check live: view-source shows `fbq('init', <pixel id>)`, and Meta
      Pixel Helper shows exactly **one** PageView (tracking.js skips its
      fallback when `fbq` exists — two PageViews = a stale tracking.js).
- [ ] **GHL workflow** — Opportunity Stage Changed → `POST /api/meta-offline`
      with Bearer secret + merge fields (see `docs/GHL_META_OFFLINE_WORKFLOW.md`).
- [ ] **Stage-name alignment** — Qualified / Booked / Showed / Won (or snapshot
      equivalents) map to `QualifiedLead` / `Schedule` / `Showed` / `Purchase`;
      never guess mappings.
- [ ] **Events Manager custom conversions** — map `QualifiedLead` and `Showed`
      as custom conversions (undocumented fifth step; also in
      `docs/GHL_META_OFFLINE_WORKFLOW.md`).
- [ ] **Live verify**: Test Events browser+server Lead **DEDUPED**; Schedule on
      a real `/book/` booking shows **Browser + Server deduped as one event**
      (Worker sends `action_source: website` with the shared `event_id`;
      browser carries `value: 300` matching `META_VALUE_SCHEDULE`); one
      simulated stage → server `QualifiedLead`.

## Pre-launch (staging URL)

- [ ] **Defaults sign-off**: walk the client/owner through every token that
      shipped on its `|default` (from `--validate` output). Each one is a
      conscious yes, not a shrug.
- [ ] **Long-value spot-check at 390px**: header, footer, drawer, hero with
      the real business name and headline — no wrapping into the nav, no
      truncation.
- [ ] **Robots/canonical**: staging serves `noindex` (gate checks the meta,
      you check there's no stray production sitemap pointing at staging);
      canonicals point at the production domain; OG/Twitter tags filled and
      checked in a share-preview validator.
- [ ] **Cross-browser/device**: Safari + Chrome + one real Android or
      iPhone, at 390 and 1440. Glass blur, gradient text, clip-path shield,
      rails, date/select inputs.
- [ ] **PageSpeed Insights** on staging — `npm run psi:mobile -- <url>`, not
      local Lighthouse (TVD-044): **Perf ≥65 mobile / ≥90 desktop, A11y ≥95,
      SEO ≥90, CLS <0.1.** These are the numbers the script exits non-zero on,
      and they are the only launch gate — owner ruling, 2026-07-29. This list
      previously asked for 85 mobile / 95 SEO, which no real client site clears
      once its own photography, GA4 and Meta are loaded; the higher figures held
      launches hostage to a score the template cannot control. Aim higher, gate
      on these.
      Three PSI traps, all handled by the script — do not hand-roll API calls:
      (a) PSI may return a **cached** analysis for a repeated request, so N calls
      can be one measurement; the script counts distinct `fetchTime` values and
      warns. Never cache-bust with a query parameter — that bypasses the
      Cloudflare edge cache and measures a cold start instead of the site.
      (b) PSI's runner speed swings (`benchmarkIndex` 135-1294 observed on one
      URL, moving Perf 67→87). A number within ~10 points of the floor is not a
      pass; re-run it. Discard the first run against a fresh deploy hash.
      (c) `lcp-breakdown-insight` phases are relative weights, not a
      decomposition — they do not sum to LCP. Rank them; never quote them as
      absolute timings. When comparing two builds, trust **LCP over the score**.
- [ ] **At most one image preload, never with viewport-unit `imagesizes`
      (TVD-047 / WTV-044):** `rg -c 'as="image"' dist/index.html` must be 0 or 1.
      The template ships 0. NOTE: WTV-042 previously banned this outright on a
      2.3s LCP measurement — that was measured on a mirror without Pages
      Functions and did **not** replicate on a real deployment (+0.01s,
      overlapping ranges). If an audit tool recommends preloading the hero, it
      is neither wrong nor useful here; leave the markup alone.
- [ ] **Favicon set, sitemap generated + referenced, SSL green, www/non-www
      redirect chosen and enforced, 404 page live.**

## Before EVERY hydrate — template freshness (learned on build #1)

- [ ] **`git fetch` the template remote and confirm the checkout is current**
      before hydrating: `git rev-parse HEAD` must equal
      `git rev-parse origin/premium-redesign` — or exactly the commit named in
      the work order. NEVER hydrate from whatever copy happens to be on disk:
      build #1 redeployed a one-value GA4 fix from a stale checkout and
      silently dropped the WTV-019 Turnstile fix it was explicitly ordered to
      include. Record the hydrated template SHA in WIRING.md build provenance.

## Post-deploy smoke (EVERY deploy — staging and prod; learned on build #1)

Every completion report MUST paste the raw curl output of this section plus
the template SHA and gate JSON summary. A report that only claims success,
without evidence, is not done and will be sent back.

- [ ] **The deploy directory contains `functions/`** (gate.mjs now FAILs
      without it) and `wrangler pages deploy` runs from the dist root so
      Functions upload with the static files. Symptom of getting this wrong:
      every `/api/*` route answers with the homepage HTML instead of JSON —
      forms dead, product grids empty — while the static site looks perfect
      (build #1 shipped exactly this).
- [ ] **The deploy directory contains `_redirects` and `404.html`** (gate.mjs
      FAILs without them) — deploy the gated dist byte-exact, never a
      re-assembled subset. Smoke: `/hot-tubs.html` returns 301 →
      `/hot-tubs/`, a nonsense path returns 404, and
      `/active-inventory/<real-slug>/` serves the product template (NOT the
      homepage). Build #1 dropped both files on every deploy: all product
      URLs and 404s silently served the homepage with a 200, killing product
      pages and Product schema while everything looked fine.
- [ ] **Product route returns 200, proven mechanically:**
      `node scripts/verify-product-route.mjs https://<domain>`. It pulls a real
      slug from the live `/api/inventory` (never constructs one — WTV-031) and
      asserts the slug URL serves the shell with 200, the non-slash form 301s to
      it, and the `/active-inventory/` listing is not shadowed. A `_redirects`
      200-proxy destination must never end in `.html`: Pages 308-normalizes the
      extension away and does not chain redirects, so every product URL 404s
      while the rest of the site looks perfect (WTV-034). Gate check 15b now
      hard-fails this, but run the live check anyway — the gate reads the
      artifact, this reads what Pages actually served.
      The script now also **renders the page in headless Chrome** and asserts
      the displayed product name and the emitted Product JSON-LD match the live
      D1 record — HTTP checks alone cannot see a page that returns 200 and then
      renders "Product unavailable" (WTV-035). Set `CHROME_PATH` if the browser
      is not auto-detected; do not pass `--no-render` for a launch.

- [ ] **PageSpeed Insights is the number of record for performance (TVD-044):**
      `npm run psi:mobile -- https://<domain>` and
      `npm run psi:desktop -- https://<domain>`. PSI is the same machine for
      everyone, so the operator and the template author cannot disagree about
      the number. **Do not quote a local Lighthouse performance score as a
      pass** — two parties measuring the same bytes correctly produced 62 and
      99 because their runners differed (WTV-041). Local `lh:mobile` is kept
      only as a fast directional tool for A/B work, and any local A/B result
      must be confirmed on PSI before it is written down as a finding.
      **Discard the first run against a fresh deploy hash** — the edge cache is
      empty and you are scoring Cloudflare's cold start, not the site.
      **When comparing two arms, rank on LCP, not the composite score.** PSI's
      runner `benchmarkIndex` ranged 135 to 1246 across batches in WTV-042 and
      is not monotonic with the score — one baseline batch scored 68 at bench
      1010 and 72 at bench 474. LCP separated the same arms cleanly: 5.47-5.73s
      with the hero preload, 3.19-3.39s without, no overlap.
- [ ] **Lighthouse, scripted — not hand-run (WTV-036 / TVD-038):**
      `npm run lh:mobile -- https://<domain>` and `npm run lh:desktop -- https://<domain>`.
      Thresholds: accessibility >= 95, desktop >= 90, SEO >= 90 — **performance
      is signed off on PSI, not here.** The template scores **accessibility 100 on all 13 pages** at
      the certified SHA, so anything below 95 is a regression introduced by
      client content or config — not a template baseline. The script prints the
      specific failing audits.
      **SEO on a `*.pages.dev` hash is meaningless:** Cloudflare sends
      `X-Robots-Tag: noindex` on every Pages hostname, which costs ~34 points
      regardless of markup. The script marks SEO `EXEMPT` there. Re-run on the
      canonical domain after DNS cutover and only sign off on SEO then.
      `is-crawlable` failing on `/admin/` and `/404.html` is intentional.
      **Never gate on a cold deployment hash (WTV-041 / TVD-042):** a fresh
      Pages hash has an empty edge cache, and the LCP element is the hero
      image, so the first request for it goes to origin. Measured on one
      unchanged URL and one machine: cold = performance 89 / LCP 3.72s, warm =
      99 / LCP 1.71s. The script now warms the edge, runs 3x, and reports the
      median, so just running it is enough — but do not substitute a hand-run
      Lighthouse or a single `--no-warm` pass for it, and do not open a
      template defect off one cold number.
      **Read the `benchmarkIndex` line before believing a failure.** It prints
      the runner's CPU speed. Below ~1800 the same site loses several points
      for reasons that have nothing to do with the site; below ~1000 the score
      is not comparable at all. A slow runner is never exempted from the
      threshold — it just tells you whether to fix the site or the machine.
- [ ] **Launch photography is compressed (TVD-039):**
      `npm run images:optimize <dir> --out <dir>` before writing any image URL
      into `tokens.env`. Targets WebP, max edge 1600px, <=120KB, EXIF stripped.
      Hero and showroom images are client-supplied tokens the build never sees,
      so nothing else will catch an oversized file. Product photos uploaded via
      `/admin` are shrunk automatically in the browser and need no action.
- [ ] **Client photography is compressed before launch (WTV-037):**
      Hero and showroom images are client-supplied tokens, not template assets,
      and oversized uploads are the single largest mobile-performance cost. Each
      should be WebP, no wider than 1600px, and ideally <=120KB. No template
      change can fix a 167KB hero. Do **not** "fix" performance by deferring
      GA4, the Meta pixel, or Clarity — see TVD-037; that trade is refused.
- [ ] **Built artifact has no pinned product slug:**
      `rg 'data-product-slug' dist/active-inventory/SLUG/index.html` must return
      nothing. One shell serves every product URL, so a hydrated slug pins all
      units to one record. `PRODUCT_SLUG` was deleted from the token system in
      WTV-035 — if it reappears in a `tokens.env`, delete it. Gate check 15c
      also hard-fails this.
- [ ] **Deploy with `wrangler pages deploy` only — never raw API calls.** Raw
      API deploys can register the file manifest without uploading the blobs:
      routing "works" (308s on .html paths) while every asset returns an empty
      500. If wrangler errors, paste the error — do not fall back to the API.
- [ ] **`curl` the deployment before reporting it:** `/` and `/assets/theme.css`
      return 200.
- [ ] **Product images actually render — a 200 is not proof.** `primary_image`
      values must start with `/` or `https:`; relative paths fall back to the
      navy placeholder silently (WTV-032):
      `curl -s https://<domain>/api/inventory | grep -o '"primary_image":"[^"]*"'`
      Then open one product page and confirm a real photo, not the placeholder.
- [ ] **Product-page / Product-schema test uses a slug enumerated from D1**, never
      one constructed from manufacturer knowledge (WTV-031):
      `wrangler d1 execute <db> --remote --command "SELECT slug,status,featured FROM products"`
      (run outside the repo — its `wrangler.toml` is tokenized). Prefer
      `featured=1` + `status=available` so the homepage grid is covered too.
- [ ] **`GET /api/inventory?featured=1` returns 200 JSON.** A 500 (worker 1101)
      on a project that predates this build usually means D1 schema drift —
      diff live `sqlite_master` against `functions/db/schema.sql` and apply
      additive `ALTER TABLE` migrations (never DROP). Missing `featured` was
      build #1's version of this.
- [ ] **`POST /api/lead` with `{}` does NOT return 503.** A 503 "Lead vault is
      not configured" means `GOOGLE_SHEETS_ID` is missing — secrets alone are
      not enough. Set it on BOTH production and preview environments. The
      standing lead-vault service account for ALL clients is
      `paradise-lead-vault@paradise-spas-lead-vault.iam.gserviceaccount.com`
      (share each client sheet with it as Editor; key rotation happens in its
      GCP project, never per client).
- [ ] **NO captcha / security checker anywhere (TVD-025)** — Turnstile was
      removed from the template entirely (widgets, api.js loader, sitekey
      token, secret, server verification). Verify zero `cf-turnstile` /
      `challenges.cloudflare.com` references in the built dist, do NOT set
      `TURNSTILE_SECRET_KEY` or `TURNSTILE_SITE_KEY` on the Pages project
      (delete them on projects that predate the removal), and confirm a real
      form submit succeeds with no security-check step. History: on old
      templates a broken widget silently rejected 100% of leads
      (WTV-017/018/019, then fail-open TVD-024, now full removal). Spam
      control is the honeypot + server-side 24h dedupe.
- [ ] **Ignore "blocked from indexing" on `*.pages.dev` hash URLs** — Cloudflare
      auto-noindexes deployment-hash URLs. Check robots on the canonical
      project domain (and later the custom domain) only.
- [ ] **At least one product marked `featured=1` per category** (or the
      homepage featured grid intentionally empty and flagged).

## DNS cutover

Follow `references/dns-cutover.md`. It is a **two-day** procedure: the `www` TTL is
dropped 24 hours before the record changes, or a portion of the client's traffic
keeps reaching the old site for a full day while leads land in two places.

- [ ] Step 0 observations (`NS`, apex, `www`, TTL, `MX`, SPF) recorded in `WIRING.md`
      **before** any change, so a rollback has values to restore.
- [ ] `CLIENT_WEBSITE_URL` is the canonical host (`www` unless Cloudflare is
      authoritative for the zone) and the site has been **rebuilt** through it.
      Canonicals naming a host that 301s elsewhere makes every page a redirect.
- [ ] After cutover: `www` returns **200** and the apex returns **301** with the
      path preserved. A `301` on both is a redirect loop and the site is down.
- [ ] `MX` records identical to Step 0. Breaking a dealer's email is worse than
      breaking their website.

## Post-launch (within 1 hour of DNS)

- [ ] **Test lead from a phone on cellular** (not office wifi, not a
      browser emulator) → lands in the client's GHL sub-account with correct
      source/campaign/tags → automation fires. Use `verify_funnel` where
      available.
- [ ] **Inventory gate end-to-end once**: unlock it, confirm the unlock
      persists across a reload.
- [ ] **Call the tracked number; text the SMS link** — confirm routing to
      the client (or their tracking line), not to Paradise or SSA.
- [ ] **GA4 Realtime + Meta Test Events** show the cellular session on the
      CLIENT's IDs (not the template's — gate already fingerprint-checked,
      this confirms the live pipes).
- [ ] **GHL External Tracking stitch + dedupe (wiring ID #9)**: browse 2–3
      pages anonymously, submit the gate form, then confirm in the client's
      GHL that the contact timeline shows the PRIOR page views stitched in
      AND exactly ONE contact exists. Duplicate contacts = FAIL — the
      /api/lead pipeline and the tracking capture must dedupe-merge on
      email/phone; investigate before launch. (Key absent at launch is
      allowed — attribution loss only; add within 48h alongside GSC.)
- [ ] **Screenshot archive**: every page at 1440 and 390, stored alongside
      `WIRING.md` with the launch date.

## Booking calendar (/book/) — only if `tracking.ghlBookingCalendarId` is set

API-created appointments do not necessarily fire the same GHL automations as
native widget bookings. Never assume — verify in Execution Logs.

- [ ] Calendar has at least one **assigned team member** (free slots can show
      without one, but appointment creation fails without it).
- [ ] **Calendar `openHours` is not empty, and the offered window matches the
      store's posted hours in store-local time** (WTV-048). An empty
      `openHours: {}` does NOT disable booking — GHL silently serves a default
      window, which on Sun Pool's "Showroom Visit" calendar rendered as
      **05:00–13:30 Pacific**: 5 AM appointments offered, no afternoon or evening
      slot ever shown. Check it directly rather than by eye:
      `GET /calendars/<id>` → `openHours` must be populated, and
      `GET /calendars/<id>/free-slots?startDate=<ms>&endDate=<ms>` must return a
      first and last slot inside business hours.
      `secrets:verify` cannot catch this — it confirms `GHL_BOOKING_CALENDAR_ID`
      is present, not that the hours behind it are sane, so a PASS on the booking
      row is not evidence the calendar is usable.
- [ ] Load `/book/` on the live domain — real slots render (not request-mode).
- [ ] Make **one real test booking** end-to-end from the page.
- [ ] Appointment appears in GHL at the **correct store-local time** with the
      contact tagged `Intent - Showroom Visit` + `Campaign - booking`.
- [ ] Open **Automation → Execution Logs**: confirm the appointment-booked
      workflow actually fired for the API-created appointment. If it triggers
      on a different appointment status than `confirmed`, adjust the workflow
      trigger (or flag the mismatch) before sign-off.
- [ ] Confirmation SMS/email reached the test contact.
- [ ] If the calendar syncs with Google Calendar: know that sync lag
      (~30–60 s) can rarely double-book a slot. GHL is the source of truth;
      the page's slot-taken retry handles the rejection path. No action —
      just don't promise the client it is impossible.
- [ ] Delete the test appointment and test contact.

## Search indexing (same day as DNS)

Submission is automatable; Google indexing itself is not. These steps get the
site *discovered* — the day-7 step below verifies it actually got crawled.

- [ ] **Verify the GSC property** using the meta-token method: put the
      client's token in `tracking.gscVerification`, rebuild, deploy, click
      Verify in Search Console. (Token absent at launch = launch proceeds,
      open wiring item, verify within 48h — decision-table.md.)
- [ ] **Submit `sitemap.xml` in GSC** (Sitemaps report → enter
      `https://<domain>/sitemap.xml` → status "Success").
- [ ] **Request Indexing** via URL Inspection on the homepage, the inventory
      page, and one category page. Manual only — Google's Indexing API does
      not cover normal pages; anyone selling "instant Google indexing" for
      regular URLs is guessing.
- [ ] **IndexNow**: `node manus-skills/dealer-site-launch/scripts/indexnow.mjs
      --init` at build, redeploy so the key file is live, then
      `--submit <domain>`. Covers Bing/Yandex instantly; Google does not use
      IndexNow.
- [ ] **Update the client's Google Business Profile website link** to the
      new domain — often the single biggest local-traffic lever, and the one
      most often forgotten. (No GBP at all → flagged at Checkpoint 1;
      creating one is an upsell, not a blocker.)

## Day-7 crawl verification (scheduled — put it on the calendar at launch)

- [ ] **GSC Pages report**: indexed count ≥ (sitemap URL count − pages
      intentionally excluded). Sitemap count is in the gate output / the
      sitemap itself.
- [ ] Any URL sitting in **"Discovered – currently not indexed"** or
      **"Crawled – currently not indexed"** → individual Request Indexing
      via URL Inspection.
- [ ] **Log the indexed count and date in the client's `WIRING.md`** so the
      next review has a baseline.

## Sign-off

HUMAN CHECKPOINT 2 = every box above checked + gate.mjs all-PASS on the
production build (`--env prod`). Then, and only then, DNS.
