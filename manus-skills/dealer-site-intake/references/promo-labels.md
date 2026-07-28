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

## Product-detail content fields (TVD-027 — fuels the sales page)

The product page (`/active-inventory/<slug>/`) is a Paradise-style sales
layout. These six optional fields fill its rich sections; each section
auto-hides when its field is empty, so a sparse record still renders clean.

| Field | Section it fills | Rules |
| --- | --- | --- |
| `headline` (≤140) | Hero H1 | Name + plain-words benefit: "Eco Spa E4 — More Seating Without the Oversized Footprint". Falls back to the product name. |
| `positioning_label` (≤60) | Hero kicker | Who-is-this-for segment tag: "VALUE / FAMILY COMFORT", "FAMILY SIZE / BEST SELLER", "LUXURY / THERAPY FOCUS". Falls back to `promo_label`, then category. |
| `hero_description` (≤320) | Hero sub | 1–2 sentences selling this exact unit. Falls back to `delivery_promise`. |
| `why_bullets` (≤6 × 220) | "Why This One Stands Out" checklist | One concrete, honest benefit per bullet. No invented specs. |
| `long_description` (≤1400) | "About the <name>" paragraph | One honest paragraph: who it's for, what makes it worth it, why buy this unit now. |
| `best_for` (≤220) | Gold "Best For" callout | One line: the exact buyer. "Families of four to six who want daily soaks." |

Also on the page automatically: all `quick_facts` (up to 8) as the Quick Facts
grid, the model name as a gold subtitle when `headline` is set, price/monthly in
the sticky price card (with the ask-treatment when empty), an out-the-door
pricing promise line, status-driven availability copy plus a pending/sold
callout box with backup-inquiry / restock-list CTAs, and a sticky mobile CTA
bar (Call + status CTA) that appears after the hero and hides at the form.
