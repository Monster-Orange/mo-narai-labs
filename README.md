# Narai Labs

Tools Narai builds for its own lessons, built **only on the public `@michinarai/sdk`**, the way any publisher would build
one. If a tool here needs something the SDK doesn't give, that is a finding (see `FINDINGS.md`), not a shortcut.

| Tool | What it is |
| --- | --- |
| [`labs/fretboard`](labs/fretboard) | A guitar neck: shows a note, a scale or an interval; the learner picks positions and sends what they played (`music.played@1`). The Tutor can `highlight` and `clear`. |
| [`labs/hostile`](labs/hostile) | A tool that conforms on paper and then tries everything it shouldn't: verdicts, oversized and malformed payloads, undeclared activities and commands, forged messages. Its tests prove each attempt is stopped. |

## Run it

```sh
corepack enable          # pnpm, at the version package.json pins
pnpm install
make preflight           # check-imports, lint, typecheck, tests, build
make e2e                 # each tool, headless, through the SDK's harness
pnpm dev                 # the fretboard in the SDK's harness, to try by hand
```

Node 20 or later. The SDK installs from its git repository at a pinned commit and builds itself on install.

Part of Monster-Orange/mo-narai#1285 (the Tool Platform). Rules for agents working here: `AGENTS.md`.
