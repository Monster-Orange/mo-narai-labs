// The tapper's data: its cycle, its presets, its answers and its practice batches, with no DOM.
import { describe, expect, it } from "vitest";
import { MAX_TAPS, practiceBatch, readPreset, taps } from "../src/model.ts";
import { TALS, beatAt, vibhagStart } from "../src/theory.ts";

const rupak = TALS.rupak;

describe("rupak tāl", () => {
  it("is seven beats in 3 + 2 + 2, its sam a wave", () => {
    expect(rupak.bols).toHaveLength(rupak.beats);
    expect(rupak.vibhags.reduce((a: number, b: number) => a + b, 0)).toBe(7);
    expect([0, 1, 2, 3, 4, 5, 6].map((b) => vibhagStart(b, rupak))).toEqual([0, null, null, 1, null, 2, null]);
    expect(rupak.hands[0]).toBe("wave");
  });

  it("walks its beats at the tempo, and comes round", () => {
    expect([0, 749, 750, 4500, 5250].map((ms) => beatAt(ms, 80, rupak))).toEqual([0, 0, 1, 6, 0]);
  });
});

describe("a preset and an answer", () => {
  it("is a known tāl at 40 to 160 beats a minute", () => {
    expect(readPreset({ schema: "music.tal-preset@1", tal: "rupak", tempo_bpm: 80 })).toEqual({ schema: "music.tal-preset@1", tal: "rupak", tempo_bpm: 80 });
    expect(readPreset({ schema: "music.tal-preset@1", tal: "tintal", tempo_bpm: 80 })).toBeNull();
    expect(readPreset({ schema: "music.tal-preset@1", tal: "rupak", tempo_bpm: 300 })).toBeNull();
  });

  it("sends the taps in order, and nothing else", () => {
    expect(taps([750, 0, 1500])).toEqual({ schema: "music.taps@1", taps: [0, 750, 1500] });
  });
});

describe("practice, batched", () => {
  it("reports at most once a minute from the first tap, and at once when the page goes away", () => {
    const b = practiceBatch(7);
    for (let i = 0; i < 14; i++) b.tap(1000 + i * 750);
    expect(b.take(30_000)).toBeNull();
    const first = b.take(61_000);
    expect(first).toEqual({ duration_s: 60, attempts: 2, payload: { schema: "music.taps@1", taps: Array.from({ length: 14 }, (_, i) => 1000 + i * 750) } });
    b.tap(62_000);
    expect(b.take(70_000)).toBeNull();
    expect(b.take(70_000, true)).toMatchObject({ attempts: 1, payload: { taps: [62_000] } });
    expect(b.take(200_000, true)).toBeNull(); // nothing pending
  });

  it("never puts more than the type allows in one report", () => {
    const b = practiceBatch(7);
    for (let i = 0; i < MAX_TAPS + 10; i++) b.tap(i * 10);
    expect(b.take(61_000, true)?.payload.taps).toHaveLength(MAX_TAPS);
    expect(b.take(62_000, true)?.payload.taps).toHaveLength(10);
  });
});
