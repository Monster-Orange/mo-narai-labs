// The hostile tool in CI (the Planner's slice 1; the study's Dogfood › The hostile tool): every attempt it makes is
// stopped, by the SDK before sending or by Narai's host after, and none reaches a handler. A new attempt in
// src/attempts.ts is tested here with nothing else to write.
import { afterEach, describe, expect, it } from "vitest";
import type { Answer, Practice } from "@narai/sdk";
import { manifest } from "../src/manifest.ts";
import { ATTEMPTS } from "../src/attempts.ts";
import { launch, tick } from "./wire.ts";

const TASK = { id: "itm_hostile", kind: "pick", assist: "none" as const, prompt: "Pick one." };
let close = () => {};
afterEach(() => close());

async function hostile() {
  const got = { answers: [] as Answer[], practice: [] as Practice[], refused: [] as { reason: string }[] };
  const run = await launch(manifest, { launch: "lch_hostile0001", locale: "en", task: TASK,
    onAnswer: (a) => got.answers.push(a), onPractice: (p) => got.practice.push(p), onRefused: (r) => got.refused.push(r) });
  close = run.close;
  // what the hostile tool posts to its parent, around the SDK, reaches the host's window as from its frame
  const forged: unknown[] = [];
  const parent = { postMessage: (message: unknown, origin: string) => { forged.push(message); run.parent.postMessage(message, origin); } };
  return { ...run, got, parent, forged };
}

describe("narai-labs/hostile", () => {
  for (const attempt of ATTEMPTS) {
    it(`${attempt.name}: ${attempt.expect}`, async () => {
      const h = await hostile();
      h.tool.ready("en");
      await tick();
      let thrown: unknown = null;
      try { attempt.run({ tool: h.tool, parent: h.parent }); } catch (e) { thrown = e; }
      await tick();
      expect(h.got.answers, "no answer reached Narai").toEqual([]);
      expect(h.got.practice, "no practice reached Narai").toEqual([]);
      if (attempt.expect === "thrown") {
        expect(thrown, "the SDK refused it before sending").toBeInstanceOf(Error);
        expect(h.got.refused).toEqual([]);
      } else if (attempt.expect === "refused") {
        expect(thrown).toBeNull();
        expect(h.got.refused.length, "Narai's host refused it").toBeGreaterThan(0);
      } else {
        expect(thrown).toBeNull();
        expect(h.forged.length, "it was posted").toBeGreaterThan(0);
      }
    });
  }

  // A gap the hostile tool found: the host takes all 1,000 (mo-narai-sdk#6). `fails` until a limit lands; then it turns
  // red here, and becomes an `it`.
  it.fails("a flood of practice, 1,000 reports at once: the host takes no more than its limit (mo-narai-sdk#6)", async () => {
    const h = await hostile();
    h.tool.ready("en");
    for (let i = 0; i < 1000; i++) h.tool.practice("drill", { duration_s: 1, attempts: 1, payload: { schema: "hostile.drill@1", count: i } });
    await tick();
    expect(h.got.practice.length).toBeLessThan(1000);
  });

  it("an answer before tool.ready: refused by the host", async () => {
    const h = await hostile();
    h.tool.answer({ schema: "hostile.pick@1", choice: "B" });
    await tick();
    expect(h.got.answers).toEqual([]);
    expect(h.got.refused.map((r) => r.reason)).toEqual(["tool.answer before tool.ready"]);
  });

  it("the honest answer, for contrast, gets through", async () => {
    const h = await hostile();
    h.tool.ready("en");
    h.tool.answer({ schema: "hostile.pick@1", choice: "B" });
    await tick();
    expect(h.got.refused).toEqual([]);
    expect(h.got.answers).toHaveLength(1);
  });
});
