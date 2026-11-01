// The smallest tool Narai hosts: it shows the step's options, the learner picks one, and the pick goes back as the
// task's answer (with no task, as practice). Narai judges it; the tool never knows which option is right. The course
// quotes its regions (narai-tools, module "Meet the SDK"): keep each one whole and short.
import { connect, defineTool } from "@michinarai/sdk";
import manifestJson from "../narai-tool.json";

// with no task the tool says so, and a pick is practice
const PRACTICE: Record<string, string> = {
  en: "Practice: Narai isn't asking anything yet.",
  ja: "練習モード：Narai からの質問はまだありません。",
};

// #region connect
const manifest = defineTool(manifestJson); // narai-tool.json, checked as it loads
const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] }); // only Narai may connect
// #endregion connect

// #region show
const preset = session.start.preset; // the step's setup: hello.options@1
const options = Array.isArray(preset?.options) ? preset.options.map(String) : [];
const locale = manifest.locales?.includes(session.start.locale) ? session.start.locale : "en";
const root = document.getElementById("tool") ?? document.body;
const task = session.task; // none: practice, never dead
const prompt = Object.assign(document.createElement("p"), { textContent: task?.prompt ?? PRACTICE[locale] });
root.append(prompt); // Narai's prompt, already in the learner's language, shown as given
const began = Date.now();
for (const option of options) {
  const button = Object.assign(document.createElement("button"), { type: "button", textContent: option });
  button.addEventListener("click", () => {
    const pick = { schema: "hello.choice@1", choice: option }; // what they did, never whether it was right
    if (task) session.answer(pick);
    else session.practice("pick", { duration_s: Math.round((Date.now() - began) / 1000), attempts: 1, payload: pick });
  });
  root.append(button);
}
// #endregion show

// #region ready
session.ready(locale); // answers are taken from here on
// #endregion ready
