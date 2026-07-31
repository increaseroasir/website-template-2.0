# Agent run — P2 Form 1 wiring + GHL forms note

**Agent:** integrator  
**Run id:** `20260731T090200Z-p2-form1-wired-ghl-note`  
**Branch:** `factory/p2-make-intake`  
**Date:** 2026-07-31

## Done

- Form 1 scenario `4852018` blueprint wired to Supabase connection `4834536` and webhook `2785703`.
- Path: webhook → idempotency GET → router (dup respond vs create clients/case/link/intake/config → RPC `request_client_transition` → respond).
- Hook learn started; learn payload accepted.
- Documented GHL forms dependency: `docs/make/P2-ghl-forms-dependency.md`.
- Updated `docs/make/P2-form1-scenario.md` with live IDs.

## Blocked

1. **Make max active scenarios** — `scenarios_activate` failed. Need owner to free a slot or raise plan before e2e.
2. **Fail-closed filters** (missing fields / forbidden aliases / protected slug) not present on compact blueprint — re-add before production-facing use.
3. **GHL forms** — awaiting owner: target sub-account + current form exports/IDs. `list_available_locations` returned 403 (agency/location token gap); owner must name the location.

## Confirmations

- Sun Pool untouched.
- No production systems contacted.
- No secret values exposed.
- Target remains `epeddfdifckzzmskhdsz` only.
- Stop before P3.
