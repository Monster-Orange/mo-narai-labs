// The page Narai frames, and every line of it that talks to Narai: through @michinarai/sdk alone, as any publisher's tool.
// The start says which cycle, how fast and how long a count-in (the step's preset, Narai's music.cycle-preset@1) and,
// when Narai judges an item, the task: the taps go
// back as its answer. Without a task the learner taps freely, and that goes to Narai as practice, batched under the
// host's limit. The course quotes the #region blocks here, in model.ts and in harness.mjs (narai-tools, demo "The rhythm tapper"): keep
// each one whole and short.
import { connect, pickLocale } from "@michinarai/sdk";
import { manifest } from "./manifest.ts";
import { mountTapper } from "./tapper.ts";
import { practiceBatch, readPreset } from "./model.ts";
import { LOCALES } from "./words.ts";
import "./rhythm.css";

const root = document.getElementById("tool");
if (!root) throw new Error("rhythm: no #tool");

const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] });
const preset = readPreset(session.start.preset);
const task = session.task;
if (!preset || (task && task.kind !== "tap_cycle")) {
  session.close("error");
} else {
  const tool = mountTapper(root);
  const locale = pickLocale(session.start, LOCALES);
  tool.onAnswer((a) => session.answer(a));
  session.onLocale((m) => tool.setLocale(pickLocale(m, LOCALES)));
  // #region practice
  if (!task) {
    const batch = practiceBatch(preset.beats);
    const report = (force: boolean) => {
      const r = batch.take(tool.elapsed(), force);
      if (r) session.practice("free_tap", r); // what they tapped, never how well
    };
    tool.onTap((at, source) => { batch.tap(at, source); report(false); });
    setInterval(() => report(false), 5_000);
    addEventListener("pagehide", () => report(true));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") report(true); });
  }
  // #endregion practice
  tool.start(preset, { locale, task: task ? { prompt: task.prompt } : null });
  session.ready(locale);
}
