// The interval trainer in the SDK's harness (`narai dev` until @narai/cli has it): Narai's host on http://localhost, the
// tool on http://127.0.0.1 in a sandboxed frame. Prints the host's address; opens nothing. Build first (`pnpm build`).
//
//   node harness.mjs [task]     task: name (default) | play | practice (no task: play freely)
import { readFileSync } from "node:fs";
import { defineTool } from "@michinarai/sdk";
import { startHarness } from "@michinarai/sdk/harness";

// #region tasks
export const TASKS = {
  name: { notes: [57, 61], task: { id: "itm_name_M3", kind: "name_interval", assist: "none", prompt: "Listen, then name the interval." } },
  play: { notes: [57], task: { id: "itm_play_M3", kind: "play_interval", assist: "none", prompt: "Play the note a major third above A3." } },
  practice: { notes: [57, 64], task: undefined },
};
// #endregion tasks

export async function harness(name = "name", ports = {}) {
  const manifest = defineTool(JSON.parse(readFileSync(new URL("./narai-tool.json", import.meta.url), "utf8")));
  const { notes, task } = TASKS[name];
  return startHarness({
    manifest, toolDir: new URL("./dist", import.meta.url).pathname, locale: "en", fallback: ["en"], task, ...ports,
    preset: { schema: "music.interval-preset@1", notes },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await harness(process.argv[2]);
  console.log(`intervals in the harness: ${h.hostUrl} (the tool: ${h.toolUrl}); Ctrl-C stops it`);
}
