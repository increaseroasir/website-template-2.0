import { randomUUID } from "node:crypto";

/**
 * In-memory Supabase stand-in for unit/contract tests.
 * No live GHL, Make, or production Supabase.
 */
export function createMockStore() {
  return {
    clients: new Map(),
    onboarding_cases: new Map(),
    intake_submissions: new Map(),
    config_versions: new Map(),
    idempotency_keys: new Map(),
    status_history: [],
    deferrals: [],
    sync_failures: [],
    approval_readiness: new Map(),
    production_approvals: new Map(),
    rollback_authorizations: new Map(),
    managed_resources: new Map(),
    clickup_mirrors: new Map(),
    workflow_events: [],
  };
}

export function newId() {
  return randomUUID();
}
