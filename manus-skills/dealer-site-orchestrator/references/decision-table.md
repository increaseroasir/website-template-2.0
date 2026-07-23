# Decision Table — no-asking defaults

When a build situation isn't covered by SKILL.md or the other references,
find it here BEFORE asking a human. Apply the ruling, log it in the build
report, and move on. If it's not in this table either, propose a new row in
the build report — don't improvise silently (Law 4).

| Situation | Ruling | Because |
|---|---|---|
| No active offer / no end date | Evergreen mode: leave `OFFER_ENDS_AT` empty; `body.offer-static` hides clock UI; neutralize urgency copy | Dead `00:00:00` tiles are urgency theater; a past date is worse |
| Offer date given without timezone | Block at `--validate` (it enforces TZ); ask intake for the client's local TZ, don't guess | Midnight in the wrong zone ends promos 5+ hours early/late |
| Missing image for a token | Leave the token empty (gradient well renders) + flag at Checkpoint 1 | Empty degrades cleanly by design; a stock-photo guess misrepresents the showroom |
| Image URL 404s | Fix or empty it before launch — never ship | `onerror` hides it, but a 404 still costs a request and fails the archive |
| Uploaded image under the token's minimum size | Upscale with the approved scaling tool **up to 2×**; record every upscale (file, from→to dims) in the build report | Modest AI upscales are invisible in gradient wells; past 2× artifacts show |
| Uploaded image below HALF the minimum | Request a better original — do not upscale | 2×+ upscaling produces visible mush on hero-sized surfaces |
| LCP hero image under minimum | Ship native-res whenever possible; an upscaled hero gets its own Checkpoint 1 flag | The hero is the first paint and the largest surface — quality loss is most visible there |
| <10 Google reviews | Drop the JSON-LD aggregateRating block entirely; stats band uses other true numbers | Thin ratings in schema invite penalties; honesty rules forbid padding |
| Rating below ~4.0 | Drop schema rating AND the stats-band rating stat; use years/deliveries instead | Advertising a 3.2 hurts; inventing a better one is fraud |
| Business name too long for header | Short trading name in `CLIENT_NAME`, full name in `CLIENT_LEGAL_NAME`/JSON-LD/TCPA — **never shrink fonts** | Header/drawer/footer are sized for ~40 chars; font hacks are a Law 1 violation |
| Client wants different colors/palette | Escalate per Laws 1/3 — change nothing | Palette lives in hundreds of gradient stops + data-URI SVGs; it's a template-repo re-theming project |
| Client wants a layout/section change | Escalate to the template repo as a version-bump request | Law 1: hydrate, never rebuild |
| Missing hours or address | Block at Checkpoint 1 — these feed JSON-LD, footer, and GMB consistency | A launched site with wrong NAP data poisons local SEO |
| Missing Turnstile sitekey | **Block launch** | Forms fail silently = invisible lead loss; the page looks fine, leads vanish |
| Missing any of the 8 wiring IDs | Block launch (B2 is all-or-nothing) | Every missing ID is either lost data or leads routed to the wrong business |
| Missing GHL sub-account entirely | Block; wiring can't be verified against nothing | A lead endpoint pointed "somewhere" is worse than down |
| Intake silent on service-area towns | Use towns from the client's GMB profile radius; flag list at Checkpoint 1 | Chips must be real towns; GMB is the least-wrong source |
| Client provides reviews without names/dates | Use "Verified customer" + month/source if the source is real; drop otherwise | Reviews are facts; unverifiable ones don't ship |
| Token value needs a `\|` | Rephrase with "and"/"·"/"—" in tokens.env | Pipe corrupts the `{{TOKEN\|default}}` parser |
| Staging URL needs to be shared publicly | Keep `noindex`; share the URL; never flip robots early | An indexed staging site cannibalizes the launch domain |
| GSC verification token absent at launch | Launch proceeds; flag as open wiring item; verify the property within 48h | The token gates reporting, not indexing — the meta is stripped when empty, so nothing broken ships |
| Staging build + indexing | robots.txt `Disallow: /` + `noindex` meta (automatic); NEVER submit staging to IndexNow or GSC — `indexnow.mjs` refuses staging dists | One indexed staging URL competes with the launch domain forever |
| Client has no Google Business Profile | Flag at Checkpoint 1; launch proceeds; GBP creation is an upsell, not a blocker | The GBP website link is a huge local lever, but it's the client's asset to create — not a build dependency |
| GHL External Tracking key absent at launch | Launch proceeds (cosmetic tier in the validator); flag as open wiring item alongside GSC; add within 48h | Attribution loss, not lead loss — leads still flow via /api/lead; only session stitching/page-view history is missed |
| External tracking on staging builds | NEVER a real tracking URL/ID on staging — gate.mjs FAILS it; leave empty until the prod build | Staging page views would stitch into the client's real GHL contacts and pollute attribution |
| External tracking creates duplicate contacts | FAIL wiring ID #9; investigate dedupe-merge (email/phone matching) before launch — do not ship | Twin contacts split the timeline, double-fire automations, and wreck reporting for every lead after launch |
| Booking calendar ID absent at launch | Launch proceeds (cosmetic tier); /book/ runs request-mode (preferred-day capture, confirm-by-text); add the ID within 48h | Convenience loss, not lead loss — every submit still creates a tagged GHL contact |
| Booking test appointment fails but contact appears | Check calendar has an assigned team member AND belongs to this client's location (a wrong-location ID shows slots but rejects every booking) | free-slots does not location-check the calendar; only appointment creation does — slots rendering proves nothing about bookability |
| Booked appointments don't fire automations | Rebuild the workflow on **Customer Booked Appointment** (filter: booking calendar) or **Appointment Status = confirmed**; API bookings surface as Source "Third party" | Form-submitted triggers never fire for /book/ — no GHL form is involved |
| Anything not in this table | Propose a new row in the build report; do NOT improvise silently | The table only stays load-bearing if gaps get ruled once, centrally |
