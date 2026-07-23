# Launch Checklist — human-only items (Part B)

These are the Part B items a script cannot verify — gate.mjs emits them as
MANUAL. Work them at workflow step 8, after the mechanical gate passes.
Copy the full Part B checklist from `FINAL_DIAL_IN_AND_LAUNCH_GATE.md` into
the client repo as `LAUNCH_GATE.md`; an unchecked box blocks launch (Law 4).

## Pre-launch (staging URL)

- [ ] **Defaults sign-off**: walk the client/owner through every token that
      shipped on its `|default` (from `--validate` output). Each one is a
      conscious yes, not a shrug.
- [ ] **Long-value spot-check at 390px**: header, footer, drawer, hero with
      the real business name and headline — no wrapping into the nav, no
      truncation.
- [ ] **Robots/canonical**: staging serves `noindex` (gate checks the meta,
      you check there's no stray production sitemap pointing at staging);
      canonicals point at the production domain; OG/Twitter tags filled and
      checked in a share-preview validator.
- [ ] **Cross-browser/device**: Safari + Chrome + one real Android or
      iPhone, at 390 and 1440. Glass blur, gradient text, clip-path shield,
      rails, date/select inputs.
- [ ] **Lighthouse** on staging: Perf ≥85 mobile / ≥95 desktop, A11y ≥95,
      SEO ≥95, CLS <0.1.
- [ ] **Favicon set, sitemap generated + referenced, SSL green, www/non-www
      redirect chosen and enforced, 404 page live.**

## Post-launch (within 1 hour of DNS)

- [ ] **Test lead from a phone on cellular** (not office wifi, not a
      browser emulator) → lands in the client's GHL sub-account with correct
      source/campaign/tags → automation fires. Use `verify_funnel` where
      available.
- [ ] **Inventory gate end-to-end once**: unlock it, confirm the unlock
      persists across a reload.
- [ ] **Call the tracked number; text the SMS link** — confirm routing to
      the client (or their tracking line), not to Paradise or SSA.
- [ ] **GA4 Realtime + Meta Test Events** show the cellular session on the
      CLIENT's IDs (not the template's — gate already fingerprint-checked,
      this confirms the live pipes).
- [ ] **Screenshot archive**: every page at 1440 and 390, stored alongside
      `WIRING.md` with the launch date.

## Sign-off

HUMAN CHECKPOINT 2 = every box above checked + gate.mjs all-PASS on the
production build (`--env prod`). Then, and only then, DNS.
