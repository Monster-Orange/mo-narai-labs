// What the hostile tool tries (Tool Platform study, Dogfood › The hostile tool; the Planner's slice 1). Each attempt is
// something a tool page can actually do: call the public SDK with what its manifest doesn't allow, or post to its
// parent window around the SDK. Each names who must stop it:
//   thrown   the SDK refuses it on the tool's side, before anything is sent (ToolMessageError or an Error)
//   refused  it is sent, and Narai's host refuses it (the host's onRefused), never reaching a handler
//   ignored  a forged message on the window, which the host never takes (no handler, no refusal needed)
// The tests (test/hostile.test.ts) run every attempt on a real channel; the page (main.ts) runs them in the harness.
import type { Payload, ToolSession } from "@narai/sdk";

export type Expect = "thrown" | "refused" | "ignored";

export interface Attempt {
  name: string;
  expect: Expect;
  /** `tool`: the hostile tool's SDK session; `parent`: its parent window, written to around the SDK. */
  run(ctx: { tool: ToolSession; parent: { postMessage(message: unknown, targetOrigin: string): void } }): void;
}

const pick = (extra: Record<string, unknown> = {}): Payload => ({ schema: "hostile.pick@1", choice: "B", ...extra });

export const ATTEMPTS: readonly Attempt[] = [
  { name: "an answer with a verdict: correct", expect: "thrown", run: ({ tool }) => tool.answer(pick({ correct: true })) },
  { name: "an answer with a verdict at depth: meta.score", expect: "thrown", run: ({ tool }) => tool.answer(pick({ meta: { score: 1 } })) },
  { name: "an answer with a verdict in a list: checks[].passed", expect: "thrown", run: ({ tool }) => tool.answer(pick({ checks: [{ passed: true }] })) },
  { name: "an answer over 64 KB", expect: "thrown", run: ({ tool }) => tool.answer(pick({ choice: "x".repeat(70 * 1024) })) },
  { name: "an answer in a payload its task's kind doesn't answer in", expect: "thrown", run: ({ tool }) => tool.answer({ schema: "hostile.drill@1", count: 1 }) },
  { name: "practice for an activity the manifest doesn't list", expect: "thrown", run: ({ tool }) => tool.practice("free-play", { duration_s: 1, attempts: 1, payload: { schema: "hostile.drill@1", count: 1 } }) },
  { name: "a handler for a command the manifest doesn't list", expect: "thrown", run: ({ tool }) => tool.onCommand("exfiltrate", () => undefined) },
  { name: "an answer whose body breaks its schema (an extra field)", expect: "refused", run: ({ tool }) => tool.answer(pick({ learner_email: "someone@example.com" })) },
  { name: "a forged answer posted to the parent window, around the port", expect: "ignored",
    run: ({ parent }) => parent.postMessage({ type: "tool.answer", v: 1, launch: "lch_forgedforged", task: "itm_hostile", payload: pick() }, "*") },
  { name: "a forged connect, asking the host for a second port", expect: "ignored",
    run: ({ parent }) => parent.postMessage({ type: "narai.tool.connect", v: 1 }, "*") },
];
