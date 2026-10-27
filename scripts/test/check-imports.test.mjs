import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { breaches, specifiers } from "../check-imports.mjs";

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

test("a tool that imports only @narai/sdk and its own files passes", () => {
  assert.deepEqual(breaches(fixture("clean")), []);
});

test("mo-narai's code, another @narai package, a library or a node builtin is a breach, as is a runtime dependency", () => {
  assert.deepEqual(breaches(fixture("dirty")).sort(), [
    "labs/bad/package.json: runtime dependency react (only @narai/sdk)",
    "labs/bad/src/main.ts: ../../../../../../mo-narai/web/src/app reaches outside bad/",
    "labs/bad/src/main.ts: imports @narai/internal-host (only @narai/sdk)",
    "labs/bad/src/main.ts: imports node:fs (only @narai/sdk)",
    "labs/bad/src/main.ts: imports react (only @narai/sdk)",
  ]);
});

test("specifiers: static, side-effect, dynamic and type imports; comments are not imports", () => {
  assert.deepEqual(specifiers(`import a from "x";\nimport "y";\nconst b = import("z");\nimport type { T } from "w";\n// import "c";`).sort(), ["w", "x", "y", "z"]);
});
