# Meta Pixel + Conversions API — Technical Brief

**Audience:** Meta ads consultant / media buyer  
**Site type:** Local dealer website (inventory + lead forms + optional showroom booking)  
**Last updated:** 2026-07-23  

**Read this file first.** When finished, open and complete  
[`META_CONSULTANT_INTAKE.md`](./META_CONSULTANT_INTAKE.md) — that file asks for specific recommendations and numbers. Do not skip it.

---

## 1. How data reaches Meta (two channels)

| Channel | Runs where | Library / endpoint | Purpose |
|---|---|---|---|
| **Meta Pixel** | Visitor’s browser | `fbevents.js` via `fbq(...)` | PageView, ViewContent, Lead, Contact, Schedule |
| **Conversions API (CAPI)** | Our Cloudflare Pages Function (server) | `POST https://graph.facebook.com/v21.0/{PIXEL_ID}/events` (Graph API v21.0) | `Lead` (website, value 0) from `/api/lead`; `Schedule` from `/api/booking`; `QualifiedLead` / `Schedule` / `Showed` / `Purchase` from `/api/meta-offline` (GHL stage webhooks) |

**Design goal:** Pixel catches what the browser can see; CAPI recovers what Pixel misses (ad blockers, iOS limits). For the primary conversion (`Lead`), both channels share the **same `event_id`** so Meta deduplicates and does not double-count.

```
Ad click (fbclid) → landing page
  → Pixel: init + PageView (+ ViewContent on content pages)
  → Cookies: _fbp (Pixel), _fbc (or synthesized from fbclid)
  → Form submit generates UUID (event_id)
  → POST /api/lead { PII, fbp, fbc, fbclid, UTMs, meta_event_id }
  → Server: validate → Turnstile → lead vault → GHL upsert
  → IF eligible: CAPI Lead (same event_id) THEN browser Pixel Lead (same eventID)
```

---

## 2. Browser Pixel — events fired

### 2.1 PageView (every page with Pixel configured)

- Script: site `tracking.js`
- `fbq('init', PIXEL_ID)` then `fbq('track', 'PageView')`
- **CAPI counterpart:** none

### 2.2 ViewContent (selected content / catalog pages)

- Script: `view-content.js`
- Payload:
  - `content_name` — from page attribute `data-meta-view-content`, else document title, else path
  - `content_category` — from `data-meta-view-category` (examples: homepage, hot-tub, swim-spa, sauna, inventory, catalog)
- **CAPI counterpart:** none

### 2.3 Lead (primary conversion — Pixel half)

- Script: `lead-form.js`
- Fires **only after** `/api/lead` returns success **and** server sets Meta fire = true
- Payload:
  - `value` — configurable lead value (default **950**)
  - `currency` — default **USD**
  - `content_name` — campaign name, else form source
  - `content_category` — campaign, else `website-form`
  - Options: `{ eventID: <same UUID as CAPI event_id> }`

### 2.4 Contact (phone tap)

- Script: `call-tracking.js`
- Any click on `a[href^="tel:"]` → `fbq('track', 'Contact')`
- **No value.** **No CAPI.** Fires on click, not on answered call.

### 2.5 Schedule (showroom booking page `/book/` only)

- Script: `booking.js`
- On successful booking submit → `fbq('track', 'Schedule', { content_name: 'showroom-visit' })`
- **No CAPI today.** **No shared event_id** with server.

### 2.6 Events we do not fire

Not implemented: `Purchase`, `AddToCart`, `InitiateCheckout`, `CompleteRegistration`, `Search`, or custom conversion events in code.

---

## 3. Server CAPI — Lead event (exact fields)

**Module:** `functions/lib/meta-capi.js`  
**Called from:** `POST /api/lead` only  
**Required env:** `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`  
**Optional env:** `META_TEST_EVENT_CODE` (Events Manager Test Events)

| Field | What we send |
|---|---|
| `event_name` | `Lead` |
| `event_time` | Unix seconds at send time |
| `event_id` | Same UUID as browser `eventID` / form `submission_id` |
| `action_source` | `website` |
| `event_source_url` | Form page URL, else configured site URL |
| `user_data.em` | SHA-256 of email (trim + lowercase) |
| `user_data.ph` | SHA-256 of phone digits; 10-digit US numbers prefixed with `1` |
| `user_data.client_ip_address` | Cloudflare `CF-Connecting-IP` (fallback `X-Forwarded-For`) |
| `user_data.client_user_agent` | Request User-Agent |
| `user_data.fbp` | `_fbp` cookie if present |
| `user_data.fbc` | `_fbc` cookie, or synthesized `fb.1.{timestamp}.{fbclid}` |
| `custom_data.value` | `LEAD_VALUE` (default **950**) |
| `custom_data.currency` | `LEAD_CURRENCY` (default **USD**) |
| `custom_data.content_name` | Product name → else campaign → else source |
| `custom_data.content_category` | Campaign → else product category |

**Not sent on CAPI today:** first name, last name, city, state, zip, external_id, DOB, gender.

**Browser Advanced Matching:** we do **not** pass email/phone into `fbq('init', …)` after form fill. Matching relies on cookies + CAPI hashed PII.

---

## 4. Deduplication

1. Browser generates a UUID **before** submit (`crypto.randomUUID()`).
2. Sent to the API as `submission_id` and `meta_event_id`.
3. CAPI uses it as `event_id`.
4. Pixel uses it as `eventID` on `Lead`.

**Order:** CRM write first → CAPI Lead (if eligible) → response tells browser to fire Pixel Lead with the same ID.

---

## 5. When Lead does / does not fire

| Situation | Pixel `Lead` | CAPI `Lead` |
|---|---|---|
| New form lead, CRM upsert succeeded | Yes | Yes |
| Duplicate email/phone within ~24h (already recorded) | No | No |
| CRM upsert failed | No | No |
| Validation / spam / Turnstile failed | No | No |
| Booking page success (`/book/`) | No (`Schedule` only) | No |
| Phone tap | No (`Contact` only) | No |

**Intentional quality rule:** Meta only trains on form leads that actually landed in the CRM and are not short-window duplicates.

---

## 6. Attribution signals captured on submit

Forwarded with every lead form POST:

- `fbclid`, `_fbp`, `_fbc` (or synthesized fbc)
- UTMs: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `landing_page_url`, `referrer_url`, `traffic_channel` (site-side: `paid` when `fbclid` / paid Meta patterns present)
- Product context when from inventory: product name, slug, category, prices (used in CRM; subset reflected in CAPI `content_*`)

---

## 7. Lead value

| Setting | Default | Where |
|---|---|---|
| Lead value | `950` | Config `tracking.leadValue` + env `LEAD_VALUE` |
| Currency | `USD` | Config + env `LEAD_CURRENCY` |

Same flat value for homepage, product-page, contact, financing forms, etc. **Not** tied to unit price, margin, or close rate unless you change the config.

---

## 8. Credentials that must be live (per account)

1. Pixel ID in site config (`tracking.metaPixelId`) — browser  
2. **Same** Pixel ID in server env `META_PIXEL_ID` — CAPI  
3. CAPI access token secret `META_CAPI_ACCESS_TOKEN`  
4. Optional `META_TEST_EVENT_CODE` for Test Events  
5. Aligned `LEAD_VALUE` / `LEAD_CURRENCY`

If Pixel exists but CAPI token is missing: browser events still fire; server `meta_capi` stays false (hurts Event Match Quality / recovery).

---

## 9. Known gaps (do not paper over these)

1. **`Schedule` (booking) has no CAPI** and no shared `event_id`.  
2. **`Contact` is Pixel-only** and is a click, not a verified call.  
3. **No offline / CRM-stage CAPI** (e.g. qualified, showed, sold).  
4. **Thin CAPI user_data** — no hashed name / geo.  
5. **ViewContent / PageView not server-backed.**  
6. **Flat lead value** — weak for true value optimization until set to real economics or differentiated by lead type.  
7. **No Pixel Advanced Matching** from form fields after submit.

---

## 10. Next step (required)

Open **[`META_CONSULTANT_INTAKE.md`](./META_CONSULTANT_INTAKE.md)** and answer every numbered item with specifics (event names, bid strategy, values, audiences, build asks). Vague answers like “improve EMQ” or “optimize better” are not acceptable — use the intake’s format.
