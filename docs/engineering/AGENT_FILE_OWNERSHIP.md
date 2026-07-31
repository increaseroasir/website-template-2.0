# Agent File Ownership

**Status:** Proposed operating matrix — not enforced by CI yet  
**Rule:** No two active agents may write the same canonical file concurrently.

| Path | Primary agent | Reviewer | Read-only consumers | Concurrent writes? | Merge priority | Required approval |
|---|---|---|---|---|---|---|
| `config/identity-fields.json` | Contract/DB | QA/red-team | All | **No** | Highest | Owner (version publish) |
| `config/state-machine.json` | Contract/DB | QA/red-team | Make, Docs | **No** | Highest | Owner |
| `config/factory-contract.schema.json` | Contract/DB | QA/red-team | All | **No** | Highest | Owner |
| `config/forbidden-aliases.json` | Contract/DB | QA/red-team | All | **No** | High | Integrator |
| `config/supabase-targets.json` | Contract/DB | Integrator | Make | **No** | Highest | Owner (`apply_authorized`) |
| `config/onboarding-field-registry.json` | Contract/DB | GHL + QA | Make, ClickUp | **No** | High | Integrator |
| `config/onboarding-field-mappings.json` | Contract/DB | GHL + Make | ClickUp | **No** | High | Integrator |
| `config/onboarding-option-sets.json` | Contract/DB | GHL | Forms | **No** | Medium | Integrator |
| `config/forms/**` | Contract/DB (+ GHL for live IDs only after auth) | QA | Make | **No** | High | Integrator |
| `config/onboarding-clickup.json` | ClickUp ops | Docs | Integrator | **No** | Medium | Integrator |
| `config/onboarding-workflows.json` | Contract/DB | Make + ClickUp | QA | **No** | Medium | Integrator |
| `config/form-state-transitions.json` | Contract/DB | Make | QA | **No** | High | Integrator |
| `docs/onboarding/**` | Docs/evidence (+ design authors) | Integrator | All | Avoid overlap | Medium | Integrator |
| `docs/make/**` | Make orchestration | Integrator | Contract | **No** | Medium | Owner for live IDs |
| `docs/engineering/**` | Docs/evidence + Integrator | QA | All | Coordinated | Low | Integrator |
| `docs/EXECUTION_STATE.md` | **Integrator only** | Owner | All (read) | **No** | Highest | Owner explicit |
| `supabase/migrations/**` | Contract/DB | QA | Make | **No** | Highest | Owner apply auth |
| `docs/onboarding/proposed-migrations/**` | Contract/DB | QA | Integrator | Coordinated | Medium | Owner before copy to supabase/ |
| `tests/onboarding/**` | Contract/DB + QA | Integrator | — | Coordinated | High | Integrator |
| `tests/factory-contract/**` | Contract/DB + QA | Integrator | — | Coordinated | Highest | Integrator |
| `clients/**` | Website/provisioning (later) | QA | — | Per-client only | High | Break-glass if protected |
| `config/protected-clients.json` | Integrator / safety | QA | All | **No** | Highest | Owner |
| `artifacts/break-glass/**` | Owner / Integrator safety task | QA | Agents (detect) | **No** | Safety | Owner |
| Deployment / `wrangler.toml` / Pages | Website/provisioning | QA | — | **No** | High | Owner + P3+ |

## Conflict rule

If two work packages need the same path: serialize. Prefer Contract/DB first for canonical names; GHL/Make/ClickUp consume frozen outputs as read-only until the next contract bump.
