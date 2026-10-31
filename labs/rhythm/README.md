# rhythm

A rhythm tapper. The learner taps one cycle of rupak tāl: 7 beats, grouped 3 + 2 + 2. Wave, clap, clap. The tool
sends when each tap landed. Narai decides whether it was in time.

It's the course's *The rhythm tapper* module: practice beside answers.

**What it uses from the SDK**

- Narai's rhythm payloads, declared exactly as Narai's schema writes them:
  - `music.cycle-preset@1`: the step's cycle (its beats in groups, a hand per group, a bol per beat), its tempo and
    its count-in;
  - `music.taps@1`: each tap's time, from the first beat after the count-in, and how it was tapped (touch or key).
- An answer, `tap_cycle`, and a practice activity, `free_tap`, both in `music.taps@1`.
- Practice is batched once a minute, under the host's practice limit.
- `pickLocale` and `onLocale`: English and Japanese. Bols stay in Latin spelling in both.

**Run it**

```sh
pnpm --filter @narai-labs/rhythm dev cycle     # or practice
pnpm --filter @narai-labs/rhythm test
pnpm --filter @narai-labs/rhythm e2e
```
