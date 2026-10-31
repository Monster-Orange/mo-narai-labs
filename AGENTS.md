# Working rules for agents in this repository

Narai Labs is where Narai builds tools for its own lessons the way any publisher would: on the public `@michinarai/sdk`
and nothing else. It is the Tool Platform's dogfood (Monster-Orange/mo-narai#1285). What it costs to build here is
what it costs a third party, so friction is the product of this repository, not a nuisance to route around.

## The rules

- **The public SDK only.** A tool's `src/` imports its own files and `@michinarai/sdk` (with its subpaths), nothing
  else; its runtime dependencies name `@michinarai/sdk` alone. No imports from mo-narai, no copied platform code, no
  private endpoints. `pnpm check:imports` fails a breach, and it runs first in `pnpm preflight`.
- **The SDK is pinned to one published version** (an exact `x.y.z` from npm, never a git commit, a link or a range),
  the same in every tool; `pnpm check:imports` fails anything else. Moving the version is its own commit, with every
  tool's tests green on it.
- **Friction is filed, not worked around in silence.** Anything the SDK makes hard, wrong or undocumented becomes an
  issue on Monster-Orange/mo-narai-sdk (or mo-narai-cli for the command line) and a line in `FINDINGS.md`. A local
  workaround names its issue in a comment and goes when the SDK fixes it.
- **Tools never judge.** A tool reports what the learner did (`tool.answer`, `tool.practice`); Narai decides whether
  it is right. No verdicts in a payload (`correct`, `score`, `passed`, …): the SDK refuses them, and `labs/hostile`
  proves it keeps refusing.
- **Never name the reference company or its products** anywhere in this repository: code, comments, docs, commit
  messages, issues.
- **Every PR and commit names its issue**: `Part of Monster-Orange/mo-narai#1285` (or the issue it closes).

## A tool

`labs/<name>/` holds one tool: `narai-tool.json` (its manifest, with its payload schemas), `src/` (the page Narai
frames), `test/` (vitest, on a real MessageChannel through the SDK's host), `harness.mjs` (the SDK's harness, for a
person to try it) and `e2e.mjs` (a headless run of the harness that asserts what crossed the wire).

## The gate

`make preflight` (or `pnpm preflight`): check-imports, lint, typecheck, tests, build. `make e2e` drives each tool
through the SDK's harness headless. Run both before you hand anything off: they are the gate. CI runs the same, by hand only (`workflow_dispatch`), as
in mo-narai since the Actions cost cut.
