# Hydrate dist/

From repo root (never build in place on the template):

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

Staging: `ROBOTS_DIRECTIVE=noindex, follow` in tokens.env.
Prod: `ROBOTS_DIRECTIVE=index,follow` + DOMAIN set. Admin keeps hardcoded noindex.
