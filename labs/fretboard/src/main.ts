// The page Narai frames, and every line of it that talks to Narai: through @michinarai/sdk alone, as any publisher's tool.
// The start sets the neck up (the step's music.neck-preset@1) and, when Narai judges an item, gives the task, whose
// payload says what to show; the learner's picks go back as the task's answer (music.played@1); what the neck shows goes
// to Narai as its state (music.neck-state@1); the Tutor may `highlight` and `clear`, nothing else, and each is answered
// (a highlight that names no note is refused). The picks are kept in this launch's storage, so a reload keeps them.
// A tap plucks its string; on a step that grants the microphone (the start's `granted`), the learner may play their
// own guitar instead, and the notes heard join the answer, never the audio.
// The course quotes the #region blocks here (session, commands, storage), in model.ts, words.ts and harness.mjs (narai-tools, demo "The
// fretboard"): keep each one whole and short.
import { CommandRefused, connect, type Payload, pickLocale } from "@michinarai/sdk";
import { manifest } from "./manifest.ts";
import { mountFretboard } from "./fretboard.ts";
import { micAllowed } from "./mic.ts";
import { player } from "./sound.ts";
import { NOTHING, readPicks, readShow, type Preset } from "./model.ts";
import { LOCALES } from "./words.ts";
import "./fretboard.css";

const root = document.getElementById("tool");
if (!root) throw new Error("fretboard: no #tool");

// #region session
const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] });
const preset = session.start.preset as Preset | null; // the SDK has checked it against Narai's music.neck-preset@1
if (!preset) session.close("error");
const tool = mountFretboard(root, undefined, player());
const locale = pickLocale(session.start, LOCALES);
const task = session.task;
tool.onAnswer((a) => session.answer(a));
// `granted` is the step's grant (FINDINGS #10: not in the SDK yet, so none until it is): no grant, no Listen
const mic = micAllowed((session.start as { granted?: unknown }).granted);
if (preset) tool.start(preset, { locale, prompt: task?.prompt ?? null, show: readShow(task?.payload) ?? NOTHING, mic });
session.ready(locale);
// what it shows, once ready, then every change
const shown = tool.current();
if (shown) session.state(shown);
tool.onState((s) => session.state(s));
// #endregion session

// #region commands
// a command that came before its handler waits for it (the SDK holds it); each is answered: an ack, or the refusal
session.onCommand("highlight", (p: Payload) => {
  const show = readShow(p);
  if (!show || !tool.highlight(show)) throw new CommandRefused("invalid_payload", "a highlight names notes on this neck");
});
session.onCommand("clear", () => void tool.highlight(NOTHING));
session.onLocale((m) => tool.setLocale(pickLocale(m, LOCALES)));
// #endregion commands

// #region storage
// this launch's own: each change to the picks is kept, and storage answers once the tool is ready, so the picks kept
// before a reload come back then
tool.onPicks((picks) => void session.storage.set("picks", picks));
const kept = await session.storage.get("picks");
if (kept.ok) tool.restore(readPicks(kept.value));
// #endregion storage

