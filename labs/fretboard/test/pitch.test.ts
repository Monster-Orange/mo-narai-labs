// Hearing notes: a window's pitch, a pitch's MIDI number, frames to notes; and the neck's own pluck, heard back.
import { describe, expect, it } from "vitest";
import { detect, hzOf, listener, midiOf } from "../src/pitch.ts";
import { pluck } from "../src/sound.ts";
import { STANDARD } from "../src/theory.ts";

const RATE = 48_000, WINDOW = 2048;

const tone = (hz: number, harmonics: number[] = [1], amp = 0.4) =>
  Float32Array.from({ length: WINDOW }, (_, i) => harmonics.reduce((s, h, k) => s + (amp / (k + 1)) * Math.sin((2 * Math.PI * hz * h * i) / RATE), 0));

/** A seeded noise, so a pluck is the same every run. */
function seeded(seed: number): () => number {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

describe("a window's pitch", () => {
  it("finds a pure tone across a guitar's range, within a few cents", () => {
    for (const n of [STANDARD[0], 57, 64, 76, 88]) {
      const heard = detect(tone(hzOf(n)), RATE);
      expect(heard, `MIDI ${n}`).not.toBeNull();
      expect(Math.abs(1200 * Math.log2((heard?.hz ?? 0) / hzOf(n))), `MIDI ${n}`).toBeLessThan(5);
    }
  });

  it("names the fundamental of a string's tone, not its louder octave", () => {
    const heard = detect(tone(hzOf(45), [1, 2, 3, 4]), RATE);
    expect(midiOf(heard?.hz ?? 0)).toBe(45);
  });

  it("hears nothing in silence, and nothing in noise", () => {
    expect(detect(new Float32Array(WINDOW), RATE)).toBeNull();
    expect(detect(tone(440, [1], 0.005), RATE)).toBeNull();
    const random = seeded(7);
    expect(detect(Float32Array.from({ length: WINDOW }, () => random() * 2 - 1), RATE)).toBeNull();
  });

  it("hears the neck's own pluck as the pitch it was plucked at", () => {
    for (const n of [40, 45, 57, 64, 69]) {
      const samples = pluck(n, RATE, seeded(n));
      const heard = detect(samples.subarray(RATE / 10, RATE / 10 + WINDOW), RATE);
      expect(midiOf(heard?.hz ?? 0), `MIDI ${n}`).toBe(n);
    }
  });
});

describe("a pitch's MIDI number", () => {
  it("is the nearest: A4 is 69, middle C 60, a quarter tone flat of C#4 still C#4", () => {
    expect(midiOf(440)).toBe(69);
    expect(midiOf(261.63)).toBe(60);
    expect(midiOf(hzOf(61) * 2 ** (-0.4 / 12))).toBe(61);
  });
});

describe("frames to notes", () => {
  const run = (frames: (number | null)[], hold = 3) => {
    const hear = listener(hold);
    return frames.map((pitch, i) => hear({ pitch, at_ms: i * 20 })).filter((n) => n !== null);
  };

  it("a pitch that holds is one note, timed from its first frame", () => {
    expect(run([null, 57, 57, 57, 57, 57, 57])).toEqual([{ pitch: 57, at_ms: 20 }]);
  });

  it("a blip shorter than the hold is no note", () => {
    expect(run([57, 57, null, 61, null, null])).toEqual([]);
  });

  it("another pitch is another note; the same again only after silence", () => {
    expect(run([57, 57, 57, 61, 61, 61, 61, 57, 57, 57])).toEqual([{ pitch: 57, at_ms: 0 }, { pitch: 61, at_ms: 60 }, { pitch: 57, at_ms: 140 }]);
    expect(run([57, 57, 57, null, 57, 57, 57])).toEqual([{ pitch: 57, at_ms: 0 }]);
    expect(run([57, 57, 57, null, null, null, 57, 57, 57])).toEqual([{ pitch: 57, at_ms: 0 }, { pitch: 57, at_ms: 120 }]);
  });
});
