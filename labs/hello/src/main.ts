// The smallest tool Narai hosts: it shows the step's options, the learner picks one, and the pick goes back as the
// task's answer. Narai judges it; the tool never knows which option is right. The course quotes its regions
// (narai-tools, module "Meet the SDK"): keep each one whole and short.
import { connect, defineTool } from "@michinarai/sdk";
import manifestJson from "../narai-tool.json";

// #region connect
const manifest = defineTool(manifestJson); // narai-tool.json, checked as it loads
const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] }); // only Narai may connect
// #endregion connect

// #region show
const preset = session.start.preset; // the step's setup: hello.options@1
const options = Array.isArray(preset?.options) ? preset.options.map(String) : [];
const root = document.getElementById("tool") ?? document.body;
const prompt = Object.assign(document.createElement("p"), { textContent: session.task?.prompt ?? "" });
root.append(prompt); // Narai's prompt, already in the learner's language, shown as given
for (const option of options) {
  const button = Object.assign(document.createElement("button"), { type: "button", textContent: option });
  button.disabled = session.task === null; // free play: nothing to answer
  button.addEventListener("click", () => session.answer({ schema: "hello.choice@1", choice: option })); // what they did, never whether it was right
  root.append(button);
}
// #endregion show

// #region ready
const locale = manifest.locales?.includes(session.start.locale) ? session.start.locale : "en";
session.ready(locale); // answers are taken from here on
// #endregion ready
