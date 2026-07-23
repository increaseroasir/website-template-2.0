# Wiring — the nine IDs

Read this BEFORE touching any integration ID. Every ID must be (1) present,
(2) NOT a template/Paradise value (gate.mjs checks the known fingerprints in
`scripts/template-fingerprints.json`), and (3) **verified firing live** —
presence in config proves nothing. Record every ID + verification timestamp
in the client's `WIRING.md` (scaffolded by `new-client.mjs --init`).

| # | ID | Config location | Template leftover looks like | LIVE verification |
|---|---|---|---|---|
| 1 | GA4 measurement ID | `tracking.ga4Id` | `{{GA4_ID}}` or `G-E5WGSEGZYP` | Open GA4 **Realtime** on the client property; visit staging; your session appears within ~60s |
| 2 | Meta Pixel ID | `tracking.metaPixelId` | `{{META_PIXEL_ID}}` or `1317738110513512` | Meta **Test Events** (or Pixel Helper): PageView on load + ViewContent on a product page |
| 3 | Clarity project ID | `tracking.clarityId` | `{{CLARITY_ID}}` or `xeoe7g20ml` | Clarity dashboard shows a live session/recording for your visit |
| 4 | Lead endpoint / GHL webhook | `endpoints.lead` (+ Pages Function env) | endpoint 404s, or leads land in the WRONG sub-account | Submit a test lead; contact appears in **this client's** GHL sub-account with correct source/campaign/tags |
| 5 | GHL chat widget ID | chat widget snippet / config | `6a4454fd638eec5af4195a51` | Widget renders after the ~20s deferral; a test chat lands in this client's GHL inbox |
| 6 | Closebot source ID | Closebot script `?source=` | `coMRVmh8SR6oGXTA` | Closebot dashboard registers the visit/source |
| 7 | Turnstile sitekey | `tracking.turnstileSiteKey` | `{{TURNSTILE_SITE_KEY}}` or empty | A real form submit **succeeds** — an empty/wrong key = silent lead loss; the page renders fine either way, so only a submit proves it |
| 8 | Phone + SMS (E164) | `client.primaryPhoneHref` / `client.smsHref` | `tel:+17018382614` | Call the number → rings the client (or their tracking line); tap the SMS link on a real phone → correct thread opens |
| 9 | GHL External Tracking | `tracking.ghlExternalTracking` (script src URL from the per-location snippet) | any other dealer's tracking URL/ID (fingerprint pending for the origin dealer — see template-fingerprints.json) | Browse 2–3 pages anonymously (fresh incognito, cellular if possible), then submit the gate form. In the client's GHL confirm BOTH: (a) the contact timeline shows the PRIOR page views stitched in, and (b) exactly ONE contact exists — the /api/lead pipeline and the tracking capture must dedupe-merge on email/phone, not create twins. **Duplicate contacts = FAIL; investigate before launch.** Loads with the other pixels, never on the chat widget's 20s deferral (late loading misses the page view). Works because all template forms are native DOM `<form>` elements. |

## Order of operations

1. Fill all nine in `clients/<name>/client.config.js` from the intake brief
   (never from memory, never from another client's WIRING.md).
2. `new-client.mjs --validate <name>` — catches empty/tokenized IDs and
   non-E164 phones statically.
3. Build → `gate.mjs` — catches fingerprint leftovers with file:line evidence.
4. **Live-verify each row on staging** (the table's last column). gate.mjs
   emits these as MANUAL — a human or a browser session must actually do them.
5. Fill the `WIRING.md` table: ID value, who verified, how, timestamp.

## WIRING.md is the client's permanent record

It also records the **template version** the build came from (Law 2) and the
post-launch screenshot archive location. If an ID changes after launch,
update WIRING.md in the same change — an undocumented ID swap is how the
next rebuild silently reverts a client to someone else's pixel.
