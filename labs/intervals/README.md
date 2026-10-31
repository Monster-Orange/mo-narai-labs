# intervals

An interval trainer. It plays notes. The learner names the interval, or plays the note above on a keyboard.

Two item kinds, one tool. The played answer is the fretboard's own type, `music.played@1`, so one judge reads both
tools. That's the point of the course's *The interval trainer* module.

**What it uses from the SDK**

- Two answers, by the task's kind: `name_interval` in `music.interval-named@1`, `play_interval` in `music.played@1`.
- `audio_out`: the one capability it asks for. Sine tones through Web Audio, started on the learner's first press.
  No microphone, no network.
- A command: `replay`, from the Tutor.
- `pickLocale` and `onLocale`: English and Japanese.

**Run it**

```sh
pnpm --filter @narai-labs/intervals dev name   # or play, practice
pnpm --filter @narai-labs/intervals test
pnpm --filter @narai-labs/intervals e2e
```
