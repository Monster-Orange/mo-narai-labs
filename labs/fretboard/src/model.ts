// What the fretboard shows and what it sends, as data (no DOM). The payload families are the manifest's own
// (narai-tool.json `payloads`): a step's preset says what to show; an answer says what the learner played, never whether
// it was right (D4: Narai judges); the Tutor's commands are `highlight` and `clear`, nothing else.
import { INTERVALS, SCALES, above, positionsOf, pitchAt, same, scaleClasses, type Interval, type Position, type Scale } from "./theory.ts";

/** music.neck-preset@1: what the neck shows. */
export type Show =
  | { kind: "note"; note: string }
  | { kind: "scale"; key: string; scale: Scale }
  | { kind: "interval"; root: string; interval: Interval };
export interface Preset { schema: "music.neck-preset@1"; instrument: "guitar"; tuning: "standard"; frets: number; show: Show }

/** A spot the neck marks: the shown note or scale tone, its root, or the Tutor's highlight. */
export interface Mark { position: Position; role: "shown" | "root" | "tutor" }

/** What a played note carries: its pitch, when (ms from the start), and where (display data, never graded). */
export interface Played { pitch: string; at_ms: number; position: Position }
/** music.played@2: what the learner played, in order. No verdict, at any depth. Its position is optional (a guitar
 *  position or a key), so any instrument answers in it; a judge reads pitch and at_ms only. @1 (0.1.0) required a guitar
 *  position on every note: a changed shape is a new version, and @1 keeps its meaning. */
export type Answer = { schema: "music.played@2"; notes: Played[] };

export const DEFAULT_FRETS = 12;

/** The marks a preset shows. With the tool's checks hidden (a judged task, assist: none), only an interval's root stays:
 *  the rest would be the answer. */
export function shown(preset: Preset, hidden: boolean): Mark[] {
  const { show, frets } = preset;
  switch (show.kind) {
    case "note":
      return hidden ? [] : positionsOf(show.note, frets).map((position) => ({ position, role: "shown" }));
    case "scale": {
      if (hidden) return [];
      const [key = show.key, ...rest] = scaleClasses(show.key, show.scale);
      return [
        ...positionsOf(key, frets).map((position): Mark => ({ position, role: "root" })),
        ...rest.flatMap((pc) => positionsOf(pc, frets).map((position): Mark => ({ position, role: "shown" }))),
      ];
    }
    case "interval": {
      const roots = positionsOf(show.root, frets).map((position): Mark => ({ position, role: "root" }));
      if (hidden) return roots;
      return [...roots, ...positionsOf(above(show.root, show.interval), frets).map((position): Mark => ({ position, role: "shown" }))];
    }
  }
}

/** music.notes@1, `highlight`'s payload: notes with an octave mark that pitch, without one every position of it. */
export function highlighted(notes: readonly string[], frets: number): Mark[] {
  return notes.flatMap((n) => positionsOf(n, frets).map((position): Mark => ({ position, role: "tutor" })));
}

/** The learner's picks, toggled: a second tap on a spot takes it back. */
export function toggle(picks: readonly Played[], position: Position, at_ms: number): Played[] {
  return picks.some((p) => same(p.position, position))
    ? picks.filter((p) => !same(p.position, position))
    : [...picks, { pitch: pitchAt(position), at_ms, position }];
}

/** The answer for what was picked, in the order it was played. */
export function answer(picks: readonly Played[]): Answer {
  return { schema: "music.played@2", notes: [...picks].sort((a, b) => a.at_ms - b.at_ms).map((p) => ({ ...p, position: { ...p.position } })) };
}

/** A preset as the step wrote it, or null when it isn't one this tool shows. */
export function readPreset(value: unknown): Preset | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const show = v.show as Record<string, unknown> | undefined;
  if (v.schema !== "music.neck-preset@1" || v.instrument !== "guitar" || v.tuning !== "standard" || !show) return null;
  const frets = typeof v.frets === "number" && Number.isInteger(v.frets) && v.frets >= 5 && v.frets <= 24 ? v.frets : DEFAULT_FRETS;
  const str = (k: string) => (typeof show[k] === "string" ? (show[k] as string) : null);
  switch (show.kind) {
    case "note": {
      const note = str("note");
      return note ? { schema: "music.neck-preset@1", instrument: "guitar", tuning: "standard", frets, show: { kind: "note", note } } : null;
    }
    case "scale": {
      const key = str("key"), scale = str("scale");
      return key && scale && scale in SCALES ? { schema: "music.neck-preset@1", instrument: "guitar", tuning: "standard", frets, show: { kind: "scale", key, scale: scale as Scale } } : null;
    }
    case "interval": {
      const root = str("root"), interval = str("interval");
      return root && interval && interval in INTERVALS ? { schema: "music.neck-preset@1", instrument: "guitar", tuning: "standard", frets, show: { kind: "interval", root, interval: interval as Interval } } : null;
    }
    default: return null;
  }
}
