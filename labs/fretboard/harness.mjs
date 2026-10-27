// The fretboard in the SDK's harness (`narai dev` until @narai/cli has it): Narai's host on http://localhost, the tool
// on http://127.0.0.1 in a sandboxed frame, a judged interval task on the neck. Prints the host's address; opens
// nothing. Build first (`pnpm build`).
//
//   node harness.mjs [show]     show: interval (default) | note | scale | practice (the scale, no task)
import { readFileSync } from "node:fs";
import { defineTool } from "@narai/sdk";
import { startHarness } from "@narai/sdk/harness";

export const SHOWS = {
  interval: { show: { kind: "interval", root: "A3", interval: "M3" }, task: { id: "itm_maj3_A3", kind: "play_target", assist: "none", prompt: "Play the note a major third above A3." } },
  note: { show: { kind: "note", note: "C" }, task: { id: "itm_every_C", kind: "play_target", assist: "none", prompt: "Play every C you can find below the 12th fret." } },
  scale: { show: { kind: "scale", key: "A", scale: "minor-pentatonic" }, task: { id: "itm_am_pent", kind: "play_target", assist: "none", prompt: "Play A minor pentatonic in the fifth position." } },
  practice: { show: { kind: "scale", key: "A", scale: "minor-pentatonic" }, task: undefined },
};

export async function harness(name = "interval", ports = {}) {
  const manifest = defineTool(JSON.parse(readFileSync(new URL("./narai-tool.json", import.meta.url), "utf8")));
  const { show, task } = SHOWS[name];
  return startHarness({
    manifest, toolDir: new URL("./dist", import.meta.url).pathname, locale: "en", fallback: ["en"], task, ...ports,
    preset: { schema: "music.neck-preset@1", instrument: "guitar", tuning: "standard", frets: 12, show },
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await harness(process.argv[2]);
  console.log(`fretboard in the harness: ${h.hostUrl} (the tool: ${h.toolUrl}); Ctrl-C stops it`);
}
