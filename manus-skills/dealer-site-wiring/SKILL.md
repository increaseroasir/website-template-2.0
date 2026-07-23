---
name: dealer-site-wiring
description: >
  Live-verify the ten dealer-site integration IDs (GA4, Meta Pixel, Clarity,
  lead/GHL, chat, Closebot, Turnstile, phone/SMS, GHL External Tracking,
  GHL Booking Calendar). Use when wiring tracking, GHL, or launch verification.
  Duplicate contacts on external tracking = FAIL.
compatibility: Staging or production URL for the client. Access to client GA4,
  Meta, Clarity, GHL sub-account.
metadata:
  author: Start Scale Automate
  version: "2.0"
---

# Dealer Site Wiring

Load **`references/wiring.md`** now — it is the source of truth for all ten IDs.

Fill **`references/WIRING.template.md`** into the client's `WIRING.md` as you verify.

## The ten IDs (summary)

1. GA4 — Realtime session  
2. Meta Pixel — PageView + ViewContent  
3. Clarity — live session  
4. Lead endpoint / GHL — test lead in **this** sub-account  
5. GHL chat widget — test chat  
6. Closebot source — dashboard registers visit  
7. Turnstile — real submit succeeds  
8. Phone + SMS E164 — rings / correct thread  
9. GHL External Tracking — page views stitched + **exactly one** contact  
10. GHL Booking Calendar — live booking at store-local time + Execution Logs, **or** intentional empty (request-mode)

## Rules

- Leftover `{{TOKEN}}` or another dealer's ID = FAIL.  
- Wrong-location calendar can still **show** slots — only a live booking proves #10.  
- External tracking must never ship a real ID on staging.  
- Forms are native DOM `<form>` — iframe embeds break external tracking.

## Done when

Every row in client `WIRING.md` has value + verification checkbox, or an explicit "intentionally empty + reason" for cosmetic IDs.
