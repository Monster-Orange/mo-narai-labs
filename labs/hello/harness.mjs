// The hello tool in the SDK's harness: Narai's host on http://localhost, the tool on http://127.0.0.1 in a sandboxed
// frame, one judged question. Prints the host's address; opens nothing. Build first (`pnpm build`).
//
//   node harness.mjs
import { readFileSync } from "node:fs";
import { defineTool } from "@michinarai/sdk";
import { startHarness } from "@michinarai/sdk/harness";

export const PRESET = { schema: "hello.options@1", options: ["A", "B", "C"] };
export const TASK = { id: "itm_hello", kind: "pick", assist: "none", prompt: "Which letter comes after A?" };

// #region harness
export async function harness(ports = {}) {
  const manifest = defineTool(JSON.parse(readFileSync(new URL("./narai-tool.json", import.meta.url), "utf8")));
  return startHarness({
    manifest, toolDir: new URL("./dist", import.meta.url).pathname, locale: "en", fallback: ["en"],
    preset: PRESET, task: TASK, ...ports,
  });
}
// #endregion harness

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await harness();
  console.log(`hello in the harness: ${h.hostUrl} (the tool: ${h.toolUrl}); Ctrl-C stops it`);
}
