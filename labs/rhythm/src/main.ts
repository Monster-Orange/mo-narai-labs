// The page Narai frames, and every line of it that talks to Narai: through @michinarai/sdk alone, as any publisher's tool.
// The start says which cycle and how fast (the step's preset) and, when Narai judges an item, the task: the taps go
// back as its answer. Without a task the learner taps freely, and that goes to Narai as practice, batched under the
// host's limit. The course quotes the #region blocks here and in model.ts (narai-tools, demo "The rhythm tapper"): keep
// each one whole and short.
import { connect } from "@michinarai/sdk";
import { manifest } from "./manifest.ts";
import { mountTapper } from "./tapper.ts";
import { practiceBatch, readPreset } from "./model.ts";
import { TALS } from "./theory.ts";
import { pickLocale } from "./words.ts";
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
  const locale = pickLocale([session.start.locale, ...session.start.fallback]);
  tool.onAnswer((a) => session.answer(a));
  session.onLocale((m) => tool.setLocale(pickLocale([m.locale, ...m.fallback])));
  // #region practice
  if (!task) {
    const batch = practiceBatch(TALS[preset.tal].beats);
    const report = (force: boolean) => {
      const r = batch.take(tool.elapsed(), force);
      if (r) session.practice("free_tap", r); // what they tapped, never how well
    };
    tool.onTap((at) => { batch.tap(at); report(false); });
    setInterval(() => report(false), 5_000);
    addEventListener("pagehide", () => report(true));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") report(true); });
  }
  // #endregion practice
  tool.start(preset, { locale, task: task ? { prompt: task.prompt } : null });
  session.ready(locale);
}
