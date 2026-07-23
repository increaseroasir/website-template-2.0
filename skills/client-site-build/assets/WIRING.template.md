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

## The eight IDs (each row: value + live verification)

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

## Post-launch verification (within 1 hour of DNS)

| Item | Result | Date |
|---|---|---|
| Cellular test lead → GHL sub-account + automation fired | | |
| Inventory gate unlocked end-to-end; unlock persisted | | |
| GA4 Realtime + Meta Test Events on CLIENT IDs | | |
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

## Notes / decision-table rulings applied

-
