# hello

The smallest tool Narai can host. One question, a few buttons. The pick is the answer.

It's the first example in the course, *Meet the SDK*: start to finish, it's every line a tool needs.

**What it uses from the SDK**

- `defineTool` on `narai-tool.json`: the manifest, checked as it loads.
- `connect`: the handshake with Narai's host. The start carries the learner's locale, the step's preset
  (`hello.options@1`, the buttons) and the task.
- `session.answer`: the pick, as `hello.choice@1`. No verdict in it. Narai decides.
- `session.ready`: the tool is up, in this language.

No commands, no state, no storage. Those start with the fretboard.

**Run it**

```sh
pnpm --filter @narai-labs/hello dev     # builds, then prints the harness's address
pnpm --filter @narai-labs/hello test    # the contract, over a real channel
pnpm --filter @narai-labs/hello e2e     # headless, through the harness
```
