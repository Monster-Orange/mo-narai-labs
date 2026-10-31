import { describe, expect, it } from "vitest";
import { STANDARD_NECK, above, midi, pitchAt, pitchClass, pitchName, positionsOf, scaleClasses } from "../src/theory.ts";

describe("pitches", () => {
  it("reads sharps, flats and octaves; C4 is MIDI 60", () => {
    expect(pitchClass("Db")).toBe("C#");
    expect(pitchClass("A#3")).toBe("A#");
    expect(pitchClass("H")).toBeNull();
    expect(midi("C4")).toBe(60);
    expect(midi("A")).toBeNull();
    expect(pitchName(61)).toBe("C#4");
  });

  it("standard tuning: the open strings, and C#4 at string 2 fret 2", () => {
    expect([1, 2, 3, 4, 5, 6].map((s) => pitchAt(STANDARD_NECK, { string: s, fret: 0 }))).toEqual(["E4", "B3", "G3", "D3", "A2", "E2"]);
    expect(pitchAt(STANDARD_NECK, { string: 2, fret: 2 })).toBe("C#4");
    expect(() => pitchAt(STANDARD_NECK, { string: 7, fret: 0 })).toThrow();
    expect(() => pitchAt(STANDARD_NECK, { string: 1, fret: 13 })).toThrow();
  });

  it("any tuning, lowest string first as Narai writes it: a seven-string's low B is string 7", () => {
    const seven = { tuning: [35, 40, 45, 50, 55, 59, 64], frets: 24 };
    expect(pitchAt(seven, { string: 7, fret: 0 })).toBe("B1");
    expect(pitchAt(seven, { string: 1, fret: 24 })).toBe("E6");
  });
});

describe("the neck", () => {
  it("a pitch class lies on every string; a pitch with its octave only where it sounds", () => {
    const a = positionsOf({ pc: 9 }, STANDARD_NECK);
    expect(new Set(a.map((p) => p.string)).size).toBe(6);
    expect(positionsOf({ pitch: 57 }, STANDARD_NECK)).toEqual([{ string: 3, fret: 2 }, { string: 4, fret: 7 }, { string: 5, fret: 12 }]);
  });

  it("scales and intervals: A minor pentatonic; a major third above A3 is C#4", () => {
    expect(scaleClasses("A", "minor-pentatonic")).toEqual(["A", "C", "D", "E", "G"]);
    expect(scaleClasses("Bb", "major")).toEqual(["A#", "C", "D", "D#", "F", "G", "A"]);
    expect(above("A3", "M3")).toBe("C#4");
    expect(() => above("A", "M3")).toThrow();
  });
});
