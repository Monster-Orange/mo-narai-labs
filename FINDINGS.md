# Findings

What building on the public SDK cost, as it happened. Each is filed upstream; a workaround in this repository names
its issue and goes when the SDK fixes it.

| # | Finding | Filed | Workaround here |
| --- | --- | --- | --- |
| 1 | The SDK had no runtime yet: types and a manifest check, no `connect`. | mo-narai-sdk#2 (answered by #4) | none: waited for the slice-1 runtime |
| 2 | No published package: the SDK installs from git, and needs a `prepare` build plus pnpm's `onlyBuiltDependencies` to get a `dist/`. | mo-narai-sdk#3 | the pin and `onlyBuiltDependencies` in `package.json` |
| 3 | A tool can flood the host with practice reports: 1,000 in a row all reach the handler, with no rate or count limit. | mo-narai-sdk#6 | `labs/hostile` has it as an expected failure (`it.fails`), which turns red when the SDK fixes it |
| 4 | A manifest's `payloads` schemas describe the body **without** its `schema` key (the SDK strips it before validating). Nothing in the README says so; a schema that requires `schema` fails every payload. | mo-narai-sdk#7 | none needed once known |
| 5 | No conformance kit: to test a tool against the SDK's host over a real channel, each tool copies the same wiring (`test/wire.ts`). The SDK should ship it (`@narai/sdk/testing`). | mo-narai-sdk#8 | `labs/*/test/wire.ts`, one copy per tool |
| 6 | `defineTool` is typed with literal unions, so `narai-tool.json`, imported as JSON, doesn't type-check (`"none"` widens to `string`). Every tool that keeps its manifest as JSON hits it. The SDK could take `unknown` and check at runtime, or export a `readManifest(json)`. | mo-narai-sdk#9 | `labs/*/src/manifest.ts`: `manifestProblems` first, then the assertion |
