# Wiring — browser IDs + Meta CAPI / offline funnel

Read this BEFORE touching any integration ID. Every ID must be (1) present
when required, (2) NOT a template leftover (gate.mjs fingerprints), and
(3) **verified firing live**. Presence in config proves nothing. Record
everything in the client's `WIRING.md`.

## Browser / config IDs (1–10)

| # | ID | Config location | Template leftover looks like | LIVE verification |
|---|---|---|---|---|
| 1 | GA4 measurement ID | `tracking.ga4Id` | `{{GA4_ID}}` or `G-E5WGSEGZYP` | Open GA4 **Realtime** on the client property; visit staging; your session appears within ~60s |
| 2 | Meta Pixel ID | `tracking.metaPixelId` | `{{META_PIXEL_ID}}` or `1317738110513512` | Meta **Test Events**: PageView on load + ViewContent on a content page |
| 3 | Clarity project ID | `tracking.clarityId` | `{{CLARITY_ID}}` or `xeoe7g20ml` | Clarity dashboard shows a live session/recording for your visit |
| 4 | Lead endpoint / GHL webhook | `endpoints.lead` (+ Pages Function env) | endpoint 404s, or leads land in the WRONG sub-account | Submit a test lead; contact appears in **this client's** GHL sub-account with correct source/campaign/tags — including the `new-lead` entry tag (see handshake below) |
| 5 | GHL chat widget ID | Not in `client.config.js` yet — record in WIRING + paste into the location chat snippet at deploy | `6a4454fd638eec5af4195a51` | Widget renders after the ~20s deferral; a test chat lands in this client's GHL inbox |
| 6 | Closebot source ID | Not in `client.config.js` yet — record in WIRING + Closebot `?source=` at deploy | `coMRVmh8SR6oGXTA` | Closebot dashboard registers the visit/source |
| 7 | Native form submit (no captcha — TVD-025) | — | — | A real form submit **succeeds** with no security-check step; zero `cf-turnstile`/`challenges.cloudflare.com` refs in the dist; `TURNSTILE_*` vars absent from the Pages project |
| 8 | Phone + SMS (E164) | `client.primaryPhoneHref` / `client.smsHref` | `tel:+17018382614` | Call + SMS routing to the client (or their tracking line) |
| 9 | GHL External Tracking | `tracking.ghlExternalTracking` | other dealer's tracking URL | Anon 2–3 page browse + form submit → prior page views stitched + **exactly ONE** contact |
| 10 | GHL Booking Calendar ID | `tracking.ghlBookingCalendarId` | wrong-location calendar ID | Live booking at store-local time + Execution Logs, or intentional empty (request-mode) |

## Meta CAPI secrets + offline funnel (11–13)

Validator / gate **cannot read Cloudflare secrets** — same standing MANUAL
warning treatment as `GHL_API_TOKEN`. Confirm in wrangler / dashboard, then
live-verify.

| # | Item | Where it lives | LIVE verification |
|---|---|---|---|
| 11 | `META_CAPI_ACCESS_TOKEN` | Cloudflare Pages **secret** (never GHL, never git) | With Pixel + CAPI configured: submit a test lead → Events Manager **Test Events** shows browser + server `Lead` arriving **DEDUPED as one event** (same `event_id`). Optional: set `META_TEST_EVENT_CODE` or `TEST_EVENT_CODE` while testing. |
| 12 | `META_OFFLINE_WEBHOOK_SECRET` | Cloudflare Pages **secret**; Bearer on `POST /api/meta-offline` | Unauthorized request → 401; valid Bearer + known `event_name` → 200 + `ok:true` |
| 13a | GHL custom field keys (6) | Snapshot / location custom fields | After a form lead (with Pixel cookies): contact has `fbp`, `fbc`, `meta_event_id`, `event_source_url`, `external_id`, `store_pixel_id` populated when data exists. Missing keys = silent skip (attribution loss). |
| 13b | Opportunity Stage Changed → `/api/meta-offline` | GHL Automation webhook | One simulated stage change (e.g. Qualified) with merge fields → Events Manager shows server `QualifiedLead` (`action_source=system_generated`). Unknown stage names must return **2xx skipped** (not retry loops). |

### Meta live-verification block (do in order)

1. **Lead dedupe:** Events Manager Test Events — browser + server `Lead` = **one** event.  
2. **Schedule:** complete a real `/book/` booking (calendar configured) — server `Schedule` + Pixel `Schedule` share `event_id` when booked.  
3. **Offline:** fire one simulated stage webhook → `QualifiedLead` (or Showed) server-side.  
4. **Events Manager:** map `QualifiedLead` and `Showed` as **custom conversions** (see `docs/GHL_META_OFFLINE_WORKFLOW.md`).

## Website ↔ snapshot tag handshake (`GHL_BASE_TAGS`)

Every website build sets the Cloudflare env var `GHL_BASE_TAGS` to the
standard entry tag **`new-lead`** (both Production and Preview). Every
snapshot's intake workflow triggers on that same tag. This is the
website↔snapshot handshake — **it must match or automations never fire**:
`functions/lib/ghl.js` stamps `GHL_BASE_TAGS` onto every contact it creates,
and the snapshot's intake workflow does nothing until a contact carries its
trigger tag. Leads that reach GHL but start zero automations = check this
handshake first.

LIVE verification: submit a test lead → the GHL contact carries `new-lead`
(plus the `src-*` source tag) AND the intake workflow shows a run in
Execution Logs.

### Automatic intent tags (server-side, no config)

`functions/lib/ghl.js` also stamps intent tags the snapshot can route on:

- **`financing-request`** — any lead whose `lead_source` contains
  `financing` (the /financing.html funnel). The financing page is a locked
  full-screen survey (no nav, no page scroll) whose success redirect sends
  the visitor to `/book/`; snapshot workflows targeting financing leads
  must trigger on this tag.
- `productlead` — leads from a product detail page.
- `Campaign - <campaign>` / `Intent - <form_intent>` — every lead.

## Order of operations

1. Fill browser IDs in `clients/<name>/client.config.js` from intake.  
2. Set Cloudflare secrets (GHL token, Meta CAPI, Meta offline webhook) and
   the `GHL_BASE_TAGS=new-lead` env var (both environments).  
3. Ensure snapshot has the 6 Meta contact fields + stage webhook, and its
   intake workflow triggers on `new-lead`.  
4. `new-client.mjs --validate` → build → `gate.mjs`.  
5. Live-verify every row; fill `WIRING.md`.

## WIRING.md is the client's permanent record

Template version (Law 2) + post-launch archive. Undocumented ID swaps after
launch are how the next rebuild reverts a client to someone else's pixel.
