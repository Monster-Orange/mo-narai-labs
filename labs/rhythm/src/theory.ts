// The tapper's music: a rhythmic cycle as Narai's music.cycle-preset@1 sets it up, a tala or a meter: its beats in
// groups (a tāl's divisions, its vibhāgs; a meter's bars), a clap (tālī) or a wave (khālī) to show each group, and a
// syllable (a bol) per beat. Pure, so the tests read it.

export type Hand = "clap" | "wave";

/** A cycle's structure: its beats, their groups, and (when the step gives them) a hand per group and a syllable per beat. */
export interface Cycle { beats: number; groups: readonly number[]; hands: readonly Hand[] | null; syllables: readonly string[] | null }

/** Rupak: seven beats, 3 + 2 + 2. Its first beat (sam) is a wave, unlike most tāls. */
export const RUPAK: Cycle = { beats: 7, groups: [3, 2, 2], hands: ["wave", "clap", "clap"], syllables: ["Tin", "Tin", "Na", "Dhi", "Na", "Dhi", "Na"] };

/** One beat at a tempo, in ms. */
export const beatMs = (bpm: number): number => 60_000 / bpm;

/** The beat (0-based) sounding at `ms` from the cycle's first beat. */
export const beatAt = (ms: number, bpm: number, cycle: Cycle): number => Math.floor(Math.max(0, ms) / beatMs(bpm)) % cycle.beats;

/** Whether a beat starts a group, and if so which one. */
export function groupStart(beat: number, cycle: Cycle): number | null {
  let at = 0;
  for (const [i, n] of cycle.groups.entries()) {
    if (beat === at) return i;
    at += n;
  }
  return null;
}
