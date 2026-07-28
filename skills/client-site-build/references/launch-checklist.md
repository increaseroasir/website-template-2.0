# Launch Checklist — human-only items (Part B)

These are the Part B items a script cannot verify — gate.mjs emits them as
MANUAL. Work them at workflow step 8, after the mechanical gate passes.
Copy the full Part B checklist from `FINAL_DIAL_IN_AND_LAUNCH_GATE.md` into
the client repo as `LAUNCH_GATE.md`; an unchecked box blocks launch (Law 4).

## Meta CAPI + offline funnel (per-client onboarding — before or with staging)

Code ships ready; these pieces are **location-specific** and silent when missing
(attribution loss, not lead loss — decision-table). Do not enable the stage
workflow until stage names match the snapshot.

- [ ] **Six GHL custom field keys** in the client snapshot/location (exact
      keys): `fbp`, `fbc`, `meta_event_id`, `event_source_url`, `external_id`,
      `store_pixel_id`.
- [ ] **Three Cloudflare secrets**: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`,
      `META_OFFLINE_WEBHOOK_SECRET` (CAPI token never in GHL).
- [ ] **GHL workflow** — Opportunity Stage Changed → `POST /api/meta-offline`
      with Bearer secret + merge fields (see `docs/GHL_META_OFFLINE_WORKFLOW.md`).
- [ ] **Stage-name alignment** — Qualified / Booked / Showed / Won (or snapshot
      equivalents) map to `QualifiedLead` / `Schedule` / `Showed` / `Purchase`;
      never guess mappings.
- [ ] **Events Manager custom conversions** — map `QualifiedLead` and `Showed`
      as custom conversions (undocumented fifth step; also in
      `docs/GHL_META_OFFLINE_WORKFLOW.md`).
- [ ] **Live verify**: Test Events browser+server Lead **DEDUPED**; Schedule on
      a real `/book/` booking; one simulated stage → server `QualifiedLead`.

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
- [ ] **Lighthouse** on staging: Perf ≥85 mobile / ≥95 desktop, A11y ≥95,
      SEO ≥95, CLS <0.1.
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
- [ ] **Deploy with `wrangler pages deploy` only — never raw API calls.** Raw
      API deploys can register the file manifest without uploading the blobs:
      routing "works" (308s on .html paths) while every asset returns an empty
      500. If wrangler errors, paste the error — do not fall back to the API.
- [ ] **`curl` the deployment before reporting it:** `/` and `/assets/theme.css`
      return 200.
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
- [ ] **Every `.cf-turnstile` on every page has a `data-sitekey`** — this took
      TWO template fixes: WTV-017/018 (`3e2fadd`+) covers the dynamically
      injected category/product/inventory forms via native-form.js; WTV-019
      (`24a700c`+) covers the static widgets hardcoded in `index.html`
      (homepage hero form, which also gained the missing turnstile api.js
      script tag) and `book/index.html`. A widget without a sitekey never
      issues a token, and with `TURNSTILE_SECRET_KEY` set the server rejects
      every lead with "Please complete the security check." Check the homepage
      and /book/ specifically — they fail invisibly on templates < `24a700c`.
- [ ] **Ignore "blocked from indexing" on `*.pages.dev` hash URLs** — Cloudflare
      auto-noindexes deployment-hash URLs. Check robots on the canonical
      project domain (and later the custom domain) only.
- [ ] **At least one product marked `featured=1` per category** (or the
      homepage featured grid intentionally empty and flagged).

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
