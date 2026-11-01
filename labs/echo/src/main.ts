// A test fixture, never in a lesson: it shows what the start says about the learner and nothing else. A learner who
// linked their account with the publisher and let its tools know them arrives with a `subject` (SDK 0.3.3, only for a
// manifest that declares surfaces.account_link); anyone else arrives with none. Narai's e2e reads it back.
import { connect, defineTool } from "@michinarai/sdk";
import manifestJson from "../narai-tool.json";

const manifest = defineTool(manifestJson); // narai-tool.json, checked as it loads
const session = await connect(manifest, { hostOrigins: ["https://michinar.ai"] }); // only Narai may connect

const root = document.getElementById("tool") ?? document.body;
const subject = Object.assign(document.createElement("output"), { textContent: session.start.subject ?? "none" });
subject.dataset.subject = "";
root.append(subject);
session.ready("en");
