# Findings

What building on the public SDK cost, as it happened. Each is filed upstream; a workaround in this repository names
its issue and goes when the SDK fixes it. Fixed ones say where; their workarounds are gone.

| # | Finding | Filed | Workaround here |
| --- | --- | --- | --- |
| 1 | The SDK had no runtime yet: types and a manifest check, no `connect`. | mo-narai-sdk#2 (answered by #4) | none: waited for the slice-1 runtime |
| 2 | No published package: the SDK installs from git, and needs a `prepare` build plus pnpm's `onlyBuiltDependencies` to get a `dist/`. | mo-narai-sdk#3, fixed by the npm publish (0.1.0) | none: every tool names `0.1.0`, and `check:imports` holds it |
| 3 | A tool can flood the host with practice reports: 1,000 in a row all reach the handler, with no rate or count limit. | mo-narai-sdk#6, fixed in bab4816 (10 at once, then 6 a minute) | none: `labs/hostile` tests the limit |
| 4 | A manifest's `payloads` schemas describe the body **without** its `schema` key (the SDK strips it before validating). Nothing in the README says so; a schema that requires `schema` fails every payload. | mo-narai-sdk#7, fixed in bab4816 (README, `manifestWarnings`) | none |
| 5 | No conformance kit: to test a tool against the SDK's host over a real channel, each tool copies the same wiring (`test/wire.ts`). The SDK should ship it (`@michinarai/sdk/testing`). | mo-narai-sdk#8, fixed in bab4816 (`@michinarai/sdk/testing`) | none: the tests use the kit |
| 6 | `defineTool` is typed with literal unions, so `narai-tool.json`, imported as JSON, doesn't type-check (`"none"` widens to `string`). Every tool that keeps its manifest as JSON hits it. The SDK could take `unknown` and check at runtime, or export a `readManifest(json)`. | mo-narai-sdk#9, fixed in bab4816 (`defineTool(unknown)`) | none |
| 7 | The kit forges onto the port and onto the tool's window, but not onto the host's window, so "a tool posts a forged answer to its parent, around its port" can't be tested through it. | mo-narai-sdk#10, fixed in eb4cc70 (`postToHost`, `connects`) | none: `labs/hostile` tests the parent window too |
| 8 | The browser harness (`startHarness`) leaves storage calls out of its `events`, and a reloaded tool frame never reconnects, so "a reload keeps this launch's storage" can't be tested end to end. | mo-narai-sdk#19, fixed in #21 and #22 (storage in the harness's events; a reloaded frame always reconnects) | none: the fretboard's e2e reloads its frame and finds the pick |
| 9 | No locale picker: the host sends a fallback chain (`ja-JP`, `ja`, `en`) and every tool matches it against its own `locales` with the same code. | mo-narai-sdk#25, fixed in 0.2.0 (`pickLocale`) | none: each tool's `words.ts` lists its `LOCALES`, and the SDK picks among them |
