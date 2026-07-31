# Work packages (P2–P7)

Implementation-ready packages for phases **after** P0 safety lock and P0.5 contract freeze.  
These packages specify contracts only — **no side effects** are authorized by this folder.

| Package | Phase | Title | Side effects allowed now? |
|---|---|---|---|
| [P2-intake-identity.md](./P2-intake-identity.md) | P2 | Intake + identity write path | **No** |
| [P3-provision.md](./P3-provision.md) | P3 | Infrastructure provision | **No** (gated on owner P0.5 + schema) |
| [P4-hydrate.md](./P4-hydrate.md) | P4 | Deterministic hydrate CLI | **No** until package accepted |
| [P5-staging.md](./P5-staging.md) | P5 | Staging deploy + leakage suite | **No** |
| [P6-production.md](./P6-production.md) | P6 | Approval-gated production | **No** |
| [P7-fleet.md](./P7-fleet.md) | P7 | Fleet upgrades + allowlists | **No** |

## Shared constraints (all packages)

- Canonical repo: `increaseroasir/website-template-2.0`
- Integration branch: `factory/p0-safety-lock` (until integrator opens later trains)
- One monorepo; **no per-client GitHub forks**; one Cloudflare Pages project per `client_slug`
- Identity fields: only names in `docs/CANONICAL_CONTRACT.md` / `config/identity-fields.json` (Agent B)
- Skills SoT: `manus-skills/` (legacy `skills/` is not SoT)
- Protected: `clients/sun-pool-spa` — OID `f3da831b2c31d37693f6022340b2d2f936bb4f72` — break-glass required
- Secrets: `wrangler pages secret put` only — see `docs/runbooks/SECRETS_RUNBOOK.md`
- Never invent competing field names (`ghlLocationId`, `ghlSubAccountId`, etc. as canon)

## How to use

Each package lists exact inputs/outputs, idempotency keys, state transitions, tests, dependencies, files likely to change, and credentials required. Implementing agents must stay inside the package’s owned paths and must not contact production unless the package’s “Credentials / environments” section explicitly authorizes a named non-production target.
