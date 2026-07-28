---
name: dealer-site-wiring
description: >
  Live-verify dealer-site integration IDs (GA4, Meta Pixel, Clarity, lead/GHL,
  chat, Closebot, phone/SMS, GHL External Tracking, Booking Calendar)
  plus Meta CAPI secrets and offline stage webhook. Use when wiring tracking,
  GHL, Meta CAPI, or launch verification. Duplicate contacts on external
  tracking = FAIL.
compatibility: Staging or production URL for the client. Access to client GA4,
  Meta, Clarity, GHL sub-account, Cloudflare secrets.
metadata:
  author: Start Scale Automate
  version: "2.1"
---

# Dealer Site Wiring

Load **`references/wiring.md`** now — source of truth for browser IDs (1–10)
and Meta CAPI / offline funnel (11–13).

Fill **`references/WIRING.template.md`** into the client's `WIRING.md` as you verify.

## Browser IDs (1–10) — summary

1. GA4 — Realtime session  
2. Meta Pixel — PageView + ViewContent  
3. Clarity — live session  
4. Lead endpoint / GHL — test lead in **this** sub-account  
5. GHL chat widget — test chat  
6. Closebot source — dashboard registers visit  
7. Native form — real submit succeeds (no captcha anywhere per TVD-025)  
8. Phone + SMS E164 — rings / correct thread  
9. GHL External Tracking — page views stitched + **exactly one** contact  
10. GHL Booking Calendar — live booking at store-local time + Execution Logs, **or** intentional empty (request-mode)

## Meta CAPI + offline (11–13) — summary

11. `META_CAPI_ACCESS_TOKEN` (Cloudflare secret) — Lead browser+server **DEDUPED**  
12. `META_OFFLINE_WEBHOOK_SECRET` (Cloudflare secret) — Bearer on `/api/meta-offline`  
13. Six GHL fields + Opportunity Stage webhook + Events Manager custom conversions (`QualifiedLead` / `Showed`)

## Rules

- Leftover `{{TOKEN}}` or another dealer's ID = FAIL.  
- Wrong-location calendar can still **show** slots — only a live booking proves #10.  
- External tracking must never ship a real ID on staging.  
- Forms are native DOM `<form>` — iframe embeds break external tracking.  
- CAPI token lives in Cloudflare secrets, **never** GHL.

## Gotchas

- Offline Meta events need the 6 contact fields + the stage webhook; missing
  pieces skip silently — the funnel looks alive in the browser while CRM
  events go nowhere. CAPI token lives in Cloudflare secrets, never GHL.

## Done when

Every row in client `WIRING.md` has value + verification checkbox, or an
explicit "intentionally empty + reason" for cosmetic IDs / standing secrets.
