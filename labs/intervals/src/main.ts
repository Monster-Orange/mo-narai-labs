// The page Narai frames, and every line of it that talks to Narai: through @michinarai/sdk alone, as any publisher's tool.
// The start says what to play (the step's preset) and, when Narai judges an item, the task; its kind says whether the
// learner names the interval or plays it, and what they did goes back as the task's answer. The Tutor may `replay`,
// nothing else (the manifest says so, and the SDK holds both sides to it). What it plays, and whether it is sounding,
// goes to Narai as its state; the answer begun is kept in this launch's storage, so a reload keeps it. The course
// quotes the #region blocks here (session, storage),
// in model.ts and in audio.ts (narai-tools, demo "The interval trainer"): keep each one whole and short.
import { connect, pickLocale } from "@michinarai/sdk";
import { manifest } from "./manifest.ts";
import { webAudio } from "./audio.ts";
import { mountTrainer } from "./trainer.ts";
import { modeOf, readKept, readPreset } from "./model.ts";
import { LOCALES } from "./words.ts";
import "./intervals.css";

const root = document.getElementById("tool");
if (!root) throw new Error("intervals: no #tool");

// #region session
const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] });
const preset = readPreset(session.start.preset);
const task = session.task;
const mode = modeOf(task?.kind ?? null);
if (!preset || mode === null) session.close("error");
const tool = mountTrainer(root, webAudio());
const locale = pickLocale(session.start, LOCALES);
tool.onAnswer((a) => session.answer(a));
session.onCommand("replay", () => tool.replay());
session.onLocale((m) => tool.setLocale(pickLocale(m, LOCALES)));
if (preset && mode !== null) tool.start(preset, { locale, task: task && mode !== "free" ? { prompt: task.prompt, mode } : null });
session.ready(locale);
// what it plays, once ready, then each time it starts or stops sounding
const shown = tool.current();
if (shown) session.state(shown);
tool.onState((s) => session.state(s));
// #endregion session

// #region storage
// the answer begun, kept on each change; after a reload it comes back once the tool is ready
tool.onKept((k) => void session.storage.set("answer", k));
const kept = await session.storage.get("answer");
if (kept.ok) tool.restore(readKept(kept.value));
// #endregion storage
