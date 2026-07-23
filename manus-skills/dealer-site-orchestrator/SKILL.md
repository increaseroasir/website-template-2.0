---
name: dealer-site-orchestrator
description: >
  Route and supervise building a hot-tub dealer client website from the
  website-template premium redesign. Use when the user asks for a new dealer
  site, client build, fulfillment, launch, or "build the site for [business]".
  Composes intake → hydrate → wiring → launch skills. Do not use for template
  design-system or palette changes.
compatibility: Requires the companion Manus skills dealer-site-intake,
  dealer-site-hydrate, dealer-site-wiring, and dealer-site-launch in the same
  project. Requires a checkout of the website template repo with Node.js 18+.
metadata:
  author: Start Scale Automate
  version: "2.0"
  manus: composable-orchestrator
---

# Dealer Site Orchestrator

You are the router for dealer website fulfillment. **Do not do all work in this skill alone.** Activate (or follow) the specialized skills below in order. Manus Skills are composable — load Level-3 resources only when a step needs them.

## Laws (never violate)

1. **Hydrate, never rebuild.** Client builds change config, tokens, and images only.
2. **No unversioned copies.** Record template version in `WIRING.md`.
3. **Palette is the product.** Navy + gold stays; client = logo, copy, photos, market.
4. **Fail loudly before launch.** Gate FAIL or unchecked wiring = blocked launch.

## Compose these skills (in order)

| Step | Skill (slash / name) | When to load its resources |
|---|---|---|
| 1 | `dealer-site-intake` | Filling `client.config.js`, `tokens.env`, images |
| 2 | `dealer-site-hydrate` | Building `clients/<name>/dist/` |
| 3 | `dealer-site-wiring` | Verifying the ten integration IDs live |
| 4 | `dealer-site-launch` | Staging/prod gate, DNS, indexing, day-7 |

If a situation is ambiguous, **read** `references/decision-table.md` before asking a human.

## Checklist (track literally)

```
- [ ] Intake skill: --init + fill + --validate PASS
- [ ] HUMAN CHECKPOINT 1: config + defaults signed off
- [ ] Hydrate skill: dist build complete
- [ ] Launch skill: gate --env staging all PASS
- [ ] Wiring skill: all ten IDs live-verified (or documented empty)
- [ ] Launch skill: human checklist + HUMAN CHECKPOINT 2
- [ ] Post-launch + day-7 crawl verification logged in WIRING.md
```

## Out of scope

Template CSS/layout/palette changes, Paradise Spas hardcodes, inventing stats/reviews/JSON-LD, deploying past a gate FAIL.
