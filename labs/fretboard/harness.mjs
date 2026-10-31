// The fretboard in the SDK's harness (`narai dev` until @narai/cli has it): Narai's host on http://localhost, the tool
// on http://127.0.0.1 in a sandboxed frame, a guitar neck (Narai's music.neck-preset@1) and a judged task whose payload
// says what to show. Prints the host's address; opens nothing. Build first (`pnpm build`).
//
//   node harness.mjs [show]     show: interval (default) | note | scale | practice (no task: the Tutor's highlight shows)
import { readFileSync } from "node:fs";
import { defineTool } from "@michinarai/sdk";
import { startHarness } from "@michinarai/sdk/harness";

/** Standard tuning on a 12-fret neck, as Narai's preset writes it: MIDI per string, the lowest first. */
export const NECK = { schema: "music.neck-preset@1", tuning: [40, 45, 50, 55, 59, 64], frets: 12, capo: null, handed: "right", labels: "notes" };

// #region shows
/** What a step shows is its task's: the notes to highlight (an interval's root alone, so the target isn't given away). */
const task = (id, prompt, notes) => ({ id, kind: "play_target", assist: "none", prompt, payload: { schema: "music.notes@1", notes } });
export const SHOWS = {
  interval: task("itm_maj3_A3", "Play the note a major third above A3.", ["A3"]),
  note: task("itm_every_C", "Play every C you can find below the 12th fret.", ["C"]),
  scale: task("itm_am_pent", "Play A minor pentatonic in the fifth position.", ["A", "C", "D", "E", "G"]),
  practice: undefined,
};
// #endregion shows

export async function harness(name = "interval", ports = {}) {
  const manifest = defineTool(JSON.parse(readFileSync(new URL("./narai-tool.json", import.meta.url), "utf8")));
  return startHarness({
    manifest, toolDir: new URL("./dist", import.meta.url).pathname, locale: "en", fallback: ["en"], task: SHOWS[name], ...ports,
    preset: NECK,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await harness(process.argv[2]);
  console.log(`fretboard in the harness: ${h.hostUrl} (the tool: ${h.toolUrl}); Ctrl-C stops it`);
}
