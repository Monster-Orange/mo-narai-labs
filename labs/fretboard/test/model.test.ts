import { describe, expect, it } from "vitest";
import { VERDICT_KEYS } from "@michinarai/sdk";
import { answer, highlighted, readPreset, shown, toggle, type Preset } from "../src/model.ts";

function preset(show: unknown): Preset {
  const p = readPreset({ schema: "music.neck-preset@1", instrument: "guitar", tuning: "standard", frets: 12, show });
  if (!p) throw new Error(`not a preset: ${JSON.stringify(show)}`);
  return p;
}
const keys = (v: unknown): string[] => (v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...keys(x)]) : []);

describe("what the neck shows", () => {
  it("a note: every position of it; hidden on a judged task", () => {
    expect(shown(preset({ kind: "note", note: "A" }), false)).toHaveLength(positionsCount("A"));
    expect(shown(preset({ kind: "note", note: "A" }), true)).toEqual([]);
  });

  it("a scale: its key as the root, the other tones shown", () => {
    const marks = shown(preset({ kind: "scale", key: "A", scale: "minor-pentatonic" }), false);
    expect(marks.filter((m) => m.role === "root").every((m) => m.position.string === 6 ? m.position.fret % 12 === 5 : true)).toBe(true);
    expect(new Set(marks.map((m) => m.role))).toEqual(new Set(["root", "shown"]));
  });

  it("an interval: the root stays on a judged task, the target goes", () => {
    const p = preset({ kind: "interval", root: "A3", interval: "M3" });
    expect(shown(p, false).filter((m) => m.role === "shown").length).toBeGreaterThan(0);
    expect(shown(p, true).every((m) => m.role === "root")).toBe(true);
  });

  it("refuses a preset it doesn't show", () => {
    expect(readPreset({ schema: "music.neck-preset@1", instrument: "bass", tuning: "standard", show: { kind: "note", note: "A" } })).toBeNull();
    expect(readPreset({ schema: "music.neck-preset@1", instrument: "guitar", tuning: "standard", show: { kind: "scale", key: "A", scale: "lydian" } })).toBeNull();
  });
});

describe("the Tutor's highlight and the learner's answer", () => {
  it("highlight: an exact pitch, or every position of a pitch class", () => {
    expect(highlighted(["C#4"], 12).map((m) => m.position)).toEqual([{ string: 2, fret: 2 }, { string: 3, fret: 6 }, { string: 4, fret: 11 }]);
    expect(highlighted([], 12)).toEqual([]);
  });

  it("the picks toggle, and the answer is what was played, in order, with no verdict at any depth", () => {
    let picks = toggle([], { string: 2, fret: 2 }, 900);
    picks = toggle(picks, { string: 1, fret: 5 }, 400);
    picks = toggle(picks, { string: 1, fret: 5 }, 1200); // taken back
    picks = toggle(picks, { string: 3, fret: 2 }, 300);
    const a = answer(picks);
    expect(a).toEqual({ schema: "music.played@2", notes: [
      { pitch: "A3", at_ms: 300, position: { string: 3, fret: 2 } },
      { pitch: "C#4", at_ms: 900, position: { string: 2, fret: 2 } },
    ] });
    expect(keys(a).filter((k) => VERDICT_KEYS.has(k))).toEqual([]);
  });
});

function positionsCount(note: string): number {
  return shown(preset({ kind: "note", note }), false).length;
}
