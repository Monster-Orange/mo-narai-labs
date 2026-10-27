// What the tapper sets up and what it sends, as data (no DOM). The payload families are the manifest's own
// (narai-tool.json `payloads`): a step's preset is the cycle and its tempo; an answer is when the learner tapped, never
// whether they were on the beat (D4: Narai judges); free play goes to Narai as practice, in batches the host takes.
import { TALS, type TalName } from "./theory.ts";

/** music.tal-preset@1: the cycle and how fast. */
export interface Preset { schema: "music.tal-preset@1"; tal: TalName; tempo_bpm: number }
/** music.taps@1: when the learner tapped, ms from the start. */
export type Taps = { schema: "music.taps@1"; taps: number[] };

export const MAX_TAPS = 512;

/** The answer for the taps, in order. */
export const taps = (at: readonly number[]): Taps => ({ schema: "music.taps@1", taps: [...at].sort((a, b) => a - b) });

/** A preset as the step wrote it, or null when it isn't one this tapper plays. */
export function readPreset(value: unknown): Preset | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const bpm = v.tempo_bpm;
  if (v.schema !== "music.tal-preset@1" || typeof v.tal !== "string" || !(v.tal in TALS)) return null;
  if (typeof bpm !== "number" || !Number.isInteger(bpm) || bpm < 40 || bpm > 160) return null;
  return { schema: "music.tal-preset@1", tal: v.tal as TalName, tempo_bpm: bpm };
}

// #region batch
/** One practice report (the SDK's PracticeReport) for the `free_tap` activity. */
export interface Report { duration_s: number; attempts: number; payload: Taps }

/** Free play's taps (ms from the start, one clock for taps and `now`), reported as practice at most once a minute (the host takes a burst of 10, then 6 a minute), and
 *  at once when the page goes away. An attempt is a cycle tapped through. */
export function practiceBatch(beats: number, everyMs = 60_000) {
  let pending: number[] = [];
  let since: number | null = null; // when the pending taps began
  let last = -Infinity; // when the last report went
  return {
    tap(at: number) {
      if (since === null) {
        since = at;
        if (last === -Infinity) last = at; // the first report goes a minute after the first tap
      }
      pending.push(at);
    },
    /** The report due now (`force`: the page is going away), or null. */
    take(now: number, force = false): Report | null {
      if (pending.length === 0 || since === null || (!force && now - last < everyMs)) return null;
      const sent = pending.slice(0, MAX_TAPS);
      pending = pending.slice(MAX_TAPS);
      const report = { duration_s: Math.max(1, Math.round((now - since) / 1000)), attempts: Math.max(1, Math.floor(sent.length / beats)), payload: taps(sent) };
      since = pending.length > 0 ? now : null;
      last = now;
      return report;
    },
  };
}
// #endregion batch
