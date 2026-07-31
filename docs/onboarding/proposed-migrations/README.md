# Proposed migrations — DO NOT APPLY

These SQL files are **proposals** for owner approval. They are intentionally **not** under `supabase/migrations/` so they cannot be applied by the normal migration path without an explicit move + authorization.

Target if later approved: `htl-factory-dev` / `epeddfdifckzzmskhdsz` only.  
`config/supabase-targets.json` must remain `apply_authorized: false` until a separate apply authorization.

| File | Purpose |
|---|---|
| [`001_onboarding_employees.md`](./001_onboarding_employees.md) | Repeatable employee CRM access rows |
| [`002_inventory_submissions.md`](./002_inventory_submissions.md) | Inventory upload batches |
| [`003_inventory_items_optional.md`](./003_inventory_items_optional.md) | Optional per-item rows |

`.sql` twins now sit beside the markdown proposals for review. After owner approval of apply, copy into `supabase/migrations/` and apply to **dev only** — never by inference.
