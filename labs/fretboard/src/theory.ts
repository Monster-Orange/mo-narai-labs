// The fretboard's music: pitches in scientific pitch notation ("C#4", how the Tutor names them in every language) and as
// MIDI numbers (what the learner played crosses the wire as), a neck as Narai's music.neck-preset@1 sets it up, and where
// a note, a scale or an interval lies on it. Pure, so the tests read it.

export const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type PitchClass = (typeof PITCH_CLASSES)[number];

const FLATS: Record<string, PitchClass> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B", Fb: "E" };
const NOTE = /^([A-G])([#b]?)(-?\d)?$/;

/** A string (1 is the high E) and a fret (0 is open). */
export interface Position { string: number; fret: number }

/** A neck as Narai's music.neck-preset@1 sets it up: its tuning (MIDI per string, the lowest string first, as Narai
 *  writes it), its frets, and a capo. String 1 is the highest-pitched string, as music.played@1 numbers them. */
export interface Neck { tuning: readonly number[]; frets: number; capo?: number | null }

/** Standard tuning, lowest string first, as Narai's preset writes it: E2 A2 D3 G3 B3 E4. */
export const STANDARD = [40, 45, 50, 55, 59, 64] as const;
export const STANDARD_NECK: Neck = { tuning: STANDARD, frets: 12, capo: null };

/** A note's pitch class (sharps; flats read as their sharp), or null when it isn't a note. */
export function pitchClass(note: string): PitchClass | null {
  const m = NOTE.exec(note);
  if (!m) return null;
  const name = `${m[1]}${m[2]}`;
  const flat = FLATS[name];
  if (flat) return flat;
  return (PITCH_CLASSES as readonly string[]).includes(name) ? (name as PitchClass) : null;
}

/** A pitch with its octave ("C#4") as a MIDI number (C4 = 60), or null without an octave. */
export function midi(note: string): number | null {
  const m = NOTE.exec(note);
  const pc = pitchClass(note);
  if (!m || pc === null || m[3] === undefined) return null;
  return (Number(m[3]) + 1) * 12 + PITCH_CLASSES.indexOf(pc);
}

/** The pitch class of a MIDI number, or of any semitone count from C. */
export function classOf(n: number): PitchClass {
  return PITCH_CLASSES[((n % 12) + 12) % 12] as PitchClass;
}

/** A MIDI number as a pitch ("C#4"). */
export function pitchName(n: number): string {
  return `${classOf(n)}${Math.floor(n / 12) - 1}`;
}

/** The lowest fret a neck plays: the capo's (its string sounds there open), else the nut. */
export const lowest = (neck: Neck): number => neck.capo ?? 0;

/** The MIDI number sounding at a position on a neck. */
export function sounding(neck: Neck, p: Position): number {
  const open = neck.tuning[neck.tuning.length - p.string];
  if (open === undefined || p.fret < lowest(neck) || p.fret > neck.frets) throw new RangeError(`no string ${p.string}, fret ${p.fret}`);
  return open + p.fret;
}

/** The pitch sounding at a position on a neck. */
export function pitchAt(neck: Neck, p: Position): string {
  return pitchName(sounding(neck, p));
}

/** Every position a neck plays (from its capo up), string 1 first, then by fret. */
export function positions(neck: Neck): Position[] {
  const from = lowest(neck);
  return neck.tuning.flatMap((_, s) => Array.from({ length: neck.frets - from + 1 }, (_, i) => ({ string: s + 1, fret: from + i })));
}

/** Where a pitch (a MIDI number) sounds on a neck, or every position of a pitch class (0 is C), as music.notes@1
 *  names them. */
export function positionsOf(target: { pitch: number } | { pc: number }, neck: Neck): Position[] {
  return positions(neck).filter((p) => {
    const n = sounding(neck, p);
    return "pitch" in target ? n === target.pitch : (n % 12) === target.pc;
  });
}

export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  "natural-minor": [0, 2, 3, 5, 7, 8, 10],
  "major-pentatonic": [0, 2, 4, 7, 9],
  "minor-pentatonic": [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
} as const;
export type Scale = keyof typeof SCALES;

/** A scale's pitch classes from its key, the key first. */
export function scaleClasses(key: string, scale: Scale): PitchClass[] {
  const root = pitchClass(key);
  if (root === null) throw new RangeError(`no key ${key}`);
  const at = PITCH_CLASSES.indexOf(root);
  return SCALES[scale].map((step) => classOf(at + step));
}

export const INTERVALS = { P1: 0, m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, TT: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12 } as const;
export type Interval = keyof typeof INTERVALS;

/** The pitch an interval above a root pitch ("A3" + M3 = "C#4"). */
export function above(root: string, interval: Interval): string {
  const n = midi(root);
  if (n === null) throw new RangeError(`an interval needs a root with its octave: ${root}`);
  return pitchName(n + INTERVALS[interval]);
}

export const same = (a: Position, b: Position): boolean => a.string === b.string && a.fret === b.fret;

const DEGREES = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"] as const;
const NAMES = Object.keys(INTERVALS).slice(0, 12);

/** A highlighted spot's label, as the preset's `labels` asks: its note, its interval from the root, or its degree in
 *  the root's key; none for `none` (or with no root to count from). */
export function labelOf(n: number, root: number | null, labels: "none" | "notes" | "intervals" | "degrees"): string | null {
  if (labels === "notes") return classOf(n);
  if (labels === "none" || root === null) return null;
  const step = (((n - root) % 12) + 12) % 12;
  return (labels === "intervals" ? NAMES[step] : DEGREES[step]) ?? null;
}
