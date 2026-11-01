// The fretboard end to end in the SDK's harness, headless: the host sets the neck up (Narai's music.neck-preset@1) on a
// judged interval task whose payload shows the root, A3. The neck reports what it shows (tool.state, music.neck-state@1),
// the learner plays C#4 (string 2, fret 2), the tool's frame reloads and the pick comes back from this launch's storage, and
// Send takes a tool.answer in music.played@1, with nothing refused. Build first (`pnpm build`).
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
  // the task's root is shown, labeled; its target isn't
  assert.deepEqual(await tool.locator(".spot.shown").evaluateAll((s) => s.map((g) => `${g.dataset.string}/${g.dataset.fret}`)), ["3/2", "4/7", "5/12"]);
  assert.equal(await tool.locator('.spot[data-string="3"][data-fret="2"] .label').textContent(), "A");
  // the keyboard: the neck is one tab stop, the arrows move on it and keep focus, and Enter plays
  assert.equal(await tool.locator('.spot[tabindex="0"]').count(), 1, "the neck is one tab stop");
  await tool.locator('.spot[tabindex="0"]').focus();
  const focused = () => tool.locator(".spot:focus").evaluate((g) => `${g.dataset.string}/${g.dataset.fret}`);
  assert.equal(await focused(), "3/2", "the first stop is the task's first mark");
  await tool.locator(".spot:focus").press("ArrowUp");
  assert.equal(await focused(), "2/2");
  assert.equal(await tool.locator('.spot[tabindex="0"]').count(), 1, "still one tab stop, where focus is");
  assert.equal(await tool.locator(".spot:focus").getAttribute("aria-label"), "String 2, fret 2: C#4");
  await tool.locator(".spot:focus").press("Enter");
  await tool.locator('.spot[data-string="2"][data-fret="2"][aria-pressed="true"]').waitFor();
  assert.equal(await focused(), "2/2", "playing keeps focus on the spot");
  await page.waitForTimeout(300);
  // the tool's frame reloads: it reconnects to the same launch, and the pick comes back from this launch's storage
  const frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.goto(frame.url());
  await tool.locator('.spot[data-string="2"][data-fret="2"][aria-pressed="true"]').waitFor({ timeout: 15_000 });
  await tool.getByRole("button", { name: "Send" }).click();
  await page.waitForTimeout(500);
  const seen = h.events.filter((e) => e.direction === "in");
  assert.deepEqual(h.events.filter((e) => !e.ok), [], "nothing refused");
  const state = seen.find((e) => e.type === "tool.state")?.message.payload;
  assert.deepEqual(state?.highlighted, [{ string: 3, fret: 2, label: "A" }, { string: 4, fret: 7, label: "A" }, { string: 5, fret: 12, label: "A" }]);
  const answer = seen.findLast((e) => e.type === "tool.answer")?.message;
  assert.equal(answer?.payload.schema, "music.played@1");
  assert.deepEqual(answer.payload.notes.map((n) => [n.pitch, n.string, n.fret]), [[61, 2, 2]]);
    assert.ok(seen.some((e) => e.type === "tool.storage.set"), "the pick was kept in storage");
  console.log("e2e: the neck took Narai's preset, reported what it shows, is one tab stop that the arrows move on, kept a pick across a reload and answered in music.played@1");
} finally {
  await browser.close();
  await h.close();
}
