// What the trainer plays and what it sends, as data (no DOM). The payload families are the manifest's own
// (narai-tool.json `payloads`): a step's preset is the sound (one note or two), never the key; an answer is the interval
// the learner named or the notes they played, never whether it was right (D4: Narai judges). The Tutor may `replay`.
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
