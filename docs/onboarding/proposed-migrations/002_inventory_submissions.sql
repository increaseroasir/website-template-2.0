-- PROPOSAL ONLY — DO NOT APPLY without separate owner authorization.

CREATE TABLE IF NOT EXISTS inventory_submissions (
  inventory_submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  inventory_availability text NOT NULL,
  inventory_source_system text,
  inventory_approval_owner text,
  inventory_rights_confirmed boolean,
  inventory_expected_date date,
  spreadsheet_asset_ref text,
  spreadsheet_filename text,
  spreadsheet_content_type text,
  item_count integer,
  parse_status text NOT NULL DEFAULT 'not_applicable',
  review_status text NOT NULL DEFAULT 'submitted',
  source_submission_id text NOT NULL,
  correlation_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_submissions_case_submission_unique
    UNIQUE (onboarding_case_id, source_submission_id),
  CONSTRAINT inventory_submissions_availability_check CHECK (
    inventory_availability IN (
      'ready_to_upload',
      'needs_template',
      'no_current_inventory',
      'pending'
    )
  ),
  CONSTRAINT inventory_submissions_parse_status_check CHECK (
    parse_status IN (
      'not_applicable',
      'pending',
      'parsed',
      'parse_failed',
      'skipped'
    )
  )
);

CREATE INDEX IF NOT EXISTS inventory_submissions_case_idx
  ON inventory_submissions (onboarding_case_id);

CREATE INDEX IF NOT EXISTS inventory_submissions_availability_idx
  ON inventory_submissions (inventory_availability);

COMMENT ON TABLE inventory_submissions IS
  'Initial inventory upload batches. Not storage form3. Idempotent on (onboarding_case_id, source_submission_id).';
