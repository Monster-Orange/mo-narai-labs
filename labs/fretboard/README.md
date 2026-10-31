# fretboard

A guitar neck. Any number of strings, any tuning, a capo, left-handed or right. The step sets it up. The task, or the
Tutor, says what to show. The learner plays positions and sends them.

It's the course's running example: *The fretboard* module reads it file by file.

**What it uses from the SDK**

- Narai's music payloads, declared unchanged with `musicPayloads(...)`:
  - `music.neck-preset@1`: the step's neck (tuning, frets, capo, handedness, labels);
  - `music.played@1`: the answer, each note's pitch and time, plus its string and fret;
  - `music.neck-state@1`: what the neck shows, sent with `session.state` on every change.
- `task_payloads`: a judged task carries `music.notes@1`, the notes to show before the learner plays.
- Commands: `highlight` and `clear`, from the Tutor. Each one is answered. A highlight that names no note on the neck
  is refused with `CommandRefused`.
- `session.storage`: the learner's picks, kept for this launch. Reload the frame and they come back.
- `pickLocale` and `onLocale`: English and Japanese. Only the tool's own words change. Narai sends the prompt.

**Run it**

```sh
pnpm --filter @narai-labs/fretboard dev interval   # or note, scale, practice
pnpm --filter @narai-labs/fretboard test
pnpm --filter @narai-labs/fretboard e2e            # plays C#4, reloads the frame, finds the pick, sends it
```
