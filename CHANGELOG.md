# Changelog

Template releases for `increaseroasir/website-template-2.0` (`premium-redesign`).
Each client build records the template version + git SHA in its `WIRING.md`.

## 1.1.0 — 2026-07-30

### Fixed
- **CAPI no longer depends on GHL success.** `functions/api/lead.js` fires Meta Lead
  when the request is not a duplicate/retry, even if the CRM upsert fails. A GHL
  outage no longer silently erases ad-platform conversion data.
- **Traffic misclassification on apex vs www.** `assets/traffic-attribution.js`
  normalises hosts before comparing, so internal navigation is not counted as
  referral when `websiteUrl` and the live hostname disagree on `www`.
- **Token drift between `tokens.env` and `client.config.js`.** Sun Pool had 17
  keys defined in both files; four already disagreed (including the canonical
  host). `client.config.js` is now authoritative for everything
  `tokenMapFromConfig` owns; `tokens.env` holds content-only tokens.
- **49 dead tokens** removed from Sun Pool's `tokens.env` (213 → 144). Generator
  templates no longer ship the static-PDP leftovers
  (`PRODUCT_BEST_FOR_*`, `PRODUCT_FACT_*_COPY`, `PRODUCT_LONG_DESCRIPTION`,
  `PRODUCT_PRICE_LABEL`, `PRODUCT_SECONDARY_CTA`, `OFFER_PRIMARY_CTA`).
- **Stale Turnstile site key** removed from Sun Pool `client.config.js` (TVD-025).

### Added
- **Token linter rules** in `scripts/check-tokens-env.mjs`:
  - fail on dead tokens (assigned but never consumed as `{{TOKEN}}`)
  - fail on tokens owned by both `tokens.env` and `client.config.js`
- **Semantic versioning.** This `VERSION` file + `CHANGELOG.md`. Tag `v1.1.0`
  marks the release; clients record version + SHA at hydrate time.
- **Operational docs** for Meta Test Events (`META_TEST_EVENT_CODE` bind → fire →
  strip → redeploy), the CAPI unique-phone verification trap, and **1Password as
  the vault of record** (Supabase holds non-secret IDs + status only).

### Known polish debt
- Several client-varying CTA labels remain hardcoded literals
  ("Apply for Financing", "Unlock Inventory", "Send My Price", …).
- Review cards always render five decorative stars; rating copy lives in
  `REVIEWS_TOTAL_LINE`.

## 1.0.0 — 2026-07-23

Initial Part A certification of the premium redesign (`TEMPLATE_CERTIFICATION.md`).
Version number assigned retrospectively; prior builds referenced git SHA only.
