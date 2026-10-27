// The hello tool end to end in the SDK's harness, headless: the host starts it on one question, the learner picks B,
// and the harness took a tool.answer in hello.choice@1 with nothing refused. Build first (`pnpm build`).
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { harness } from "./harness.mjs";

const h = await harness();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(h.hostUrl);
  const tool = page.frameLocator("iframe");
  await tool.getByText("Which letter comes after A?").waitFor({ timeout: 15_000 });
  await tool.getByRole("button", { name: "B" }).click();
  await page.waitForTimeout(500);
  const seen = h.events.filter((e) => e.direction === "in");
  assert.deepEqual(h.events.filter((e) => !e.ok), [], "nothing refused");
  assert.deepEqual(seen.map((e) => e.type), ["tool.ready", "tool.answer"]);
  assert.deepEqual(seen[1].message.payload, { schema: "hello.choice@1", choice: "B" });
  console.log("e2e: hello started, took a pick and answered in hello.choice@1, through the harness");
} finally {
  await browser.close();
  await h.close();
}
