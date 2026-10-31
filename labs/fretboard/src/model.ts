// What the fretboard shows and what it sends, as data (no DOM). Narai's own music payloads, declared unchanged
// (manifest.ts, from the SDK's musicPayloads): a step's preset is the neck's setup (music.neck-preset@1), what the neck
// shows is reported as its state (music.neck-state@1), and an answer says what the learner played (music.played@1),
// never whether it was right (Narai judges). What to show is highlighting: the task's own notes on a judged step,
// the Tutor's `highlight` otherwise (labs' music.notes@1), nothing else.
import type { MusicNeckPreset, MusicNeckState, MusicPlayed } from "@michinarai/sdk";
import { labelOf, midi, pitchClass, positionsOf, same, sounding, type Neck, type Position } from "./theory.ts";

/** A payload as it crosses: its body and the SDK's `schema` key. */
type Wire<T, S extends string> = T & { schema: S; [key: string]: unknown };
/** music.neck-preset@1: the neck as the step sets it up (tuning, frets, capo, handedness, what a mark says). */
export type Preset = Wire<MusicNeckPreset, "music.neck-preset@1">;

/** A spot the neck highlights, with what it says (the preset's `labels`). */
export interface Mark { position: Position; label: string | null }

/** A played note as music.played@1 carries it: its MIDI pitch, when (ms from the start), and, for a tapped one, where
 *  on the neck (display data: a judge reads pitch and at_ms). A note the microphone heard has no place: a guitar plays
 *  one pitch in several. */
export interface Played { pitch: number; at_ms: number; string?: number; fret?: number }
/** A tapped note: one with its place on the neck. */
export const placed = (p: Played): p is Played & Position => p.string !== undefined && p.fret !== undefined;
/** music.played@1: what the learner played, in order. No verdict, at any depth. */
export type Answer = Wire<MusicPlayed, "music.played@1">;
/** music.neck-state@1: what the neck shows (its setup and its highlights), never what the learner did. */
export type State = Wire<MusicNeckState, "music.neck-state@1">;

export const neckOf = (p: Preset): Neck => ({ tuning: p.tuning, frets: p.frets, capo: p.capo ?? null });

// #region shown
/** The marks for notes to show: every position of each note (a pitch class anywhere, a pitch where it sounds), labelled
 *  from the first note (the root). Null when one isn't a note or isn't on this neck (C8 on a guitar), so a command can
 *  refuse it. */
export function highlighted(preset: Preset, notes: readonly string[]): Mark[] | null {
  const neck = neckOf(preset);
  if (notes.some((n) => pitchClass(n) === null || positionsOf(n, neck).length === 0)) return null;
  const first = notes[0];
  const root = first === undefined ? null : (midi(first) ?? midi(`${first}4`));
  const marks: Mark[] = [];
  for (const note of notes) {
    for (const position of positionsOf(note, neck)) {
      if (!marks.some((m) => same(m.position, position))) marks.push({ position, label: labelOf(sounding(neck, position), root, preset.labels) });
    }
  }
  return marks;
}
// #endregion shown

/** The neck's state: its setup and what it highlights. `playing` is false: it plays nothing back (a tap's pluck is
 *  the learner's own note). */
export function state(preset: Preset, marks: readonly Mark[]): State {
  const { schema: _, ...neck } = preset;
  return { schema: "music.neck-state@1", preset: neck as MusicNeckPreset, highlighted: marks.map((m) => ({ ...m.position, label: m.label })), playing: false };
}

/** The learner's picks, toggled: a second tap on a spot takes it back. */
export function toggle(preset: Preset, picks: readonly Played[], position: Position, at_ms: number): Played[] {
  return picks.some((p) => placed(p) && same(p, position))
    ? picks.filter((p) => !(placed(p) && same(p, position)))
    : [...picks, { pitch: sounding(neckOf(preset), position), at_ms, string: position.string, fret: position.fret }];
}

/** A note the microphone heard, after the picks: it has no place, so another tap never takes it back (Clear does). */
export function heard(picks: readonly Played[], pitch: number, at_ms: number): Played[] {
  return [...picks, { pitch, at_ms }];
}

/** The answer for what was played, in order. With notes the microphone heard, `latency_ms` says how late the tool
 *  hears (Narai's judge allows for it). */
export function answer(picks: readonly Played[], latency_ms: number | null = null): Answer {
  const notes = [...picks].sort((a, b) => a.at_ms - b.at_ms).map((p) => ({ ...p }));
  return latency_ms !== null && picks.some((p) => !placed(p)) ? { schema: "music.played@1", notes, latency_ms } : { schema: "music.played@1", notes };
}

/** Picks as this launch's storage kept them (after a reload, say), or none when they aren't picks. */
export function readPicks(value: unknown): Played[] {
  if (!Array.isArray(value)) return [];
  const int = (v: unknown) => typeof v === "number" && Number.isInteger(v);
  const note = (p: Record<string, unknown>) => int(p.pitch) && int(p.at_ms) && (int(p.string) && int(p.fret) || (p.string === undefined && p.fret === undefined));
  return value.filter((p): p is Played => !!p && typeof p === "object" && note(p as Record<string, unknown>));
}
