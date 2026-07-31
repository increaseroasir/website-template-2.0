import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateShellCommand } from '../../.cursor/hooks/factory-safety-shell.mjs';
import { evaluateToolUse } from '../../.cursor/hooks/factory-safety-pretool.mjs';

describe('factory-safety-shell hook', () => {
  it('blocks sun-pool-spa mutating commands', () => {
    const r = evaluateShellCommand('node manus-skills/dealer-site-intake/scripts/new-client.mjs --init sun-pool-spa');
    assert.equal(r.deny, true);
  });

  it('allows read-only sun-pool tree OID inspection', () => {
    const r = evaluateShellCommand("git rev-parse 'HEAD:clients/sun-pool-spa'");
    assert.equal(r.deny, false);
  });

  it('blocks wrangler pages deploy', () => {
    const r = evaluateShellCommand('wrangler pages deploy . --project-name demo --branch main');
    assert.equal(r.deny, true);
  });

  it('blocks npm run deploy', () => {
    assert.equal(evaluateShellCommand('npm run deploy').deny, true);
    assert.equal(evaluateShellCommand('npm run preview:deploy').deny, true);
  });

  it('blocks clients/* bulk', () => {
    assert.equal(evaluateShellCommand('rm -rf clients/*').deny, true);
    assert.equal(evaluateShellCommand('for d in clients/*; do echo $d; done').deny, true);
  });

  it('blocks .env writes', () => {
    assert.equal(evaluateShellCommand('echo SECRET=1 > .env').deny, true);
    assert.equal(evaluateShellCommand('cp x .env.local').deny, true);
  });

  it('blocks env printing', () => {
    assert.equal(evaluateShellCommand('printenv').deny, true);
    assert.equal(evaluateShellCommand('env | grep TOKEN').deny, true);
  });

  it('blocks destructive supabase', () => {
    assert.equal(evaluateShellCommand('supabase db reset --linked').deny, true);
  });

  it('blocks git push to main', () => {
    assert.equal(evaluateShellCommand('git push origin main').deny, true);
    assert.equal(evaluateShellCommand('git push -u origin premium-redesign').deny, true);
  });

  it('allows safe feature-branch push command text', () => {
    assert.equal(evaluateShellCommand('git push -u origin cursor/p0-agent-a-safety-224e').deny, false);
  });

  it('blocks remote db init and secrets verify', () => {
    assert.equal(evaluateShellCommand('npm run db:init:remote').deny, true);
    assert.equal(evaluateShellCommand('npm run secrets:verify').deny, true);
    assert.equal(evaluateShellCommand('npm run ghl:fields:create').deny, true);
  });
});

describe('factory-safety-pretool hook', () => {
  it('blocks writes to sun-pool-spa', () => {
    const r = evaluateToolUse({
      tool_name: 'Write',
      tool_input: { path: '/workspace/clients/sun-pool-spa/client.config.js' }
    });
    assert.equal(r.deny, true);
  });

  it('blocks .env writes', () => {
    const r = evaluateToolUse({
      tool_name: 'Write',
      tool_input: { path: '/workspace/.env' }
    });
    assert.equal(r.deny, true);
  });

  it('allows writes to safety-owned paths', () => {
    const r = evaluateToolUse({
      tool_name: 'Write',
      tool_input: { path: '/workspace/scripts/lib/client-protection.mjs' }
    });
    assert.equal(r.deny, false);
  });

  it('blocks EXECUTION_STATE edits', () => {
    const r = evaluateToolUse({
      tool_name: 'StrReplace',
      tool_input: { path: 'docs/EXECUTION_STATE.md' }
    });
    assert.equal(r.deny, true);
  });
});
