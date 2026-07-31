# Evidence: P2 Make read-only inventory

**Run ID:** `20260731T084800Z-p2-make-inventory`  
**Agent:** integrator / P2  
**Branch:** `factory/p2-make-intake` (from `factory/p0-safety-lock` @ `9b51c64`)  
**Authorization:** OWNER AUTHORIZATION: P2 MAKE INTAKE  
**Mode:** read-only (no scenario create in this artifact)

## Target locks

| Field | Value |
|---|---|
| Supabase project | `htl-factory-dev` |
| project_ref | `epeddfdifckzzmskhdsz` |
| environment | `dev_test` |
| Make zone | `us1.make.com` |

## Organization / team

| Field | Value |
|---|---|
| Organization name | Increase ROAS |
| Organization id | `1111422` |
| Team name | My Team |
| Team id | `442605` |
| Product label | Free |
| `users_me` | Unauthorized (org/team listing still succeeded) |

## Scenarios

| Metric | Count |
|---|---|
| Total scenarios | 42 |
| Active | 26 |
| Inactive | 16 |

### HTL Factory / intake collision check

- **No** scenarios named for HTL Factory, Form 1/2/3 intake, or Supabase control plane.
- Name-adjacent **inactive** only: `Onboarding Scenario (DWY) 2nd Version - INCREASE ROAS` (`1856850`) — DWY legacy, not factory intake.
- Unattached webhook `Sub Account Creation` — **do not reuse** (P2 forbids GHL sub-account provisioning).

**Verdict:** collision hard-stop **CLEAR**. New scenarios must use distinct names:

- `HTL Factory — Form 1 Intake (dev_test)`
- `HTL Factory — Form 2 Intake (dev_test)`
- `HTL Factory — Form 3 Intake (dev_test)`

### Existing scenario families (leave untouched)

Active set is largely tree-client Typeform → GHL and Discord/SMS notification scenarios (Acree, Elite, Taperia, Momentum, Opt-in, etc.).

## Connections

| Family | Present | Notes |
|---|---|---|
| GoHighLevel Location OAuth (`highlevel3`) | Yes (many client locations) | Do not use real client locations for factory test |
| Typeform | Yes | |
| Discord | Yes | |
| Google / Google Restricted | Yes | Restricted expires noted in inventory |
| OpenAI | Yes | |
| Calendly | Yes | |
| Deprecated HighLevel agency/company | Yes | |
| **Supabase** | **No** | Required before live Form 1 writes |

## Webhooks / hooks

Many `gateway-webhook` and Typeform event hooks for client ops. None are HTL Factory Form 1–3 intake hooks. Do not repurpose client hooks.

## Capacity / risks

- Org license object reports Free + low scenario/ops caps; team already has 42 scenarios — treat ops budget as a risk; keep new scenarios **inactive** until verification.
- No Make data store may hold authoritative status.
- Secrets must never land in Make notes, Git, docs, or chat.

## Hard-stop checklist (inventory phase)

| Condition | Result |
|---|---|
| Wrong Supabase project ref | N/A until connection — bind only `epeddfdifckzzmskhdsz` |
| Unexpected HTL intake scenario collision | **PASS / CLEAR** |
| Sun Pool mutation | Not touched |
| Scenario create during inventory | Not performed |

## Next steps (authorized)

1. Align `docs/work-packages/P2-intake-identity.md` to live schema/state machine.
2. Create Supabase connection / HTTP credential for `epeddfdifckzzmskhdsz` only (owner authorizes credential URL).
3. Build Form 1 scenario first (inactive until verified).
4. Forms 2/3 after Form 1 e2e.
5. Stop before P3.

## Confirmations

- Sun Pool untouched  
- No production systems contacted for writes  
- No secret values recorded in this artifact  
- Make inventory was read-only  
