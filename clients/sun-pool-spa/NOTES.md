# Sun Pool & Spa — Client Notes

## Release Status (2026-08-01)
- **Deployed:** `7b4a6609` at https://sun-pool-spa.pages.dev — LIVE
- **Branch:** `sun-pool/preflight-2026-08-01`
- **Certified SHA:** `42ba6eda625afbcea9e0f10da070d3c309e763ad`
- **Token lint:** PASS (144 tokens, 69/69 hard-required)
- **Smoke test:** 14/14 routes 200, /api/inventory returns 9 products
- **Artifact integrity:** GA4 correct, no unresolved tokens, Worker bundle deployed

## Resolved Blockers
- B-1 RESOLVED: GA4 ID fixed in client.config.js (G-KSJ8N5G2ZJ → G-KSJ8N5GZZJ)
- B-2 RESOLVED: Artifact hydrated and deployed from certified SHA
- B-5 RESOLVED: Booking is request-mode by design — confirmed

## Open Items
- B-3 OPEN: /api/readiness authenticated check — needs ADMIN_PASSWORD from Cloudflare Pages env
- B-4 OPEN: Meta CAPI server-side token (WTV-051) — verify non-empty in Cloudflare Pages env
- B-6 OPEN: Lead Vault sheet column widening to 35 (WTV-046) — owner action
- PSI: Mobile perf 64 (1pt below threshold), CLS 0.19 — R2 image dimensions + Meta Pixel
- DNS: Cutover to sunpoolandspasupply.com — requires explicit authorization

## Cloudflare Deploy
Token saved as "Cloudflare Deploy API" connector in Manus.
Deploy command: CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID npx wrangler@4 pages deploy clients/sun-pool-spa/dist-prod --project-name sun-pool-spa --branch main

## PSI Scores (2026-08-01, .pages.dev pre-DNS)
Mobile: Perf 64, A11y 100, BP 96, SEO 69 | Desktop: Perf 96, A11y 100, BP 96, SEO 69
SEO 69 expected pre-DNS (canonical mismatch on .pages.dev). Will resolve after cutover.
