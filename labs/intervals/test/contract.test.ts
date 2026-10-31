// The trainer against the SDK, both sides: its manifest is one the SDK takes, both its answers cross a real channel,
// its played answer is the fretboard's own type, and what the manifest doesn't declare doesn't cross.
import { afterEach, describe, expect, it } from "vitest";
import { manifestProblems, musicPayloads } from "@michinarai/sdk";
import { launch } from "@michinarai/sdk/testing";
import { manifest } from "../src/manifest.ts";
import { LOCALES } from "../src/words.ts";
import { named, played, state, toggle } from "../src/model.ts";
import fretboard from "../../fretboard/narai-tool.json";

const PRESET = { schema: "music.interval-preset@1" as const, notes: ["A3", "C#4"] };
const NAME = { id: "itm_name_M3", kind: "name_interval", assist: "none" as const, prompt: "Listen, then name the interval." };
const PLAY = { id: "itm_play_M3", kind: "play_interval", assist: "none" as const, prompt: "Play the note a major third above A3." };
let close = () => {};
afterEach(() => close());

describe("narai-labs/intervals' manifest", () => {
  it("names the languages the tool has, its default first, as its words do (the SDK picks among them)", () => {
    expect(manifest.locales).toEqual([...LOCALES]);
  });

  it("is one the SDK takes, with no problems, and asks to play sound and nothing else", () => {
    expect(manifestProblems(manifest)).toEqual([]);
    expect(manifest.capabilities).toEqual({ audio_out: true, microphone: false, network: "none" });
  });

  it("answers a played interval in Narai's music.played@1, declared unchanged, as the fretboard does: one judge, two tools", () => {
    expect(manifest.answers?.play_interval).toBe("music.played@1");
    expect(manifest.payloads?.["music.played@1"]).toEqual(musicPayloads("music.played@1")["music.played@1"]);
    expect(manifest.payloads?.["music.played@1"]).toEqual(fretboard.payloads["music.played@1"]);
  });
});

describe("a launch", () => {
  it("takes a named interval and a played one, untouched; never a verdict", async () => {
    for (const [task, answer] of [[NAME, named("M3")], [PLAY, played(toggle([], 61, 800))]] as const) {
      const run = await launch(manifest, { launch: `lch_${task.id}`, locale: "en", preset: PRESET, task });
      close = run.close;
      run.tool.ready("en");
      run.tool.answer(answer);
      expect(() => run.tool.answer({ ...answer, correct: true })).toThrow();
      await run.settle();
      expect(run.received.refused).toEqual([]);
      expect(run.received.answers.map((a) => a.payload)).toEqual([answer]);
      run.close();
    }
  });

  it("the Tutor's replay arrives; a command the manifest doesn't list is never sent", async () => {
    const run = await launch(manifest, { launch: "lch_intervals02", locale: "en", preset: PRESET });
    close = run.close;
    const got: string[] = [];
    run.tool.onCommand("replay", (_p, m) => { got.push(m.command); });
    run.host.command("replay", { schema: "music.none@1" });
    expect(() => run.host.command("highlight", { schema: "music.notes@1", notes: ["A3"] })).toThrow();
    await run.settle();
    expect(got).toEqual(["replay"]);
  });

  it("its state goes to Narai as it starts and stops sounding, and Narai can ask for it; the learner's keys are no state", async () => {
    const run = await launch(manifest, { launch: "lch_intervals03", locale: "en", preset: PRESET });
    close = run.close;
    run.tool.ready("en");
    run.tool.state(state(PRESET, true));
    run.tool.state(state(PRESET, false));
    await run.settle();
    expect(run.received.states.map((s) => s.payload)).toEqual([state(PRESET, true), state(PRESET, false)]);
    expect(await run.host.requestState()).toEqual(state(PRESET, false));
    const before = run.received.states.length;
    run.tool.state({ ...state(PRESET, false), picks: [61] });
    await run.settle();
    expect(run.received.states).toHaveLength(before); // refused at the host: the schema has no room for them
    expect(run.received.refused.map((r) => r.reason)).toEqual(["music.interval-state@1: (root) must NOT have additional properties (picks)"]);
  });

  it("an answer begun is this launch's own: kept in its storage, and still there when the reloaded tool reconnects", async () => {
    const run = await launch(manifest, { launch: "lch_intervals04", locale: "en", preset: PRESET, task: NAME });
    close = run.close;
    run.tool.ready("en");
    const kept = { choice: "M3", picks: [] };
    expect(await run.tool.storage.set("answer", kept)).toEqual({ ok: true });
    const again = await run.reconnect();
    again.ready("en");
    expect(await again.storage.get("answer")).toEqual({ ok: true, value: kept });
  });
});
