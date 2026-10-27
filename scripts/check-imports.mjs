// The dogfood's one rule (Tool Platform study D11): a labs tool is built ONLY on the public @michinarai/sdk, as a third
// party would be. Every import in a tool's src/ is its own file or @michinarai/sdk (and its subpaths); nothing reaches out of
// the tool's folder (mo-narai, another tool); its runtime dependencies name @michinarai/sdk alone. Build tools (vite,
// vitest, typescript) are dev dependencies and never imported by src/.
//
//   node scripts/check-imports.mjs [ROOT]
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED = /^@michinarai\/sdk(\/.*)?$/;
const SOURCE = /\.(ts|tsx|js|mjs)$/;

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : SOURCE.test(f) ? [p] : [];
});

/** Every import specifier in a module's text: static, dynamic, re-exports and side-effect imports. */
export function specifiers(text) {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const found = [];
  for (const m of code.matchAll(/(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
    found.push(m[1] ?? m[2] ?? m[3]);
  }
  return found;
}

/** The rule's breaches under ROOT/labs: "file: what", one per breach. */
export function breaches(root) {
  const labs = join(root, "labs");
  if (!existsSync(labs)) return [];
  const out = [];
  for (const tool of readdirSync(labs)) {
    const dir = join(labs, tool);
    if (!statSync(dir).isDirectory()) continue;
    const pkg = join(dir, "package.json");
    if (existsSync(pkg)) {
      const deps = Object.keys(JSON.parse(readFileSync(pkg, "utf8")).dependencies ?? {});
      for (const d of deps) if (!ALLOWED.test(d)) out.push(`${relative(root, pkg)}: runtime dependency ${d} (only @michinarai/sdk)`);
    }
    const src = join(dir, "src");
    if (!existsSync(src)) continue;
    for (const file of walk(src)) {
      for (const spec of specifiers(readFileSync(file, "utf8"))) {
        if (spec.startsWith(".")) {
          const target = resolve(dirname(file), spec);
          if (!target.startsWith(dir + "/")) out.push(`${relative(root, file)}: ${spec} reaches outside ${tool}/`);
        } else if (!ALLOWED.test(spec)) {
          out.push(`${relative(root, file)}: imports ${spec} (only @michinarai/sdk)`);
        }
      }
    }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  const found = breaches(root);
  for (const b of found) console.error(`check-imports: ${b}`);
  console.log(`check-imports: ${found.length ? `${found.length} breach(es)` : "every tool imports only @michinarai/sdk"}`);
  process.exit(found.length ? 1 : 0);
}
