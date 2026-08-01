# P3 Failure and Rollback Plan

**Status:** INFORMATIONAL ONLY — design; no live rollback execution authorized  
**Applies to:** Fake-client / test provision jobs only until P6+ policies supersede  
**Related:** [`PROVISIONING_READY_GATE.md`](./PROVISIONING_READY_GATE.md), `docs/work-packages/P3-provision.md`, `docs/CANONICAL_CONTRACT.md`

---

## Principles

1. **Fail closed** — unknown client, identity disagreement, protected slug, missing approval → stop.  
2. **Create-if-missing, never double-create** — idempotency keys + unique constraints.  
3. **Supabase is authoritative for IDs** — external systems may be ahead; reconcile toward SB.  
4. **Slug never unlocks** on failure or rollback (`TRACKED_DOC`).  
5. **Rollback needs distinct authorization** — same pattern as production rollback (`TRACKED_DOC`).  
6. **ClickUp never drives rollback** of Supabase (`TRACKED_DOC`).  
7. **No secret values** in job logs, SB columns, Git, or Make blueprints.

---

## Status transitions on failure

| From | To | When | Actor |
|---|---|---|---|
| `approved` | `provisioning` | Job accepted | `make_service` / `tech_operator` / `system` |
| `provisioning` | `provision_failed` | Unrecoverable step failure after retries policy | `make_service` / `system` |
| `provision_failed` | `provisioning` | Authorized retry | `make_service` / `tech_operator` / `system` |
| `provisioning` | `infrastructure_ready` | All required resources `verified` | `make_service` / `system` |

(`TRACKED_DOC` — `config/state-machine.json`)

Make must **not** set `live` on any failure or success path (`TRACKED_DOC` — P3-provision).

---

## Per-resource failure modes

Lifecycle: `not_requested` → `requested` → `creating` → `created` → `verified`  
Alt: `failed` | `orphaned` | `externally_missing`

| Mode | Meaning | Immediate action |
|---|---|---|
| `failed` | API error / validation before durable create | Retry with backoff if transient; else `provision_failed` + human task |
| `orphaned` | External resource exists; SB write missed | Reconcile: adopt ID into `infrastructure_resources`; do not create second |
| `externally_missing` | SB has ID; external GET 404 | Clear or quarantine ID only with tech_operator auth; never invent replacement silently |
| Timeout mid-create | Ambiguous | Reconcile search by slug/client_id before retry create |

---

## Step-level failure matrix (GHL → snapshot → CF → sheet)

| Step | Failure | Auto retry? | Job status | Human task | Rollback? |
|---|---|---|---|---|---|
| Gate re-check at start | Predicate false | No | Abort; stay `approved` | Fix data | N/A |
| GHL location create | API error | Yes (transient only) | `provision_failed` if exhausted | Fix agency token / payload | No delete unless rollback auth |
| GHL location create | Duplicate name ambiguity | No | `review_required` style hold | CSM/tech resolve | No |
| Snapshot install | Install fail | Limited | `provision_failed` | Manual snapshot / support | Leave location; do not recreate location |
| Snapshot verify | Mismatch | No | `provision_failed` | Re-verify / re-install | No auto wipe |
| CF Pages create | API error | Transient yes | `provision_failed` | Check test account | Reconcile before recreate |
| CF Pages | Created, SB write fail | Reconcile | Job retry adopts | — | Prefer adopt over delete |
| D1 / R2 | Same as Pages | Same | Same | Same | Same |
| Lead sheet | Create fail | Transient yes | `provision_failed` | Google SA / sharing | No |
| Slug lock | Lock write fail after resource created | Reconcile | Hold `infrastructure_ready` | Repair lock row | **Do not** unlock |
| Transition to `infrastructure_ready` | RPC reject | No | Stay `provisioning` / `provision_failed` | Fix version/actor | N/A |

---

## Idempotency and reconcile

| Key | Behavior on replay |
|---|---|
| `provision:{client_id}:{approval_id}` | Return original job result |
| `cf:pages:{client_slug}` | One Pages project |
| `cf:d1:{client_id}` / `cf:r2:{client_id}` | One each |
| `ghl:location:{client_id}` | One location |
| `sheets:vault:{client_id}` | One sheet |

**Reconcile job (design):** compare Cloudflare/GHL/Google vs Supabase; repair IDs; never double-create (`TRACKED_DOC` — P3-provision).

Suggested reconcile order:

1. Load job + `infrastructure_resources` for `client_id`  
2. For each resource type: if SB missing → search external by deterministic name → adopt or mark `orphaned`  
3. If SB present → GET external → mark `externally_missing` or `verified`  
4. Emit audit event; do not change fulfillment status except via RPC when all verified  

**Evidence class:** `DESIGN_ONLY` (job not built).

---

## Rollback vs cleanup

| Concept | When | Authorization | Effect |
|---|---|---|---|
| **Retry** | Transient / fixed cause | Same or renewed P3 approval per frozen policy | Resume create-if-missing |
| **Cleanup (fake client)** | Test residue after PASS/FAIL | Owner or tech_operator test cleanup auth | Delete/quarantine **test-tagged** resources |
| **Rollback (P3)** | Need to undo mistaken provision | **Distinct rollback authorization** artifact | See below |
| **Production rollback** | Live site | Production rollback auth + candidate | Out of P3 scope (`TRACKED_DOC` P6) |

### P3 rollback authorization (design)

Rollback artifact must include:

- `version`
- `client_id`, `client_slug`, `onboarding_case_id`
- `provisioning_job_id`
- `actor`, `approved_by`, `reason`, `scope`, `expires_at`
- `environment` = `test` \| `development` (never inferred production)
- Explicit resource allowlist to tear down

CLI flag alone is insufficient (`TRACKED_DOC`).

### P3 rollback sequence (design — fake/test only)

```text
1. Validate rollback artifact (scope, expiry, client match)
2. Transition note: do NOT unlock slug
3. For each resource in allowlist (reverse order):
   sheet → R2 → D1 → Pages → (optional) GHL location
   - Prefer disable/quarantine over hard delete when snapshot/location may retain CRM data
4. Mark infrastructure_resources state retired/orphaned_cleanup
5. Transition: infrastructure_ready|provisioning|provision_failed → provision_failed
   (or authorized return to approved — freeze exact allowed transitions before build;
    today state-machine has provision_failed → provisioning, not → approved)
6. Open human tasks for any external delete failure
7. Audit event with correlation_id
```

**Note:** Current `state-machine.json` does **not** define `infrastructure_ready` → `approved` or unlock paths. Any “return to approved” requires a **contract/state-machine bump** before implementation (`TRACKED_DOC` gap → `DESIGN_ONLY` proposal).

**Recommended until bump:** rollback leaves status `provision_failed` and resources retired; new provision requires new `approval_id` and idempotency key.

---

## Orphan playbook

| Symptom | Detection | Fix |
|---|---|---|
| Pages project exists; no SB row | CF list by slug prefix / deterministic name | Insert resource row; mark `verified`; continue |
| SB has `pages_project_id`; CF 404 | GET project | Mark `externally_missing`; human decides recreate |
| GHL location created; no `ghl_location_id` | Agency search by name + create time window | Patch client ID field via controlled write; verify |
| Sheet created; ID lost | Drive search by title pattern `HTL Fake…Lead Vault` | Adopt ID |
| Double resources same type | Unique constraint + list | Quarantine newer; keep canonical; human delete duplicate |

---

## Snapshot-specific hazards

| Hazard | Mitigation |
|---|---|
| Wrong snapshot installed | Owner-approved snapshot ID bound in P3 approval; verify step fails closed |
| Snapshot touches unintended location | Create location first; install only into stored `ghl_location_id` |
| Retainer / production snapshot used in test | Deny list of production snapshot IDs in approval validator (`DESIGN_ONLY`) |
| Paradise / Sun Pool locations | Hard exclude from writable scope |

---

## Cloudflare-specific hazards

| Hazard | Mitigation |
|---|---|
| Production account token | Env allowlist; fail if account ID ≠ test |
| `deployment_configs` PATCH for secrets | Forbidden; secrets via later `wrangler pages secret put` only |
| Binding drift | Record intended bindings in SB; verify in reconcile |
| Name collision on slug | Slug reservation uniqueness before create |

---

## What never rolls back

- `client_id` / `onboarding_case_id`  
- Locked `client_slug` / `slug_locked*`  
- `deployment_key`  
- Append-only intake submissions  
- CSM approval history  
- Secret values (there should be none in P3 path)

---

## Human follow-up task templates (design)

| Trigger | Task title (example) | Owner |
|---|---|---|
| `provision_failed` | `[P3] Provision failed — {client_slug} — {step}` | Tech operator |
| Orphan adopted | `[P3] Confirm adopted resource {type}` | Tech operator |
| Snapshot verify fail | `[P3] Snapshot verify — {ghl_location_id}` | Tech operator + CSM |
| Rollback partial | `[P3] Rollback incomplete — manual delete {resource}` | Tech operator |
| Identity conflict at gate | `[P3] Blocked provisioning_ready — identity` | CSM |

ClickUp may mirror these; Supabase/job tables remain SoT.

---

## Correlation and audit

Preserve chain (`TRACKED_DOC`):

`submission` → `onboarding_case` → `client` → `approval` → `provisioning_job` → `resources` → (later) `hydration` → …

Every side-effecting call carries `correlation_id` + idempotency key.  
Failed steps append status history / audit events; no silent drops.

---

## Fake-client cleanup SLA (design)

| After | Action |
|---|---|
| Successful P3 proof | Cleanup within 7 days or quarantine with `fake-p3` tag |
| Failed P3 proof | Same; prefer leave evidence IDs in artifact then delete externals |
| Abandoned job > 24h in `creating` | Reconcile → `failed` or adopt |

---

## Open design decisions (must freeze before build)

1. Does P3 approval consume on transition to `provisioning` or on job row insert?  
2. Which resource is the canonical first for `slug_locked_by_resource_id`?  
3. Exact allowed RPC path after rollback (`provision_failed` only vs return to `approved`).  
4. Hard-delete vs disable for GHL test locations.  
5. Whether Lead Vault copy-from-Paradise template is allowed in factory test or a blank factory template is required (legacy checklist vs monorepo factory — **prefer factory blank template** to avoid Paradise coupling) (`DESIGN_ONLY` recommendation).

Do not invent field names to close these; integrator + owner decide.
