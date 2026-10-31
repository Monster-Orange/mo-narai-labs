// What the trainer plays and what it sends, as data (no DOM). The payload families are the manifest's own
// (narai-tool.json `payloads`): a step's preset is the sound (one note or two), never the key; an answer is the interval
// the learner named or the notes they played, never whether it was right (Narai judges). The Tutor may `replay`. What
// it plays, and whether it is sounding, goes to Narai as its state; the learner's half-entered answer stays in this
// launch's storage, so a reload keeps it.
import { INTERVALS, midi, type Interval } from "./theory.ts";

/** music.interval-preset@1: the notes the trainer plays, low to high as the step wrote them. */
export interface Preset { schema: "music.interval-preset@1"; notes: string[] }

/** What the learner does here: name the interval they hear, play the interval above the note, or play freely. */
export type Mode = "name" | "play" | "free";

/** music.interval-named@1: the interval named. */
export type Named = { schema: "music.interval-named@1"; interval: Interval };
/** A played key as Narai's music.played@1 carries it: its MIDI pitch (on a keyboard the pitch is the key) and when (ms
 *  from the start). */
export interface Played { pitch: number; at_ms: number }
/** music.played@1, Narai's, declared unchanged: the fretboard answers in it too (one judge, two tools). */
export type PlayedAnswer = { schema: "music.played@1"; notes: Played[] };
export type Answer = Named | PlayedAnswer;

// #region mode
/** music.interval-state@1: what the trainer plays (the preset's notes) and whether it is sounding now. Never what the
 *  learner did, and never the interval: with two notes, naming it is the task. */
export type State = { schema: "music.interval-state@1"; notes: string[]; playing: boolean };

export const state = (preset: Preset, playing: boolean): State => ({ schema: "music.interval-state@1", notes: [...preset.notes], playing });

/** An answer begun and not sent, as this launch's storage keeps it: the interval chosen, or the keys played so far. */
export interface Kept { choice: Interval | null; picks: Played[] }

/** What storage kept, or nothing begun when it isn't that (a shape from another version, say). */
export function readKept(value: unknown): Kept {
  const none: Kept = { choice: null, picks: [] };
  if (!value || typeof value !== "object") return none;
  const v = value as Record<string, unknown>;
  const int = (x: unknown) => typeof x === "number" && Number.isInteger(x);
  const choice = typeof v.choice === "string" && (INTERVALS as readonly string[]).includes(v.choice) ? (v.choice as Interval) : null;
  const picks = Array.isArray(v.picks)
    ? v.picks.filter((p): p is Played => !!p && typeof p === "object" && int((p as Played).pitch) && int((p as Played).at_ms))
    : [];
  return { choice, picks };
}

/** The task's item kind as this trainer's mode (the manifest's `answers`); free play without a task. */
export function modeOf(kind: string | null): Mode | null {
  if (kind === null) return "free";
  return kind === "name_interval" ? "name" : kind === "play_interval" ? "play" : null;
}
// #endregion mode

/** The keyboard's keys: two octaves from the C at or below the lowest note. */
export function keys(preset: Preset): number[] {
  const low = Math.min(...preset.notes.map((n) => midi(n) ?? 60));
  const from = low - (((low % 12) + 12) % 12);
  return Array.from({ length: 25 }, (_, i) => from + i);
}

/** The learner's keys, toggled: a second tap on a key takes it back. */
export function toggle(picks: readonly Played[], key: number, at_ms: number): Played[] {
  return picks.some((p) => p.pitch === key)
    ? picks.filter((p) => p.pitch !== key)
    : [...picks, { pitch: key, at_ms }];
}

/** The answer for the keys played, in the order they were played. */
export function played(picks: readonly Played[]): PlayedAnswer {
  return { schema: "music.played@1", notes: [...picks].sort((a, b) => a.at_ms - b.at_ms).map((p) => ({ ...p })) };
}

/** The answer for an interval named. */
export const named = (interval: Interval): Named => ({ schema: "music.interval-named@1", interval });

/** A preset as the step wrote it, or null when it isn't one this trainer plays. */
export function readPreset(value: unknown): Preset | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.schema !== "music.interval-preset@1" || !Array.isArray(v.notes)) return null;
  const notes = v.notes.filter((n): n is string => typeof n === "string" && midi(n) !== null);
  return notes.length >= 1 && notes.length <= 2 && notes.length === v.notes.length ? { schema: "music.interval-preset@1", notes } : null;
}

export { INTERVALS };
