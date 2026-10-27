// The page Narai frames, and every line of it that talks to Narai: through @michinarai/sdk alone, as any publisher's tool.
// The start says what to play (the step's preset) and, when Narai judges an item, the task; its kind says whether the
// learner names the interval or plays it, and what they did goes back as the task's answer. The Tutor may `replay`,
// nothing else (the manifest says so, and the SDK holds both sides to it).
import { connect } from "@michinarai/sdk";
import { manifest } from "./manifest.ts";
import { webAudio } from "./audio.ts";
import { mountTrainer } from "./trainer.ts";
import { modeOf, readPreset } from "./model.ts";
import { pickLocale } from "./words.ts";
import "./intervals.css";

const root = document.getElementById("tool");
if (!root) throw new Error("intervals: no #tool");

const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] });
const preset = readPreset(session.start.preset);
const task = session.task;
const mode = modeOf(task?.kind ?? null);
if (!preset || mode === null) {
  session.close("error");
} else {
  const tool = mountTrainer(root, webAudio());
  const locale = pickLocale([session.start.locale, ...session.start.fallback]);
  tool.onAnswer((a) => session.answer(a));
  session.onCommand("replay", () => tool.replay());
  session.onLocale((m) => tool.setLocale(pickLocale([m.locale, ...m.fallback])));
  tool.start(preset, { locale, task: task && mode !== "free" ? { prompt: task.prompt, mode } : null });
  session.ready(locale);
}
