---
name: dealer-site-orchestrator
description: >
  Route and supervise building a hot-tub dealer client website from the
  website-template premium redesign. Use when the user asks for a new dealer
  site, client build, fulfillment, launch, rush / urgent build, or "build the
  site for [business], here's their info". Composes intake → hydrate → wiring
  → launch. Do not use for template design-system or palette changes.
compatibility: Requires the companion Manus skills dealer-site-intake,
  dealer-site-hydrate, dealer-site-wiring, and dealer-site-launch in the same
  project. Requires a checkout of the website template repo with Node.js 18+.
metadata:
  author: Start Scale Automate
  version: "2.2"
  manus: composable-orchestrator
---

# Dealer Site Orchestrator

You are the router for dealer website fulfillment. **Do not do all work in this skill alone.** Activate (or follow) the specialized skills below in order. Manus Skills are composable — load Level-3 resources only when a step needs them.

## Laws (never violate)

1. **Hydrate, never rebuild.** Client builds change config, tokens, and images only.
2. **No unversioned copies.** Record template version in `WIRING.md` as root
   `VERSION` **and** the fetched git SHA (e.g. `template: 1.1.0 @ <sha>`).
3. **Palette is the product.** Navy + gold stays; client = logo, copy, photos, market.
4. **Fail loudly before launch.** Gate FAIL or unchecked wiring = blocked launch.
5. **Rush reduces scope, never quality gates.** A rush build still runs full
   `--validate` (REQUIRED tier), `gate.mjs`, and the post-launch cellular test
   lead. It does not skip validation, gate FAIL rows, or live lead proof.
6. **The fetched commit is the only skill source.** At the start of every build,
   read `manus-skills/` out of the certified SHA you just fetched — never from an
   uploaded zip, a local workspace copy, or memory of a previous build. Process
   fixes ship as commits exactly like code fixes, and a stale pack silently
   reintroduces a failure that was already solved and paid for. If a document you
   are reading references a section your copy does not contain, your pack is
   stale: re-fetch before continuing.

## Compose these skills (in order)

| Step | Skill (slash / name) | When to load its resources |
|---|---|---|
| 1 | `dealer-site-intake` | Sheet/brief → config/tokens; `--profile rush` when urgent |
| 2 | `dealer-site-hydrate` | Building `clients/<name>/dist/` |
| 3 | `dealer-site-wiring` | Verifying browser IDs + Meta CAPI / offline funnel live |
| 4 | `dealer-site-launch` | Staging/prod gate, DNS, indexing, day-7 |

If a situation is ambiguous, **read** `references/decision-table.md` before asking a human.

## Rush build (target intake→launch in 1–2 days)

1. Intake via sheet or messy brief (`intake-sheet-mapping.md`).  
2. `--validate <name> --profile rush` → REQUIRED hard-fail; else `fixList48h` in WIRING.md.  
3. **Checkpoint 1 (one message):** config summary + defaults[] + photo mapping + 48h list → approve/reject.  
4. Hydrate + `gate.mjs --env staging` then prod-token gate.  
5. **Checkpoint 2 (one message):** gate table + screenshots → approve/reject.  
6. DNS + post-launch test lead (never skipped) + day-7 scheduled.

## Checklist (track literally)

```
- [ ] Intake skill: --init + sheet/brief + --validate [--profile rush] PASS
- [ ] HUMAN CHECKPOINT 1: config + defaults (+ rush: photos + 48h list) signed off
- [ ] Hydrate skill: dist build complete
- [ ] Launch skill: gate --env staging all PASS
- [ ] Wiring skill: IDs 1–10 + Meta CAPI/offline (11–13) live-verified (or documented empty)
- [ ] Launch skill: human checklist + HUMAN CHECKPOINT 2
- [ ] Post-launch test lead + day-7 crawl verification logged in WIRING.md
```

## Gotchas

- Offline Meta events need the 6 contact fields + the stage webhook; missing
  pieces skip silently — the funnel looks alive in the browser while CRM
  events go nowhere. CAPI token lives in Cloudflare secrets, never GHL.

## Out of scope

Template CSS/layout/palette changes, Paradise Spas hardcodes, inventing stats/reviews/JSON-LD, deploying past a gate FAIL.
