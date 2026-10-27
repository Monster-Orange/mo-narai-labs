// The hello tool against Narai's host, through the SDK's kit: its manifest is one the SDK takes, a pick crosses as the
// task's answer, and what its manifest doesn't allow doesn't.
import { afterEach, describe, expect, it } from "vitest";
import { defineTool, manifestProblems } from "@michinarai/sdk";
import { launch } from "@michinarai/sdk/testing";
import manifestJson from "../narai-tool.json";

const manifest = defineTool(manifestJson);
const PRESET = { schema: "hello.options@1", options: ["A", "B", "C"] };
const TASK = { id: "itm_hello", kind: "pick", assist: "none" as const, prompt: "Which letter comes after A?" };
let close = () => {};
afterEach(() => close());

async function started() {
  const run = await launch(manifest, { launch: "lch_hello00001", locale: "en", preset: PRESET, task: TASK });
  close = run.close;
  run.tool.ready("en");
  return run;
}

describe("narai-labs/hello", () => {
  it("has a manifest the SDK takes, with no problems", () => {
    expect(manifestProblems(manifest)).toEqual([]);
  });

  it("starts with the preset and the task; a pick reaches Narai as the answer, untouched", async () => {
    // #region kit
    const run = await started();
    expect(run.tool.start.preset).toEqual(PRESET);
    run.tool.answer({ schema: "hello.choice@1", choice: "B" });
    await run.settle();
    expect(run.received.refused).toEqual([]);
    expect(run.received.answers.map((a) => [a.task, a.payload])).toEqual([["itm_hello", { schema: "hello.choice@1", choice: "B" }]]);
    // #endregion kit
  });

  it("an answer that says whether it was right never leaves the tool", async () => {
    const run = await started();
    expect(() => run.tool.answer({ schema: "hello.choice@1", choice: "B", correct: true })).toThrow();
    await run.settle();
    expect(run.received.answers).toEqual([]);
  });

  it("a pick the schema doesn't allow is refused by Narai's host", async () => {
    const run = await started();
    run.tool.answer({ schema: "hello.choice@1", choice: "B", note: "extra" });
    await run.settle();
    expect(run.received.answers).toEqual([]);
    expect(run.received.refused.length).toBeGreaterThan(0);
  });
});
