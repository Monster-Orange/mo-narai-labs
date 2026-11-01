// The echo fixture in the SDK's harness: Narai's host on http://localhost, the tool on http://127.0.0.1 in a sandboxed
// frame, for no linked learner (it shows "none") unless the e2e passes a `subject`. Prints the host's address; opens
// nothing. Build first (`pnpm build`).
//
//   node harness.mjs
import { readFileSync } from "node:fs";
import { defineTool } from "@michinarai/sdk";
import { startHarness } from "@michinarai/sdk/harness";

export async function harness(ports = {}) {
  const manifest = defineTool(JSON.parse(readFileSync(new URL("./narai-tool.json", import.meta.url), "utf8")));
  return startHarness({ manifest, toolDir: new URL("./dist", import.meta.url).pathname, locale: "en", fallback: ["en"], ...ports });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await harness();
  console.log(`echo in the harness: ${h.hostUrl} (the tool: ${h.toolUrl}); Ctrl-C stops it`);
}
