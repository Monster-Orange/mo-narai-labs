// The fretboard on the page: a guitar neck drawn in SVG, every position a button. It shows what the preset asks (a
// note, a scale, an interval), the Tutor's highlights, and the learner's picks. On a task Narai judges it shows Narai's
// prompt (already in the learner's language), and Send hands the picks to `onAnswer` as a music.played@1 answer. It never
// says whether they are right, and with the task's assist off it hides what would give the answer away.
import { STANDARD, pitchAt, same, type Position } from "./theory.ts";
import { answer, highlighted, shown, toggle, type Answer, type Mark, type Played, type Preset } from "./model.ts";
import { words, type Locale } from "./words.ts";

const SVG = "http://www.w3.org/2000/svg";
const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const FRET_W = 64, STRING_GAP = 28, PAD = 24, OPEN_W = 40;

/** A task Narai judges: its prompt, and whether the tool's own marks would answer it (assist: none). */
export interface TaskView { prompt: string; hideChecks: boolean }

/** The tool, as main.ts drives it from the SDK's session: started with a step's preset (and a task, if any), sent the
 *  Tutor's commands, handing back what the learner played. */
export interface Tool {
  start(preset: Preset, opts: { locale: Locale; task: TaskView | null }): void;
  setLocale(locale: Locale): void;
  command(name: "highlight" | "clear", notes?: readonly string[]): void;
  onAnswer(send: (a: Answer) => void): void;
}

export function mountFretboard(root: HTMLElement, now: () => number = () => performance.now()): Tool {
  let preset: Preset | null = null;
  let task: TaskView | null = null;
  let locale: Locale = "en";
  let tutor: Mark[] = [];
  let picks: Played[] = [];
  let began = 0;
  let send: (a: Answer) => void = () => {};

  const draw = () => {
    root.replaceChildren();
    if (!preset) return;
    const t = words(locale);
    if (task) {
      const prompt = document.createElement("p");
      prompt.className = "prompt";
      prompt.textContent = task.prompt;
      root.append(prompt);
    }
    const frets = preset.frets;
    const width = PAD * 2 + OPEN_W + frets * FRET_W, height = PAD * 2 + STRING_GAP * (STANDARD.length - 1);
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "neck");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", t.neck);
    const x = (fret: number) => (fret === 0 ? PAD + OPEN_W / 2 : PAD + OPEN_W + (fret - 0.5) * FRET_W);
    const y = (string: number) => PAD + (string - 1) * STRING_GAP;
    const el = (name: string, attrs: Record<string, string | number>, parent: Element = svg) => {
      const e = document.createElementNS(SVG, name);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      parent.append(e);
      return e;
    };
    // the frets, the nut, the inlays and the strings
    el("line", { x1: PAD + OPEN_W, y1: PAD, x2: PAD + OPEN_W, y2: y(6), class: "nut" });
    for (let f = 1; f <= frets; f++) el("line", { x1: PAD + OPEN_W + f * FRET_W, y1: PAD, x2: PAD + OPEN_W + f * FRET_W, y2: y(6), class: "fret" });
    for (const f of INLAYS.filter((f) => f <= frets)) el("circle", { cx: x(f), cy: (y(3) + y(4)) / 2, r: 5, class: "inlay" });
    // the octave: two dots, between strings 2 and 3 and between 4 and 5
    if (frets >= 12) for (const [a, b] of [[2, 3], [4, 5]] as const) el("circle", { cx: x(12), cy: (y(a) + y(b)) / 2, r: 5, class: "inlay" });
    for (let s = 1; s <= STANDARD.length; s++) el("line", { x1: PAD, y1: y(s), x2: width - PAD, y2: y(s), class: `string s${s}` });

    const marks = [...shown(preset, task?.hideChecks ?? false), ...tutor];
    const roleAt = (p: Position) => (marks.find((m) => same(m.position, p) && m.role === "tutor") ?? marks.find((m) => same(m.position, p)))?.role;
    for (let s = 1; s <= STANDARD.length; s++) {
      for (let f = 0; f <= frets; f++) {
        const position = { string: s, fret: f };
        const picked = picks.some((p) => same(p.position, position));
        const role = roleAt(position);
        const g = el("g", {
          class: ["spot", role ?? "", picked ? "picked" : ""].filter(Boolean).join(" "),
          role: "button", tabindex: 0, "aria-pressed": String(picked),
          "aria-label": t.spot(s, f, pitchAt(position)),
          "data-string": s, "data-fret": f,
        });
        el("circle", { cx: x(f), cy: y(s), r: 11 }, g);
        const pick = () => { picks = toggle(picks, position, Math.max(0, Math.round(now() - began))); draw(); };
        g.addEventListener("click", pick);
        g.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") { e.preventDefault(); pick(); } });
      }
    }
    root.append(svg);

    if (task) {
      const bar = document.createElement("div");
      bar.className = "answer-bar";
      const clear = Object.assign(document.createElement("button"), { type: "button", textContent: t.clear, className: "quiet" });
      clear.disabled = picks.length === 0;
      clear.addEventListener("click", () => { picks = []; draw(); });
      const done = Object.assign(document.createElement("button"), { type: "button", textContent: t.send, className: "primary" });
      done.disabled = picks.length === 0;
      done.addEventListener("click", () => send(answer(picks)));
      bar.append(clear, done);
      root.append(bar);
    }
  };

  return {
    start(p, opts) {
      preset = p;
      task = opts.task;
      locale = opts.locale;
      tutor = [];
      picks = [];
      began = now();
      draw();
    },
    setLocale(l) { locale = l; draw(); },
    command(name, notes = []) {
      if (!preset) return;
      tutor = name === "highlight" ? highlighted(notes, preset.frets) : [];
      draw();
    },
    onAnswer(fn) { send = fn; },
  };
}
