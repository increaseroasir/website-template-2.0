# Snapshot Test Findings — 2026-07-28
Issues discovered during the first end-to-end snapshot test build (snapshot-test client).
Each item is either already fixed in the template or flagged as a required check on every future build.

> Consolidated into the canonical `website-template-2.0` repo. The fixed items are logged as
> WTV-026–028 in `KNOWN_ISSUES.md`; the standing rules live in `TEMPLATE_DECISIONS.md`
> (TVD-028/029). CHECK-06 below is **superseded** — see the note on it.

---

## FIXED IN TEMPLATE

### 1. `client.config.js` not copied into dist
**What broke:** Pixel, GA4, Clarity, and GHL External Tracking all silently dead. `window.CLIENT_CONFIG` was `undefined`.
**Fix:** `build-config.mjs` → `injectMetaPixel()` now hardcodes the pixel directly into HTML. `scan-placeholders.mjs` now fails the gate if `client.config.js` is missing from dist root.
**Status:** ✅ Fixed in template

### 2. Meta Pixel not firing — runtime dependency on `CLIENT_CONFIG`
**What broke:** `tracking.js` only initialized the pixel if `window.CLIENT_CONFIG.tracking.metaPixelId` was truthy at runtime. One missing/cached file = silent failure.
**Fix:** Pixel is now hardcoded in HTML at build time by `build-config.mjs`. `tracking.js` still runs as a fallback but the hardcoded pixel fires first.
**Status:** ✅ Fixed in template

### 3. Cloudflare Rocket Loader deferring inline pixel script
**What broke:** Even when the pixel was in the HTML, Rocket Loader on the zone deferred the `<script>` block, causing the Pixel Helper to report no pixel.
**Fix:** `data-cfasync="false"` added to the pixel script tag in `build-config.mjs` injection.
**Status:** ✅ Fixed in template

### 4. GHL `meta_offline_webhook_secret` out of sync with Cloudflare Worker
**What broke:** Webhook fired and reached the Worker but returned `{"ok":false,"error":"Unauthorized"}`. GHL execution log showed Failed.
**Root cause:** `echo` vs `printf` when piping secrets into `wrangler pages secret put`. `echo` appends a trailing newline which gets base64-encoded into the secret. GHL had the old mangled value.
**Fix:** Always use `printf '%s'` (not `echo`) when setting secrets. Added verification command to KNOWN_ISSUES.
**Status:** ✅ Fixed — verification command documented

### 5. GHL offline webhook sending `event_name: "Qualified"` instead of `"QualifiedLead"`
**What broke:** Worker returned `{"skipped":true,"reason":"unknown_event_name"}`. No Meta event fired.
**Fix:** Updated the GHL workflow webhook body to use `"QualifiedLead"`.
**Status:** ✅ Fixed in GHL workflow (builder account)

### 6. `fbc` field sending literal string `"null"` when GHL contact field is empty
**What broke:** GHL resolves an empty `{{contact.fbc}}` merge field to the string `"null"` (not empty). This would be passed to Meta as a real fbc value.
**Fix:** `meta-offline.js` now strips literal `"null"` strings from `fbp` and `fbc` fields: `.replace(/^null$/i, "")`.
**Status:** ✅ Fixed in template

### 7. Google Sheets vault gate blocking GHL and CAPI in test environment
**What broke:** `lead.js` writes to Google Sheets vault first, then calls GHL and CAPI. With no Sheet configured, it returned HTTP 500 before GHL was ever called.
**Fix:** Vault gate made non-fatal in test build (vault write failure is caught and logged, execution continues to GHL/CAPI).
**Status:** ✅ Fixed in snapshot-test dist only (template source unchanged — vault is required in production)

---

## REQUIRED CHECKS ON EVERY BUILD

### CHECK-01: Verify both sides of every secret match after setting
After setting `META_OFFLINE_WEBHOOK_SECRET` on Cloudflare, immediately read the GHL custom value and assert equality:
```bash
GHL_SECRET=$(curl -s "https://services.leadconnectorhq.com/locations/{LOCATION_ID}/customValues" \
  -H "Authorization: Bearer {PIT}" -H "Version: 2021-07-28" | \
  python3 -c "import sys,json; cvs=json.load(sys.stdin).get('customValues',[]); \
  print(next((c['value'] for c in cvs if 'webhook_secret' in c.get('name','')), 'NOT_FOUND'))")
# Fire a ping to verify auth passes (should return "skipped", not "Unauthorized")
curl -s -X POST "https://{DOMAIN}/api/meta-offline" \
  -H "Authorization: Bearer $GHL_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event_name":"__ping__","email":"ping@test.com","phone":"5550000000"}' | grep -o '"skipped"\|"Unauthorized"'
```

### CHECK-02: Verify Meta Pixel fires in browser before launch
Open the page in a fresh incognito window with the Meta Pixel Helper extension. Confirm the pixel ID shows as active. Do not rely on curl — the pixel is browser-side JS.

### CHECK-03: Verify GHL workflow event_name values match the Worker's allowed list
Worker accepts: `QualifiedLead`, `Schedule`, `Showed`, `Purchase` (exact strings, case-sensitive).
Check every offline workflow webhook body before launch.

### CHECK-04: Verify opportunity merge fields are not used for critical data
GHL-007 confirmed: `opportunity.date_updated` and `opportunity.monetary_value` send as empty strings in webhook bodies. Do not use opportunity fields for `event_time` or `value` in webhook payloads. Use contact fields or custom values instead.

### CHECK-05: Always use `printf '%s'` when piping secrets to wrangler
```bash
# CORRECT
printf '%s' "$SECRET_VALUE" | wrangler pages secret put SECRET_NAME --project-name {project}
# WRONG — echo appends a newline which corrupts base64 secrets
echo "$SECRET_VALUE" | wrangler pages secret put SECRET_NAME --project-name {project}
```

### CHECK-06: ~~Turnstile must be configured before launch~~ — SUPERSEDED by TVD-025
**Do the opposite.** Turnstile was removed from the template entirely on 2026-07-28 (TVD-025): no widgets, no api.js loader, no `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` anywhere — delete them from legacy Pages projects. Spam control is the off-screen honeypot + 24h duplicate detection. `gate.mjs` hard-fails any artifact containing a Turnstile reference.

### CHECK-07: Booking calendar ID must be set and verified
Set `GHL_BOOKING_CALENDAR_ID` in Cloudflare env vars. After deploy, hit `/api/booking` and confirm `"bookable": true` and `"days"` array is non-empty. Empty days = calendar has no availability configured in GHL.

### CHECK-08: Confirm CAPI deduplication is working for Schedule events
After a test booking, check Meta Events Manager → Test Events. The `Schedule` event should appear once (not twice). If it appears as Browser only, check that:
1. The booking page is sending `meta_event_id` in the POST body
2. The server is echoing it back in the response
3. The browser pixel is using `data.meta_event_id || eventId` as the `eventID` parameter

### CHECK-09: GHL workflow URL must point to the correct domain
The `meta_offline_webhook_url` custom value must match the deployed domain. After any domain change, update this custom value immediately. Verify by checking GHL → Automation → Execution Logs after moving a contact through a trigger stage.

### CHECK-10: `meta_event_id` deduplication only works for web leads
Contacts created manually in GHL (not through the landing page) will have an empty `meta_event_id` field. The offline webhook will fire successfully but `meta_event_id_linkage` will be null — Meta cannot link the offline event back to the original browser Lead event. This is expected and unavoidable for non-web leads.

---

## OPEN ITEMS (not yet fixed in template)

### OPEN-01: Unhydrated copy tokens visible on test site
`{{HOME_LEAD_HEADLINE}}`, `{{HOME_LEAD_SUBHEAD}}`, `{{LEAD_FORM_DISCLAIMER}}`, and ~40 other copy tokens are unfilled on the test build. These are cosmetic for testing but must be filled before any client launch. The `scan-placeholders.mjs` gate catches these — a build with unfilled tokens will not pass the gate.

### OPEN-02: `event_name: "Qualified"` in GHL workflow — rename to `"QualifiedLead"` in snapshot template
The snapshot's offline workflow was using `"Qualified"` instead of `"QualifiedLead"`. This has been fixed in the builder account but the snapshot template itself (before installation) may still have the wrong value. Verify after every snapshot install.

### OPEN-03: GHL workflow `fbc` field sends literal `"null"` string
Fixed in the Worker (`meta-offline.js`), but the GHL workflow body still sends `"fbc": "{{contact.fbc}}"`. Consider changing the workflow to omit `fbc` entirely when empty, or use a conditional merge field if GHL supports it.
