# Start here

## For Alex

1. Cursor → **File → Open Folder**
2. Open: `/Users/alexlobaito/website-template-premium-redesign`
3. Start a **new chat** in that window
4. Paste the prompt below

Do **not** keep redesigning in `website-template-2.0` for this project.

You do **not** need a GitHub fork for me (or Claude in Cursor) to work on this. Opening this folder is enough. A fork is only useful if someone else needs a remote copy on GitHub.

---

## Prompt to paste to Claude

```text
Work ONLY in this folder: website-template-premium-redesign
Do NOT edit /Users/alexlobaito/website-template-2.0

Read PROJECT.md and docs/PREMIUM_REDESIGN_HANDOFF.md first.

Already done: premium index.html + inventory.html.

Continue redesigning remaining pages. Also fix these mobile UX bugs on ALL premium pages (including category pages already redesigned):

1) TEXT OVERFLOW
- Placeholders and long headlines must NEVER fall off the right edge on mobile.
- Use overflow-x: clip on page, overflow-wrap/break-word on headlines, max-width: 100%, no nowrap on hero titles.
- Test at ~390px width. Unresolved {{TOKENS}} must still wrap safely.

2) BOTTOM STICKY BAR (Call / Text / See Models)
- Hidden above the fold on page load.
- Only appear AFTER the user scrolls past the hero/primary CTA that is visible when the page opens.
- Use IntersectionObserver on the hero CTA group (same idea as homepage #lead / #mbar).

3) NAV STICKY CTA (mobile)
- At top of page: "Call Us 24/7" is OK while the bottom bar is hidden.
- After scroll past hero CTA (when bottom bar shows): change the nav sticky button to "Get Directions" (maps link via {{CLIENT_MAP_URL}} / client.mapUrl).
- Goal: never show two Call buttons at once.

Hard rules: no Paradise/Minot/701 hardcodes; placeholders only; keep lead/tracking/D1; npm run brand:guard; stay on premium-redesign; no push to main unless asked.

Start by fixing the three mobile UX items on hot-tubs / swim-spas / saunas (and shared category.css/js), then continue remaining pages.
```
