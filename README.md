# Narai Labs

Tools Narai builds for its own lessons. Built on the public [`@michinarai/sdk`](https://www.npmjs.com/package/@michinarai/sdk)
and nothing else, the way anyone would build one.

A tool is a small web app. Narai frames it in a lesson, sandboxed, on its own origin. It shows the learner an
instrument and reports what the learner did. It never grades. Narai keeps the answer keys and runs every judge.

If a tool here needs something the SDK doesn't give, that's a finding. It goes in [`FINDINGS.md`](FINDINGS.md) and
upstream to the SDK. No shortcuts around it.

## The tools

| Tool | What it is |
| --- | --- |
| [`labs/hello`](labs/hello) | The smallest tool. One question, a few buttons, the pick is the answer. |
| [`labs/fretboard`](labs/fretboard) | A guitar neck. The step sets it up, the task or the Tutor says what to show, the learner plays. |
| [`labs/intervals`](labs/intervals) | An interval trainer. It plays notes; the learner names the interval or plays the note above. |
| [`labs/rhythm`](labs/rhythm) | A rhythm tapper. The learner taps one cycle of rupak tāl (7 beats, 3 + 2 + 2). |
| [`labs/hostile`](labs/hostile) | A tool that tries everything it shouldn't. Its tests prove each attempt is stopped. |

Each folder has its own README: what it shows, which SDK features it uses, how to run it.

## The course

Narai's course for tool developers, *Build a tool for Narai*, is built from this repository. Its slides quote the code
here, at a pinned commit, by `#region` block. So the code in the course is the code that runs.

| Module | Tool |
| --- | --- |
| Meet the SDK | `labs/hello` |
| The fretboard | `labs/fretboard` |
| The interval trainer | `labs/intervals` |
| The rhythm tapper | `labs/rhythm` |
| The sandbox | `labs/hostile` |

A `#region` block is quoted whole. Keep each one short. Don't split or rename one without changing the course.

## Run it

```sh
corepack enable          # pnpm, at the version package.json pins
pnpm install
make preflight           # check-imports, lint, typecheck, tests, build
make e2e                 # each tool, headless, through the SDK's harness
```

Node 20 or later. Every tool names the same exact SDK version from npm. `pnpm check:imports` fails anything else.

## Try a tool by hand

The SDK ships a harness: a stand-in for Narai's host. It serves the host page on `http://localhost` and the tool on
`http://127.0.0.1`, in a sandboxed frame, so the two are different origins, as they are in Narai. It prints both
addresses and opens nothing.

```sh
pnpm --filter @narai-labs/fretboard dev interval     # or note, scale, practice
```

Open the host's address. Every message between host and tool is checked against the tool's manifest, both ways, and
the harness records each one. A tool's `e2e.mjs` drives the same harness headless and asserts what crossed.

## Narai's music payloads

Every `music.*` name is Narai's: the neck's (`music.neck-preset@1`, `music.neck-state@1`), the notes to show
(`music.notes@1`), the interval trainer's (`music.interval-preset@1`, `music.interval-named@1`), the rhythm's
(`music.cycle-preset@1`, `music.taps@1`), `music.played@1` and `music.none@1`. A tool declares each one exactly as
Narai's schema writes it; Narai's registry refuses a variant. A payload only one tool reads takes that tool's own
name (`intervals.state@1`), never `music.*`. Pitches cross as MIDI numbers (A3 is 57), pitch classes as 0 to 11
(C is 0).

`music.played@1` carries each note's MIDI pitch and `at_ms`, and for a guitar its `string` and `fret`. No keyboard
position, by design: a key has exactly one pitch, so the pitch is the key (key 61 is C#4). String and fret exist
because a guitar plays one pitch in several places. A judge reads `pitch` and `at_ms` either way.

## License

Apache-2.0, as the SDK. See [`LICENSE`](LICENSE).

Working here as an agent: read [`AGENTS.md`](AGENTS.md) first.
