// The fretboard in the SDK's harness (`narai dev` until @narai/cli has it): Narai's host on http://localhost, the tool
// on http://127.0.0.1 in a sandboxed frame, a guitar neck (Narai's music.neck-preset@1) and a judged task whose payload
// says what to show. Prints the host's address; opens nothing. Build first (`pnpm build`).
//
//   node harness.mjs [show]     show: interval (default) | note | scale | passage | practice (no task: the Tutor's highlight shows)
import { readFileSync } from "node:fs";
import { defineTool } from "@michinarai/sdk";
import { startHarness } from "@michinarai/sdk/harness";

/** Standard tuning on a 12-fret neck, as Narai's preset writes it: MIDI per string, the lowest first. */
export const NECK = { schema: "music.neck-preset@1", tuning: [40, 45, 50, 55, 59, 64], frets: 12, capo: null, handed: "right", labels: "notes" };

// #region shows
/** What a step shows is its task's (Narai's music.notes@1): pitches where they sound, as MIDI (A3 is 57), or pitch
 *  classes anywhere (C is 0). An interval's task shows its root alone, so the target isn't given away. */
const task = (id, prompt, show) => ({ id, kind: "play_target", assist: "none", prompt, payload: { schema: "music.notes@1", ...show } });
export const SHOWS = {
  interval: task("itm_maj3_A3", "Play the note a major third above A3.", { notes: [57] }),
  note: task("itm_every_C", "Play every C you can find below the 12th fret.", { classes: [0] }),
  scale: task("itm_am_pent", "Play A minor pentatonic in the fifth position.", { classes: [9, 0, 2, 4, 7] }),
  // Narai's play_passage: the notes to play, shown where they sound; judged on the notes in order, at any pace
  passage: { ...task("itm_am_pent_up", "Play A minor pentatonic up from A3: A3, C4, D4, E4, G4.", { notes: [57, 60, 62, 64, 67] }), kind: "play_passage" },
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
