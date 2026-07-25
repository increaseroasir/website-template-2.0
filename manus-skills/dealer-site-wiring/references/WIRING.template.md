# WIRING.md — <CLIENT NAME>

Permanent record for this client build (Laws 2 and 4). Fill every row before
launch; update in the same change whenever an ID changes after launch.

## Build provenance

| Field | Value |
|---|---|
| Template version (tag/commit) | |
| Built by | |
| Build date | |
| Intake source (GHL form link / brief) | |
| Staging URL | |
| Production domain | |

## Browser / config IDs (1–10)

| # | Integration | ID / value | Verified how | By | Date |
|---|---|---|---|---|---|
| 1 | GA4 measurement ID | | Realtime showed test visit | | |
| 2 | Meta Pixel ID | | Test Events: PageView + ViewContent | | |
| 3 | Clarity project ID | | Live session visible | | |
| 4 | Lead endpoint / GHL sub-account | | Test lead landed w/ correct tags | | |
| 5 | GHL chat widget ID | | Widget rendered; chat routed to inbox | | |
| 6 | Closebot source ID | | Dashboard registered visit | | |
| 7 | Turnstile sitekey | | Real form submit succeeded | | |
| 8 | Phone / SMS (E164) | | Called + texted; routing confirmed | | |
| 9 | GHL External Tracking | | Anon browse + gate submit: prior page views stitched on timeline; exactly ONE contact (no twins) | | |
| 10 | GHL Booking Calendar ID | | ☐ team member assigned · ☐ live test booking at correct store-local time · ☐ tags present · ☐ Execution Logs show workflow fired · ☐ test deleted — or ☐ intentionally empty (request-mode) | |

## Meta CAPI secrets + offline funnel (11–13)

Secrets live in Cloudflare only (validator cannot read them — standing MANUAL).
Never put `META_CAPI_ACCESS_TOKEN` in GHL.

| # | Integration | Value / status | Verified how | By | Date |
|---|---|---|---|---|---|
| 11 | `META_CAPI_ACCESS_TOKEN` (CF secret) | set / not set | Test Events: browser + server `Lead` **DEDUPED as one event** | | |
| 12 | `META_OFFLINE_WEBHOOK_SECRET` (CF secret) | set / not set | Valid Bearer → 200; missing/wrong → 401/503 | | |
| 13a | GHL custom fields (6 keys) | fbp, fbc, meta_event_id, event_source_url, external_id, store_pixel_id | After form lead: fields populated when Pixel cookies present | | |
| 13b | Opportunity Stage → `/api/meta-offline` | workflow live / not yet | Simulated Qualified → server `QualifiedLead`; unknown stage → 2xx skipped | | |
| 13c | Events Manager custom conversions | QualifiedLead + Showed mapped | Custom conversions created in Events Manager | | |

## Post-launch verification (within 1 hour of DNS)

| Item | Result | Date |
|---|---|---|
| Cellular test lead → GHL sub-account + automation fired | | |
| Inventory gate unlocked end-to-end; unlock persisted | | |
| GA4 Realtime + Meta Test Events on CLIENT IDs | | |
| Meta Lead dedupe (browser+server = one) + one offline stage event | | |
| Screenshot archive (1440/390, every page) location | | |

## Search indexing

| Item | Result | Date |
|---|---|---|
| GSC property verified (meta token) | | |
| sitemap.xml submitted in GSC (status Success) | | |
| Request Indexing: homepage + inventory + one category | | |
| IndexNow key live + `--submit <domain>` run | | |
| Google Business Profile website link updated | | |
| **Day-7 crawl verification**: indexed count vs sitemap count | | |

## 48-HOUR FIX LIST

Auto-filled by `--validate --profile rush` (or `map-intake.mjs --write-wiring`)
for blank 48h-tier intake rows. Launch may proceed; close within 48 hours.

| Done | What we need | Owner | config / secret |
|---|---|---|---|
| — | _(none yet)_ | — | — |

## Notes / decision-table rulings applied

-
