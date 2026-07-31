# Form 1 create-or-link blueprint (inactive, static)

**UTC:** 20260731T203300Z  
**Agent:** integrator  
**Branch tip before:** `85e001b069c47c205326ea815edaf5584309af32`  
**Scenario:** `4852018` · webhook `2785703` · connection `4834536`  
**Project:** `epeddfdifckzzmskhdsz` / htl-factory-dev

## Incident note

During an earlier interrupted apply attempt, live scenario `4852018` was observed as **webhook-only**. It was restored by applying this complete create-or-link blueprint in one inactive `scenarios_update`. No activation. No webhook send.

## Matching policy

| Identifier | Normalization | Confidence | Auto-link? | Ambiguity | Duplicate risk |
|---|---|---|---|---|---|
| `client_id` | UUID exact | highest | yes if exactly 1 | >1 → `review_required`; 0 when supplied → `identity_conflict` | low |
| `deployment_key` | exact | high | yes if exactly 1 and no higher match | >1 → `review_required` | low (DB unique) |
| `client_slug` | exact kebab slug | high | yes if exactly 1 and no `client_id`/`deployment_key` resolution | >1 → `review_required` | low (DB unique) |
| `ghl_opportunity_id` | exact | engagement | not a company match; if already bound → `identity_conflict` | n/a | prevents second case |
| `ghl_contact_id` | — | person only | **never** company auto-link | — | would merge orgs |
| `owner_email` / `owner_phone` | — | weak | **never** | — | high |
| `business_name` | — | weak | **never** | — | high |
| `domain` / `domain_reported_name` | — | weak / reported | **never** auto-link | — | high |

**Match order:** `client_id` → `deployment_key` → `client_slug`.

## Ambiguity / fail-closed rules

- Conflicting high-confidence identifiers → `identity_conflict` (**no create**)
- Multiple rows for one identifier → `review_required` (**no create**)
- Supplied `client_id` with zero hits → `identity_conflict` (**no create**)
- Slug hit + deployment_key miss (key supplied) → `identity_conflict` (**no create**)
- Key hit + slug miss (slug supplied) → `identity_conflict` (**no create**)
- Create only when: no `client_id` supplied AND client_id/key/slug/opportunity lookups all empty

## Route diagram

```text
webhook(2785703)
  → idempotency GET intake_submissions(form1, submission_id)
  → router
       ├─ replay (body != []) → outcome=replayed
       └─ not_replay
            → GET clients by client_id
            → GET clients by deployment_key
            → GET clients by client_slug
            → GET onboarding_cases by ghl_opportunity_id
            → router
                 ├─ multi_* → review_required
                 ├─ conflicts → identity_conflict
                 ├─ link_by_client_id → new case on existing client_id → intake/config → RPC → linked
                 ├─ link_by_deployment_key → linked
                 ├─ link_by_client_slug → linked
                 └─ create_new → create client+case → intake/config → RPC → created
```

## Static path proofs (saved blueprint)

| Case | Route / filter | Outcome | Writes |
|---|---|---|---|
| No match | `create_new` | `created` | client + case + intake + config + RPC |
| One `client_id` | `link_by_client_id` | `linked` | case + intake + config + RPC; **no client create** |
| One `deployment_key` | `link_by_deployment_key` | `linked` | same |
| One `client_slug` (no key/id) | `link_by_client_slug` | `linked` | same |
| Conflicting identifiers | `*_disagree` / `*_miss` | `identity_conflict` | respond only |
| Multiple matches | `multi_*` | `review_required` | respond only |
| Replay | `replay` | `replayed` | respond only (before create/link) |

Field preservation on link: clients row fields not overwritten (no update of domain/business_name). Form 1 reported values go to `config_versions.config` / intake payload only. Null does not clear (create-path append; no merge-clear).

## Modules

- 46 modules; packages: `gateway`, `supabase`, `builtin` only
- No GHL / ClickUp modules
- All Supabase modules use connection `4834536`
- Webhook remains `2785703`

## Snapshots

- Before (create-only restore baseline): `20260731T203000Z-form1-create-or-link-BEFORE.json`
- After (live verified): `20260731T203300Z-form1-create-or-link-AFTER.json`
- Builder: `_build_form1_create_or_link.py`

## Safety confirmations

| Check | Result |
|---|---|
| `isActive` | **false** |
| `nextExec` | null |
| Webhook executions / payload sends | **none** |
| Active scenarios org | still **26** (nothing paused) |
| Real client data | none |
| GHL / ClickUp | none |

## Capacity

Still blocked for E2E. Next owner action: increase Make capacity by one active slot, then authorize synthetic create / link / replay / conflict E2E.
