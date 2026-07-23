---
name: client-site-build
description: >-
  Build, hydrate, update, or launch a client website from the
  website-template-2.0 hot tub dealer template. Use when asked to create a
  new customer or client site, set up the template for a dealer, swap in a
  client's branding, copy, images, or market details, wire tracking or GHL
  integrations, run the launch gate, or push a client site live — even if
  the request just says "build the site for [business name]" without
  mentioning the template or tokens. Do NOT use for changes to the
  template's shared design system, layout, or palette — those are
  template-repo changes, out of scope for client builds.
compatibility: Requires Node.js 18+ and a repo checkout of website-template-2.0.
metadata:
  author: Start Scale Automate (SSA)
  version: "1.0"
---

# Client Site Build

Turn an intake brief into a launched client site by **hydrating tokens only**.
Canon (never contradict, in this order): `SITE_MASTER_SPEC.md` →
`FINAL_DIAL_IN_AND_LAUNCH_GATE.md` → this skill.

## Laws (Part C — absolute)

1. **Hydrate, never rebuild.** A client build touches ONLY config, token
   values, and image assets. Styling changes go to the template repo and ship
   as a version bump to the fleet.
2. **No unversioned copies.** Every client site records the template version
   it was built from (in `WIRING.md`).
3. **Palette is the product.** Navy+gold is load-bearing. Client branding =
   logo, copy, photos, market — never palette.
4. **Fail loudly before launch, never after.** Ambiguity gets flagged in the
   gate report, not guessed. An unchecked box is a blocked launch — no
   exceptions, including "the client is in a hurry."

## Workflow checklist

Copy this into your task tracking and check items off literally. Config is
the plan, `--validate` checks the plan, `gate.mjs` checks the build. **Never
skip a validation step or proceed past a FAIL.**

```
- [ ] 1. Intake → config: node skills/client-site-build/scripts/new-client.mjs --init <name>
- [ ] 2. Fill config from intake brief (read references/content-rules.md before writing any copy)
- [ ] 3. Validate: new-client.mjs --validate <name> → must print PASS + defaults report
- [ ] 4. HUMAN CHECKPOINT 1: config + shipped-defaults sign-off
- [ ] 5. Build to dist/ (never in place); preview from dist/
- [ ] 6. Gate: node skills/client-site-build/scripts/gate.mjs --env staging → all PASS
- [ ] 7. Wiring live-verification (read references/wiring.md now)
- [ ] 8. Manual launch items (read references/launch-checklist.md now)
- [ ] 9. HUMAN CHECKPOINT 2: final gate sign-off before DNS
- [ ] 10. Post-launch: test lead end-to-end; archive WIRING.md + screenshots
```

Step 5 build command (from the client dir, config already validated):

```bash
mkdir -p clients/<name>/dist
rsync -a --exclude .git --exclude node_modules --exclude skills --exclude clients \
  --exclude .wrangler <template-root>/ clients/<name>/dist/
cp clients/<name>/client.config.js clients/<name>/dist/client.config.js
cd clients/<name>/dist && set -a && . ../tokens.env && set +a && node scripts/build-config.mjs
```

(`tokens.env` supplies the content tokens build-config.mjs reads from the
environment; config keys cover the wiring/identity tokens.)

`build-config.mjs` rewrites files **where it runs** — that is why it must
only ever run inside `dist/`, never in the template checkout.

## Gotchas — read before you hit them

- The legacy build wrote **in place** and destroyed the template's tokens;
  only ever build to `dist/` — if no dist pipeline exists, STOP and report.
- Empty Turnstile sitekey = forms fail silently = invisible lead loss;
  verify a real submit succeeds, not just that the page renders.
- No offer date → evergreen mode (`body.offer-static` hides clock UI); never
  ship dead `00:00:00` countdown tiles — an empty `OFFER_ENDS_AT` is valid,
  a stale past date is not.
- Palette is load-bearing (hardcoded gradient stops + data-URI SVGs in CSS);
  "change the colors" is an escalation per Laws 1/3, not an edit.
- Token values may contain `|` and apostrophes; `|` inside a *value* breaks
  the `{{TOKEN|default}}` pipe parser and apostrophes break attribute
  contexts — always test with `assets/hostile.config.js` semantics.
- `#prodRail` dots generate **after** inventory hydration
  (`dealer:inventory-hydrated` event), not on DOMContentLoaded — don't
  "fix" empty dots at load time.
- TCPA/consent text may shrink at short viewports but **never** hides;
  compaction ladders shed logo → chips → lead paragraph, never consent.
- First-party asset URLs are cache-busted (`?v=`); a stale-looking JS bug is
  usually a missing version stamp, not a code bug — bump the stamp first.

## Scripts

- `scripts/new-client.mjs --init <name>` — scaffold `clients/<name>/` from
  the intake + config templates (never overwrites without `--force`).
- `scripts/new-client.mjs --validate <name>` — schema check; JSON verdict
  with `errors[]`, `warnings[]`, and `defaults[]` (every token shipping on
  its `|default`). Exit 0 pass / 1 fail / 2 bad usage.
- `scripts/gate.mjs --env staging|prod [--dist <path>]` — mechanical launch
  gate against a built `dist/` only: `{{` leftovers, template fingerprints
  (`scripts/template-fingerprints.json`), duplicate IDs, dead hrefs/anchors,
  img alt/dimensions, preload count, robots-vs-env, E164 tel/sms. JSON table
  `{check, status, evidence}`; rows it can't check emit `MANUAL`. Exit 0
  all-pass / 1 fails present.

npm aliases: `npm run client:new -- --init <name>`,
`npm run client:validate -- --validate <name>`, `npm run client:gate -- --env staging`.

## When to load each reference

- `references/token-reference.md` — before filling any token value; it lists
  all 328 tokens with context, defaults, required flags, and length limits.
- `references/content-rules.md` — before writing ANY copy (length ceilings
  derived from the CSS + honesty rules for stats/reviews/JSON-LD/TCPA).
- `references/images.md` — before sourcing or placing any image (dims,
  `_ALT` pairs, LCP handling, empty-token behavior).
- `references/wiring.md` — before touching any integration ID (the eight
  IDs, where they live, what a leftover looks like, live verification).
- `references/launch-checklist.md` — at step 8; the human-only Part B items.
- `references/decision-table.md` — when a situation isn't covered above,
  read it BEFORE asking a human; it has the no-asking defaults.

## Copywriting freedom

Voice and phrasing are yours within content-rules limits. The limits exist
because the layout breaks, not because of taste: e.g. hero headlines wrap to
three lines at 390px past ~48 characters; `.btn` is `white-space:nowrap` so
long button labels overflow the pill. Stats, reviews, ratings, and JSON-LD
are **facts, not copy** — real numbers or removed, never invented.
