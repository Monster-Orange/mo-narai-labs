// The tapper's music: a tāl, the cycle of beats Hindustani music keeps time in, with its divisions (vibhāg), its
// syllables (bols) and how each division is shown with the hands: a clap (tālī) or a wave (khālī). Pure, so the tests
// read it.

export interface Tal { beats: number; vibhags: readonly number[]; bols: readonly string[]; hands: readonly ("clap" | "wave")[] }

/** Rupak: seven beats, 3 + 2 + 2. Its first beat (sam) is a wave, unlike most tāls. */
export const TALS = {
  rupak: { beats: 7, vibhags: [3, 2, 2], bols: ["Tin", "Tin", "Na", "Dhi", "Na", "Dhi", "Na"], hands: ["wave", "clap", "clap"] },
} as const satisfies Record<string, Tal>;
export type TalName = keyof typeof TALS;

/** One beat at a tempo, in ms. */
export const beatMs = (bpm: number): number => 60_000 / bpm;

/** The beat (0-based) sounding at `ms` from the cycle's start. */
export const beatAt = (ms: number, bpm: number, tal: Tal): number => Math.floor(Math.max(0, ms) / beatMs(bpm)) % tal.beats;

/** Whether a beat starts a division, and if so which one. */
export function vibhagStart(beat: number, tal: Tal): number | null {
  let at = 0;
  for (const [i, n] of tal.vibhags.entries()) {
    if (beat === at) return i;
    at += n;
  }
  return null;
}
