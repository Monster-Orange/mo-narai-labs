// The tapper on the page: the cycle's beats (each with its syllable, a group's first beat with its clap or wave), a
// pulse that walks them at the tempo after the count-in, and a Tap button (or the space bar). On a task Narai judges
// it shows Narai's prompt (already in the learner's language), and Send hands the taps to `onAnswer`. In free play each
// tap goes to `onTap`, for practice. It never says whether a tap was on the beat. Its clock starts at the first beat
// after the count-in, as music.taps@1 counts.
import { beatAt, beatMs, groupStart } from "./theory.ts";
import { taps, type Preset, type Source, type Taps } from "./model.ts";
import { words, type Locale } from "./words.ts";

export interface Tool {
  start(preset: Preset, opts: { locale: Locale; task: { prompt: string } | null }): void;
  setLocale(locale: Locale): void;
  onAnswer(send: (a: Taps) => void): void;
  /** Free play: each tap, ms from the first beat, and how it was tapped. */
  onTap(fn: (at: number, source: Source) => void): void;
  /** Ms since the first beat: the clock taps are on. */
  elapsed(): number;
}

export function mountTapper(root: HTMLElement, now: () => number = () => performance.now()): Tool {
  let preset: Preset | null = null;
  let task: { prompt: string } | null = null;
  let locale: Locale = "en";
  let tapped: number[] = [];
  let sources: Source[] = [];
  let zero = 0; // the first beat after the count-in, on `now`'s clock
  let send: (a: Taps) => void = () => {};
  let onTap: (at: number, source: Source) => void = () => {};
  let cells: HTMLElement[] = [];
  let count: HTMLElement | null = null;

  const tap = (source: Source) => {
    if (!preset) return;
    const at = Math.round(now() - zero);
    if (at < -beatMs(preset.tempo_bpm) / 2) return; // still counting in: not a tap of the cycle
    const t = Math.max(0, at);
    tapped = [...tapped, t];
    sources = [...sources, source];
    if (task) draw();
    else { onTap(t, source); if (count) count.textContent = words(locale).tapped(tapped.length); }
  };
  document.addEventListener("keydown", (e) => { if (e.key === " " && preset) { e.preventDefault(); tap("key"); } });
  const pulse = () => {
    if (preset && cells.length) {
      const ms = now() - zero;
      const beat = ms < 0 ? -1 : beatAt(ms, preset.tempo_bpm, preset);
      cells.forEach((c, i) => c.classList.toggle("now", i === beat));
      if (count && ms < 0) count.textContent = words(locale).countIn(Math.ceil(-ms / beatMs(preset.tempo_bpm)));
    }
    requestAnimationFrame(pulse);
  };
  requestAnimationFrame(pulse);

  const draw = () => {
    root.replaceChildren();
    if (!preset) return;
    const t = words(locale), cycle = preset;
    if (task) root.append(Object.assign(document.createElement("p"), { className: "prompt", textContent: task.prompt }));
    const list = document.createElement("ol");
    list.className = "cycle";
    list.setAttribute("aria-label", t.cycle(cycle.name, cycle.beats, cycle.groups));
    cells = Array.from({ length: cycle.beats }, (_, beat) => {
      const g = groupStart(beat, cycle);
      const li = document.createElement("li");
      li.className = g === null ? "beat" : "beat starts";
      li.append(Object.assign(document.createElement("span"), { className: "bol", textContent: cycle.syllables?.[beat] ?? String(beat + 1) }));
      const hand = g === null ? undefined : cycle.hands?.[g];
      if (hand) li.append(Object.assign(document.createElement("span"), { className: "hand", textContent: t.hand[hand] }));
      list.append(li);
      return li;
    });
    root.append(list);
    const bar = document.createElement("div");
    bar.className = "answer-bar";
    const pad = Object.assign(document.createElement("button"), { type: "button", className: "tap", textContent: t.tap });
    pad.addEventListener("pointerdown", (e) => { e.preventDefault(); tap("touch"); });
    count = Object.assign(document.createElement("span"), { className: "count", textContent: t.tapped(tapped.length) });
    bar.append(count);
    if (task) {
      const clear = Object.assign(document.createElement("button"), { type: "button", textContent: t.clear, className: "quiet" });
      const done = Object.assign(document.createElement("button"), { type: "button", textContent: t.send, className: "primary" });
      clear.disabled = done.disabled = tapped.length === 0;
      clear.addEventListener("click", () => { tapped = []; sources = []; draw(); });
      done.addEventListener("click", () => send(taps(tapped, sources)));
      bar.append(clear, done);
    }
    root.append(pad, bar);
  };

  return {
    start(p, opts) {
      preset = p; task = opts.task; locale = opts.locale; tapped = []; sources = [];
      zero = now() + p.count_in_beats * beatMs(p.tempo_bpm);
      draw();
    },
    setLocale(l) { locale = l; draw(); },
    onAnswer(fn) { send = fn; },
    onTap(fn) { onTap = fn; },
    elapsed() { return Math.max(0, Math.round(now() - zero)); },
  };
}
