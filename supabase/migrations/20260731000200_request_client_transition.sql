-- Controlled status transition RPC. Free-form status updates remain forbidden.
-- Migration status: COMPLETE BUT NOT APPLIED (do not run against production).

CREATE TABLE IF NOT EXISTS factory_transition_rules (
  from_status text NOT NULL,
  to_status text NOT NULL,
  actors text[] NOT NULL,
  requires_approval_readiness boolean NOT NULL DEFAULT false,
  requires_production_approval boolean NOT NULL DEFAULT false,
  PRIMARY KEY (from_status, to_status)
);

-- Seed from config/state-machine.json (keep in sync; tests assert parity)
INSERT INTO factory_transition_rules (from_status, to_status, actors, requires_approval_readiness, requires_production_approval)
VALUES
  ('submitted', 'under_review', ARRAY['csm', 'make_service', 'system'], false, false),
  ('under_review', 'needs_correction', ARRAY['csm'], false, false),
  ('needs_correction', 'under_review', ARRAY['csm', 'make_service', 'system'], false, false),
  ('under_review', 'rejected', ARRAY['csm', 'owner'], false, false),
  ('under_review', 'deferred', ARRAY['csm'], false, false),
  ('deferred', 'under_review', ARRAY['csm'], false, false),
  ('under_review', 'approved', ARRAY['csm', 'system'], true, false),
  ('approved', 'provisioning', ARRAY['make_service', 'tech_operator', 'system'], false, false),
  ('provisioning', 'provision_failed', ARRAY['make_service', 'system'], false, false),
  ('provision_failed', 'provisioning', ARRAY['make_service', 'tech_operator', 'system'], false, false),
  ('provisioning', 'infrastructure_ready', ARRAY['make_service', 'system'], false, false),
  ('infrastructure_ready', 'building', ARRAY['ai_build_agent', 'tech_operator', 'system'], false, false),
  ('building', 'build_failed', ARRAY['ai_build_agent', 'system'], false, false),
  ('build_failed', 'building', ARRAY['ai_build_agent', 'tech_operator', 'system'], false, false),
  ('building', 'staging', ARRAY['ai_build_agent', 'tech_operator', 'system'], false, false),
  ('staging', 'qa_failed', ARRAY['csm', 'approver'], false, false),
  ('qa_failed', 'building', ARRAY['ai_build_agent', 'tech_operator', 'system'], false, false),
  ('staging', 'awaiting_approval', ARRAY['csm', 'approver', 'system'], false, false),
  ('awaiting_approval', 'production_deploying', ARRAY['approver', 'tech_operator', 'system'], false, true),
  ('production_deploying', 'live', ARRAY['system', 'tech_operator'], false, false),
  ('live', 'update_requested', ARRAY['csm', 'owner'], false, false),
  ('update_requested', 'updating', ARRAY['tech_operator', 'ai_build_agent', 'system'], false, false),
  ('updating', 'staging', ARRAY['ai_build_agent', 'tech_operator', 'system'], false, false),
  ('live', 'suspended', ARRAY['owner', 'tech_operator'], false, false),
  ('suspended', 'live', ARRAY['owner', 'tech_operator'], false, false),
  ('rejected', 'archived', ARRAY['csm', 'owner'], false, false),
  ('live', 'archived', ARRAY['owner'], false, false)
ON CONFLICT (from_status, to_status) DO UPDATE
SET actors = EXCLUDED.actors,
    requires_approval_readiness = EXCLUDED.requires_approval_readiness,
    requires_production_approval = EXCLUDED.requires_production_approval;

CREATE OR REPLACE FUNCTION request_client_transition(
  p_client_id uuid DEFAULT NULL,
  p_onboarding_case_id uuid DEFAULT NULL,
  p_expected_current_status text DEFAULT NULL,
  p_requested_status text DEFAULT NULL,
  p_expected_version integer DEFAULT NULL,
  p_actor text DEFAULT NULL,
  p_correlation_id text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case onboarding_cases%ROWTYPE;
  v_rule factory_transition_rules%ROWTYPE;
  v_approval production_approvals%ROWTYPE;
  v_key text;
  v_prior idempotency_keys%ROWTYPE;
  v_result jsonb;
  v_new_version integer;
BEGIN
  IF p_expected_current_status IS NULL OR p_requested_status IS NULL THEN
    RAISE EXCEPTION 'invalid_argument: expected_current_status and requested_status are required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF p_expected_version IS NULL THEN
    RAISE EXCEPTION 'invalid_argument: expected_version is required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF p_actor IS NULL OR length(trim(p_actor)) = 0 THEN
    RAISE EXCEPTION 'invalid_argument: actor is required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF p_correlation_id IS NULL OR length(trim(p_correlation_id)) = 0 THEN
    RAISE EXCEPTION 'invalid_argument: correlation_id is required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF p_client_id IS NULL AND p_onboarding_case_id IS NULL THEN
    RAISE EXCEPTION 'invalid_argument: client_id or onboarding_case_id is required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_onboarding_case_id IS NOT NULL THEN
    SELECT * INTO v_case
    FROM onboarding_cases
    WHERE onboarding_case_id = p_onboarding_case_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found: onboarding_case_id'
        USING ERRCODE = 'no_data_found';
    END IF;
    IF p_client_id IS NOT NULL AND v_case.client_id <> p_client_id THEN
      RAISE EXCEPTION 'identity_mismatch: client_id does not match onboarding_case_id'
        USING ERRCODE = 'invalid_parameter_value';
    END IF;
  ELSE
    SELECT oc.* INTO v_case
    FROM onboarding_cases oc
    JOIN clients c ON c.active_onboarding_case_id = oc.onboarding_case_id
    WHERE c.client_id = p_client_id
    FOR UPDATE OF oc;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found: active onboarding case for client_id'
        USING ERRCODE = 'no_data_found';
    END IF;
  END IF;

  v_key := coalesce(
    nullif(trim(p_idempotency_key), ''),
    'transition:' || v_case.onboarding_case_id::text || ':' || p_requested_status || ':' || p_correlation_id
  );

  SELECT * INTO v_prior FROM idempotency_keys WHERE key = v_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'result', v_prior.result
    );
  END IF;

  IF v_case.status = p_requested_status AND v_case.version = p_expected_version THEN
    v_result := jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'onboarding_case_id', v_case.onboarding_case_id,
      'client_id', v_case.client_id,
      'status', v_case.status,
      'version', v_case.version
    );
    INSERT INTO idempotency_keys (key, operation, client_id, onboarding_case_id, result)
    VALUES (v_key, 'request_client_transition', v_case.client_id, v_case.onboarding_case_id, v_result);
    RETURN v_result;
  END IF;

  IF v_case.status IS DISTINCT FROM p_expected_current_status
     OR v_case.version IS DISTINCT FROM p_expected_version THEN
    RAISE EXCEPTION 'concurrency_conflict: expected status=% version=% but found status=% version=%',
      p_expected_current_status, p_expected_version, v_case.status, v_case.version
      USING ERRCODE = 'serialization_failure';
  END IF;

  SELECT * INTO v_rule
  FROM factory_transition_rules
  WHERE from_status = p_expected_current_status
    AND to_status = p_requested_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', p_expected_current_status, p_requested_status
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT (p_actor = ANY (v_rule.actors)) THEN
    RAISE EXCEPTION 'actor_not_allowed: % cannot transition % -> %',
      p_actor, p_expected_current_status, p_requested_status
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_rule.requires_approval_readiness THEN
    IF NOT EXISTS (
      SELECT 1 FROM approval_readiness ar
      WHERE ar.onboarding_case_id = v_case.onboarding_case_id
        AND ar.target_environment IN ('staging', 'production')
        AND ar.is_ready = true
    ) THEN
      RAISE EXCEPTION 'approval_readiness_blocked: case is not ready'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_rule.requires_production_approval THEN
    SELECT * INTO v_approval
    FROM production_approvals
    WHERE onboarding_case_id = v_case.onboarding_case_id
      AND environment = 'production'
      AND consumed_at IS NULL
      AND expires_at > now()
    ORDER BY approved_at DESC
    LIMIT 1
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'production_approval_required: unexpired unused production approval missing'
        USING ERRCODE = 'check_violation';
    END IF;
    UPDATE production_approvals
    SET consumed_at = now()
    WHERE production_approval_id = v_approval.production_approval_id;
  END IF;

  v_new_version := v_case.version + 1;

  PERFORM set_config('factory.allow_status_transition', '1', true);
  PERFORM set_config('factory.actor', p_actor, true);

  UPDATE onboarding_cases
  SET status = p_requested_status,
      version = v_new_version,
      correlation_id = p_correlation_id,
      updated_at = now()
  WHERE onboarding_case_id = v_case.onboarding_case_id;

  INSERT INTO status_history (
    client_id,
    onboarding_case_id,
    from_status,
    to_status,
    from_version,
    to_version,
    actor,
    correlation_id,
    reason,
    idempotency_key
  ) VALUES (
    v_case.client_id,
    v_case.onboarding_case_id,
    v_case.status,
    p_requested_status,
    v_case.version,
    v_new_version,
    p_actor,
    p_correlation_id,
    p_reason,
    v_key
  );

  INSERT INTO workflow_events (
    client_id,
    onboarding_case_id,
    event_type,
    correlation_id,
    actor,
    payload
  ) VALUES (
    v_case.client_id,
    v_case.onboarding_case_id,
    'status_transition',
    p_correlation_id,
    p_actor,
    jsonb_build_object(
      'from_status', v_case.status,
      'to_status', p_requested_status,
      'from_version', v_case.version,
      'to_version', v_new_version,
      'reason', p_reason
    )
  );

  v_result := jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'onboarding_case_id', v_case.onboarding_case_id,
    'client_id', v_case.client_id,
    'status', p_requested_status,
    'version', v_new_version
  );

  INSERT INTO idempotency_keys (key, operation, client_id, onboarding_case_id, result)
  VALUES (v_key, 'request_client_transition', v_case.client_id, v_case.onboarding_case_id, v_result);

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION request_client_transition(
  uuid, uuid, text, text, integer, text, text, text, text
) FROM PUBLIC;

COMMENT ON FUNCTION request_client_transition IS
  'Sole writer for onboarding_cases.status. Enforces state-machine, actor, optimistic concurrency, and idempotency.';
