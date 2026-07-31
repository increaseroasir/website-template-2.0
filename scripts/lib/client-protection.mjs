/**
 * Shared client mutation guard for the HTL factory.
 *
 * Fail closed when:
 * - client identity is unknown
 * - client_id and client_slug disagree
 * - client is protected and break-glass is missing/expired/wrong-scope
 * - operation targets production without authorization
 *
 * A CLI flag alone is never sufficient authorization.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = resolve(__dirname, '..', '..');
const CONFIG_REL = join('config', 'protected-clients.json');

export class ClientProtectionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ClientProtectionError';
    this.code = code;
  }
}

export function findRepoRoot(start = DEFAULT_REPO_ROOT) {
  let dir = resolve(start);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, CONFIG_REL)) && existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return DEFAULT_REPO_ROOT;
}

export function loadProtectedClientsConfig(repoRoot = findRepoRoot()) {
  const path = join(repoRoot, CONFIG_REL);
  if (!existsSync(path)) {
    throw new ClientProtectionError(
      'CONFIG_MISSING',
      `Missing ${CONFIG_REL}; refuse to authorize client mutations.`
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new ClientProtectionError(
      'CONFIG_INVALID',
      `Invalid ${CONFIG_REL}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (!parsed || !Array.isArray(parsed.protected_clients)) {
    throw new ClientProtectionError(
      'CONFIG_INVALID',
      `${CONFIG_REL} must contain a protected_clients array.`
    );
  }
  return parsed;
}

function normalizeSlug(slug) {
  if (slug == null || slug === '') return null;
  return String(slug).trim().toLowerCase();
}

function normalizeId(id) {
  if (id == null || id === '') return null;
  return String(id).trim().toLowerCase();
}

export function getProtectedEntry(identity, config = loadProtectedClientsConfig()) {
  const slug = normalizeSlug(identity?.clientSlug ?? identity?.slug ?? identity?.client_slug);
  const clientId = normalizeId(identity?.clientId ?? identity?.client_id);
  return (config.protected_clients || []).find((entry) => {
    const entrySlug = normalizeSlug(entry.slug);
    const entryId = normalizeId(entry.client_id);
    if (slug && entrySlug && slug === entrySlug) return true;
    if (clientId && entryId && clientId === entryId) return true;
    return false;
  }) || null;
}

export function isProtectedClient(identity, config = loadProtectedClientsConfig()) {
  return Boolean(getProtectedEntry(identity, config));
}

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function resolveBreakGlassPath(opts, config, repoRoot, slug) {
  if (opts.breakGlassPath) {
    return isAbsolute(opts.breakGlassPath)
      ? opts.breakGlassPath
      : resolve(repoRoot, opts.breakGlassPath);
  }
  if (opts.breakGlassArtifact) {
    return isAbsolute(opts.breakGlassArtifact)
      ? opts.breakGlassArtifact
      : resolve(repoRoot, opts.breakGlassArtifact);
  }
  const fromEnv = process.env.HTL_BREAK_GLASS_PATH || process.env.BREAK_GLASS_PATH;
  if (fromEnv) {
    return isAbsolute(fromEnv) ? fromEnv : resolve(repoRoot, fromEnv);
  }
  const dir = config.break_glass?.artifact_dir || 'artifacts/break-glass';
  if (!slug) return null;
  return join(repoRoot, dir, `${slug}.json`);
}

function scopeAllows(scope, operation) {
  if (!Array.isArray(scope) || scope.length === 0) return false;
  const op = String(operation || '*').toLowerCase();
  return scope.some((item) => {
    const s = String(item || '').toLowerCase();
    return s === '*' || s === 'all' || s === op;
  });
}

function validateBreakGlass(artifact, { slug, clientId, operation, now }) {
  if (!artifact || typeof artifact !== 'object') {
    return { ok: false, code: 'BREAK_GLASS_INVALID', message: 'Break-glass artifact is missing or not JSON.' };
  }
  const required = ['version', 'client_slug', 'actor', 'reason', 'scope', 'expires_at', 'approved_by'];
  for (const field of required) {
    if (artifact[field] == null || artifact[field] === '') {
      return { ok: false, code: 'BREAK_GLASS_INVALID', message: `Break-glass missing required field: ${field}` };
    }
  }
  if (normalizeSlug(artifact.client_slug) !== normalizeSlug(slug)) {
    return {
      ok: false,
      code: 'BREAK_GLASS_WRONG_CLIENT',
      message: `Break-glass client_slug "${artifact.client_slug}" does not match "${slug}".`
    };
  }
  const artifactId = normalizeId(artifact.client_id);
  if (artifactId && clientId && artifactId !== clientId) {
    return {
      ok: false,
      code: 'BREAK_GLASS_WRONG_CLIENT',
      message: 'Break-glass client_id does not match requested client_id.'
    };
  }
  const expires = Date.parse(artifact.expires_at);
  if (!Number.isFinite(expires)) {
    return { ok: false, code: 'BREAK_GLASS_INVALID', message: 'Break-glass expires_at is not a valid timestamp.' };
  }
  if (expires <= now) {
    return { ok: false, code: 'BREAK_GLASS_EXPIRED', message: `Break-glass expired at ${artifact.expires_at}.` };
  }
  if (!scopeAllows(artifact.scope, operation)) {
    return {
      ok: false,
      code: 'BREAK_GLASS_WRONG_SCOPE',
      message: `Break-glass scope ${JSON.stringify(artifact.scope)} does not include operation "${operation}".`
    };
  }
  return { ok: true };
}

/**
 * Assert a client-scoped mutating operation is allowed.
 *
 * @param {object} opts
 * @param {string} [opts.clientSlug]
 * @param {string} [opts.clientId]
 * @param {string} [opts.operation] e.g. hydrate|init|deploy|migrate|bulk|write
 * @param {string} [opts.environment] development|test|staging|production
 * @param {string} [opts.breakGlassPath] path to approval artifact (not a bare CLI flag)
 * @param {boolean} [opts.cliForceFlag] if true, still insufficient alone for protected clients
 * @param {string} [opts.repoRoot]
 * @param {number} [opts.nowMs]
 * @param {boolean} [opts.productionAuthorized] explicit production authorization signal
 * @returns {{ allowed: true, protected: boolean, breakGlassUsed: boolean }}
 */
export function assertClientMutationAllowed(opts = {}) {
  const repoRoot = opts.repoRoot ? resolve(opts.repoRoot) : findRepoRoot();
  const config = opts.config || loadProtectedClientsConfig(repoRoot);
  const slug = normalizeSlug(opts.clientSlug ?? opts.slug ?? opts.client_slug);
  const clientId = normalizeId(opts.clientId ?? opts.client_id);
  const operation = String(opts.operation || 'mutate').toLowerCase();
  const environment = String(opts.environment || process.env.HTL_ENVIRONMENT || 'development').toLowerCase();
  const now = Number.isFinite(opts.nowMs) ? opts.nowMs : Date.now();

  if (!slug && !clientId) {
    throw new ClientProtectionError(
      'IDENTITY_UNKNOWN',
      'Client identity unknown: provide clientSlug and/or clientId before mutation.'
    );
  }

  const bySlug = slug
    ? (config.protected_clients || []).find((e) => normalizeSlug(e.slug) === slug)
    : null;
  const byId = clientId
    ? (config.protected_clients || []).find((e) => {
        const entryId = normalizeId(e.client_id);
        return entryId && entryId === clientId;
      })
    : null;

  if (slug && clientId && bySlug && byId && bySlug !== byId) {
    throw new ClientProtectionError(
      'IDENTITY_MISMATCH',
      `client_id and client_slug disagree for protected lookup (${clientId} vs ${slug}).`
    );
  }

  if (slug && clientId) {
    const entry = bySlug || byId;
    if (entry) {
      const entryId = normalizeId(entry.client_id);
      const entrySlug = normalizeSlug(entry.slug);
      if (entryId && entryId !== clientId) {
        throw new ClientProtectionError(
          'IDENTITY_MISMATCH',
          `client_id "${clientId}" does not match protected client "${entrySlug}" (configured client_id).`
        );
      }
      if (entrySlug && slug !== entrySlug && byId) {
        throw new ClientProtectionError(
          'IDENTITY_MISMATCH',
          `client_slug "${slug}" does not match client_id "${clientId}".`
        );
      }
    }
  }

  if (environment === 'production') {
    const prodOk = opts.productionAuthorized === true
      || String(process.env.HTL_PRODUCTION_AUTHORIZED || '').toLowerCase() === 'true';
    if (!prodOk) {
      throw new ClientProtectionError(
        'PRODUCTION_UNAUTHORIZED',
        `Production mutation denied for operation "${operation}". Requires explicit production authorization (not a CLI flag alone).`
      );
    }
  }

  const protectedEntry = bySlug || byId || getProtectedEntry({ clientSlug: slug, clientId }, config);
  if (!protectedEntry || protectedEntry.requires_break_glass === false) {
    return { allowed: true, protected: Boolean(protectedEntry), breakGlassUsed: false };
  }

  // Null / missing client_id on a protected entry is an additional protection
  // condition — never invent a UUID and never treat it as permission to mutate.
  if (
    protectedEntry.client_id == null &&
    (protectedEntry.missing_client_id_is_additional_protection !== false)
  ) {
    // Fall through to break-glass requirement; do not soften the gate.
  }

  // CLI force/bypass flags are never enough for protected clients.
  if (opts.cliForceFlag || opts.force || opts.allowProtected) {
    // Continue only if a valid break-glass artifact also exists.
  }

  const bgPath = resolveBreakGlassPath(opts, config, repoRoot, slug || normalizeSlug(protectedEntry.slug));
  if (!bgPath || !existsSync(bgPath)) {
    throw new ClientProtectionError(
      'BREAK_GLASS_REQUIRED',
      `Protected client "${slug || protectedEntry.slug}" requires a break-glass artifact for operation "${operation}".`
        + (opts.cliForceFlag ? ' A CLI flag alone is never sufficient authorization.' : '')
    );
  }

  const artifact = readJsonFile(bgPath);
  const checked = validateBreakGlass(artifact, {
    slug: slug || normalizeSlug(protectedEntry.slug),
    clientId,
    operation,
    now
  });
  if (!checked.ok) {
    throw new ClientProtectionError(checked.code, checked.message);
  }

  return { allowed: true, protected: true, breakGlassUsed: true, breakGlassPath: bgPath };
}

/** Convenience: return false instead of throwing. */
export function clientMutationAllowed(opts = {}) {
  try {
    return assertClientMutationAllowed(opts);
  } catch (err) {
    if (err instanceof ClientProtectionError) {
      return { allowed: false, code: err.code, message: err.message };
    }
    throw err;
  }
}

export function assertNotBulkClientsGlob(target) {
  const value = String(target || '');
  if (
    /(^|[/\s])clients\/\*(?:$|[/\s])/.test(value)
    || /clients\/\*\*/.test(value)
    || value === 'clients/*'
    || value === 'clients/**'
  ) {
    throw new ClientProtectionError(
      'BULK_CLIENTS_FORBIDDEN',
      'Unrestricted clients/* filesystem operations are forbidden. Use an explicit allowlist.'
    );
  }
}
