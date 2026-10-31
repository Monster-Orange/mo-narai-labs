// The trainer's data: its presets, its keyboard and its answers, with no DOM.
import { describe, expect, it } from "vitest";
import { keys, modeOf, named, played, readKept, readPreset, state, toggle } from "../src/model.ts";
import { black, frequency, midi, pitchName } from "../src/theory.ts";

describe("theory", () => {
  it("reads pitches as MIDI numbers and back, and sounds A4 at 440 Hz", () => {
    expect(midi("C4")).toBe(60);
    expect(midi("C#4")).toBe(61);
    expect(midi("Db4")).toBeNull(); // the wire spells sharps
    expect(pitchName(57)).toBe("A3");
    expect(black(61)).toBe(true);
    expect(frequency(69)).toBe(440);
  });
});

describe("a preset", () => {
  it("is one note or two, each with its octave", () => {
    expect(readPreset({ schema: "music.interval-preset@1", notes: ["A3", "C#4"] })).toEqual({ schema: "music.interval-preset@1", notes: ["A3", "C#4"] });
    expect(readPreset({ schema: "music.interval-preset@1", notes: ["A"] })).toBeNull();
    expect(readPreset({ schema: "music.interval-preset@1", notes: [] })).toBeNull();
    expect(readPreset({ schema: "music.neck-preset@1", notes: ["A3"] })).toBeNull();
  });

  it("puts two octaves of keys from the C at or below its lowest note", () => {
    const k = keys({ schema: "music.interval-preset@1", notes: ["C#4", "A3"] });
    expect(k).toHaveLength(25);
    expect([k[0], k[24]].map((n) => pitchName(n ?? -1))).toEqual(["C3", "C5"]);
  });
});

describe("the answers", () => {
  it("name the interval, or play keys in the order played (a second tap takes one back)", () => {
    expect(named("M3")).toEqual({ schema: "music.interval-named@1", interval: "M3" });
    let picks = toggle([], 64, 900);
    picks = toggle(picks, 61, 300);
    picks = toggle(picks, 57, 1200);
    picks = toggle(picks, 57, 1500);
    expect(played(picks)).toEqual({ schema: "music.played@1", notes: [
      { pitch: 61, at_ms: 300 },
      { pitch: 64, at_ms: 900 },
    ] });
  });

  it("follow the task's item kind; a kind the manifest doesn't answer is none", () => {
    expect(modeOf("name_interval")).toBe("name");
    expect(modeOf("play_interval")).toBe("play");
    expect(modeOf(null)).toBe("free");
    expect(modeOf("play_target")).toBeNull();
  });
});

describe("what the trainer plays, and what it keeps", () => {
  const PRESET = { schema: "music.interval-preset@1" as const, notes: ["A3", "C#4"] };

  it("its state is the preset's notes and whether they sound: never the learner, never the interval", () => {
    expect(state(PRESET, true)).toEqual({ schema: "intervals.state@1", notes: ["A3", "C#4"], playing: true });
    expect(Object.keys(state(PRESET, false)).sort()).toEqual(["notes", "playing", "schema"]);
  });

  it("an answer begun comes back from storage whole; anything else is nothing begun", () => {
    const kept = { choice: "M3", picks: [{ pitch: 61, at_ms: 800 }] };
    expect(readKept(kept)).toEqual(kept);
    expect(readKept({ choice: "M9", picks: [{ pitch: "C#4", at_ms: 0 }, null] })).toEqual({ choice: null, picks: [] });
    expect(readKept(null)).toEqual({ choice: null, picks: [] });
    expect(readKept([1, 2])).toEqual({ choice: null, picks: [] });
  });
});
