// The page Narai frames, and every line of it that talks to Narai: through @michinarai/sdk alone, as any publisher's tool.
// The start says what to show (the step's preset) and, when Narai judges an item, the task; the learner's picks go back
// as the task's answer; the Tutor may `highlight` and `clear`, nothing else (the manifest says so, and the SDK holds
// both sides to it). The course quotes the #region blocks here, in model.ts, words.ts and harness.mjs (narai-tools,
// demo "The fretboard"): keep each one whole and short.
import { connect, type Payload } from "@michinarai/sdk";
import { manifest } from "./manifest.ts";
import { mountFretboard } from "./fretboard.ts";
import { readPreset } from "./model.ts";
import { pickLocale } from "./words.ts";
import "./fretboard.css";

const root = document.getElementById("tool");
if (!root) throw new Error("fretboard: no #tool");

// #region session
const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] });
const preset = readPreset(session.start.preset);
if (!preset) {
  session.close("error");
} else {
  const tool = mountFretboard(root);
  const locale = pickLocale([session.start.locale, ...session.start.fallback]);
  const task = session.task;
  tool.onAnswer((a) => session.answer(a));
  session.onCommand("highlight", (p: Payload) => tool.command("highlight", notesOf(p)));
  session.onCommand("clear", () => tool.command("clear"));
  session.onLocale((m) => tool.setLocale(pickLocale([m.locale, ...m.fallback])));
  tool.start(preset, { locale, task: task ? { prompt: task.prompt, hideChecks: task.assist === "none" } : null });
  session.ready(locale);
}
// #endregion session

/** music.notes@1's notes (the SDK has checked the payload's schema name; its body is read here, defensively). */
function notesOf(p: Payload): string[] {
  return Array.isArray(p.notes) ? p.notes.filter((n): n is string => typeof n === "string") : [];
}
