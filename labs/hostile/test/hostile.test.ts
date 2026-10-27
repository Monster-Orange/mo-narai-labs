// The hostile tool in CI (the Planner's slice 1; the study's Dogfood › The hostile tool): every attempt it makes is
// stopped, by the SDK before sending or by Narai's host after, and none reaches a handler. A new attempt in
// src/attempts.ts is tested here with nothing else to write.
import { afterEach, describe, expect, it } from "vitest";
import { launch } from "@michinarai/sdk/testing";
import { manifest } from "../src/manifest.ts";
import { ATTEMPTS, LAUNCH, TASK } from "../src/attempts.ts";

let close = () => {};
afterEach(() => close());

async function hostile(options: Parameters<typeof launch>[1] = {}) {
  const run = await launch(manifest, { launch: LAUNCH, locale: "en", task: { id: TASK, kind: "pick", assist: "none", prompt: "Pick one." }, ...options });
  close = run.close;
  return run;
}

describe("narai-labs/hostile", () => {
  for (const attempt of ATTEMPTS) {
    it(`${attempt.name}: ${attempt.expect}`, async () => {
      const h = await hostile();
      h.tool.ready("en");
      await h.settle();
      let thrown: unknown = null;
      try {
        attempt.run({ tool: h.tool, forge: h.forge, postToHost: (message) => h.postToHost(message), postToTool: (message, origin) => h.postToTool(message, { origin }) });
      } catch (e) { thrown = e; }
      await h.settle();
      expect(h.received.answers, "no answer reached Narai").toEqual([]);
      expect(h.received.practice, "no practice reached Narai").toEqual([]);
      if (attempt.expect === "thrown") {
        expect(thrown, "the SDK refused it before sending").toBeInstanceOf(Error);
        expect(h.received.refused).toEqual([]);
      } else if (attempt.expect === "refused") {
        expect(thrown).toBeNull();
        expect(h.received.refused.length, "Narai's host refused it").toBeGreaterThan(0);
      } else {
        expect(thrown).toBeNull();
        expect(h.received.refused).toEqual([]);
        expect(h.connects, "the host connected the tool once, and only once").toHaveLength(1);
        // the session it would have replaced still works
        h.tool.answer({ schema: "hostile.pick@1", choice: "B" });
        await h.settle();
        expect(h.received.answers).toHaveLength(1);
        h.received.answers.length = 0;
      }
    });
  }

  // Found by this tool (mo-narai-sdk#6, fixed in bab4816): a flood of practice reports is cut at the host's limit, 10 at
  // once and then 6 a minute; the rest are refused, never handled.
  // #region flood
  it("a flood of practice, 1,000 reports at once: the host takes its burst of 10 and refuses the rest", async () => {
    const h = await hostile({ now: () => 0 });
    h.tool.ready("en");
    for (let i = 0; i < 1000; i++) h.tool.practice("drill", { duration_s: 1, attempts: 1, payload: { schema: "hostile.drill@1", count: i } });
    await h.settle();
    expect(h.received.practice).toHaveLength(10);
    expect(h.received.refused).toHaveLength(990);
    expect(new Set(h.received.refused.map((r) => r.reason)).size).toBe(1);
  });
  // #endregion flood

  it("an answer before tool.ready: refused by the host", async () => {
    const h = await hostile();
    h.tool.answer({ schema: "hostile.pick@1", choice: "B" });
    await h.settle();
    expect(h.received.answers).toEqual([]);
    expect(h.received.refused.map((r) => r.reason)).toEqual(["tool.answer before tool.ready"]);
  });

  it("the honest answer, for contrast, gets through", async () => {
    const h = await hostile();
    h.tool.ready("en");
    h.tool.answer({ schema: "hostile.pick@1", choice: "B" });
    await h.settle();
    expect(h.received.refused).toEqual([]);
    expect(h.received.answers).toHaveLength(1);
  });
});
