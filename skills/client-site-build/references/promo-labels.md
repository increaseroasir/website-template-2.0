# Promo labels & no-price behavior (product merchandising)

`promo_label` is the small badge on every inventory card (circle badge on default
cards, `product-tag` pill on inventory/category cards, `badge` on home cards) and
the section heading on the product detail page. One short phrase per product.

## Rules

- **Max ~18 characters / 1–3 words.** Longer strings overflow the circular
  `sale-badge` on default cards.
- **One label per product.** Pick the single strongest angle; don't stack.
- **Never invent a claim.** "Save $1,500" only if the discount is real;
  "1 Left" only if quantity is actually 1. Labels are marketing copy, not
  schema facts, but the no-invented-stats law still applies.
- **Leave blank when nothing applies.** The card falls back automatically
  (quantity count, category name, or "Available") — a generic label is worse
  than the fallback.

## Recommended pick-list

| Angle | Labels |
| --- | --- |
| Scarcity (strongest) | `1 Left` · `2 Left` · `Last One` · `Floor Model` · `Display Model` |
| Price event | `Event Price` · `Price Drop` · `Clearance` · `Save $1,500` (real $ only) · `Manager's Special` |
| Freshness | `New Arrival` · `Just Landed` · `2026 Model` |
| Social proof | `Best Seller` · `Most Popular` · `Staff Pick` |
| Readiness | `Wet-Test Ready` · `Delivery Ready` |
| Financing hook | `0% APR` (only if a real program exists) · `From $89/mo` (must match `monthly_payment`) |

Priority when several apply: **scarcity > price event > freshness > social
proof > readiness > financing**. Scarcity converts hardest for in-stock local
inventory.

## No-price behavior (built into the template — do not fake a price)

When `price` is 0/empty the renderers never print "$0"; they sell the price
request instead:

- **Default card:** "Today's local price / **Text-back pricing** / 30-second
  request — no obligation" (monthly line still shows if `monthly_payment` set).
- **Home card:** "Today's local price / **Ask — we'll text it back**".
- **Inventory/category card:** monthly-only box if `monthly_payment` is set;
  otherwise "Today's Local Price / **Ask — texted in minutes**".
- **Product detail page:** panel heading becomes "Today's Local Price" with
  "Ask — we'll text it back in minutes".

So: if the client won't publish a price, leave `price` empty — never enter 0,
1, or a placeholder dollar amount. Setting `monthly_payment` alone is a good
middle ground ("Financing as low as $X/mo") for MAP-restricted brands.
