# Future Provisioning Ready Gate (design only — do not build)

**Not authorized:** GHL sub-account create, snapshot install, credentials, P3 Make scenarios.

## Hard rule

Do **not** trigger provisioning on raw `main_client_onboarding` submission alone.

## Emit `provisioning_ready` only when all true

- `payment_confirmed = true`
- `main_client_onboarding = complete`
- `csm_review_status = approved`
- Canonical client identity validated
- `client_slug` reserved
- Required GHL provisioning fields present
- Duplicate client/location check passed
- No blocking identity or ownership conflict
- Owner-approved snapshot selected
- Onboarding case status eligible for provisioning (via approved state machine / RPC only)

## Later P3 consumer (separate authorization)

```text
provisioning_ready
→ create GHL sub-account
→ store ghl_location_id
→ install approved snapshot
→ verify snapshot
→ update ClickUp milestones (sub-account created / snapshot installed / verified)
→ create human follow-up tasks for failures
```

## Fail-closed tests (design)

- Incomplete / duplicate / test / bad submissions never become `provisioning_ready`
- Sun Pool slug fails closed
- Wrong client_id fails closed
