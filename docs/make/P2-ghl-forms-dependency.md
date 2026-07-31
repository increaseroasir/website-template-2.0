# P2 — GHL forms dependency (owner input)

**Date:** 2026-07-31  
**Scope:** Optimize / install Form 1–3 in a **specific existing** GHL sub-account via `user-ghl` MCP.  
**Not authorized:** creating new GHL sub-accounts / location provisioning.

## Locked approach

1. Owner names the target **location / sub-account**.
2. Owner provides **current forms** (export, screenshots, field lists, or form IDs) for optimization.
3. Agent uses GHL MCP only inside that location:
   - `switch_location` / `get_current_location`
   - `get_forms` / `get_form_full`
   - `create_form` / `update_form` / `install_intake_form` as needed
4. Form submit → Make webhook (`2785703` Form 1) → Supabase `epeddfdifckzzmskhdsz`.
5. Make remains the intake worker; Supabase remains status SoT via `request_client_transition`.

## Owner deliverables (blocking)

| Item | Needed |
|---|---|
| Target location name + ID | Yes |
| Current Form 1 (fields / ID / export) | Yes — optimize before rebuild |
| Current Form 2 / Form 3 (if exist) | Preferred |
| Confirm webhook destination for Form 1 | Make hook URL below |

## Live Make Form 1 objects (dev_test)

| Object | ID |
|---|---|
| Scenario | `4852018` — `HTL Factory Form 1 Intake (dev_test)` (inactive) |
| Webhook | `2785703` — `https://hook.us1.make.com/3kbchattgqyafd0sqb8xdod3deayksto` |
| Supabase connection | `4834536` — `HTL Factory Dev (epeddfdifckzzmskhdsz)` |

## Blocker note

Make org hit **max active scenarios**. Form 1 e2e needs one free active slot (temporarily deactivate a noncritical scenario, or raise plan). Do not deactivate production Discord/Typeform bots without owner pick.
