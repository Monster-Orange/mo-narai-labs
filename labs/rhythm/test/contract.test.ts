// The tapper against the SDK, both sides: its manifest is one the SDK takes, its answer and its practice cross a real
// channel, and the host's practice limit holds: a tool that reports every tap is refused past the burst, while one
// batch a minute never is.
import { afterEach, describe, expect, it } from "vitest";
import { manifestProblems } from "@michinarai/sdk";
import { launch } from "@michinarai/sdk/testing";
import { manifest } from "../src/manifest.ts";
import { LOCALES } from "../src/words.ts";
import { practiceBatch, taps } from "../src/model.ts";

const PRESET = { schema: "music.tal-preset@1", tal: "rupak", tempo_bpm: 80 };
const TASK = { id: "itm_rupak_80", kind: "tap_cycle", assist: "none" as const, prompt: "Tap one cycle of rupak tāl at 80 beats a minute, starting on sam." };
let close = () => {};
afterEach(() => close());

describe("narai-labs/rhythm's manifest", () => {
  it("names the languages the tool has, its default first, as its words do (the SDK picks among them)", () => {
    expect(manifest.locales).toEqual([...LOCALES]);
  });

  it("is one the SDK takes, with no problems, and asks for no capability", () => {
    expect(manifestProblems(manifest)).toEqual([]);
    expect(manifest.capabilities).toEqual({ audio_out: false, microphone: false, network: "none" });
    expect(manifest.practice).toEqual({ free_tap: "music.taps@1" });
  });
});

describe("a launch", () => {
  it("takes the taps as the task's answer, untouched; never a verdict", async () => {
    const run = await launch(manifest, { launch: "lch_rhythm01", locale: "en", preset: PRESET, task: TASK });
    close = run.close;
    run.tool.ready("en");
    const answer = taps([0, 750, 1500, 2250, 3000, 3750, 4500]);
    expect(() => run.tool.answer({ ...answer, on_beat: true, score: 1 })).toThrow();
    run.tool.answer(answer);
    await run.settle();
    expect(run.received.refused).toEqual([]);
    expect(run.received.answers.map((a) => a.payload)).toEqual([answer]);
  });

  it("free play: a report for every tap is refused past the host's burst; a batch a minute never is", async () => {
    let clock = 0;
    const run = await launch(manifest, { launch: "lch_rhythm02", locale: "en", preset: PRESET, practiceLimit: { burst: 10, perMinute: 6 }, now: () => clock });
    close = run.close;
    run.tool.ready("en");
    for (let i = 0; i < 12; i++) run.tool.practice("free_tap", { duration_s: 1, attempts: 1, payload: taps([i * 750]) });
    await run.settle();
    expect(run.received.practice).toHaveLength(10);
    expect(run.received.refused.length).toBeGreaterThan(0);

    const batched = await launch(manifest, { launch: "lch_rhythm03", locale: "en", preset: PRESET, practiceLimit: { burst: 10, perMinute: 6 }, now: () => clock });
    close = () => { run.close(); batched.close(); };
    batched.tool.ready("en");
    const b = practiceBatch(7);
    for (let minute = 0; minute < 20; minute++) {
      for (let i = 0; i < 80; i++) b.tap(minute * 60_000 + i * 750);
      clock = (minute + 1) * 60_000;
      const r = b.take(clock);
      if (r) batched.tool.practice("free_tap", r);
      await batched.settle(); // the host reads its clock as each report arrives
    }
    expect(batched.received.refused).toEqual([]);
    expect(batched.received.practice).toHaveLength(20);
  });
});
