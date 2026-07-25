# Module F — skill-pack self-audit (2026-07-24)

## Paper walk (rush client = text brief + Drive photos)

| Step | Specified? | Guess/improvise risk |
|---|---|---|
| 1 init | YES — new-client --init | — |
| 2 brief→config | YES — map-intake --brief + intake-sheet-mapping | Brief keyword heuristic is fuzzy; prefer structured JSON when possible |
| 3 photos from Drive | YES — images.md + CLIENT_UPLOAD_CHECKLIST + check-assets | Agent must download from Drive manually (no Drive API in pack) |
| 4 validate rush | YES — --profile rush | Must set intake.json ghlSubAccountId for REQUIRED GHL location |
| 5 CP1 one message | YES — orchestrator / client-site-build SKILL | — |
| 6 hydrate | YES — references/hydrate.md | — |
| 7 staging gate + wiring | YES — gate.mjs + wiring.md (13 IDs) | Chat/Closebot not in client.config — WIRING + deploy paste |
| 8 CP2 | YES | Screenshots still human/browser |
| 9 prod + DNS | YES — provisioning + launch-checklist | CF dashboard clicks are human |
| 10 test lead + day-7 | YES — launch-checklist | Calendar reminder is human |

## Defects fixed in this pass
- Stale decision-table "8 wiring IDs" → 1–8/10 critical + 9/11–13 48h rules
- wiring.md chat/closebot config location clarified
- trigger-queries + evals gain rush cases
- hostile leadValue 950 → 0 (Meta Lead value)

## Gaps deferred
- Chat widget / Closebot not first-class `client.config.js` keys (needs template token work)
- No Google Drive API — human downloads photos
- `client.fulfillment.json` legacy schema retained but not required (contradiction logged in Module C)
- Paradise live site still behind Meta funnel (separate repo job)

## Verdict
**Yes — sufficient for a supervised first client build this week**, provided a human runs CF secrets, GHL field/workflow clicks, screenshots, and the cellular test lead. Unsupervised fully-autonomous launch: **no** (same human MANUAL gate rows).
