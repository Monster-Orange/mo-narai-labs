// The rhythm tapper in the SDK's harness (`narai dev` until @narai/cli has it): Narai's host on http://localhost, the
// tool on http://127.0.0.1 in a sandboxed frame. Prints the host's address; opens nothing. Build first (`pnpm build`).
//
//   node harness.mjs [task]     task: cycle (default) | practice (no task: tap freely; practice reports, batched)
import { readFileSync } from "node:fs";
import { defineTool } from "@michinarai/sdk";
import { startHarness } from "@michinarai/sdk/harness";

/** Rupak tāl at 80 beats a minute, as Narai's music.cycle-preset@1 sets a cycle up: its beats in groups, a hand per
 *  group, a bol per beat. */
export const PRESET = {
  schema: "music.cycle-preset@1", system: "tala", name: "rupak", beats: 7, groups: [3, 2, 2], hands: ["wave", "clap", "clap"],
  syllables: ["Tin", "Tin", "Na", "Dhi", "Na", "Dhi", "Na"], tempo_bpm: 80,
};

// #region tasks
export const TASKS = {
  cycle: { task: { id: "itm_rupak_80", kind: "tap_cycle", assist: "none", prompt: "Tap one cycle of rupak tāl at 80 beats a minute, starting on sam." } },
  practice: { task: undefined },
};
// #endregion tasks

export async function harness(name = "cycle", ports = {}) {
  const manifest = defineTool(JSON.parse(readFileSync(new URL("./narai-tool.json", import.meta.url), "utf8")));
  return startHarness({
    manifest, toolDir: new URL("./dist", import.meta.url).pathname, locale: "en", fallback: ["en"], task: TASKS[name].task, ...ports,
    preset: PRESET,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await harness(process.argv[2]);
  console.log(`rhythm in the harness: ${h.hostUrl} (the tool: ${h.toolUrl}); Ctrl-C stops it`);
}
