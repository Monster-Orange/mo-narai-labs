// The interval trainer end to end in the SDK's harness, headless. Named: the host starts it on a name_interval task,
// the learner picks Major 3rd and sends it. Played: on a play_interval task, the learner plays C#4. Each time the
// harness took one tool.answer, in its own type, with nothing refused, and no interval shown. Before Send, the tool's
// frame reloads: it reconnects to the same launch and the answer begun comes back from storage. Listen reports what it
// plays as it sounds and stops (tool.state). Build first (`pnpm build`).
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { harness } from "./harness.mjs";

const browser = await chromium.launch();
try {
  for (const [name, act, expect] of [
    ["name", (tool) => tool.locator('.name[data-interval="M3"]').click(), { schema: "music.interval-named@1", interval: "M3" }],
    ["play", (tool) => tool.locator('.key[data-key="61"]').click(), { schema: "music.played@1", pitches: [61] }],
  ]) {
    const h = await harness(name);
    try {
      const page = await browser.newPage();
      await page.goto(h.hostUrl);
      const tool = page.frameLocator("iframe");
      await tool.locator(".prompt").waitFor({ timeout: 15_000 });
      assert.equal(await tool.locator(".key").count(), 25);
      await tool.locator(".listen").click();
      await act(tool);
      await tool.locator('[aria-pressed="true"]').waitFor();
      await page.waitForTimeout(300);
      const frame = page.frames().find((f) => f !== page.mainFrame());
      await frame.goto(frame.url());
      await tool.locator('[aria-pressed="true"]').waitFor({ timeout: 15_000 });
      await page.waitForTimeout(2_000); // Listen's notes have stopped
      await tool.getByRole("button", { name: "Send" }).click();
      await page.waitForTimeout(500);
      const seen = h.events.filter((e) => e.direction === "in");
      assert.deepEqual(h.events.filter((e) => !e.ok), [], `${name}: nothing refused`);
      const types = seen.map((e) => e.type);
      assert.equal(types.filter((t) => t === "tool.ready").length, 2, `${name}: ready, then ready again after the reload`);
      assert.equal(types.filter((t) => t === "tool.answer").length, 1, `${name}: one answer`);
      assert.ok(types.includes("tool.storage.set"), `${name}: the answer begun was kept`);
      const states = seen.filter((e) => e.type === "tool.state").map((e) => e.message.payload.playing);
      assert.deepEqual(states.slice(0, 3), [false, true, false], `${name}: quiet, sounding, quiet`);
      const payload = seen.find((e) => e.type === "tool.answer").message.payload;
      assert.equal(payload.schema, expect.schema);
      if (expect.interval) assert.equal(payload.interval, expect.interval);
      if (expect.pitches) assert.deepEqual(payload.notes.map((n) => n.pitch), expect.pitches);
      await page.close();
    } finally {
      await h.close();
    }
  }
  console.log("e2e: intervals named M3 (music.interval-named@1) and played C#4 (music.played@1), each kept across a reload, its state reported, through the harness");
} finally {
  await browser.close();
}
