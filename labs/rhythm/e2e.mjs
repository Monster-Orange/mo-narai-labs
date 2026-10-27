// The rhythm tapper end to end in the SDK's harness, headless. On a tap_cycle task the learner taps seven times and
// sends: the harness took one tool.answer in music.taps@1 with seven rising times. In free play, leaving the page sends
// what was tapped as one practice report. Nothing refused. Build first (`pnpm build`).
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { harness } from "./harness.mjs";

const browser = await chromium.launch();
try {
  {
    const h = await harness("cycle");
    const page = await browser.newPage();
    await page.goto(h.hostUrl);
    const tool = page.frameLocator("iframe");
    await tool.locator(".prompt").waitFor({ timeout: 15_000 });
    assert.equal(await tool.locator(".beat").count(), 7);
    for (let i = 0; i < 7; i++) { await tool.locator(".tap").dispatchEvent("pointerdown"); await page.waitForTimeout(60); }
    await tool.getByRole("button", { name: "Send" }).click();
    await page.waitForTimeout(500);
    const seen = h.events.filter((e) => e.direction === "in");
    assert.deepEqual(h.events.filter((e) => !e.ok), [], "cycle: nothing refused");
    assert.deepEqual(seen.map((e) => e.type), ["tool.ready", "tool.answer"]);
    const t = seen[1].message.payload.taps;
    assert.equal(seen[1].message.payload.schema, "music.taps@1");
    assert.equal(t.length, 7);
    assert.ok(t.every((x, i) => i === 0 || x > t[i - 1]), "taps rise");
    await page.close();
    await h.close();
  }
  {
    const h = await harness("practice");
    const page = await browser.newPage();
    await page.goto(h.hostUrl);
    const tool = page.frameLocator("iframe");
    await tool.locator(".tap").waitFor({ timeout: 15_000 });
    for (let i = 0; i < 9; i++) await tool.locator(".tap").dispatchEvent("pointerdown");
    await page.waitForTimeout(200);
    assert.equal(h.events.filter((e) => e.type === "tool.practice").length, 0, "nothing reported before the minute");
    await page.locator("iframe").evaluate((f) => f.remove()); // the page goes away
    await page.waitForTimeout(500);
    const practice = h.events.filter((e) => e.type === "tool.practice");
    assert.deepEqual(h.events.filter((e) => !e.ok), [], "practice: nothing refused");
    assert.equal(practice.length, 1);
    assert.equal(practice[0].message.activity, "free_tap");
    assert.equal(practice[0].message.payload.taps.length, 9);
    await page.close();
    await h.close();
  }
  console.log("e2e: rhythm tapped a cycle (music.taps@1) and reported free play once, as practice, through the harness");
} finally {
  await browser.close();
}
