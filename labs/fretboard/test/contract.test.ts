// The fretboard against the SDK, both sides: its manifest is one the SDK takes, its answers and the Tutor's commands
// cross a real channel, and what the manifest doesn't declare doesn't.
import { afterEach, describe, expect, it } from "vitest";
import { manifestProblems, type Command } from "@michinarai/sdk";
import { launch } from "@michinarai/sdk/testing";
import { manifest } from "../src/manifest.ts";
import { answer, toggle } from "../src/model.ts";

const TASK = { id: "itm_maj3_A", kind: "play_target", assist: "none" as const, prompt: "Play the note a major third above A3." };
const PRESET = { schema: "music.neck-preset@1", instrument: "guitar", tuning: "standard", frets: 12, show: { kind: "interval", root: "A3", interval: "M3" } };
let close = () => {};
afterEach(() => close());

describe("narai-labs/fretboard's manifest", () => {
  it("is one the SDK takes, with no problems", () => {
    expect(manifestProblems(manifest)).toEqual([]);
    expect(manifest.id).toBe("narai-labs/fretboard");
  });
});

describe("a launch", () => {
  it("starts with the preset and the task; the learner's answer reaches Narai as played, untouched", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard01", locale: "ja-JP", fallback: ["ja", "en"], preset: PRESET, task: TASK });
    close = run.close;
    expect(run.tool.start.preset).toEqual(PRESET);
    expect(run.tool.task).toEqual(TASK);
    run.tool.ready("ja");
    const played = answer(toggle([], { string: 2, fret: 2 }, 4120));
    run.tool.answer(played);
    await run.settle();
    expect(run.received.refused).toEqual([]);
    expect(run.received.answers).toHaveLength(1);
    expect(run.received.answers[0]).toMatchObject({ type: "tool.answer", task: TASK.id, payload: played });
  });

  it("music.played@2 takes any instrument's note: a guitar position, a key or none; never a verdict", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard03", locale: "en", preset: PRESET, task: TASK });
    close = run.close;
    run.tool.ready("en");
    const notes = [{ pitch: "A3", at_ms: 0, position: { string: 3, fret: 2 } }, { pitch: "C#4", at_ms: 600, position: { key: 61 } }, { pitch: "E4", at_ms: 1200 }];
    run.tool.answer({ schema: "music.played@2", notes });
    run.forge({ type: "tool.answer", v: 1, launch: "lch_fretboard03", task: TASK.id, payload: { schema: "music.played@2", notes: [{ pitch: "A3", at_ms: 0, position: { string: 3, key: 57 } }] } });
    await run.settle();
    expect(run.received.answers.map((a) => a.payload)).toEqual([{ schema: "music.played@2", notes }]);
    expect(run.received.refused).toHaveLength(1);
    expect(() => run.tool.answer({ schema: "music.played@2", notes, correct: true })).toThrow();
  });

  it("the Tutor's highlight and clear arrive; a command the manifest doesn't list is never sent", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard02", locale: "en", preset: PRESET });
    close = run.close;
    const got: Command[] = [];
    run.tool.onCommand("highlight", (_p, m) => got.push(m));
    run.tool.onCommand("clear", (_p, m) => got.push(m));
    run.host.command("highlight", { schema: "music.notes@1", notes: ["A3", "C#4"] });
    run.host.command("clear", { schema: "music.none@1" });
    expect(() => run.host.command("play", { schema: "music.notes@1", notes: ["A3"] })).toThrow();
    await run.settle();
    expect(got.map((m) => [m.command, m.payload])).toEqual([
      ["highlight", { schema: "music.notes@1", notes: ["A3", "C#4"] }],
      ["clear", { schema: "music.none@1" }],
    ]);
  });
});
