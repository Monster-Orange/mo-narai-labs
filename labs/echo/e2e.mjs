// The echo fixture end to end in the SDK's harness, headless: with no linked learner it shows "none" and says ready,
// with nothing refused. Build first (`pnpm build`).
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { harness } from "./harness.mjs";

const browser = await chromium.launch();
const h = await harness();
try {
  const page = await browser.newPage();
  await page.goto(h.hostUrl);
  const shown = page.frameLocator("iframe").locator("[data-subject]");
  await shown.waitFor({ timeout: 15_000 });
  assert.equal(await shown.textContent(), "none");
  await page.waitForTimeout(300);
  assert.deepEqual(h.events.filter((e) => !e.ok), [], "nothing refused");
  assert.deepEqual(h.events.filter((e) => e.direction === "in").map((e) => e.type), ["tool.ready"]);
  console.log("e2e: echo started with no linked learner, showed none and said ready, through the harness");
} finally {
  await browser.close();
  await h.close();
}
