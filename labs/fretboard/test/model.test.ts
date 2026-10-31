import { describe, expect, it } from "vitest";
import { VERDICT_KEYS } from "@michinarai/sdk";
import { answer, heard, highlighted, readPicks, state, toggle, type Preset } from "../src/model.ts";
import { STANDARD } from "../src/theory.ts";

const PRESET: Preset = { schema: "music.neck-preset@1", tuning: [...STANDARD], frets: 12, capo: null, handed: "right", labels: "notes" };
const keys = (v: unknown): string[] => (v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...keys(x)]) : []);
const at = (p: Preset, notes: string[]) => (highlighted(p, notes) ?? []).map((m) => [m.position.string, m.position.fret, m.label]);

describe("what the neck shows: highlights", () => {
  it("an exact pitch where it sounds, a pitch class everywhere; labelled as the preset asks", () => {
    expect(at(PRESET, ["C#4"])).toEqual([[2, 2, "C#"], [3, 6, "C#"], [4, 11, "C#"]]);
    expect(new Set(at(PRESET, ["A"]).map(([s]) => s)).size).toBe(6);
    expect(highlighted(PRESET, [])).toEqual([]);
  });

  it("intervals and degrees count from the first note, the root; none says nothing", () => {
    expect(at({ ...PRESET, labels: "intervals" }, ["A3", "C#4"]).filter(([, , l]) => l !== "P1")[0]?.[2]).toBe("M3");
    expect(new Set(at({ ...PRESET, labels: "degrees" }, ["A", "C", "E"]).map(([, , l]) => l))).toEqual(new Set(["1", "b3", "5"]));
    expect(at({ ...PRESET, labels: "none" }, ["A"]).every(([, , l]) => l === null)).toBe(true);
  });

  it("a capo: nothing below it, its fret the open string", () => {
    const capo3 = { ...PRESET, capo: 3 };
    expect(at(capo3, ["G4"]).map(([s, f]) => [s, f])).toEqual([[1, 3], [2, 8], [3, 12]]);
    expect(at(capo3, ["E"]).every(([, f]) => (f as number) >= 3)).toBe(true);
  });

  it("refuses what isn't a note, or isn't on this neck, so a command can say so", () => {
    expect(highlighted(PRESET, ["H"])).toBeNull();
    expect(highlighted(PRESET, ["A", "C8"])).toBeNull();
    expect(highlighted(PRESET, ["E1"])).toBeNull();
  });

  it("the state: the neck's setup and its highlights, never the learner", () => {
    const s = state(PRESET, highlighted(PRESET, ["C#4"]) ?? []);
    const { schema: _, ...neck } = PRESET;
    expect(s).toEqual({ schema: "music.neck-state@1", preset: neck, playing: false,
      highlighted: [{ string: 2, fret: 2, label: "C#" }, { string: 3, fret: 6, label: "C#" }, { string: 4, fret: 11, label: "C#" }] });
  });
});

describe("the learner's answer", () => {
  it("the picks toggle, and the answer is what was played (MIDI), in order, with no verdict at any depth", () => {
    let picks = toggle(PRESET, [], { string: 2, fret: 2 }, 900);
    picks = toggle(PRESET, picks, { string: 1, fret: 5 }, 400);
    picks = toggle(PRESET, picks, { string: 1, fret: 5 }, 1200); // taken back
    picks = toggle(PRESET, picks, { string: 3, fret: 2 }, 300);
    const a = answer(picks);
    expect(a).toEqual({ schema: "music.played@1", notes: [
      { pitch: 57, at_ms: 300, string: 3, fret: 2 },
      { pitch: 61, at_ms: 900, string: 2, fret: 2 },
    ] });
    expect(keys(a).filter((k) => VERDICT_KEYS.has(k))).toEqual([]);
  });

  it("a note the microphone heard joins in time order, with no place; a tap never takes it back; latency rides with it", () => {
    let picks = toggle(PRESET, [], { string: 2, fret: 2 }, 900);
    picks = heard(picks, 57, 400);
    picks = toggle(PRESET, picks, { string: 3, fret: 2 }, 1300); // A3 tapped: the heard A3 stays
    expect(answer(picks, 35)).toEqual({ schema: "music.played@1", latency_ms: 35, notes: [
      { pitch: 57, at_ms: 400 },
      { pitch: 61, at_ms: 900, string: 2, fret: 2 },
      { pitch: 57, at_ms: 1300, string: 3, fret: 2 },
    ] });
    expect(answer(toggle(PRESET, [], { string: 2, fret: 2 }, 900), 35)).not.toHaveProperty("latency_ms"); // taps alone: none
  });

  it("picks back from storage: only whole ones", () => {
    const kept = [{ pitch: 61, at_ms: 900, string: 2, fret: 2 }, { pitch: 57, at_ms: 1000 }];
    expect(readPicks(kept)).toEqual(kept);
    expect(readPicks([{ pitch: 61, at_ms: 900, string: 2 }])).toEqual([]); // half a place is none
    expect(readPicks([{ pitch: "C#4", at_ms: 0, string: 2, fret: 2 }, null, 3])).toEqual([]);
    expect(readPicks({ not: "picks" })).toEqual([]);
  });
});
