# P4 — Deterministic hydrate (`hydrate-client.mjs`)

**Phase:** P4  
**Goal:** Replace shell-sourced `tokens.env` hydrate recipe with a deterministic CLI: temp workspace → validate → atomic swap into `clients/<slug>/dist/`. Overrides never overwritten.  
**Side effects:** Spec only; implementation may mutate **non-protected** client dist when unlocked.

## Dependencies

- P0 brand/protection guards
- P2 identity fields stable (`client_slug` ↔ folder name)
- P3 optional for full factory path; manual hydrate may proceed on fixture clients without CF create
- Skills SoT remains `manus-skills/` (update hydrate SKILL; do not revive legacy `skills/` as SoT)

## Inputs

| Input | Required |
|---|---|
| `client_slug` (allowlisted, not protected unless break-glass) | Yes |
| `clients/<slug>/{client.config.js,tokens.env}` | Yes |
| Optional `redirects.extra`, assets | No |
| Template git SHA / `VERSION` | Yes (record provenance) |
| `config_version` from Supabase when available | Yes on factory path |
| Idempotency key `hydrate:{client_id}:{config_version}:{template_sha}` | Yes on factory path |
| Flags: `--dry-run`, `--force` | Optional |

## Outputs

| Output | Location |
|---|---|
| Hydrated site | `clients/<slug>/dist/` (atomic replace) |
| Provenance | `WIRING.md` build block: SHA, VERSION, config_version, timestamp |
| Dry-run diff | stdout / artifact (no swap) |
| Job row (factory) | hydrate job status in Supabase |

## Idempotency / determinism

- Same inputs + SHA → byte-stable token replacement (aside from explicitly time-stamped provenance files if any — prefer stable)
- Re-run with same key returns prior success; does not clobber client overrides flagged as sacred
- Never run `build-config.mjs` at repo root

## States

`infrastructure_ready` (or manual) → `hydrating` → `hydrated` / `hydrate_failed`

## Tests

- Fixture client (e.g. extend `hostile-rehearsal` — **never copy Sun Pool**)
- `tokens.env` with spaces/`&` parses correctly (regression for shell-source bug)
- Dual-ownership / dead-token lint still blocks (`check:tokens`)
- Dry-run makes no dist changes
- Atomic swap: crash mid-write leaves previous dist intact
- `redirects.extra` appended once per hydrate (not duplicated on re-run — define exact behavior and test it)
- brand:guard on shared tree still PASS
- Cross-check: client A strings absent from client B dist (feeds P5 suite)

## Files likely to change

- `scripts/hydrate-client.mjs` (**create**)
- `manus-skills/dealer-site-hydrate/SKILL.md` (point to CLI; deprecate `set -a && . tokens.env`)
- `scripts/dev-preview.sh` (call CLI)
- `package.json` script `hydrate` / `hydrate:dry-run`
- `docs/runbooks/` optional hydrate runbook
- Gate wiring requirement: fail if `WIRING.md` missing after hydrate

## Credentials required

| Cred | Need |
|---|---|
| None for local hydrate | Default |
| Supabase read (config_version) | Factory path test project |
| Cloudflare / GHL / secrets | **None** |

## Explicit non-goals

- Deploy
- Secret install
- Mutating `clients/sun-pool-spa`
- Implementing Make scenarios
