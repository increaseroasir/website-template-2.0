-- Form 1 Make runtime privileges for service_role on htl-factory-dev.
-- Least privilege derived from live scenario 4852018 module audit (2026-08-01):
--   clients:            SELECT, INSERT, UPDATE  (lookups + create + PATCH active_onboarding_case_id)
--   onboarding_cases:   SELECT, INSERT
--   intake_submissions: SELECT, INSERT          (idempotency GET + create)
--   config_versions:    INSERT
--   request_client_transition(...): EXECUTE
-- No DELETE for Make runtime (synthetic cleanup uses admin/Postgres path).
-- No grants on idempotency_keys / workflow_events (no direct blueprint modules;
--   SECURITY DEFINER RPC owns those writes as table owner).
-- RLS remains enabled; no anon/authenticated grants; no ownership changes.

-- Schema USAGE already present on service_role in current project; keep explicit
-- for idempotent apply on rebuilds.
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.clients TO service_role;
GRANT SELECT, INSERT ON TABLE public.onboarding_cases TO service_role;
GRANT SELECT, INSERT ON TABLE public.intake_submissions TO service_role;
GRANT INSERT ON TABLE public.config_versions TO service_role;

GRANT EXECUTE ON FUNCTION public.request_client_transition(
  uuid, uuid, text, text, integer, text, text, text, text
) TO service_role;
