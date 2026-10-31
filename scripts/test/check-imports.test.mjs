import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { breaches, specifiers } from "../check-imports.mjs";

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

test("a tool that imports only @michinarai/sdk and its own files passes", () => {
  assert.deepEqual(breaches(fixture("clean")), []);
});

test("mo-narai's code, another @narai package, a library or a node builtin is a breach, as is a runtime dependency", () => {
  assert.deepEqual(breaches(fixture("dirty")).sort(), [
    "labs/bad/package.json: runtime dependency react (only @michinarai/sdk)",
    "labs/bad/src/main.ts: ../../../../../../mo-narai/web/src/app reaches outside bad/",
    "labs/bad/src/main.ts: imports @narai/internal-host (only @michinarai/sdk)",
    "labs/bad/src/main.ts: imports node:fs (only @michinarai/sdk)",
    "labs/bad/src/main.ts: imports react (only @michinarai/sdk)",
    "labs/later/package.json: @michinarai/sdk ^0.2.0 is not an exact published version (x.y.z from npm)",
    "labs/pinned/package.json: @michinarai/sdk git+https://github.com/Monster-Orange/mo-narai-sdk.git#d7a46345a878b2857de4f25c878b19ae545c16b9 is not an exact published version (x.y.z from npm)",
  ]);
});

test("every tool names the same published @michinarai/sdk version", () => {
  const two = fileURLToPath(new URL("./fixtures/versions", import.meta.url));
  assert.deepEqual(breaches(two), ["labs/b/package.json: @michinarai/sdk 0.2.0, but labs/a/package.json has 0.1.0 (one version in every tool)"]);
});

test("specifiers: static, side-effect, dynamic and type imports; comments are not imports", () => {
  assert.deepEqual(specifiers(`import a from "x";\nimport "y";\nconst b = import("z");\nimport type { T } from "w";\n// import "c";`).sort(), ["w", "x", "y", "z"]);
});
