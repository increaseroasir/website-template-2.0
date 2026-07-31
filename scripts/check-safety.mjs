#!/usr/bin/env node
/**
 * CI entrypoint for Agent A safety gates (no network, no mutating client ops).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadProtectedClientsConfig,
  isProtectedClient,
  assertClientMutationAllowed,
  ClientProtectionError
} from './lib/client-protection.mjs';

const repoRoot = new URL('..', import.meta.url).pathname;
const SUN_POOL_TREE_OID = 'f3da831b2c31d37693f6022340b2d2f936bb4f72';
let failed = 0;

function pass(msg) {
  process.stdout.write(`PASS ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`FAIL ${msg}\n`);
  failed += 1;
}

// 1) Config presence + sun-pool requires break-glass
try {
  const config = loadProtectedClientsConfig(repoRoot);
  const sun = config.protected_clients.find((c) => c.slug === 'sun-pool-spa');
  if (!sun || sun.requires_break_glass !== true) {
    fail('sun-pool-spa must exist with requires_break_glass: true');
  } else {
    pass('protected-clients.json sun-pool-spa requires_break_glass');
  }
  if (!isProtectedClient({ clientSlug: 'sun-pool-spa' }, config)) {
    fail('isProtectedClient(sun-pool-spa) returned false');
  } else {
    pass('isProtectedClient(sun-pool-spa)');
  }
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

// 2) Protected mutation rejected without break-glass
try {
  assertClientMutationAllowed({
    repoRoot,
    clientSlug: 'sun-pool-spa',
    operation: 'hydrate'
  });
  fail('expected sun-pool-spa hydrate without break-glass to throw');
} catch (err) {
  if (err instanceof ClientProtectionError && err.code === 'BREAK_GLASS_REQUIRED') {
    pass('sun-pool-spa mutation rejected without break-glass');
  } else {
    fail(`unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// 3) Sun Pool tree OID unchanged at HEAD
const oid = spawnSync('git', ['rev-parse', 'HEAD:clients/sun-pool-spa'], {
  cwd: repoRoot,
  encoding: 'utf8'
});
if (oid.status !== 0) {
  fail(`git rev-parse HEAD:clients/sun-pool-spa failed: ${oid.stderr}`);
} else {
  const actual = oid.stdout.trim();
  if (actual !== SUN_POOL_TREE_OID) {
    fail(`Sun Pool tree OID changed: ${actual} !== ${SUN_POOL_TREE_OID}`);
  } else {
    pass(`Sun Pool tree OID ${SUN_POOL_TREE_OID}`);
  }
}

// 4) Hooks + library files exist
for (const rel of [
  'scripts/lib/client-protection.mjs',
  '.cursor/hooks.json',
  '.cursor/hooks/factory-safety-shell.mjs',
  '.cursor/hooks/factory-safety-pretool.mjs',
  'artifacts/mutator-inventory.json'
]) {
  if (!existsSync(join(repoRoot, rel))) fail(`missing ${rel}`);
  else pass(`exists ${rel}`);
}

// 5) hooks.json failClosed
try {
  const hooks = JSON.parse(readFileSync(join(repoRoot, '.cursor/hooks.json'), 'utf8'));
  const shell = hooks.hooks?.beforeShellExecution || [];
  const pre = hooks.hooks?.preToolUse || [];
  if (!shell.some((h) => h.failClosed === true)) fail('beforeShellExecution must set failClosed: true');
  else pass('beforeShellExecution failClosed');
  if (!pre.some((h) => h.failClosed === true)) fail('preToolUse must set failClosed: true');
  else pass('preToolUse failClosed');
} catch (err) {
  fail(`hooks.json parse: ${err instanceof Error ? err.message : String(err)}`);
}

// 6) unit tests
const unit = spawnSync(process.execPath, ['--test', 'tests/safety/client-protection.test.mjs', 'tests/safety/hooks.test.mjs'], {
  cwd: repoRoot,
  encoding: 'utf8'
});
process.stdout.write(unit.stdout || '');
process.stderr.write(unit.stderr || '');
if (unit.status !== 0) fail('node --test tests/safety');
else pass('node --test tests/safety');

if (failed) {
  process.stderr.write(`\nSafety checks failed: ${failed}\n`);
  process.exit(1);
}
process.stdout.write('\nAll safety checks passed.\n');
