#!/usr/bin/env node
/**
 * Fail-closed beforeShellExecution guard for HTL factory agents.
 * Reads Cursor hook JSON on stdin; writes permission JSON on stdout.
 */
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

async function readStdinJson() {
  const chunks = [];
  for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    chunks.push(line);
  }
  const raw = chunks.join('\n').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // Some hosts send a single JSON blob without newlines.
    return JSON.parse(raw);
  }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    permission: 'deny',
    user_message: reason,
    agent_message: `FACTORY_SAFETY_DENY: ${reason}`
  }) + '\n');
  process.exit(0);
}

function allow() {
  process.stdout.write(JSON.stringify({ permission: 'allow' }) + '\n');
  process.exit(0);
}

export function evaluateShellCommand(command) {
  const cmd = String(command || '');
  const lower = cmd.toLowerCase();
  const compact = lower.replace(/\s+/g, ' ').trim();

  // Protected client mutation / targeting
  const targetsSunPool = /(^|[/\s'"`])clients\/sun-pool-spa(\/|\s|$|['"`])/.test(lower)
    || /(?:--client|--name|--slug|--init|--validate|--dist)\s+['"]?sun-pool-spa\b/.test(lower)
    || (/\bsun-pool-spa\b/.test(lower)
      && /\b(npm run|node |wrangler |hydrate|deploy|migrate|init|write|rm |cp |mv |rsync|mkdir|find\b|touch\b|tee\b|sed\s+-i|perl\s+-i)/.test(lower));
  if (targetsSunPool) {
    // Narrow read-only allowlist for OID/tree inspection only.
    // `find` is NOT read-only: -delete/-exec can mutate; use git/ls/rg instead.
    const readOnly = /^(git\s+(rev-parse|ls-tree|cat-file|show|log|diff|status)|ls\b|cat\b|head\b|rg\b|grep\b)\b/.test(compact)
      && !/\b(checkout|commit|push|reset|clean|rm|mv|cp|write|tee|sed\s+-i|perl\s+-i|-delete|-exec|-execdir)\b/.test(compact)
      && !/\bfind\b/.test(compact);
    if (!readOnly) {
      return {
        deny: true,
        reason: 'Commands targeting protected client sun-pool-spa are blocked without break-glass (CLI flags are never enough).'
      };
    }
  }

  // All wrangler pages/workers deploys and secret installs are blocked in agent context
  // (including --branch preview/staging). Preview/prod deploy is never agent-authorized.
  if (/\bwrangler\b/.test(lower) && /\b(?:pages\s+deploy|pages\s+deployment\s+create|deploy)\b/.test(lower)) {
    return {
      deny: true,
      reason: 'wrangler deploy / pages deploy is blocked in agent context (including preview branches).'
    };
  }
  if (/\bwrangler\b/.test(lower) && /\b(pages\s+secret\s+put|secret\s+put|secret\s+bulk)\b/.test(lower)) {
    return {
      deny: true,
      reason: 'wrangler secret put against real systems is blocked in agent context.'
    };
  }
  if (/\bnpm\s+run\s+(deploy|preview:deploy)\b/.test(lower)) {
    return { deny: true, reason: 'npm run deploy / preview:deploy is blocked in agent context.' };
  }
  if (/\bnpm\s+run\s+db:init:remote\b/.test(lower) || (/\bwrangler\s+d1\s+execute\b/.test(lower) && /\b--remote\b/.test(lower))) {
    return { deny: true, reason: 'Remote D1 init/execute is blocked in agent context.' };
  }
  if (/\bnpm\s+run\s+ghl:fields:(check|create)\b/.test(lower) || /\bnpm\s+run\s+secrets:verify\b/.test(lower)) {
    return { deny: true, reason: 'ghl:fields:* and secrets:verify against real systems are blocked in agent context.' };
  }

  // Bulk clients/* operations
  if (/clients\/\*\*?/.test(cmd)
    || /for\s+\w+\s+in\s+clients\//.test(lower)
    || (/ls\s+clients\/\s*;/.test(lower) && /\b(rm|mv|cp|hydrate|deploy|upgrade)\b/.test(lower))
    || (/\bfind\b/.test(lower) && /(?:^|[/\s'"`])clients(?:\/|\s|$)/.test(lower) && /\b(-delete|-exec|-execdir)\b/.test(lower))
    || /\brm\s+(-[a-z]*r[a-z]*|--recursive).*\bclients\b/.test(lower)) {
    return {
      deny: true,
      reason: 'Unrestricted clients/* bulk operations are forbidden. Use an explicit allowlist.'
    };
  }

  // .env writes
  if (/(?:^|[;&|]\s*)(?:cat|tee|cp|mv|install|dd)\b.*>\s*['"]?[^'";\s]*\.env\b/.test(lower)
    || /\b(?:echo|printf)\b.*>\s*['"]?[^'";\s]*\.env\b/.test(lower)
    || /\bsed\s+-i\b.*\.env\b/.test(lower)
    || /\b(?:write|touch)\b\s+['"]?[^'";\s]*\.env\b/.test(lower)
    || />\s*['"]?\.env(\.|['"\s]|$)/.test(lower)
    || /\.env(\.local|\.production)?['"]?\s*$/.test(lower) && /\b(tee|cp|mv|redirect)\b/.test(lower)) {
    return { deny: true, reason: '.env writes are blocked. Secrets live in 1Password, not Git or local env files written by agents.' };
  }

  // Env / secret printing
  if (/^(printenv|env)\b/.test(compact)
    || /\bprintenv\b/.test(lower)
    || /\benv\s*\|/.test(lower)
    || /\b(set|export)\s*[|]\s*grep\b/.test(lower)
    || /\becho\s+("|')?\$[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|OP_SERVICE)/.test(cmd)
    || /\bconsole\.log\(process\.env/.test(lower)) {
    return { deny: true, reason: 'Printing environment/secret values is blocked.' };
  }

  // Destructive supabase
  if (/\bsupabase\b/.test(lower) && /\b(db\s+reset|db\s+push|db\s+execute|migration\s+up|migration\s+down|sql)\b/.test(lower)) {
    if (/\b(--linked|--db-url|--password|reset|drop|truncate|delete\s+from)\b/.test(lower) || /\bdb\s+reset\b/.test(lower)) {
      return { deny: true, reason: 'Destructive or linked Supabase operations are blocked for Agent safety.' };
    }
  }
  if (/\b(drop\s+table|truncate\s+table|delete\s+from)\b/.test(lower) && /\b(supabase|psql|postgres)\b/.test(lower)) {
    return { deny: true, reason: 'Destructive SQL against Supabase/Postgres is blocked.' };
  }

  // commit / push to main (or premium-redesign)
  if (/\bgit\s+push\b/.test(lower) && /\b(origin\s+)?(main|premium-redesign)\b/.test(lower)) {
    return { deny: true, reason: 'git push to main or premium-redesign is forbidden.' };
  }
  if (/\bgit\s+commit\b/.test(lower) && /\b(main|premium-redesign)\b/.test(lower)) {
    return { deny: true, reason: 'git commit while targeting main/premium-redesign is forbidden.' };
  }
  if (/\bgit\s+checkout\s+(-b\s+)?(main|premium-redesign)\b/.test(lower) && /\b(commit|push|reset|merge)\b/.test(lower)) {
    return { deny: true, reason: 'Mutating main/premium-redesign is forbidden.' };
  }
  if (/\bgit\s+(commit|push)\b/.test(lower)) {
    // Block commit/push if HEAD is main/premium-redesign — checked via env hint when provided.
    const branch = String(process.env.GIT_BRANCH || process.env.CURSOR_AGENT_BRANCH || '').toLowerCase();
    if (branch === 'main' || branch === 'premium-redesign') {
      return { deny: true, reason: `git ${compact.includes('push') ? 'push' : 'commit'} on ${branch} is forbidden.` };
    }
  }

  // Optional owned-path enforcement when agent declares ownership
  const owned = String(process.env.HTL_OWNED_PATHS || process.env.AGENT_OWNED_PATHS || '').trim();
  if (owned) {
    const prefixes = owned.split(',').map((s) => s.trim()).filter(Boolean);
    const writeRe = /\b(rm|mv|cp|tee|install|rsync|mkdir|touch|sed\s+-i|perl\s+-i|python\b.*open\(|node\s+-e)\b/;
    if (writeRe.test(lower)) {
      // Extract path-like tokens; if any clients/ or config write falls outside owned prefixes, deny.
      const pathMatches = cmd.match(/(?:clients|config|scripts|docs|\.cursor|\.github|artifacts)\/[^\s'"]+/g) || [];
      for (const p of pathMatches) {
        const ok = prefixes.some((prefix) => p === prefix || p.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`) || prefix.startsWith(p));
        if (!ok && (p.startsWith('clients/') || p.startsWith('docs/EXECUTION_STATE'))) {
          return {
            deny: true,
            reason: `Write path "${p}" is outside declared owned paths (${owned}).`
          };
        }
      }
    }
  }

  return { deny: false };
}

const isMain = Boolean(process.argv[1])
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    const input = await readStdinJson();
    const result = evaluateShellCommand(input.command || input.cmd || '');
    if (result.deny) deny(result.reason);
    allow();
  } catch (err) {
    // failClosed is set in hooks.json; still emit deny JSON for clarity
    process.stdout.write(JSON.stringify({
      permission: 'deny',
      user_message: 'factory-safety-shell hook failed closed',
      agent_message: err instanceof Error ? err.message : String(err)
    }) + '\n');
    process.exit(2);
  }
}
