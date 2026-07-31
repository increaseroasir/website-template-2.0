-- HTL Factory P0 control-plane schema
-- Migration status: COMPLETE BUT NOT APPLIED (do not run against production).
-- Canonical names: docs/CANONICAL_CONTRACT.md + config/identity-fields.json

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- clients — organization identity
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  client_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug text NOT NULL,
  deployment_key text NOT NULL,
  business_name text NOT NULL,
  domain text,
  ghl_contact_id text,
  active_onboarding_case_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_client_slug_format CHECK (client_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT clients_client_slug_unique UNIQUE (client_slug),
  CONSTRAINT clients_deployment_key_unique UNIQUE (deployment_key)
);

CREATE INDEX IF NOT EXISTS clients_ghl_contact_id_idx ON clients (ghl_contact_id);

COMMENT ON TABLE clients IS 'Dealer/customer organization. client_id is the org UUID.';
COMMENT ON COLUMN clients.client_id IS 'Immutable organization UUID.';
COMMENT ON COLUMN clients.deployment_key IS 'Immutable machine deploy identifier.';
COMMENT ON COLUMN clients.business_name IS 'Editable display name.';
COMMENT ON COLUMN clients.domain IS 'Editable public domain; changes must be audited.';

-- ---------------------------------------------------------------------------
-- onboarding_cases — engagement + authoritative fulfillment status
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_cases (
  onboarding_case_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  status text NOT NULL DEFAULT 'submitted',
  version integer NOT NULL DEFAULT 1,
  ghl_contact_id text,
  ghl_opportunity_id text,
  ghl_location_id text,
  onboarding_schema_version text NOT NULL DEFAULT '1.0.0',
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_cases_status_check CHECK (status IN (
    'submitted',
    'under_review',
    'needs_correction',
    'rejected',
    'deferred',
    'approved',
    'provisioning',
    'provision_failed',
    'infrastructure_ready',
    'building',
    'build_failed',
    'staging',
    'qa_failed',
    'awaiting_approval',
    'production_deploying',
    'live',
    'update_requested',
    'updating',
    'suspended',
    'archived'
  )),
  CONSTRAINT onboarding_cases_version_positive CHECK (version >= 1),
  CONSTRAINT onboarding_cases_ghl_opportunity_unique UNIQUE (ghl_opportunity_id)
);

CREATE INDEX IF NOT EXISTS onboarding_cases_client_id_idx ON onboarding_cases (client_id);
CREATE INDEX IF NOT EXISTS onboarding_cases_status_idx ON onboarding_cases (status);

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_active_onboarding_case_fk;
ALTER TABLE clients
  ADD CONSTRAINT clients_active_onboarding_case_fk
  FOREIGN KEY (active_onboarding_case_id)
  REFERENCES onboarding_cases (onboarding_case_id);

COMMENT ON TABLE onboarding_cases IS 'One onboarding engagement. Status is authoritative here.';
COMMENT ON COLUMN onboarding_cases.ghl_contact_id IS 'External person; not the company key.';
COMMENT ON COLUMN onboarding_cases.ghl_location_id IS 'Canonical GHL sub-account id; nullable until provision.';

-- ---------------------------------------------------------------------------
-- intake_submissions — append-only raw Form 1/2/3 payloads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intake_submissions (
  intake_submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients (client_id),
  onboarding_case_id uuid REFERENCES onboarding_cases (onboarding_case_id),
  form text NOT NULL CHECK (form IN ('form1', 'form2', 'form3')),
  schema_version text NOT NULL,
  submission_id text NOT NULL,
  ghl_contact_id text,
  payload jsonb NOT NULL,
  correlation_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT intake_submissions_source_unique UNIQUE (form, submission_id)
);

CREATE INDEX IF NOT EXISTS intake_submissions_case_idx ON intake_submissions (onboarding_case_id);

COMMENT ON TABLE intake_submissions IS 'Append-only raw form payloads. Dedupe on (form, submission_id).';

-- ---------------------------------------------------------------------------
-- config_versions — normalized build inputs (append-only versions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config_versions (
  config_version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  config_version integer NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_form text CHECK (source_form IS NULL OR source_form IN ('form1', 'form2', 'form3', 'system')),
  submission_id text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT config_versions_case_version_unique UNIQUE (onboarding_case_id, config_version),
  CONSTRAINT config_versions_positive CHECK (config_version >= 1)
);

CREATE INDEX IF NOT EXISTS config_versions_client_idx ON config_versions (client_id);

COMMENT ON TABLE config_versions IS 'Append-only normalized config. Merges bump config_version; stale expected_version rejected.';

-- ---------------------------------------------------------------------------
-- idempotency_keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  operation text NOT NULL,
  client_id uuid REFERENCES clients (client_id),
  onboarding_case_id uuid REFERENCES onboarding_cases (onboarding_case_id),
  request_hash text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idempotency_keys_case_idx ON idempotency_keys (onboarding_case_id);

-- ---------------------------------------------------------------------------
-- status_history — append-only transitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_history (
  status_history_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  from_status text,
  to_status text NOT NULL,
  from_version integer,
  to_version integer NOT NULL,
  actor text NOT NULL,
  correlation_id text,
  reason text,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS status_history_case_idx ON status_history (onboarding_case_id, created_at);

-- ---------------------------------------------------------------------------
-- deferrals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deferrals (
  deferral_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  field_name text NOT NULL,
  reason text NOT NULL,
  approved_by text NOT NULL,
  approved_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  launch_consequence text NOT NULL,
  production_allowed boolean NOT NULL DEFAULT false,
  required_before_launch boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deferrals_expiration_check CHECK (expires_at > approved_at)
);

CREATE INDEX IF NOT EXISTS deferrals_case_idx ON deferrals (onboarding_case_id);

COMMENT ON TABLE deferrals IS 'Null is not a deferral. Only rows here satisfy missing required fields.';

-- ---------------------------------------------------------------------------
-- sync_failures
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_failures (
  sync_failure_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients (client_id),
  onboarding_case_id uuid REFERENCES onboarding_cases (onboarding_case_id),
  source_system text NOT NULL,
  operation text NOT NULL,
  error_code text,
  error_message text NOT NULL,
  payload jsonb,
  correlation_id text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_failures_open_idx
  ON sync_failures (onboarding_case_id)
  WHERE resolved_at IS NULL;

-- ---------------------------------------------------------------------------
-- approval_readiness
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_readiness (
  approval_readiness_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  target_environment text NOT NULL CHECK (target_environment IN ('development', 'test', 'staging', 'production')),
  is_ready boolean NOT NULL DEFAULT false,
  missing_fields text[] NOT NULL DEFAULT '{}',
  deferrals_used uuid[] NOT NULL DEFAULT '{}',
  blocking_sync_failures uuid[] NOT NULL DEFAULT '{}',
  checked_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT approval_readiness_case_env_unique UNIQUE (onboarding_case_id, target_environment)
);

-- ---------------------------------------------------------------------------
-- production_approvals — human-bound immutable deployment candidates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_approvals (
  production_approval_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (client_id),
  onboarding_case_id uuid NOT NULL REFERENCES onboarding_cases (onboarding_case_id),
  configuration_version integer NOT NULL,
  onboarding_schema_version text NOT NULL,
  template_version text NOT NULL,
  git_sha text NOT NULL,
  hydrator_version text NOT NULL,
  gate_version text NOT NULL,
  deployment_workflow_version text NOT NULL,
  artifact_digest text NOT NULL,
  environment text NOT NULL CHECK (environment = 'production'),
  approved_by text NOT NULL,
  approved_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_approvals_expiration_check CHECK (expires_at > approved_at),
  CONSTRAINT production_approvals_config_positive CHECK (configuration_version >= 1),
  CONSTRAINT production_approvals_digest_format CHECK (artifact_digest ~ '^sha256:[0-9a-f]{64}$')
);

CREATE INDEX IF NOT EXISTS production_approvals_open_idx
  ON production_approvals (onboarding_case_id)
  WHERE consumed_at IS NULL;

COMMENT ON TABLE production_approvals IS
  'Human-approved immutable deployment candidate. Required and consumed for awaiting_approval -> production_deploying.';

-- ---------------------------------------------------------------------------
-- workflow_events — correlation / audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_events (
  workflow_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients (client_id),
  onboarding_case_id uuid REFERENCES onboarding_cases (onboarding_case_id),
  event_type text NOT NULL,
  correlation_id text,
  actor text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workflow_events_correlation_idx ON workflow_events (correlation_id);
CREATE INDEX IF NOT EXISTS workflow_events_case_idx ON workflow_events (onboarding_case_id, created_at);

-- ---------------------------------------------------------------------------
-- Ban free-form status updates (force RPC)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION forbid_direct_onboarding_status_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status IS DISTINCT FROM OLD.status
     AND coalesce(current_setting('factory.allow_status_transition', true), '') <> '1' THEN
    RAISE EXCEPTION 'free_form_status_update_forbidden: use request_client_transition'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forbid_direct_onboarding_status_update ON onboarding_cases;
CREATE TRIGGER trg_forbid_direct_onboarding_status_update
  BEFORE UPDATE OF status ON onboarding_cases
  FOR EACH ROW
  EXECUTE FUNCTION forbid_direct_onboarding_status_update();

-- Domain edit audit
CREATE OR REPLACE FUNCTION audit_client_domain_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.domain IS DISTINCT FROM OLD.domain THEN
    INSERT INTO workflow_events (client_id, onboarding_case_id, event_type, actor, payload)
    VALUES (
      NEW.client_id,
      NEW.active_onboarding_case_id,
      'domain_changed',
      coalesce(current_setting('factory.actor', true), 'unknown'),
      jsonb_build_object('from', OLD.domain, 'to', NEW.domain)
    );
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_client_domain_change ON clients;
CREATE TRIGGER trg_audit_client_domain_change
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION audit_client_domain_change();
