// The echo fixture end to end in the SDK's harness, headless. Started for a learner who linked their account (SDK
// 0.3.4: startHarness({ subject })), it shows that subject; started for anyone else, it shows "none". Either way it
// says ready, with nothing refused. Build first (`pnpm build`).
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { harness } from "./harness.mjs";

const SUBJECT = "aB3-_".repeat(8) + "xyz"; // 43 URL-safe characters, as Narai mints one
const browser = await chromium.launch();

async function shows(options, expected, what) {
  const h = await harness(options);
  try {
    const page = await browser.newPage();
    await page.goto(h.hostUrl);
    const shown = page.frameLocator("iframe").locator("[data-subject]");
    await shown.waitFor({ timeout: 15_000 });
    assert.equal(await shown.textContent(), expected, what);
    await page.waitForTimeout(300);
    assert.deepEqual(h.events.filter((e) => !e.ok), [], "nothing refused");
    assert.deepEqual(h.events.filter((e) => e.direction === "in").map((e) => e.type), ["tool.ready"]);
  } finally {
    await h.close();
  }
}

try {
  await shows({ subject: SUBJECT }, SUBJECT, "a linked learner's subject");
  console.log("e2e: echo started for a linked learner and showed their subject, through the harness");
  await shows({}, "none", "no subject");
  console.log("e2e: echo started with no linked learner, showed none and said ready, through the harness");
} finally {
  await browser.close();
}
