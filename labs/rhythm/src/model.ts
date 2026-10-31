// What the tapper sets up and what it sends, as data (no DOM), in Narai's rhythm payloads: a step's preset is the
// cycle, its tempo and its count-in (music.cycle-preset@1); an answer is when the learner tapped, ms from the first
// beat after the count-in, and how (music.taps@1), never whether they were on the beat (Narai judges); free play goes
// to Narai as practice, in batches the host takes.
import type { Cycle, Hand } from "./theory.ts";

/** music.cycle-preset@1, Narai's, as this tapper reads it (its defaults filled in). */
export interface Preset extends Cycle {
  schema: "music.cycle-preset@1"; system: "tala" | "meter"; name: string | null;
  subdivision: number; tempo_bpm: number; count_in_beats: number; cycles: number;
}
/** How the tool heard the taps: a touch (or a click) or a key. */
export type Source = "touch" | "key";
/** music.taps@1, Narai's: each tap's time, and how they were tapped. */
export type Taps = { schema: "music.taps@1"; taps: { at_ms: number }[]; source: Source };

export const MAX_TAPS = 512;

/** The answer for the taps, in order. One way of tapping is the source; both, `touch`. */
export const taps = (at: readonly number[], sources: readonly Source[] = []): Taps => ({
  schema: "music.taps@1",
  taps: [...at].sort((a, b) => a - b).map((at_ms) => ({ at_ms })),
  source: sources.length > 0 && sources.every((s) => s === "key") ? "key" : "touch",
});

/** A preset as the step wrote it, or null when it isn't one this tapper plays: Narai's rules across its fields too,
 *  which its JSON Schema can't say (the groups sum to the beats; a hand per group; a syllable per beat). */
export function readPreset(value: unknown): Preset | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const int = (x: unknown, lo: number, hi: number) => Number.isInteger(x) && (x as number) >= lo && (x as number) <= hi;
  const or = <T>(x: unknown, d: T) => (x === undefined || x === null ? d : x);
  const subdivision = or(v.subdivision, 1), count_in_beats = or(v.count_in_beats, 0), cycles = or(v.cycles, 1);
  const hands = or(v.hands, null) as Hand[] | null, syllables = or(v.syllables, null) as string[] | null, name = or(v.name, null);
  const groups = v.groups;
  if (v.schema !== "music.cycle-preset@1" || (v.system !== "tala" && v.system !== "meter")) return null;
  if (!int(v.beats, 1, 64) || !int(v.tempo_bpm, 20, 400) || !int(subdivision, 1, 8) || !int(count_in_beats, 0, 16) || !int(cycles, 1, 16)) return null;
  if (!Array.isArray(groups) || groups.length === 0 || !groups.every((g) => int(g, 1, 64))) return null;
  if (groups.reduce((a: number, b: number) => a + b, 0) !== v.beats) return null;
  if (hands !== null && (!Array.isArray(hands) || hands.length !== groups.length || !hands.every((h) => h === "clap" || h === "wave"))) return null;
  if (syllables !== null && (!Array.isArray(syllables) || syllables.length !== v.beats || !syllables.every((s) => typeof s === "string" && s.length > 0))) return null;
  if (name !== null && typeof name !== "string") return null;
  return {
    schema: "music.cycle-preset@1", system: v.system, name, beats: v.beats as number, groups: [...groups], hands, syllables,
    subdivision: subdivision as number, tempo_bpm: v.tempo_bpm as number, count_in_beats: count_in_beats as number, cycles: cycles as number,
  };
}

/** One practice report (the SDK's PracticeReport) for the `free_tap` activity. */
export interface Report { duration_s: number; attempts: number; payload: Taps }

/** Free play's taps (ms, one clock for taps and `now`), reported as practice at most once a minute (the host takes a
 *  burst of 10, then 6 a minute), and at once when the page goes away. An attempt is a cycle tapped through. */
export function practiceBatch(beats: number, everyMs = 60_000) {
  let pending: { at: number; source: Source }[] = [];
  let since: number | null = null; // when the pending taps began
  let last = -Infinity; // when the last report went
  return {
    tap(at: number, source: Source = "touch") {
      if (since === null) {
        since = at;
        if (last === -Infinity) last = at; // the first report goes a minute after the first tap
      }
      pending.push({ at, source });
    },
    // #region take
    /** The report due now (`force`: the page is going away), or null. */
    take(now: number, force = false): Report | null {
      if (pending.length === 0 || since === null || (!force && now - last < everyMs)) return null;
      const sent = pending.slice(0, MAX_TAPS);
      pending = pending.slice(MAX_TAPS);
      const payload = taps(sent.map((t) => t.at), sent.map((t) => t.source));
      const report = { duration_s: Math.max(1, Math.round((now - since) / 1000)), attempts: Math.max(1, Math.floor(sent.length / beats)), payload };
      since = pending.length > 0 ? now : null;
      last = now;
      return report;
    },
    // #endregion take
  };
}
