---
name: dealer-site-hydrate
description: >
  Build a client dist/ by copying the template and running build-config token
  hydration. Use after intake validation passes, when asked to build, preview,
  or hydrate a dealer client site. Never builds in place on the template.
compatibility: Requires validated clients/<name>/ from dealer-site-intake.
  Node.js 18+. Template repo checkout.
metadata:
  author: Start Scale Automate
  version: "2.0"
---

# Dealer Site Hydrate

Produce `clients/<name>/dist/` — the only place `build-config.mjs` may run.

## Preconditions

- `dealer-site-intake` `--validate <name>` printed **PASS**
- HUMAN CHECKPOINT 1 signed off

## Build (from repo root)

```bash
mkdir -p clients/<name>/dist
rsync -a --exclude .git --exclude node_modules --exclude skills \
  --exclude manus-skills --exclude clients --exclude .wrangler \
  --exclude docs --exclude '*.md' --exclude .cursor \
  --exclude package.json --exclude package-lock.json \
  ./ clients/<name>/dist/
cp clients/<name>/client.config.js clients/<name>/dist/client.config.js
cd clients/<name>/dist && set -a && . ../tokens.env && set +a && node scripts/build-config.mjs
rm -rf scripts
```

`build-config.mjs` rewrites files **where it runs** — only inside `dist/`.

## After build

1. Preview from `dist/` (not the template root).  
2. Hand off to `dealer-site-launch` for `gate.mjs --env staging`.  
3. Stress case: hydrate with `templates/hostile.config.js` semantics when testing empty/edge tokens.

## Laws

- Never write tokens into the template checkout.  
- Never ship `scripts/` inside a client artifact.  
- If no dist pipeline exists, **STOP** and report — do not invent an in-place build.
