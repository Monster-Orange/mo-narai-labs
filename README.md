# Narai Labs

Tools Narai builds for its own lessons, built **only on the public `@michinarai/sdk`**, the way any publisher would build
one. If a tool here needs something the SDK doesn't give, that is a finding (see `FINDINGS.md`), not a shortcut.

| Tool | What it is |
| --- | --- |
| [`labs/hello`](labs/hello) | The smallest tool: one question, a few buttons, and the pick is the answer. The course's first sample (its `#region` blocks are quoted there, so keep them whole). |
| [`labs/fretboard`](labs/fretboard) | A guitar neck, on Narai's own music payloads, declared unchanged (0.3.0): the step sets the neck up (`music.neck-preset@1`: tuning, frets, capo, handedness, labels), the task's payload or the Tutor's `highlight` says what it shows, and it reports that as its state (`music.neck-state@1`). The learner picks positions and sends what they played (`music.played@1`); the picks are kept in the launch's storage. Each Tutor command is answered: an ack, or a refusal for notes not on the neck. The stand-in neck a partner reviews (D11). |
| [`labs/intervals`](labs/intervals) | An interval trainer: it plays two notes for the learner to name (`music.interval-named@1`), or one to play the interval above on a keyboard (Narai's `music.played@1`, as the fretboard: one judge, two tools). The first labs tool to ask for a capability (`audio_out`). The Tutor can `replay`. |
| [`labs/rhythm`](labs/rhythm) | A rhythm tapper: the learner taps a cycle of rupak tāl (7 beats, 3 + 2 + 2) and sends when they tapped (`music.taps@1`). Free play goes to Narai as practice, batched once a minute under the host's limit. |
| [`labs/hostile`](labs/hostile) | A tool that conforms on paper and then tries everything it shouldn't: verdicts, oversized and malformed payloads, undeclared activities and commands, forged messages. Its tests prove each attempt is stopped. |

## Run it

```sh
corepack enable          # pnpm, at the version package.json pins
pnpm install
make preflight           # check-imports, lint, typecheck, tests, build
make e2e                 # each tool, headless, through the SDK's harness
pnpm dev                 # the fretboard in the SDK's harness, to try by hand
```

Node 20 or later. The SDK installs from npm, at the one exact version every tool names.

## Narai's music payloads

`music.played@1`, `music.neck-preset@1`, `music.neck-state@1` and `music.tab-practice@1` are Narai's: a tool declares them
unchanged, from the SDK's `musicPayloads(...)`, and the registry refuses a variant. Other `music.*` names here are labs'
own.

`music.played@1` carries a note's MIDI pitch, `at_ms`, and for a guitar its `string` and `fret`. It has no keyboard
position, by design: a key has exactly one pitch, so the pitch is the key (key 61 is C#4). String and fret exist only
because a guitar plays one pitch in several places. A judge reads `pitch` and `at_ms` either way. A position the pitch
can't give would come as a new optional field in a later `music.played`, never as a tool's own variant.

Part of Monster-Orange/mo-narai#1285 (the Tool Platform). Rules for agents working here: `AGENTS.md`.
