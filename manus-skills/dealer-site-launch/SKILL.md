---
name: dealer-site-launch
description: >
  Run the mechanical launch gate, human launch checklist, IndexNow, search
  indexing, and day-7 crawl verification for a dealer client site. Use before
  DNS cutover, at go-live, or for day-7 SEO checks. Blocks launch on any FAIL.
compatibility: Built clients/<name>/dist/. Node.js 18+.
metadata:
  author: Start Scale Automate
  version: "2.2"
---

# Dealer Site Launch

Mechanical gate first; human checklist second. **Never deploy past FAIL.**

## Scripts (repo root)

```bash
node manus-skills/dealer-site-launch/scripts/gate.mjs --env staging --dist clients/<name>/dist
node manus-skills/dealer-site-launch/scripts/gate.mjs --env prod --dist clients/<name>/dist
node manus-skills/dealer-site-launch/scripts/indexnow.mjs --init --dist clients/<name>/dist
node manus-skills/dealer-site-launch/scripts/indexnow.mjs --submit <domain> --dist clients/<name>/dist
# optional: --dry-run on submit
# Repo companions (not in this folder): npm run launch:check | admin:smoke | ghl:fields:check | ga4:funnel
```

Gate checks leftovers, fingerprints, links, robots/sitemap, GSC meta, JSON-LD, GHL external tracking rules, and emits `MANUAL` rows for human wiring (IDs 1–10 + Meta CAPI/offline secrets). Exit `0` all-pass / `1` fails.

## Load on demand

- `references/launch-checklist.md` — Part B human items + booking + Meta offline onboarding + search indexing + day-7  
- `references/provisioning-checklist.md` — CF Pages / D1 / R2 / secrets  
- `references/dns-cutover.md` — **read before touching any DNS record**: apex/CNAME constraint, TTL schedule, not breaking client email, loop check, rollback  
- `references/handoff-template.md` — client + agency handoff  
- Fingerprints: `scripts/template-fingerprints.json` (pending entries skipped)

## Sequence

```
- [ ] provisioning-checklist (D1/R2/secrets) as needed
- [ ] gate --env staging → PASS (0 FAIL)
- [ ] dealer-site-wiring complete
- [ ] launch-checklist.md every box (or N/A with reason)
- [ ] HUMAN CHECKPOINT 2 before DNS
- [ ] Prod build + gate --env prod
- [ ] DNS / deploy  → follow references/dns-cutover.md (TTL drop is 24h AHEAD of the switch)
- [ ] indexnow --init then --submit <domain> (never on staging)
- [ ] GSC verify + sitemap + Request Indexing (checklist)
- [ ] Day-7: indexed count vs sitemap; log in WIRING.md
- [ ] Fill handoff-template.md for the client
```

## Hard rules

- Staging = `Disallow: /` + noindex; never IndexNow/GSC submit staging.  
- Admin stays noindex + robots Disallow `/admin/`.  
- Google indexing is not forced — day-7 verifies crawl, does not guarantee it.
