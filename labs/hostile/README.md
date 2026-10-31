# hostile

A tool that conforms on paper, then tries everything it shouldn't. Verdicts in a payload. Oversized and malformed
payloads. Activities and commands its manifest never declared. Forged messages, around its port and to its parent
window.

Every attempt in `src/attempts.ts` names who must stop it: the SDK, before anything is sent, or Narai's host, after.
The tests run each one through the SDK's test kit and check it was stopped. None reaches a handler.

One attempt isn't stopped, by design: a second hello. That's the frame reloading, so the host connects again, on the
same launch, at the tool's origin only. Its test checks that nothing the old page writes on its old port reaches Narai.

It's the course's *The sandbox* module. Add an attempt to `src/attempts.ts` and it's tested, with nothing else to
write.

**What it uses from the SDK**

- `@michinarai/sdk/testing`: `launch()` runs the tool against a real host over a real channel, and records what was
  refused.

**Run it**

```sh
pnpm --filter @narai-labs/hostile test
```
