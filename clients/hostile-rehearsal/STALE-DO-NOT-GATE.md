# This `dist/` is frozen evidence. Do not run the launch gate against it.

`dist/` here is a **committed build output** kept as the cited artifact for the
hostile-client certification run in `TEMPLATE_CERTIFICATION.md`. It is a
snapshot, not a current build, and it has not been re-hydrated since that run.

Running `gate.mjs --dist clients/hostile-rehearsal/dist` today reports **7
failures that are not template defects.** Every one is a fix the template has
since shipped and this frozen snapshot predates:

| Gate row that fails | Fixed in |
|---|---|
| `security: zero captcha / Turnstile references` | TVD-025 (Turnstile removed entirely) |
| `routing: no 200-proxy targets a .html path` | WTV-034 |
| `product shell: no hardcoded data-product-slug` | WTV-035 |
| `tracking: head scripts inlined` | WTV-040 (pixel + config inlining) |
| `preload: no image preloads` | WTV-042 (hero preload cost 2.3s of LCP) |
| `robots: matches --env staging` ×2 | n/a — snapshot was built for prod, gated as staging |

See `KNOWN_ISSUES.md` → **WTV-039** for the full history.

## What to do instead

To exercise the gate against a hostile client, **hydrate a fresh artifact** from
the current template rather than gating this one:

```bash
# tokens live at clients/hostile-rehearsal/tokens.env
node scripts/build-config.mjs   # into a scratch dist, not this directory
node manus-skills/dealer-site-launch/scripts/gate.mjs --env staging --dist <scratch-dist>
```

`screenshots/` **is** still valid evidence — 24 full-page JPEGs at 1440 and 390,
referenced directly by the certification document. Do not delete those.

Do not "fix" this `dist/` to make the gate green. Re-hydrating it would silently
replace cited certification evidence with a different artifact.
