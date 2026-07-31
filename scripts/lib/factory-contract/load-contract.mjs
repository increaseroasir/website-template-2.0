import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

export function loadIdentityFields() {
  return readJson("config/identity-fields.json");
}

export function loadStateMachine() {
  return readJson("config/state-machine.json");
}

export function loadForbiddenAliases() {
  return readJson("config/forbidden-aliases.json");
}

export function loadFactoryContractSchema() {
  return readJson("config/factory-contract.schema.json");
}

export function loadProductionApprovalPolicy() {
  return readJson("config/production-approval.json");
}

export function loadSyncPolicy() {
  return readJson("config/sync-policy.json");
}

export function loadSupabaseTargets() {
  return readJson("config/supabase-targets.json");
}

export function repoRoot() {
  return ROOT;
}
