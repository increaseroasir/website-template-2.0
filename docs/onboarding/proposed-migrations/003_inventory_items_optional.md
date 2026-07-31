# Proposed migration (optional): `inventory_items`

**Status:** OPTIONAL PROPOSAL — do not apply  
**Depends on:** `inventory_submissions`  
**When needed:** After spreadsheet parse is authorized; not required for Form 3 intake capture.

```sql
-- OPTIONAL PROPOSAL ONLY — DO NOT APPLY without separate owner authorization.

CREATE TABLE IF NOT EXISTS inventory_items (
  inventory_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_submission_id uuid NOT NULL
    REFERENCES inventory_submissions (inventory_submission_id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  row_number integer,
  sku text,
  product_name text,
  brand text,
  category text,
  status text,
  price_cents integer,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_submission_row_unique
    UNIQUE (inventory_submission_id, row_number)
);

CREATE INDEX IF NOT EXISTS inventory_items_submission_idx
  ON inventory_items (inventory_submission_id);

CREATE INDEX IF NOT EXISTS inventory_items_case_idx
  ON inventory_items (onboarding_case_id);

COMMENT ON TABLE inventory_items IS
  'Optional parsed inventory line items. Batch authority remains on inventory_submissions.';
```

## Recommendation

Ship `inventory_submissions` first. Defer `inventory_items` until a parser path is designed and authorized.
