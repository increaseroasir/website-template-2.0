# HTL Factory Agent Contract

## Canonical factory repository

- Local path name: `website-template-premium-redesign`
- GitHub remote: `increaseroasir/website-template-2.0`

Do not use:

- Local `website-template-2.0`, which points to the legacy `ssaofficial` repository
- Paradise Spas repository
- `increase-roas-os`
- agent-ops

If the current repository remote is not `increaseroasir/website-template-2.0`, stop immediately and report **WRONG REPOSITORY**.

## Locked architecture

- One monorepo. No per-client GitHub forks.
- Client data lives under `clients/<slug>/`.
- Supabase is authoritative for fulfillment state and resource IDs.
- 1Password is authoritative for secret values (never store secret values in Git, Supabase, Make, logs, docs, or generated files).
- Make provisions infrastructure only. Template code hydrates and builds websites.
- Production requires a human-approved immutable deployment candidate.
- Skills source of truth: `manus-skills/` (legacy `skills/` is not SoT).

See `docs/FACTORY_CONSTITUTION.md` and `docs/CANONICAL_CONTRACT.md` for details. Do not reinvent field names.

## Protected client

`sun-pool-spa` is protected. See `config/protected-clients.json`.

Never modify, hydrate, deploy, migrate, upgrade, install secrets for, or include Sun Pool in a bulk operation without a valid break-glass approval artifact.

Fail closed when:

- client identity is unknown
- `client_id` and `client_slug` disagree
- client is protected and break-glass is missing/expired/wrong-scope
- operation targets production without authorization

A CLI flag alone is never sufficient authorization.

## Scope rules

- Work only on the assigned phase, branch, and owned paths.
- Do not commit directly to `main` or `premium-redesign`.
- Branch from `factory/p0-safety-lock` unless the integrator directs otherwise.
- Before opening a PR, verify `required_base_sha` is an ancestor of `HEAD`.
- Do not use production credentials.
- Do not deploy production.
- Do not build Make scenarios before the owner approves P0.5.
- Do not invent canonical field names.
- Do not use unrestricted `clients/*` operations.
- Do not create a separate RAG, vector DB, or autonomous memory system this sprint.
- The repository is the memory.

## Context and usage efficiency

- Read canonical repository files instead of requesting repeated explanations.
- Do not rescan the full repository when a current inventory exists under `artifacts/`.
- Use targeted search before broad exploration.
- Use deterministic scripts for validation whenever possible.
- Keep command output summarized; store verbose logs as artifacts.
- Use faster models for exploration and mechanical work.
- Escalate to a stronger reasoning model only for architecture, security, concurrency, or unresolved repeated failures.
- Do not create subagents for tasks that can be completed in one focused pass.
- Stop after two unchanged failures and report **BLOCKED**.
- Never duplicate another active agent's assigned analysis.

## Stop-the-line

Stop and report **BLOCKED** when:

- remote is not the canonical factory repo
- current SHA differs from the declared baseline without integrator approval
- Sun Pool appears in the writable scope without break-glass
- canonical contracts conflict
- a command would contact production or print secrets
- a secret is discovered in tracked files during the task
- the change requires an unapproved architecture decision
- existing tests fail before your modifications
- the same test fails twice without new evidence
- the proposed diff exceeds the assignment

## Completion evidence

Every PR must include:

1. Files changed
2. Tests / checks run and results
3. Assumptions
4. Unresolved risks
5. Confirmation that Sun Pool was untouched
6. Confirmation that no production systems were contacted
7. Confirmation that no secret values were exposed

Agents report status in `artifacts/agent-runs/<agent>/<run-id>.md`.
Only the integrator updates `docs/EXECUTION_STATE.md`.
