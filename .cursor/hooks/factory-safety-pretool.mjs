#!/usr/bin/env node
/**
 * Fail-closed preToolUse guard: block Write/Delete to protected clients and .env files.
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
  return JSON.parse(raw);
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

export function evaluateToolUse(payload) {
  const tool = String(payload.tool_name || payload.toolName || payload.tool || '');
  let toolInput = payload.tool_input || payload.arguments || payload.params || {};
  if (typeof toolInput === 'string') {
    try { toolInput = JSON.parse(toolInput); } catch { toolInput = { raw: toolInput }; }
  }

  const paths = [];
  for (const key of ['path', 'file_path', 'filePath', 'target', 'filename']) {
    if (toolInput[key]) paths.push(String(toolInput[key]));
  }
  if (Array.isArray(toolInput.paths)) paths.push(...toolInput.paths.map(String));
  if (toolInput.raw) paths.push(String(toolInput.raw));

  const joined = paths.join('\n');
  const writeLike = /^(Write|Delete|Edit|StrReplace|EditNotebook)$/i.test(tool)
    || /write|delete|edit/i.test(tool);

  if (writeLike) {
    if (/clients\/sun-pool-spa(\/|$)/i.test(joined) || /\/clients\/sun-pool-spa(\/|$)/i.test(joined)) {
      return { deny: true, reason: 'Writes to protected client clients/sun-pool-spa are blocked without break-glass.' };
    }
    if (/(^|[/\s])\.env(\.|$|\/)/i.test(joined) || /\.env\.(local|production|staging)\b/i.test(joined)) {
      return { deny: true, reason: 'Writes to .env files are blocked.' };
    }
    if (/docs\/EXECUTION_STATE\.md$/i.test(joined)) {
      return { deny: true, reason: 'docs/EXECUTION_STATE.md is integrator-only.' };
    }

    const owned = String(process.env.HTL_OWNED_PATHS || process.env.AGENT_OWNED_PATHS || '').trim();
    if (owned) {
      const prefixes = owned.split(',').map((s) => s.trim()).filter(Boolean);
      for (const p of paths) {
        const norm = p.replace(/\\/g, '/');
        // Only enforce when path is inside the repo-ish roots we care about
        if (!/\/(clients|config|scripts|docs|\.cursor|\.github|artifacts|tests)\//.test(`/${norm}/`)
          && !/^(clients|config|scripts|docs|\.cursor|\.github|artifacts|tests)\//.test(norm)) {
          continue;
        }
        const rel = norm.includes('/workspace/') ? norm.split('/workspace/')[1] : norm.replace(/^\.?\//, '');
        const ok = prefixes.some((prefix) => rel === prefix || rel.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`));
        if (!ok) {
          return { deny: true, reason: `Write path "${rel}" is outside declared owned paths (${owned}).` };
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
    const result = evaluateToolUse(input);
    if (result.deny) deny(result.reason);
    allow();
  } catch (err) {
    process.stdout.write(JSON.stringify({
      permission: 'deny',
      user_message: 'factory-safety-pretool hook failed closed',
      agent_message: err instanceof Error ? err.message : String(err)
    }) + '\n');
    process.exit(2);
  }
}
