// The tapper on the page: the cycle's beats (each with its bol, a division's first beat with its clap or wave), a
// pulse that walks them at the tempo, and a Tap button (or the space bar). On a task Narai judges it shows Narai's
// prompt (already in the learner's language), and Send hands the taps to `onAnswer`. In free play each tap goes to
// `onTap`, for practice. It never says whether a tap was on the beat.
import { TALS, beatAt, vibhagStart } from "./theory.ts";
import { taps, type Preset, type Taps } from "./model.ts";
import { words, type Locale } from "./words.ts";

export interface Tool {
  start(preset: Preset, opts: { locale: Locale; task: { prompt: string } | null }): void;
  setLocale(locale: Locale): void;
  onAnswer(send: (a: Taps) => void): void;
  /** Free play: each tap, ms from the start. */
  onTap(fn: (at: number) => void): void;
  /** Ms since the start: the clock taps are on. */
  elapsed(): number;
}

export function mountTapper(root: HTMLElement, now: () => number = () => performance.now()): Tool {
  let preset: Preset | null = null;
  let task: { prompt: string } | null = null;
  let locale: Locale = "en";
  let tapped: number[] = [];
  let began = 0;
  let send: (a: Taps) => void = () => {};
  let onTap: (at: number) => void = () => {};
  let cells: HTMLElement[] = [];
  let count: HTMLElement | null = null;

  const tap = () => {
    const at = Math.max(0, Math.round(now() - began));
    if (task) { tapped = [...tapped, at]; draw(); } else { onTap(at); tapped = [...tapped, at]; if (count) count.textContent = words(locale).tapped(tapped.length); }
  };
  document.addEventListener("keydown", (e) => { if (e.key === " " && preset) { e.preventDefault(); tap(); } });
  const pulse = () => {
    if (preset && cells.length) {
      const beat = beatAt(now() - began, preset.tempo_bpm, TALS[preset.tal]);
      cells.forEach((c, i) => c.classList.toggle("now", i === beat));
    }
    requestAnimationFrame(pulse);
  };
  requestAnimationFrame(pulse);

  const draw = () => {
    root.replaceChildren();
    if (!preset) return;
    const t = words(locale), tal = TALS[preset.tal];
    if (task) root.append(Object.assign(document.createElement("p"), { className: "prompt", textContent: task.prompt }));
    const cycle = document.createElement("ol");
    cycle.className = "cycle";
    cycle.setAttribute("aria-label", t.cycle);
    cells = tal.bols.map((bol, beat) => {
      const v = vibhagStart(beat, tal);
      const li = document.createElement("li");
      li.className = v === null ? "beat" : "beat starts";
      li.append(Object.assign(document.createElement("span"), { className: "bol", textContent: bol }));
      if (v !== null) li.append(Object.assign(document.createElement("span"), { className: "hand", textContent: t.hand[tal.hands[v] ?? "clap"] }));
      cycle.append(li);
      return li;
    });
    root.append(cycle);
    const bar = document.createElement("div");
    bar.className = "answer-bar";
    const pad = Object.assign(document.createElement("button"), { type: "button", className: "tap", textContent: t.tap });
    pad.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(); });
    count = Object.assign(document.createElement("span"), { className: "count", textContent: t.tapped(tapped.length) });
    bar.append(count);
    if (task) {
      const clear = Object.assign(document.createElement("button"), { type: "button", textContent: t.clear, className: "quiet" });
      const done = Object.assign(document.createElement("button"), { type: "button", textContent: t.send, className: "primary" });
      clear.disabled = done.disabled = tapped.length === 0;
      clear.addEventListener("click", () => { tapped = []; draw(); });
      done.addEventListener("click", () => send(taps(tapped)));
      bar.append(clear, done);
    }
    root.append(pad, bar);
  };

  return {
    start(p, opts) { preset = p; task = opts.task; locale = opts.locale; tapped = []; began = now(); draw(); },
    setLocale(l) { locale = l; draw(); },
    onAnswer(fn) { send = fn; },
    onTap(fn) { onTap = fn; },
    elapsed() { return Math.max(0, Math.round(now() - began)); },
  };
}
