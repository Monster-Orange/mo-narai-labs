// The trainer's music: pitches in scientific pitch notation ("C#4", what crosses the wire in every language), as MIDI
// numbers to place them on the keyboard and as frequencies to sound them. Pure, so the tests read it.

export const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const PITCH = /^([A-G]#?)(-?\d)$/;

/** A pitch with its octave ("C#4") as a MIDI number (C4 = 60), or null when it isn't one. */
export function midi(pitch: string): number | null {
  const m = PITCH.exec(pitch);
  if (!m) return null;
  const pc = (PITCH_CLASSES as readonly string[]).indexOf(m[1] as string);
  return pc < 0 ? null : (Number(m[2]) + 1) * 12 + pc;
}

/** A MIDI number as a pitch ("C#4"). */
export function pitchName(n: number): string {
  return `${PITCH_CLASSES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
}

/** Whether a MIDI number is a black key. */
export const black = (n: number): boolean => [1, 3, 6, 8, 10].includes(((n % 12) + 12) % 12);

/** Equal temperament at A4 = 440 Hz. */
export const frequency = (n: number): number => 440 * 2 ** ((n - 69) / 12);

/** The intervals a learner can name, smallest first, as music.interval-named@1 spells them. */
export const INTERVALS = ["P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "P8"] as const;
export type Interval = (typeof INTERVALS)[number];
