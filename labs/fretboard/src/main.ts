// The page Narai frames, and every line of it that talks to Narai: through @michinarai/sdk alone, as any publisher's tool.
// The start sets the neck up (the step's music.neck-preset@1) and, when Narai judges an item, gives the task, whose
// payload says what to show; the learner's picks go back as the task's answer (music.played@1); what the neck shows goes
// to Narai as its state (music.neck-state@1); the Tutor may `highlight` and `clear`, nothing else, and each is answered
// (a highlight that names no note is refused). The picks are kept in this launch's storage, so a reload keeps them.
// The course quotes the #region blocks here (session, commands, storage), in model.ts, words.ts and harness.mjs (narai-tools, demo "The
// fretboard"): keep each one whole and short.
import { CommandRefused, connect, type Payload } from "@michinarai/sdk";
import { manifest } from "./manifest.ts";
import { mountFretboard } from "./fretboard.ts";
import { readPicks, type Preset } from "./model.ts";
import { pickLocale } from "./words.ts";
import "./fretboard.css";

const root = document.getElementById("tool");
if (!root) throw new Error("fretboard: no #tool");

// #region session
const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] });
const preset = session.start.preset as Preset | null; // the SDK has checked it against Narai's music.neck-preset@1
if (!preset) session.close("error");
const tool = mountFretboard(root);
const locale = pickLocale([session.start.locale, ...session.start.fallback]);
const task = session.task;
tool.onAnswer((a) => session.answer(a));
if (preset) tool.start(preset, { locale, prompt: task?.prompt ?? null, show: notesOf(task?.payload) });
session.ready(locale);
// what it shows, once ready, then every change
const shown = tool.current();
if (shown) session.state(shown);
tool.onState((s) => session.state(s));
// #endregion session

// #region commands
// a command that came before its handler waits for it (the SDK holds it); each is answered: an ack, or the refusal
session.onCommand("highlight", (p: Payload) => {
  if (!tool.highlight(notesOf(p))) throw new CommandRefused("invalid_payload", "a highlight names notes on this neck");
});
session.onCommand("clear", () => void tool.highlight([]));
session.onLocale((m) => tool.setLocale(pickLocale([m.locale, ...m.fallback])));
// #endregion commands

// #region storage
// this launch's own: each change to the picks is kept, and storage answers once the tool is ready, so the picks kept
// before a reload come back then
tool.onPicks((picks) => void session.storage.set("picks", picks));
const kept = await session.storage.get("picks");
if (kept.ok) tool.restore(readPicks(kept.value));
// #endregion storage

/** music.notes@1's notes (the SDK has checked a command's payload; a task's is read here, defensively). */
function notesOf(p: Payload | null | undefined): string[] {
  return p && Array.isArray(p.notes) ? p.notes.filter((n): n is string => typeof n === "string") : [];
}
