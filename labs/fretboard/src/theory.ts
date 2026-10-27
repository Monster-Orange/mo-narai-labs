// The fretboard's music: pitches in scientific pitch notation ("C#4", what crosses the wire in every language), the
// guitar's standard tuning, and where a note, a scale or an interval lies on the neck. Pure, so the tests read it.

export const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type PitchClass = (typeof PITCH_CLASSES)[number];

const FLATS: Record<string, PitchClass> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B", Fb: "E" };
const NOTE = /^([A-G])([#b]?)(-?\d)?$/;

/** A string (1 is the high E) and a fret (0 is open). */
export interface Position { string: number; fret: number }

/** Standard tuning, string 1 to 6, as MIDI numbers: E4 B3 G3 D3 A2 E2. */
export const STANDARD = [64, 59, 55, 50, 45, 40] as const;

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

/** The MIDI number sounding at a position in standard tuning. */
function sounding(p: Position): number {
  const open = STANDARD[p.string - 1];
  if (open === undefined || p.fret < 0) throw new RangeError(`no string ${p.string}, fret ${p.fret}`);
  return open + p.fret;
}

/** The pitch sounding at a position in standard tuning. */
export function pitchAt(p: Position): string {
  return pitchName(sounding(p));
}

/** Every position up to `frets`, string 1 first, then by fret. */
export function positions(frets: number): Position[] {
  return STANDARD.flatMap((_, s) => Array.from({ length: frets + 1 }, (_, fret) => ({ string: s + 1, fret })));
}

/** Where a note lies: every position of its pitch class, or, with an octave ("A3"), of that pitch alone. */
export function positionsOf(note: string, frets: number): Position[] {
  const exact = midi(note);
  const pc = pitchClass(note);
  if (pc === null) return [];
  return positions(frets).filter((p) => {
    const n = sounding(p);
    return exact === null ? classOf(n) === pc : n === exact;
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
