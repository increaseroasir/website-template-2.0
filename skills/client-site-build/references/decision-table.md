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
| Anything not in this table | Propose a new row in the build report; do NOT improvise silently | The table only stays load-bearing if gaps get ruled once, centrally |
