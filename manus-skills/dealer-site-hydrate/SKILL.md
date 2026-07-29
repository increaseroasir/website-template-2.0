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
- **Template checkout is CURRENT**: `git fetch origin` then confirm
  `git rev-parse HEAD` equals `git rev-parse origin/premium-redesign` — or
  exactly the commit SHA named in the work order. On mismatch or pull
  failure, STOP and report; never hydrate the copy that happens to be on
  disk (build #1 shipped a partial fix this way). Record the SHA in
  WIRING.md build provenance.

## Lint the token file first (blocking)

```bash
npm run check:tokens clients/<name>/tokens.env
```

A non-zero exit blocks the build. `tokens.env` is sourced by bash below, not
parsed, so `CLIENT_NAME=Sun Pool & Spa Supply` exports **nothing** — and because
almost every token is written `{{TOKEN|default}}`, the page then renders the
template's default and the placeholder scanner passes. The client's real copy is
gone with no error anywhere. The linter also catches duplicate keys, where the
last assignment silently wins over any earlier edit (WTV-061).

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

## Client redirects

`_redirects` is copied verbatim and is **not** token-hydrated, so a client rule
cannot live in the shared template. If `clients/<name>/redirects.extra` exists,
append it after the copy:

```bash
[ -f clients/<name>/redirects.extra ] && \
  cat clients/<name>/redirects.extra >> clients/<name>/dist/_redirects
```

That file holds two kinds of rule, and both are lost on the next hydrate if they
were hand-edited into `dist/` instead:

- **Legacy 301s** for URLs indexed on the site being replaced. Without them a
  cutover throws away the ranking of every old page.
- **Repointed nav slots.** A client using `{{SAUNAS_URL}}` for something other
  than saunas leaves `/saunas/` built but unlinked, so anyone holding that URL
  still lands on an empty category grid (TVD-052).

Order matters: Pages applies the first matching rule, so put specific paths
above wildcards. A splat also matches its own directory — `/hp/*` matches `/hp/`
with an empty splat — so a rule for `/hp/` placed *below* `/hp/*` is unreachable.
Verify with the post-deploy smoke, not by reading the file.

### This file is a client input, not a repo file

`clients/<name>/` is **not** in the template repo. `tokens.env`,
`client.config.js`, and `redirects.extra` are delivered per client. Checking out a
SHA and finding no `redirects.extra` means **it was not supplied yet**, not that
the client has no rules. Ask for it. Never invent historical 301s, and never
silently skip the step — a skipped legacy 301 is invisible until the client's
rankings drop weeks later.

### Deriving legacy rules from evidence

Every source path must be confirmed to exist on the site being replaced, and the
old site is the only authority for what those paths are:

```bash
OLD=https://<client-domain>

# 1. Paths linked from the legacy homepage — catches whole sections a brief omits.
curl -s $OLD/ | rg -o 'href="(/[^"#?]*)"' | sed 's/href="//; s/"$//' \
  | rg -v '\.(css|js|png|jpe?g|webp|svg|ico|woff2?)$' | sort -u

# 2. The old sitemap, if it publishes one.
curl -s $OLD/sitemap.xml | rg -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g'

# 3. Confirm each candidate really resolves before writing a rule for it.
for p in /about/ /services/ ...; do
  printf '%s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' $OLD$p)"
done
```

Step 1 is not optional. On Sun Pool the brief listed `/hp/`, but the crawl found
`/hp/hot-tubs/` and `/hp/swim-spas/` — two ranked category pages that a bare
`/hp/` rule does not match and that would have 404'd after cutover.

Record in the file's header which paths were verified and when. A rule whose
source 404s on the old site is forward-looking, not a legacy 301, and should say
so — otherwise the next person reads it as evidence that the path once existed.

## After build

1. Confirm `dist/functions/api/` exists (lead, inventory, meta-offline,
   booking) — the rsync recipe keeps it; if it is missing, the deploy will
   ship a site with no working APIs and gate.mjs will FAIL it.
2. Preview from `dist/` (not the template root).  
3. Hand off to `dealer-site-launch` for `gate.mjs --env staging`.  
4. Stress case: hydrate with `templates/hostile.config.js` semantics when testing empty/edge tokens.

## Laws

- Never write tokens into the template checkout.  
- Never ship `scripts/` inside a client artifact.  
- If no dist pipeline exists, **STOP** and report — do not invent an in-place build.
