# Proposed migrations — historical provenance

> **STATUS (2026-07-31):** Published in Git as contract `0.2.0` / onboarding schema `1.1.0`.
> Retained under historical filename for provenance.
> Child-table migrations landed under `supabase/migrations/` but **NOT APPLIED** to Supabase.
> **Published in Git ≠ applied in Supabase.**

Approved SQL for `onboarding_employees` and `inventory_submissions` has been copied into timestamped files under `supabase/migrations/` (versions after remote max `20260731081314`).

This folder is retained for provenance. `inventory_items` remains deferred/not landed.

Target when apply is authorized: `htl-factory-dev` / `epeddfdifckzzmskhdsz` only.  
`config/supabase-targets.json` must remain `apply_authorized: false` until a separate apply authorization.

| File | Purpose |
|---|---|
| [`001_onboarding_employees.md`](./001_onboarding_employees.md) | Repeatable employee CRM access rows |
| [`002_inventory_submissions.md`](./002_inventory_submissions.md) | Inventory upload batches |
| [`003_inventory_items_optional.md`](./003_inventory_items_optional.md) | Optional per-item rows |

`.sql` twins remain as the approved source. Landed copies: `20260731184500_create_onboarding_employees.sql`, `20260731184600_create_inventory_submissions.sql`. Apply to **dev only** when separately authorized — never by inference.
