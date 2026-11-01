// The fretboard on the page: a neck drawn in SVG as Narai's preset sets it up (its strings, frets and capo, mirrored for
// a left hand), every position a button, and the neck one tab stop: the arrows move between them, Enter or Space plays
// (`rove`). It shows what it is told to highlight (the task's notes, the Tutor's), each
// mark labeled as the preset asks, and the learner's picks. On a task Narai judges it shows Narai's prompt (already in
// the learner's language), and Send hands the picks to `onAnswer` as a music.played@1 answer. It never says whether
// they are right. What it shows goes to `onState` (music.neck-state@1) each time it changes; the picks go to `onPicks`.
// A tap plucks the string. On a step that grants the microphone, Listen hears the learner's own guitar: each note it
// hears joins the picks (its pitch and time, no place), and only notes leave it.
import { lowest, pitchAt, pitchName, same, sounding, type Position } from "./theory.ts";
import { NOTHING, answer, heard, highlighted, neckOf, placed, rove, state, toggle, type Answer, type Mark, type Played, type Preset, type Show, type State } from "./model.ts";
import { listen, type Listening } from "./mic.ts";
import type { Player } from "./sound.ts";
import { words, type Locale } from "./words.ts";

const SVG = "http://www.w3.org/2000/svg";
const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21, 27, 29, 31, 33];
const FRET_W = 64, STRING_GAP = 28, PAD = 24, OPEN_W = 40;

/** The tool, as main.ts drives it from the SDK's session: started with a step's preset (and a task, if any), sent the
 *  Tutor's commands, handing back what the learner played and what it shows. */
export interface Tool {
  /** `mic`: the step granted the microphone and the frame allows it (mic.ts micAllowed), so Listen is offered. */
  start(preset: Preset, opts: { locale: Locale; prompt: string | null; show: Show; mic: boolean }): void;
  /** Picks kept from before (a reload): they keep their times, and new ones follow on from the last. */
  restore(picks: readonly Played[]): void;
  setLocale(locale: Locale): void;
  /** Highlight these (nothing clears); false when a pitch isn't on this neck, and nothing changes. */
  highlight(show: Show): boolean;
  onAnswer(send: (a: Answer) => void): void;
  /** What it shows now (music.neck-state@1), once started. */
  current(): State | null;
  /** Each change to what it shows, from here on. */
  onState(send: (s: State) => void): void;
  onPicks(keep: (picks: readonly Played[]) => void): void;
}

export function mountFretboard(root: HTMLElement, now: () => number = () => performance.now(), sound: Player = { play() {} }): Tool {
  let preset: Preset | null = null;
  let mic = false;
  let listening: Listening | null = null;
  let latency: number | null = null;
  let refused = false;
  let prompt: string | null = null;
  let locale: Locale = "en";
  let marks: Mark[] = [];
  let picks: Played[] = [];
  let began = 0;
  let send: (a: Answer) => void = () => {};
  let report: (s: State) => void = () => {};
  let keep: (picks: readonly Played[]) => void = () => {};
  // the one spot in the tab order (a roving tabindex), and whether focus is on the neck, to put back after a redraw
  let focus: Position | null = null;
  const pick = (list: Played[]) => { picks = list; keep(picks); draw(); };

  const draw = () => {
    const onNeck = !!root.querySelector(".spot:focus");
    root.replaceChildren();
    if (!preset) return;
    const current = preset;
    const t = words(locale);
    const neck = neckOf(preset);
    if (prompt) {
      const p = document.createElement("p");
      p.className = "prompt";
      p.textContent = prompt;
      root.append(p);
    }
    const strings = neck.tuning.length, from = lowest(neck), frets = neck.frets;
    const width = PAD * 2 + OPEN_W + (frets - from) * FRET_W, height = PAD * 2 + STRING_GAP * (strings - 1);
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", preset.handed === "left" ? "neck left" : "neck");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", t.neck);
    const x = (fret: number) => (fret === from ? PAD + OPEN_W / 2 : PAD + OPEN_W + (fret - from - 0.5) * FRET_W);
    const y = (string: number) => PAD + (string - 1) * STRING_GAP;
    const el = (name: string, attrs: Record<string, string | number>, parent: Element = svg) => {
      const e = document.createElementNS(SVG, name);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      parent.append(e);
      return e;
    };
    // the nut (or the capo), the frets, the inlays and the strings
    el("line", { x1: PAD + OPEN_W, y1: PAD, x2: PAD + OPEN_W, y2: y(strings), class: from > 0 ? "nut capo" : "nut" });
    for (let f = from + 1; f <= frets; f++) el("line", { x1: PAD + OPEN_W + (f - from) * FRET_W, y1: PAD, x2: PAD + OPEN_W + (f - from) * FRET_W, y2: y(strings), class: "fret" });
    const middle = (y(Math.floor(strings / 2)) + y(Math.floor(strings / 2) + 1)) / 2;
    for (const f of INLAYS.filter((f) => f > from && f <= frets)) el("circle", { cx: x(f), cy: middle, r: 5, class: "inlay" });
    // the octaves: two dots, a string pair in from each edge
    for (const f of [12, 24, 36].filter((f) => f > from && f <= frets)) {
      for (const [a, b] of [[2, 3], [strings - 2, strings - 1]] as const) el("circle", { cx: x(f), cy: (y(a) + y(b)) / 2, r: 5, class: "inlay" });
    }
    for (let s = 1; s <= strings; s++) el("line", { x1: PAD, y1: y(s), x2: width - PAD, y2: y(s), class: `string s${s}` });
    // the tab stop: where focus was, else the first thing shown, else the first string's lowest note
    const inNeck = (p: Position) => p.string >= 1 && p.string <= strings && p.fret >= from && p.fret <= frets;
    const stop: Position = focus && inNeck(focus) ? focus : marks[0]?.position ?? { string: 1, fret: from };
    focus = stop;
    let focused: SVGElement | null = null;

    for (let s = 1; s <= strings; s++) {
      for (let f = from; f <= frets; f++) {
        const position: Position = { string: s, fret: f };
        const picked = picks.some((p) => placed(p) && same(p, position));
        const mark = marks.find((m) => same(m.position, position));
        const g = el("g", {
          class: ["spot", mark ? "shown" : "", picked ? "picked" : ""].filter(Boolean).join(" "),
          role: "button", tabindex: same(stop, position) ? 0 : -1, "aria-pressed": String(picked),
          "aria-label": t.spot(s, f, pitchAt(neck, position)),
          "data-string": s, "data-fret": f,
        });
        el("circle", { cx: x(f), cy: y(s), r: 11 }, g);
        if (mark?.label) el("text", { x: x(f), y: y(s), class: "label", "aria-hidden": "true" }, g).textContent = mark.label;
        const tap = () => {
          const next = toggle(current, picks, position, Math.max(0, Math.round(now() - began)));
          if (next.length > picks.length) sound.play(sounding(neck, position));
          pick(next);
        };
        if (same(stop, position)) focused = g as SVGElement;
        g.addEventListener("click", () => { focus = position; tap(); });
        g.addEventListener("keydown", (e) => {
          const key = (e as KeyboardEvent).key;
          if (key === "Enter" || key === " ") { e.preventDefault(); focus = position; tap(); return; }
          const next = rove(current, position, key);
          if (!next) return;
          e.preventDefault();
          focus = next;
          for (const spot of svg.querySelectorAll<SVGElement>(".spot")) {
            const here = Number(spot.dataset.string) === next.string && Number(spot.dataset.fret) === next.fret;
            spot.setAttribute("tabindex", here ? "0" : "-1");
            if (here) spot.focus();
          }
        });
      }
    }
    root.append(svg);
    if (onNeck) (focused as SVGElement | null)?.focus();

    if (mic) {
      const bar = document.createElement("div");
      bar.className = "listen-bar";
      const button = Object.assign(document.createElement("button"), { type: "button", textContent: listening ? t.stop : t.listen, className: "quiet" });
      button.setAttribute("aria-pressed", String(!!listening));
      button.addEventListener("click", () => void toggleListening());
      const said = document.createElement("p");
      said.className = "heard";
      said.setAttribute("aria-live", "polite");
      const notes = picks.filter((p) => !placed(p)).map((p) => pitchName(p.pitch));
      said.textContent = refused ? t.micRefused : notes.length ? t.heard(notes.join(" ")) : "";
      bar.append(button, said);
      root.append(bar);
    }

    if (prompt) {
      const bar = document.createElement("div");
      bar.className = "answer-bar";
      const clear = Object.assign(document.createElement("button"), { type: "button", textContent: t.clear, className: "quiet" });
      clear.disabled = picks.length === 0;
      clear.addEventListener("click", () => pick([]));
      const done = Object.assign(document.createElement("button"), { type: "button", textContent: t.send, className: "primary" });
      done.disabled = picks.length === 0;
      done.addEventListener("click", () => send(answer(picks, latency)));
      bar.append(clear, done);
      root.append(bar);
    }
  };

  const toggleListening = async () => {
    if (listening) { listening.stop(); listening = null; draw(); return; }
    try {
      listening = await listen(now, (n) => pick(heard(picks, n.pitch, Math.max(0, Math.round(n.at_ms - began)))));
      latency = listening.latency_ms;
      refused = false;
    } catch {
      refused = true; // the learner said no, or there is no microphone: the neck still plays
    }
    draw();
  };

  const show = (what: Show): boolean => {
    if (!preset) return false;
    const next = highlighted(preset, what);
    if (!next) return false;
    marks = next;
    report(state(preset, marks));
    draw();
    return true;
  };

  return {
    start(p, opts) {
      preset = p;
      prompt = opts.prompt;
      locale = opts.locale;
      mic = opts.mic;
      picks = [];
      began = now();
      marks = [];
      if (!show(opts.show)) show(NOTHING);
    },
    restore(kept) {
      if (!preset || kept.length === 0) return;
      picks = [...kept];
      began = now() - (Math.max(...picks.map((q) => q.at_ms)) + 1);
      draw();
    },
    setLocale(l) { locale = l; draw(); },
    highlight: show,
    current: () => (preset ? state(preset, marks) : null),
    onAnswer(fn) { send = fn; },
    onState(fn) { report = fn; },
    onPicks(fn) { keep = fn; },
  };
}
