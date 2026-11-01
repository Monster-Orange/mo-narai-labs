// The echo fixture against Narai's host, through the SDK's kit: a manifest the SDK takes, with an account link on one
// origin, and a start that carries the learner's subject only when Narai's launch has one.
import { afterEach, describe, expect, it } from "vitest";
import { defineTool, manifestProblems } from "@michinarai/sdk";
import { launch } from "@michinarai/sdk/testing";
import manifestJson from "../narai-tool.json";

const manifest = defineTool(manifestJson);
const SUBJECT = "a".repeat(43); // 43 URL-safe characters, as Narai mints one
let close = () => {};
afterEach(() => close());

describe("narai-labs/echo", () => {
  it("has a manifest the SDK takes, its account link on one origin", () => {
    expect(manifestProblems(manifest)).toEqual([]);
    const link = manifest.surfaces.account_link;
    expect(link).toBeTruthy();
    expect(new Set([link?.url, link?.client_id, link?.webhook].map((u) => new URL(String(u)).origin)).size).toBe(1);
  });

  it("a linked learner's start carries their subject", async () => {
    const run = await launch(manifest, { launch: "lch_echo000001", locale: "en", subject: SUBJECT });
    close = run.close;
    expect(run.tool.start.subject).toBe(SUBJECT);
  });

  it("anyone else's start carries none", async () => {
    const run = await launch(manifest, { launch: "lch_echo000002", locale: "en" });
    close = run.close;
    expect(run.tool.start.subject).toBeUndefined();
  });
});
