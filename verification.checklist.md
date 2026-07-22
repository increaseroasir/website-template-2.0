# Increase ROAS Website Fulfillment Verification Checklist

This checklist is the launch gate for every client website built from this template. If any required line fails, the site is not ready to hand off.

## 1. Source Repo And Build

- [ ] Confirm the source template repo is public and accessible to Manus.
- [ ] Confirm the client repo was created from the approved template source.
- [ ] Confirm no previous client's files, images, IDs, or copy are present.
- [ ] Run `npm run brand:guard`.
- [ ] Run `npm run build:config`.
- [ ] Run `npm run placeholder:check`.
- [ ] Run `npm run launch:check` locally before production deploy. If a live preview exists, run `LAUNCH_CHECK_URL=https://preview-url.example npm run launch:check`.
- [ ] Confirm `client.config.js` contains the correct client values.
- [ ] Confirm `wrangler.toml` contains the correct Cloudflare Pages project, D1 database, R2 bucket, and allowed origin.

## 2. Cloudflare

- [ ] Pages project exists and deploys a preview URL.
- [ ] Production branch is set correctly.
- [ ] D1 database exists and is bound as `DB`.
- [ ] D1 schema from `functions/db/schema.sql` has been applied remotely.
- [ ] R2 bucket exists and is bound as `PRODUCT_IMAGES`.
- [ ] R2 public URL pattern is confirmed.
- [ ] `ALLOWED_ORIGIN` matches the production domain.
- [ ] Custom domain is connected and SSL is active.

## 3. Required Secrets

Set and verify each secret in Cloudflare Pages:

- [ ] `GHL_API_TOKEN`
- [ ] `GHL_LOCATION_ID`
- [ ] `GOOGLE_SHEETS_ID`
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [ ] `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- [ ] `META_CAPI_ACCESS_TOKEN`
- [ ] `META_PIXEL_ID`
- [ ] `TURNSTILE_SECRET_KEY`
- [ ] `ADMIN_PASSWORD`
- [ ] `ADMIN_SESSION_SECRET`
- [ ] `ALERT_EMAIL`
- [ ] `RESEND_API_KEY` if alert email uses Resend

## 4. Browser Tracking

Verify on the live preview URL before production:

- [ ] Meta Pixel loads with the client Pixel ID.
- [ ] Meta Pixel fires `PageView`.
- [ ] Meta Pixel fires `ViewContent` on content/product/inventory pages.
- [ ] GA4 loads with the client measurement ID.
- [ ] GA4 receives `page_view`.
- [ ] Microsoft Clarity loads with the client project ID.
- [ ] `traffic-attribution.js` stores first-touch attribution.
- [ ] `call-tracking.js` fires phone click events.
- [ ] `pricing-tracking.js` fires CTA/pricing click events.
- [ ] No browser console errors are present on homepage, inventory, product detail, contact, financing, and thank-you pages.

## 5. Lead Path

Submit one controlled test lead with a real deliverable phone/email controlled by the agency.

- [ ] Lead form validates required fields.
- [ ] Lead form sends to `/api/lead`.
- [ ] `/api/lead` returns `ok: true`.
- [ ] Google Sheets Lead Vault receives a new row.
- [ ] Lead Vault row status moves from `PENDING` to `SENT`, `DUPLICATE`, or `FAILED`.
- [ ] GHL contact is created or updated.
- [ ] GHL contact has correct source tag: `src-meta`, `src-organic`, or `src-inbound-call`.
- [ ] GHL contact has correct campaign tag.
- [ ] GHL contact has correct product/intent tags when submitted from inventory or product pages.
- [ ] GHL contact has required custom field values.
- [ ] Run `npm run ghl:fields:check` with the client's GHL credentials. If fields are missing and the user approved creation, run `npm run ghl:fields:create`.
- [ ] Duplicate lead behavior works for repeat submissions.
- [ ] Missed lead row is created if GHL is forced to fail in a controlled test or the path is documented.

## 6. Meta CAPI And Dedupe

- [ ] Meta CAPI sends a server `Lead` event.
- [ ] Server event includes hashed email and phone when available.
- [ ] Server event includes `event_source_url`.
- [ ] Server event includes `value` and `currency`.
- [ ] Server event uses the same `event_id` as the browser Lead event.
- [ ] Meta Events Manager shows browser/server dedupe working.
- [ ] Test event code is removed or disabled before final production launch unless intentionally left for testing.

## 7. GA4 And Clarity Proof

- [ ] GA4 Realtime or DebugView shows the test user.
- [ ] GA4 receives `generate_lead`.
- [ ] GA4 receives `click_call` after a phone link test.
- [ ] GA4 receives `pricing_click` after CTA tests.
- [ ] Clarity receives a session for the test user.
- [ ] Clarity receives `call_click`.
- [ ] Clarity receives `pricing_click`.

## 8. Inventory And Admin

- [ ] `/api/inventory` returns only public inventory.
- [ ] Category filters return expected data.
- [ ] Product detail page loads from a product slug.
- [ ] Product cards render from `/api/inventory`, not static placeholder product data.
- [ ] Product lead form includes product name, slug, category, status, and tags.
- [ ] `/admin` login works with `ADMIN_PASSWORD`.
- [ ] Admin can create a product.
- [ ] Admin can edit a product.
- [ ] Admin can hide a product.
- [ ] Admin can delete or mark a product deleted.
- [ ] Image upload writes to R2 and stores a usable public URL.

## 9. Mobile UX Smoke Test

Test on a real phone or mobile browser emulation:

- [ ] Homepage primary CTA is visible above the fold.
- [ ] Inventory cards are readable and tappable.
- [ ] Product page lead form is usable.
- [ ] Contact and financing forms are usable.
- [ ] Sticky bars or overlays do not cover form fields.
- [ ] Thank-you page loads after lead submit.
- [ ] Phone links open the phone dialer.

## 10. Final Handoff Proof

Create a launch proof report containing:

- [ ] Production URL
- [ ] Cloudflare Pages project URL
- [ ] Admin URL
- [ ] Google Sheet URL
- [ ] GHL contact URL for the test lead
- [ ] Meta Events Manager proof screenshot or event ID
- [ ] GA4 proof screenshot or DebugView timestamp
- [ ] Clarity project URL
- [ ] D1 database name and ID
- [ ] R2 bucket name
- [ ] List of all secrets set without exposing secret values
- [ ] Any known limitations or follow-up tasks

## Zero-Defect Exit Rule

Do not mark the client site launched if:

- Any required tracking destination is missing.
- The lead does not reach Sheets.
- The lead does not reach GHL.
- Meta CAPI does not send or dedupe.
- GA4 cannot see the lead event.
- Admin cannot manage inventory.
- Placeholder values remain in public files.
- A previous client's brand/copy/tracking IDs remain in the new client site.
