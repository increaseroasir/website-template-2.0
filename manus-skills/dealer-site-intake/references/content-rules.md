# Content Rules — copy limits + honesty rules

Read this BEFORE writing any token value. Limits are derived from the shipped
CSS — they exist because the layout breaks past them, not as style
preferences. Voice/phrasing is free within the limits.

## Length ceilings (why each exists)

| Surface | Tokens (pattern) | Limit | Why (CSS reality) |
|---|---|---|---|
| Hero H1 | `*_HEADLINE`, `HOME_HERO_HEADLINE` + `_ACCENT` | ≤48 chars combined | `clamp(2.1rem,7vw,3.9rem)` wraps to 3+ lines at 390px past ~48 chars and pushes the lead card below the fold |
| Accent word | `HOME_HERO_HEADLINE_ACCENT` | 1–3 words | it's a gradient `.deg` span inside the H1 — a whole gradient sentence reads as decoration, not emphasis |
| Subheads | `*_SUBHEAD` | ≤140 chars | `max-width:640px` body copy = 2–3 lines at 390px |
| Section headlines | `*_SECTION_HEADLINE`, `PROMISE/FINANCING/FINAL_CTA_HEADLINE` | ≤60 chars | h2 `clamp(1.6rem,4vw,2.6rem)`, centered sections wrap ugly at 3 lines |
| Button labels | `*_CTA`, `OFFER_PRIMARY_CTA`… | ≤22 chars | `.btn{white-space:nowrap}` — long labels overflow the pill, especially two-up rows at 390px |
| Mono eyebrows/kickers | `*_KICKER`, `*_EYEBROW`, `*_LABEL` | ≤28 chars | Spline Sans Mono at `.68rem` with `.26em` tracking is ~1.9× wider per char |
| Marquee offer line | `OFFER_NAME` + `OFFER_HEADLINE` + `OFFER_ENDS_LABEL` | ≤90 chars combined | single-line scrolling strip |
| Stat values | `STAT_*_VALUE` | digits + one prefix/suffix (`$`, `+`, `★`) | the count-up parser reads `prefix|number|suffix`; sentences won't animate |
| Stat labels | `STAT_*_LABEL` | ≤24 chars | mono `.6rem` under a 2rem numeral, 4-up grid |
| Fair-list bullets | `OFFER_BULLET_*` | ≤90 chars | 21px check glyph hangs at `top:1px` — 3+ line bullets look detached |
| Review quotes | `REVIEW_*_TEXT` | ≤220 chars | cards are equal-height flex; one 500-char review stretches the whole row |
| FAQ answers | `FAQ_A_*` | ≤400 chars | grid-rows accordion animates height; huge answers feel broken |
| Meta descriptions | `*_META_DESCRIPTION` | 120–158 chars | SERP truncation |
| SEO titles | `*_SEO_TITLE` | ≤60 chars incl. brand | SERP truncation |
| Disclaimers | `LEAD_FORM_DISCLAIMER`, `FINANCING_DISCLAIMER` | ≤240 chars | consent must stay visible at 390×650 after compaction (it shrinks to .56–.6rem, never hides) |

Business name note: the header, drawer, and footer are built for names up to
~40 chars. Longer legal names (e.g. "Smoky Mountain Hot Tub & Swim Spa
Superstore of Greater Knoxville") go in `CLIENT_LEGAL_NAME` / JSON-LD /
TCPA; put a short trading name in `CLIENT_NAME`. **Never shrink fonts to
fit a name** (decision-table.md).

## Character hazards

- **`|` never appears in a tokens.env value** — the hydrator parses
  `{{TOKEN|default}}` and a pipe in the value corrupts the replacement.
  Rephrase ("and", "·", "—").
- **Apostrophes are fine in text tokens** but risky in tokens rendered into
  HTML attributes (see token-reference.md context column) — prefer typographic
  ’ over ' in attribute-context tokens.
- No emoji as icons anywhere (SITE_MASTER_SPEC law).

## Honesty rules (facts, not copy)

- **Stats band** (`STAT_*`): true numbers for THIS client — years, deliveries,
  rating, review count. A 3-review dealer does not get "170+ five-star
  reviews".
- **JSON-LD aggregateRating**: the client's real GMB rating/count, or the
  block is **removed entirely**. Never inherited, never rounded up.
  <10 reviews → drop the rating schema (decision-table.md).
- **Reviews**: this client's real reviews — real first names, months, source.
  No composites, no paraphrases that change meaning.
- **TCPA/consent** (`LEAD_FORM_DISCLAIMER`, `CLIENT_LEAD_DISCLAIMER`): must
  name THIS business and THIS phone, include call/text consent +
  message/data-rates + opt-out language. It may shrink at short viewports;
  it never hides.
- **Offer copy**: an offer with no `OFFER_ENDS_AT` is evergreen — remove or
  neutralize urgency phrasing ("this weekend only" with no deadline is a lie).

## Local-SEO title/H1 formulas (formulas, not padding)

These are the highest-leverage on-page signals for a local dealer. Apply
once per page, naturally — a second stuffed mention reads as spam to both
Google and humans.

- **Title tags lead with service + city**, brand last:
  `Hot Tubs, Swim Spas & Saunas in {{CITY}} | {{CLIENT_NAME}}` —
  because Google truncates titles around ~60 chars and weights leading
  words; "service in city" is what local buyers actually type.
- **Category page titles narrow to the one service**:
  `Hot Tubs for Sale in {{CITY}} | {{CLIENT_NAME}}` — because a category
  page competing for all three services ranks for none of them.
- **Homepage H1 contains the city or market phrase** (`CLIENT_MARKET`
  works: "the Knoxville area") — because the H1 is the strongest on-page
  relevance signal after the title, and a hero that never names the market
  reads as a national brand to the algorithm.
- **Category H1/body mentions the city or service area exactly once,
  naturally** ("Shop hot tubs in {{CITY}}" / "serving {{MARKET}}") —
  because zero mentions loses the local signal and 3+ mentions is keyword
  stuffing, which suppresses rather than boosts.
- **Meta descriptions**: one city mention + the offer/differentiator + a
  verb ("Shop", "Compare", "See prices") — because descriptions don't rank
  but decide the click, and local intent converts on proximity + price.
- Never invent neighborhoods/suburbs the client doesn't serve to widen
  reach — areaServed claims must match the real service area (honesty rules
  above apply to geography too).
