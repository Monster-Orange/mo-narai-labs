// The tapper's data: its cycle, its presets, its answers and its practice batches, with no DOM.
import { describe, expect, it } from "vitest";
import { MAX_TAPS, practiceBatch, readPreset, taps } from "../src/model.ts";
import { RUPAK as rupak, beatAt, groupStart } from "../src/theory.ts";

const PRESET = { schema: "music.cycle-preset@1", system: "tala", name: "rupak", ...rupak, tempo_bpm: 80 };

describe("rupak tāl", () => {
  it("is seven beats in 3 + 2 + 2, its sam a wave", () => {
    expect(rupak.syllables).toHaveLength(rupak.beats);
    expect(rupak.groups.reduce((a: number, b: number) => a + b, 0)).toBe(7);
    expect([0, 1, 2, 3, 4, 5, 6].map((b) => groupStart(b, rupak))).toEqual([0, null, null, 1, null, 2, null]);
    expect(rupak.hands?.[0]).toBe("wave");
  });

  it("walks its beats at the tempo, and comes round", () => {
    expect([0, 749, 750, 4500, 5250].map((ms) => beatAt(ms, 80, rupak))).toEqual([0, 0, 1, 6, 0]);
  });
});

describe("a preset and an answer", () => {
  it("is Narai's cycle, its defaults filled in; a meter needs no hands or syllables", () => {
    expect(readPreset(PRESET)).toEqual({ ...PRESET, subdivision: 1, count_in_beats: 0, cycles: 1 });
    expect(readPreset({ schema: "music.cycle-preset@1", system: "meter", name: "3/4", beats: 3, groups: [3], tempo_bpm: 90 }))
      .toMatchObject({ beats: 3, hands: null, syllables: null });
  });

  it("holds Narai's rules across fields, which its JSON Schema can't say", () => {
    expect(readPreset({ ...PRESET, groups: [3, 2, 3] })).toBeNull(); // the groups sum to the beats
    expect(readPreset({ ...PRESET, hands: ["wave", "clap"] })).toBeNull(); // a hand per group
    expect(readPreset({ ...PRESET, syllables: ["Tin"] })).toBeNull(); // a syllable per beat
    expect(readPreset({ ...PRESET, tempo_bpm: 500 })).toBeNull();
    expect(readPreset({ schema: "music.tal-preset@1", tal: "rupak", tempo_bpm: 80 })).toBeNull(); // the old preset
  });

  it("sends the taps in order with how they were tapped, and nothing else", () => {
    expect(taps([750, 0, 1500])).toEqual({ schema: "music.taps@1", taps: [{ at_ms: 0 }, { at_ms: 750 }, { at_ms: 1500 }], source: "touch" });
    expect(taps([0, 750], ["key", "key"]).source).toBe("key");
    expect(taps([0, 750], ["key", "touch"]).source).toBe("touch");
  });
});

describe("practice, batched", () => {
  it("reports at most once a minute from the first tap, and at once when the page goes away", () => {
    const b = practiceBatch(7);
    for (let i = 0; i < 14; i++) b.tap(1000 + i * 750);
    expect(b.take(30_000)).toBeNull();
    const first = b.take(61_000);
    expect(first).toEqual({ duration_s: 60, attempts: 2, payload: { schema: "music.taps@1", source: "touch", taps: Array.from({ length: 14 }, (_, i) => ({ at_ms: 1000 + i * 750 })) } });
    b.tap(62_000, "key");
    expect(b.take(70_000)).toBeNull();
    expect(b.take(70_000, true)).toMatchObject({ attempts: 1, payload: { taps: [{ at_ms: 62_000 }], source: "key" } });
    expect(b.take(200_000, true)).toBeNull(); // nothing pending
  });

  it("never puts more than the type allows in one report", () => {
    const b = practiceBatch(7);
    for (let i = 0; i < MAX_TAPS + 10; i++) b.tap(i * 10);
    expect(b.take(61_000, true)?.payload.taps).toHaveLength(MAX_TAPS);
    expect(b.take(62_000, true)?.payload.taps).toHaveLength(10);
  });
});
