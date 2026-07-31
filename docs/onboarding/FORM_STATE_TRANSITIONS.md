# Form State Transitions (design freeze)

Authority: [`config/state-machine.json`](../../config/state-machine.json)  
Machine stub: [`config/form-state-transitions.json`](../../config/form-state-transitions.json)

Make may only call `request_client_transition`. Never write `onboarding_cases.status` directly.

P2 design focuses on early states (`submitted` ↔ `under_review` ↔ `needs_correction`). Do not jump to `approved` / `provisioning` from form submit. Future `provisioning_ready` is an **event**, not a free-form status invent.
