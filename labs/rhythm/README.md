# rhythm

A rhythm tapper. The learner taps one cycle of rupak tāl: 7 beats, grouped 3 + 2 + 2. Wave, clap, clap. The tool
sends when each tap landed. Narai decides whether it was in time.

It's the course's *The rhythm tapper* module: practice beside answers.

**What it uses from the SDK**

- An answer, `tap_cycle`, and a practice activity, `free_tap`, both as tap times.
- Practice is batched once a minute, under the host's practice limit.
- `pickLocale` and `onLocale`: English and Japanese. Bols stay in Latin spelling in both.

Its payloads are labs' own for now. They move to Narai's rhythm payloads (`music.taps@1`, `music.cycle-preset@1`)
when Narai's rhythm judge ships.

**Run it**

```sh
pnpm --filter @narai-labs/rhythm dev cycle     # or practice
pnpm --filter @narai-labs/rhythm test
pnpm --filter @narai-labs/rhythm e2e
```
