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
| 12 | `META_OFFLINE_WEBHOOK_SECRET` | Cloudflare Pages **secret**; Bearer on `POST /api/meta-offline`. **Set with `printf '%s' "$SECRET" \| wrangler pages secret put …` — never `echo`** (trailing newline corrupts the Bearer compare → silent 401s). | Unauthorized request → 401; valid Bearer + known `event_name` → 200 + `ok:true` |
| 13a | GHL custom field keys (6) | Snapshot / location custom fields | After a form lead (with Pixel cookies): contact has `fbp`, `fbc`, `meta_event_id`, `event_source_url`, `external_id`, `store_pixel_id` populated when data exists. Missing keys = silent skip (attribution loss). |
| 13b | Opportunity Stage Changed → `/api/meta-offline` | GHL Automation webhook | One simulated stage change (e.g. Qualified) with merge fields → Events Manager shows server `QualifiedLead` (`action_source=system_generated`). Unknown stage names must return **2xx skipped** (not retry loops). GHL resolves empty merge fields to the literal string `"null"` — the Worker strips it on `fbp`/`fbc`, so `fbc_received: "null"` in diagnostics is normal, not a bug. |

### Meta live-verification block (do in order)

1. **Lead dedupe:** Events Manager Test Events — browser + server `Lead` = **one** event.  
2. **Schedule:** complete a real `/book/` booking (calendar configured) — Test Events must show `Schedule` as **Browser + Server deduped into one event**: the Worker sends `action_source: website` with the shared `event_id`, the Pixel sends `value: 300` matching `META_VALUE_SCHEDULE`. Phone/manual bookings arrive separately as `system_generated` via the GHL stage workflow.  
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

## Where each credential comes from — source it yourself before escalating

Most of these are self-serve. Escalating to the owner for a value you can retrieve
is what turned a 30-second fix into a lost day on Sun Pool (WTV-045).

| Variable | Where to get it | Recoverable later? |
|---|---|---|
| `GHL_API_TOKEN` | Client sub-account → Settings → **Private Integrations** → open the integration → copy the token. A PIT is **not** write-once; it can be re-copied any time. If none exists, create one with the scopes below. | Yes |
| `GHL_LOCATION_ID` | The sub-account URL: `app.gohighlevel.com/v2/location/<ID>/…`, or the agency Supabase `clients` registry (`ghlLocationId`) | Yes |
| `GHL_BOOKING_CALENDAR_ID` | Calendars → the booking calendar → its ID | Yes |
| `META_PIXEL_ID` | The client's `tokens.env` — it is already there for the build-time pixel | Yes |
| `META_CAPI_ACCESS_TOKEN` | The agency Supabase `clients` registry (`metaCapiAccessToken`) first. If absent: Meta Events Manager → Data Sources → the pixel → Settings → Conversions API → generate — **owner action**, then record it in the registry | Only if recorded — Meta never re-displays it |
| `META_OFFLINE_WEBHOOK_SECRET` | Generate: `openssl rand -hex 32`. Must be pasted into the GHL workflow's Bearer header in the **same** change | Regenerable, but lives in two places |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Generate. Both are required; a missing session secret breaks admin login even with a valid password | Yes |
| `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Agency Lead Vault sheet + service account | Yes |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Agency service-account JSON | **No** — mint a new key in GCP if lost |

**Private-integration scopes the template actually needs** (a wrong selection
fails as a 401 after deploy, costing a full cycle): `contacts.readonly`,
`contacts.write`, `locations/customFields.readonly`, `calendars.readonly`,
`calendars/events.write`. Tags and opportunities need no scope — the site writes
tags onto the contact and GHL workflows trigger from them.

**Record what you retrieved.** Write `ghlLocationId`, `ghlPrivateToken`,
`ghlBookingCalendarId`, `metaPixelId`, and `metaCapiAccessToken` back to the agency
Supabase `clients` row for that client. A value recovered but not recorded gets
hunted again on the next build. The two that Meta and GHL will not re-display —
the CAPI token and a deleted PIT — are the two that cost an owner round trip, so
they are the two that most need recording.

## Setting and proving a secret

```
printf '%s' "$VALUE" | npx wrangler pages secret put NAME --project-name <project>
printf '%s' "$VALUE" | npx wrangler pages secret put NAME --project-name <project> --env preview
```

- **Never `echo`** — it appends a newline. Worse, `echo "$TOKEN" | wrangler …`
  writes an **empty** secret and exits 0 when `$TOKEN` is unset in that shell.
- `--env preview` is accepted even though it is absent from `--help` in wrangler 4.x.
- Run from a directory **without** an unhydrated `wrangler.toml`; the template's
  config contains `{{CLOUDFLARE_PAGES_PROJECT}}` and fails validation first.
- **Under OAuth login, only the first `pages secret put` works.** The `--env preview`
  variant and `pages secret list` then fail with *"it's necessary to set a
  CLOUDFLARE_API_TOKEN environment variable"* — a misleading message, because the
  same OAuth session authenticates fine against the Pages REST API. Hand wrangler
  the stored OAuth bearer explicitly and both succeed (WTV-054):

  ```
  export CLOUDFLARE_API_TOKEN=$(python3 -c "import re;print(re.search(r'oauth_token\s*=\s*\"([^\"]+)\"',open('$HOME/Library/Preferences/.wrangler/config/default.toml').read()).group(1))")
  ```
- **Never set secrets via a `deployment_configs` PATCH** (WTV-049).
- Secrets bind at **deploy time**. Deploy, then
  `ADMIN_PASSWORD='…' npm run secrets:verify -- https://<host>` per host.

A secret is set when `secrets:verify` reports it `present` — never because its
name appears in a dashboard, and never because a checklist row was ticked
(WTV-053). `empty` and `missing` are different findings: `empty` means someone set
it badly, `missing` means nobody set it.

### Prove a CAPI token before you deploy it

An empty `data` array authenticates without recording an event, so this is safe to
run against a live pixel:

```
curl -s -X POST "https://graph.facebook.com/v21.0/<PIXEL_ID>/events" \
  -d "access_token=$TOKEN" --data-urlencode 'data=[]'
```

`(#100) param data must be non-empty` means the token authenticated — that is a
**pass**. An `OAuthException` naming permissions or an invalid token is a fail.

Do not judge a CAPI token by `debug_token` scopes. A valid Events Manager token
reports `SYSTEM_USER` on the "Conversions API Application" with the single scope
`read_ads_dataset_quality`, which reads like a read-only credential and is not
(WTV-055). What matters is that the pixel ID appears in the token's
`granular_scopes[].target_ids`, and that the probe above passes.

## Order of operations

1. Fill browser IDs in `clients/<name>/client.config.js` from intake.  
2. Source every credential (see "Where each credential comes from") and set
   Cloudflare secrets plus the `GHL_BASE_TAGS=new-lead` env var in **both**
   environments. Deploy, then prove them with `npm run secrets:verify` per host
   before verifying anything else — a blank secret invalidates every test after it.  
3. Ensure snapshot has the 6 Meta contact fields + stage webhook, and its
   intake workflow triggers on `new-lead`.  
4. `new-client.mjs --validate` → build → `gate.mjs`.  
5. Live-verify every row; fill `WIRING.md`.

## WIRING.md is the client's permanent record

Template version (Law 2) + post-launch archive. Undocumented ID swaps after
launch are how the next rebuild reverts a client to someone else's pixel.
