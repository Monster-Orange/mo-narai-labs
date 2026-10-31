# fretboard

A guitar neck. Any number of strings, any tuning, a capo, left-handed or right. The step sets it up. The task, or the
Tutor, says what to show. The learner plays positions and sends them. Each tap plucks its string.

On a step that grants the microphone, the learner can play their own guitar instead. The tool hears each note
(`src/pitch.ts`: its pitch, held for a few frames) and adds it to the answer: pitch and time, no string or fret,
because a guitar plays one pitch in several places. Only notes leave the tool, never audio.

It's the course's running example: *The fretboard* module reads it file by file.

**What it uses from the SDK**

- Narai's music payloads, declared unchanged with `musicPayloads(...)`:
  - `music.neck-preset@1`: the step's neck (tuning, frets, capo, handedness, labels);
  - `music.played@1`: the answer, each note's pitch and time, plus its string and fret;
  - `music.neck-state@1`: what the neck shows, sent with `session.state` on every change.
- Two judged kinds, both answered in `music.played@1`: `play_target` (a note or notes to find) and Narai's
  `play_passage` (a passage to play; Narai judges its notes in order, at any pace).
- `task_payloads`: a judged task carries Narai's `music.notes@1`, what to show before the learner plays: pitches
  where they sound (MIDI) or pitch classes anywhere (C is 0). The Tutor's `highlight` takes the same.
- Commands: `highlight` and `clear`, from the Tutor. Each one is answered. A highlight that names no note on the neck
  is refused with `CommandRefused`.
- `session.storage`: the learner's picks, kept for this launch. Reload the frame and they come back.
- `pickLocale` and `onLocale`: English and Japanese. Only the tool's own words change. Narai sends the prompt.
- `capabilities`: `audio_out` for the pluck, `microphone` for Listen. Narai frames the tool with the microphone only on a
  step that grants it, and the start says so (`granted`). No grant, no Listen button. The SDK doesn't carry
  `granted` yet ([`FINDINGS.md`](../../FINDINGS.md) #10), so for now the button never shows.
- `latency_ms` on `music.played@1`: how late the tool hears, sent with any answer that has heard notes.

**Run it**

```sh
pnpm --filter @narai-labs/fretboard dev interval   # or note, scale, practice
pnpm --filter @narai-labs/fretboard test
pnpm --filter @narai-labs/fretboard e2e            # plays C#4, reloads the frame, finds the pick, sends it
```
