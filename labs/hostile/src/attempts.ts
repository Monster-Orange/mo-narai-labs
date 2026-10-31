// What the hostile tool tries. Each attempt is something a tool page can actually do: call the public SDK with what its
// manifest doesn't allow, write to its port around the SDK, post to its parent window around the port, or, as another
// page, post to the tool's window. Each names who must stop it:
//   thrown   the SDK refuses it on the tool's side, before anything is sent (ToolMessageError or an Error)
//   refused  it is sent, and Narai's host refuses it (the host's onRefused), never reaching a handler
//   ignored  a message that doesn't come over the port, which neither side ever takes
// The tests (test/hostile.test.ts) run every attempt through the SDK's kit (@michinarai/sdk/testing); the page (main.ts)
// runs them in the harness. The course quotes the #region blocks here and in the test (narai-tools, "The sandbox"):
// keep each one whole and short.
import type { Payload, ToolSession } from "@michinarai/sdk";

export type Expect = "thrown" | "refused" | "ignored";

export interface Attempt {
  name: string;
  expect: Expect;
  /** `tool`: the hostile tool's SDK session; `forge`: a raw message onto its port, around the SDK; `postToHost`: a
   *  message to its parent window, around the port; `postToTool`: a message on the tool's window from another page
   *  (`origin`). */
  run(ctx: {
    tool: ToolSession;
    forge(message: unknown): void;
    postToHost(message: unknown): void;
    postToTool(message: unknown, origin: string): void;
  }): void;
}

/** The launch and the task the tests start the hostile tool with (test/hostile.test.ts). */
export const LAUNCH = "lch_hostile0001";
export const TASK = "itm_hostile";

const pick = (extra: Record<string, unknown> = {}): Payload => ({ schema: "hostile.pick@1", choice: "B", ...extra });

export const ATTEMPTS: readonly Attempt[] = [
  // #region thrown
  { name: "an answer with a verdict: correct", expect: "thrown", run: ({ tool }) => tool.answer(pick({ correct: true })) },
  { name: "an answer with a verdict at depth: meta.score", expect: "thrown", run: ({ tool }) => tool.answer(pick({ meta: { score: 1 } })) },
  { name: "an answer with a verdict in a list: checks[].passed", expect: "thrown", run: ({ tool }) => tool.answer(pick({ checks: [{ passed: true }] })) },
  { name: "an answer over 64 KB", expect: "thrown", run: ({ tool }) => tool.answer(pick({ choice: "x".repeat(70 * 1024) })) },
  { name: "an answer in a payload its task's kind doesn't answer in", expect: "thrown", run: ({ tool }) => tool.answer({ schema: "hostile.drill@1", count: 1 }) },
  // #endregion thrown
  { name: "practice for an activity the manifest doesn't list", expect: "thrown", run: ({ tool }) => tool.practice("free-play", { duration_s: 1, attempts: 1, payload: { schema: "hostile.drill@1", count: 1 } }) },
  { name: "a handler for a command the manifest doesn't list", expect: "thrown", run: ({ tool }) => tool.onCommand("exfiltrate", () => undefined) },
  { name: "an answer whose body breaks its schema (an extra field)", expect: "refused", run: ({ tool }) => tool.answer(pick({ learner_email: "someone@example.com" })) },
  // #region around
  { name: "an answer written onto the port around the SDK, with a verdict", expect: "refused",
    run: ({ forge }) => forge({ type: "tool.answer", v: 1, launch: LAUNCH, task: TASK, payload: pick({ correct: true }) }) },
  { name: "an answer written onto the port around the SDK, under another launch", expect: "refused",
    run: ({ forge }) => forge({ type: "tool.answer", v: 1, launch: "lch_forgedforged", task: TASK, payload: pick() }) },
  { name: "an answer posted to the parent window, around the port", expect: "ignored",
    run: ({ postToHost }) => postToHost({ type: "tool.answer", v: 1, launch: LAUNCH, task: TASK, payload: pick() }) },
  { name: "a second hello, asking the host for another port", expect: "ignored",
    run: ({ postToHost }) => postToHost({ type: "tool.hello", v: 1 }) },
  { name: "a connect from another page, offering the tool a second port", expect: "ignored",
    run: ({ postToTool }) => postToTool({ type: "narai.tool.connect", v: 1 }, "https://elsewhere.example") },
  // #endregion around
];
