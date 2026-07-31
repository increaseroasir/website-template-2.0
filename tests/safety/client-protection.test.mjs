import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  assertClientMutationAllowed,
  clientMutationAllowed,
  ClientProtectionError,
  assertNotBulkClientsGlob,
  loadProtectedClientsConfig,
  isProtectedClient
} from '../../scripts/lib/client-protection.mjs';

const repoRoot = new URL('../..', import.meta.url).pathname;

describe('protected-clients.json', () => {
  it('loads and requires break-glass for sun-pool-spa', () => {
    const config = loadProtectedClientsConfig(repoRoot);
    assert.equal(config.version, 1);
    const sun = config.protected_clients.find((c) => c.slug === 'sun-pool-spa');
    assert.ok(sun);
    assert.equal(sun.requires_break_glass, true);
  });

  it('marks sun-pool-spa protected', () => {
    assert.equal(isProtectedClient({ clientSlug: 'sun-pool-spa' }, loadProtectedClientsConfig(repoRoot)), true);
    assert.equal(isProtectedClient({ clientSlug: 'hostile-rehearsal' }, loadProtectedClientsConfig(repoRoot)), false);
  });
});

describe('assertClientMutationAllowed', () => {
  let fixtureRoot;

  before(() => {
    fixtureRoot = mkdtempSync(join(tmpdir(), 'htl-protection-'));
    mkdirSync(join(fixtureRoot, 'config'), { recursive: true });
    mkdirSync(join(fixtureRoot, 'artifacts', 'break-glass'), { recursive: true });
    writeFileSync(join(fixtureRoot, 'package.json'), '{"type":"module"}\n');
    writeFileSync(join(fixtureRoot, 'config', 'protected-clients.json'), JSON.stringify({
      version: 1,
      break_glass: { artifact_dir: 'artifacts/break-glass' },
      protected_clients: [
        {
          slug: 'sun-pool-spa',
          client_id: '11111111-1111-1111-1111-111111111111',
          requires_break_glass: true
        },
        {
          slug: 'open-dealer',
          client_id: '22222222-2222-2222-2222-222222222222',
          requires_break_glass: false
        }
      ]
    }, null, 2));
  });

  after(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it('fails closed on unknown identity', () => {
    assert.throws(
      () => assertClientMutationAllowed({ repoRoot: fixtureRoot, operation: 'hydrate' }),
      (err) => err instanceof ClientProtectionError && err.code === 'IDENTITY_UNKNOWN'
    );
  });

  it('allows non-protected client', () => {
    const result = assertClientMutationAllowed({
      repoRoot: fixtureRoot,
      clientSlug: 'hostile-rehearsal',
      operation: 'hydrate'
    });
    assert.equal(result.allowed, true);
    assert.equal(result.protected, false);
  });

  it('rejects protected client without break-glass', () => {
    assert.throws(
      () => assertClientMutationAllowed({
        repoRoot: fixtureRoot,
        clientSlug: 'sun-pool-spa',
        operation: 'hydrate'
      }),
      (err) => err instanceof ClientProtectionError && err.code === 'BREAK_GLASS_REQUIRED'
    );
  });

  it('rejects CLI force flag alone on protected client', () => {
    const result = clientMutationAllowed({
      repoRoot: fixtureRoot,
      clientSlug: 'sun-pool-spa',
      operation: 'hydrate',
      cliForceFlag: true,
      force: true
    });
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'BREAK_GLASS_REQUIRED');
    assert.match(result.message, /CLI flag alone/i);
  });

  it('allows protected client with valid break-glass artifact', () => {
    const path = join(fixtureRoot, 'artifacts', 'break-glass', 'sun-pool-spa.json');
    writeFileSync(path, JSON.stringify({
      version: 1,
      client_slug: 'sun-pool-spa',
      client_id: '11111111-1111-1111-1111-111111111111',
      actor: 'owner@example.com',
      approved_by: 'owner@example.com',
      reason: 'emergency fixture test',
      scope: ['hydrate'],
      expires_at: new Date(Date.now() + 60_000).toISOString()
    }, null, 2));

    const result = assertClientMutationAllowed({
      repoRoot: fixtureRoot,
      clientSlug: 'sun-pool-spa',
      clientId: '11111111-1111-1111-1111-111111111111',
      operation: 'hydrate',
      breakGlassPath: path
    });
    assert.equal(result.allowed, true);
    assert.equal(result.breakGlassUsed, true);
  });

  it('rejects expired break-glass', () => {
    const path = join(fixtureRoot, 'artifacts', 'break-glass', 'expired.json');
    writeFileSync(path, JSON.stringify({
      version: 1,
      client_slug: 'sun-pool-spa',
      actor: 'owner@example.com',
      approved_by: 'owner@example.com',
      reason: 'expired',
      scope: ['*'],
      expires_at: new Date(Date.now() - 1000).toISOString()
    }, null, 2));

    assert.throws(
      () => assertClientMutationAllowed({
        repoRoot: fixtureRoot,
        clientSlug: 'sun-pool-spa',
        operation: 'hydrate',
        breakGlassPath: path
      }),
      (err) => err instanceof ClientProtectionError && err.code === 'BREAK_GLASS_EXPIRED'
    );
  });

  it('rejects wrong-scope break-glass', () => {
    const path = join(fixtureRoot, 'artifacts', 'break-glass', 'wrong-scope.json');
    writeFileSync(path, JSON.stringify({
      version: 1,
      client_slug: 'sun-pool-spa',
      actor: 'owner@example.com',
      approved_by: 'owner@example.com',
      reason: 'scope test',
      scope: ['deploy'],
      expires_at: new Date(Date.now() + 60_000).toISOString()
    }, null, 2));

    assert.throws(
      () => assertClientMutationAllowed({
        repoRoot: fixtureRoot,
        clientSlug: 'sun-pool-spa',
        operation: 'hydrate',
        breakGlassPath: path
      }),
      (err) => err instanceof ClientProtectionError && err.code === 'BREAK_GLASS_WRONG_SCOPE'
    );
  });

  it('rejects client_id / client_slug disagreement', () => {
    assert.throws(
      () => assertClientMutationAllowed({
        repoRoot: fixtureRoot,
        clientSlug: 'sun-pool-spa',
        clientId: '22222222-2222-2222-2222-222222222222',
        operation: 'hydrate'
      }),
      (err) => err instanceof ClientProtectionError && err.code === 'IDENTITY_MISMATCH'
    );
  });

  it('rejects production without authorization', () => {
    assert.throws(
      () => assertClientMutationAllowed({
        repoRoot: fixtureRoot,
        clientSlug: 'open-dealer',
        operation: 'deploy',
        environment: 'production'
      }),
      (err) => err instanceof ClientProtectionError && err.code === 'PRODUCTION_UNAUTHORIZED'
    );
  });

  it('allows production when explicitly authorized for non-protected', () => {
    const result = assertClientMutationAllowed({
      repoRoot: fixtureRoot,
      clientSlug: 'open-dealer',
      operation: 'deploy',
      environment: 'production',
      productionAuthorized: true
    });
    assert.equal(result.allowed, true);
  });

  it('rejects bulk clients/* targets', () => {
    assert.throws(
      () => assertNotBulkClientsGlob('clients/*'),
      (err) => err instanceof ClientProtectionError && err.code === 'BULK_CLIENTS_FORBIDDEN'
    );
  });
});
