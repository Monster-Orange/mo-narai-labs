// The fretboard end to end in the SDK's harness, headless: the host starts it on a judged interval task, the learner
// plays C#4 (string 2, fret 2) and sends it, and the harness took a tool.answer in music.played@2 with nothing refused.
// Build first (`pnpm build`).
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { harness } from "./harness.mjs";

const h = await harness("interval");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(h.hostUrl);
  const tool = page.frameLocator("iframe");
  await tool.locator(".prompt").waitFor({ timeout: 15_000 });
  assert.equal(await tool.locator(".prompt").textContent(), "Play the note a major third above A3.");
  // the interval's root is shown; its target isn't (assist: none)
  assert.equal(await tool.locator(".spot.shown").count(), 0);
  assert.ok((await tool.locator(".spot.root").count()) > 0);
  await tool.locator('.spot[data-string="2"][data-fret="2"]').click();
  await tool.getByRole("button", { name: "Send" }).click();
  await page.waitForTimeout(500);
  const seen = h.events.filter((e) => e.direction === "in");
  const refused = h.events.filter((e) => !e.ok);
  assert.deepEqual(refused, [], "nothing refused");
  assert.deepEqual(seen.map((e) => e.type), ["tool.ready", "tool.answer"]);
  const answer = seen[1].message;
  assert.deepEqual(answer.payload.schema, "music.played@2");
  assert.deepEqual(answer.payload.notes.map((n) => [n.pitch, n.position]), [["C#4", { string: 2, fret: 2 }]]);
  console.log("e2e: the fretboard started, took a pick and answered in music.played@2, through the harness");
} finally {
  await browser.close();
  await h.close();
}
