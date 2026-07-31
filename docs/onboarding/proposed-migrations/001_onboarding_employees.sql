-- PROPOSAL ONLY — DO NOT APPLY without separate owner authorization.

CREATE TABLE IF NOT EXISTS onboarding_employees (
  employee_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  email text NOT NULL,
  email_normalized text NOT NULL,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  job_title text,
  job_title_other text,
  employee_location_id text,
  required_crm_role text,
  lead_assignment_role text,
  permission_profile text,
  can_view_all_leads boolean,
  can_edit_opportunities boolean,
  can_send_communications boolean,
  can_manage_calendar boolean,
  calendar_needed boolean,
  calendar_name text,
  working_days text[],
  working_hours jsonb,
  employee_timezone text,
  required_crm_functions text[],
  manager_approved boolean NOT NULL DEFAULT false,
  approving_manager_name text,
  manager_approval_date date,
  submission_status text NOT NULL DEFAULT 'submitted',
  access_status text NOT NULL DEFAULT 'not_verified',
  ghl_user_id text,
  source_submission_id text NOT NULL,
  correlation_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_employees_client_email_unique UNIQUE (client_id, email_normalized),
  CONSTRAINT onboarding_employees_case_submission_unique UNIQUE (onboarding_case_id, source_submission_id)
);

CREATE INDEX IF NOT EXISTS onboarding_employees_case_idx
  ON onboarding_employees (onboarding_case_id);

CREATE INDEX IF NOT EXISTS onboarding_employees_email_norm_idx
  ON onboarding_employees (email_normalized);

COMMENT ON TABLE onboarding_employees IS
  'Repeatable employee CRM access requests. Not storage form2. Dedupe on (client_id, email_normalized).';

-- When applied: ENABLE ROW LEVEL SECURITY and mirror factory sister-table policies.
