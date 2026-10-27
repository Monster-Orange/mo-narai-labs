// The hostile tool's page: connects like any tool, says it's ready, then runs every attempt and lists what happened to
// each on the page (the harness shows the host's side). It conforms on paper; nothing it tries should get through.
import { connect } from "@narai/sdk";
import { manifest } from "./manifest.ts";
import { ATTEMPTS } from "./attempts.ts";

const root = document.getElementById("tool");
const tool = await connect(manifest, { hostOrigins: ["https://michinar.ai"] });
tool.ready("en");
const list = document.createElement("ol");
for (const attempt of ATTEMPTS) {
  let outcome = "sent";
  try {
    attempt.run({ tool, parent: window.parent });
  } catch (e) {
    outcome = `thrown: ${(e as Error).message}`;
  }
  const li = document.createElement("li");
  li.textContent = `${attempt.name}: ${outcome} (must be ${attempt.expect})`;
  li.dataset.attempt = attempt.name;
  li.dataset.outcome = outcome.startsWith("thrown") ? "thrown" : "sent";
  list.append(li);
}
root?.append(list);
