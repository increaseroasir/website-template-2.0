#!/usr/bin/env bash
# Local hydrated preview: copies the template to a scratch dir, hydrates it with
# a client's tokens, and serves it. Never mutates the working tree.
#
#   scripts/dev-preview.sh [client] [port]
set -euo pipefail

CLIENT="${1:-sun-pool-spa}"
PORT="${2:-4211}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="/tmp/preview-$CLIENT-$PORT"

# Fail closed: protected clients (e.g. sun-pool-spa) require a break-glass artifact.
# A CLI flag alone is never sufficient authorization.
(
  cd "$REPO"
  node --input-type=module -e "
import { assertClientMutationAllowed, ClientProtectionError } from './scripts/lib/client-protection.mjs';
try {
  assertClientMutationAllowed({
    repoRoot: process.cwd(),
    clientSlug: process.argv[1],
    operation: 'preview-hydrate'
  });
} catch (err) {
  const msg = err instanceof ClientProtectionError ? err.message : String(err);
  console.error('[client-protection]', msg);
  process.exit(1);
}
" "$CLIENT"
)

if [ ! -f "$REPO/clients/$CLIENT/tokens.env" ]; then
  echo "no tokens.env for client '$CLIENT'" >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"
rsync -a \
  --exclude .git --exclude node_modules --exclude clients --exclude .wrangler \
  --exclude skills --exclude manus-skills --exclude docs --exclude .cursor \
  --exclude '*.md' --exclude package.json --exclude package-lock.json \
  "$REPO/" "$OUT/"
cp "$REPO/clients/$CLIENT/client.config.js" "$OUT/client.config.js"

# Category tiles and the hero reference assets that live on the deployed site
# rather than in the repo, so pull them in to avoid empty image wells locally.
mkdir -p "$OUT/assets"
for f in \
  HERO_sun-pool-spa-hydropool-blue-led-hot-tub.webp \
  HOTTUBS_sun-pool-spa-six-person-hot-tub.webp \
  SWIMSPAS_sun-pool-spa-blue-led-swim-spa.webp \
  SHOWROOM1_sun-pool-spa-storefront.webp \
  SHOWROOM2_sun-pool-spa-interior.webp \
  PRODUCT_sun-pool-spa-service-install.webp
do
  [ -f "$OUT/assets/$f" ] && continue
  curl -fsL -A 'Mozilla/5.0' "https://sun-pool-spa.pages.dev/assets/$f" -o "$OUT/assets/$f" 2>/dev/null || true
done

( cd "$OUT" && set -a && . "$REPO/clients/$CLIENT/tokens.env" && set +a && node scripts/build-config.mjs >/dev/null )
rm -rf "$OUT/scripts" "$OUT/components"

echo "serving $CLIENT on http://127.0.0.1:$PORT (source: $OUT)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$OUT"
