// The interval trainer end to end in the SDK's harness, headless. Named: the host starts it on a name_interval task,
// the learner picks Major 3rd and sends it. Played: on a play_interval task, the learner plays C#4. Each time the
// harness took one tool.answer, in its own type, with nothing refused, and no interval shown. Build first (`pnpm build`).
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { harness } from "./harness.mjs";

const browser = await chromium.launch();
try {
  for (const [name, act, expect] of [
    ["name", (tool) => tool.locator('.name[data-interval="M3"]').click(), { schema: "music.interval-named@1", interval: "M3" }],
    ["play", (tool) => tool.locator('.key[data-key="61"]').click(), { schema: "music.played@2", pitches: ["C#4"] }],
  ]) {
    const h = await harness(name);
    try {
      const page = await browser.newPage();
      await page.goto(h.hostUrl);
      const tool = page.frameLocator("iframe");
      await tool.locator(".prompt").waitFor({ timeout: 15_000 });
      assert.equal(await tool.locator(".key").count(), 25);
      await act(tool);
      await tool.getByRole("button", { name: "Send" }).click();
      await page.waitForTimeout(500);
      const seen = h.events.filter((e) => e.direction === "in");
      assert.deepEqual(h.events.filter((e) => !e.ok), [], `${name}: nothing refused`);
      assert.deepEqual(seen.map((e) => e.type), ["tool.ready", "tool.answer"]);
      const payload = seen[1].message.payload;
      assert.equal(payload.schema, expect.schema);
      if (expect.interval) assert.equal(payload.interval, expect.interval);
      if (expect.pitches) assert.deepEqual(payload.notes.map((n) => n.pitch), expect.pitches);
      await page.close();
    } finally {
      await h.close();
    }
  }
  console.log("e2e: intervals named M3 (music.interval-named@1) and played C#4 (music.played@2), through the harness");
} finally {
  await browser.close();
}
