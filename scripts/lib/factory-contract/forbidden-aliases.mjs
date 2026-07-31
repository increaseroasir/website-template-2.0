import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { loadForbiddenAliases, repoRoot } from "./load-contract.mjs";

/**
 * Scan contract-owned paths for forbidden alias tokens outside allowlisted files.
 * Matches whole identifiers (word boundaries), not substrings of canonical names.
 * @returns {{ ok: boolean, violations: Array<{ file: string, alias: string, canonical: string, line: number }> }}
 */
export function scanForbiddenAliases(options = {}) {
  const doc = loadForbiddenAliases();
  const root = repoRoot();
  const scanPaths = options.scanPaths || doc.ci_policy.scan_paths;
  const allowBasenames = new Set([
    "forbidden-aliases.json",
    ...(options.extraAllowBasenames || []),
  ]);

  const violations = [];

  for (const scanPath of scanPaths) {
    const abs = join(root, scanPath);
    walk(abs, (filePath) => {
      const base = filePath.split("/").pop();
      if (allowBasenames.has(base)) return;
      if (base === "CANONICAL_CONTRACT.md") return;

      const text = readFileSync(filePath, "utf8");
      const lines = text.split("\n");
      for (const entry of doc.aliases) {
        for (const alias of entry.forbidden) {
          const pattern = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(alias)}(?![A-Za-z0-9_])`);
          lines.forEach((line, idx) => {
            if (line.includes("forbidden-alias-example")) return;
            if (pattern.test(line)) {
              violations.push({
                file: relative(root, filePath),
                alias,
                canonical: entry.canonical,
                line: idx + 1,
              });
            }
          });
        }
      }
    });
  }

  return { ok: violations.length === 0, violations };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function walk(path, onFile) {
  let st;
  try {
    st = statSync(path);
  } catch {
    return;
  }
  if (st.isFile()) {
    onFile(path);
    return;
  }
  if (!st.isDirectory()) return;
  for (const name of readdirSync(path)) {
    if (name === "node_modules" || name === ".git") continue;
    walk(join(path, name), onFile);
  }
}
