// The trainer on the page: a Listen button, a two-octave keyboard (every key a button), and, on a task that asks the
// interval's name, its names. It plays the preset's notes; on a task Narai judges it shows Narai's prompt (already in
// the learner's language), and Send hands what the learner did to `onAnswer`. It never says whether it was right, and
// never shows the interval it plays: with two notes, naming it is the task.
import type { Player } from "./audio.ts";
import { black, midi, pitchName, type Interval } from "./theory.ts";
import { INTERVALS, keys, named, played, toggle, type Answer, type Mode, type Played, type Preset } from "./model.ts";
import { words, type Locale } from "./words.ts";

/** A task Narai judges: its prompt and its item kind, as the trainer's mode. */
export interface TaskView { prompt: string; mode: Exclude<Mode, "free"> }

/** The tool, as main.ts drives it from the SDK's session. */
export interface Tool {
  start(preset: Preset, opts: { locale: Locale; task: TaskView | null }): void;
  setLocale(locale: Locale): void;
  /** The Tutor's `replay`: the preset's notes again. */
  replay(): void;
  onAnswer(send: (a: Answer) => void): void;
}

export function mountTrainer(root: HTMLElement, player: Player, now: () => number = () => performance.now()): Tool {
  let preset: Preset | null = null;
  let task: TaskView | null = null;
  let locale: Locale = "en";
  let picks: Played[] = [];
  let choice: Interval | null = null;
  let began = 0;
  let send: (a: Answer) => void = () => {};

  const notes = () => (preset?.notes ?? []).map((n) => midi(n)).filter((n): n is number => n !== null);
  const button = (text: string, className: string, onClick: () => void) => {
    const b = Object.assign(document.createElement("button"), { type: "button", textContent: text, className });
    b.addEventListener("click", onClick);
    return b;
  };

  const draw = () => {
    root.replaceChildren();
    if (!preset) return;
    const t = words(locale);
    if (task) root.append(Object.assign(document.createElement("p"), { className: "prompt", textContent: task.prompt }));
    root.append(button(t.listen, "listen", () => player.play(notes())));

    const board = document.createElement("div");
    board.className = "keyboard";
    board.setAttribute("role", "group");
    board.setAttribute("aria-label", t.keyboard);
    const first = notes()[0];
    for (const key of keys(preset)) {
      const picked = picks.some((p) => p.pitch === key);
      const k = button("", ["key", black(key) ? "black" : "white", key === first && task?.mode === "play" ? "root" : "", picked ? "picked" : ""].filter(Boolean).join(" "), () => {
        player.play([key]);
        if (task?.mode !== "play") return;
        picks = toggle(picks, key, Math.max(0, Math.round(now() - began)));
        draw();
      });
      k.dataset.key = String(key);
      k.setAttribute("aria-label", pitchName(key));
      if (task?.mode === "play") k.setAttribute("aria-pressed", String(picked));
      board.append(k);
    }
    root.append(board);

    if (task?.mode === "name") {
      const names = document.createElement("div");
      names.className = "names";
      names.setAttribute("role", "group");
      names.setAttribute("aria-label", t.intervals);
      for (const i of INTERVALS) {
        const b = button(t.interval[i], i === choice ? "name chosen" : "name", () => { choice = i; draw(); });
        b.dataset.interval = i;
        b.setAttribute("aria-pressed", String(i === choice));
        names.append(b);
      }
      root.append(names);
    }

    if (task) {
      const bar = document.createElement("div");
      bar.className = "answer-bar";
      const empty = task.mode === "name" ? choice === null : picks.length === 0;
      const clear = button(t.clear, "quiet", () => { picks = []; choice = null; draw(); });
      const done = button(t.send, "primary", () => send(task?.mode === "name" && choice ? named(choice) : played(picks)));
      clear.disabled = done.disabled = empty;
      bar.append(clear, done);
      root.append(bar);
    }
  };

  return {
    start(p, opts) {
      preset = p;
      task = opts.task;
      locale = opts.locale;
      picks = [];
      choice = null;
      began = now();
      draw();
    },
    setLocale(l) { locale = l; draw(); },
    replay() { if (preset) player.play(notes()); },
    onAnswer(fn) { send = fn; },
  };
}
