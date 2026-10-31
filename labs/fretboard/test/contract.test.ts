// The fretboard against the SDK, both sides: its manifest is one the SDK takes, declaring Narai's music payloads as Narai
// wrote them; its answers, its state, the Tutor's commands (each answered) and its storage cross a real channel; and
// what the manifest doesn't declare doesn't.
import { afterEach, describe, expect, it } from "vitest";
import { CommandRefused, manifestProblems, musicPayloads, type Payload } from "@michinarai/sdk";
import { launch } from "@michinarai/sdk/testing";
import { manifest } from "../src/manifest.ts";
import { LOCALES } from "../src/words.ts";
import { answer, highlighted, readShow, state, toggle, type Preset } from "../src/model.ts";
import { STANDARD } from "../src/theory.ts";

const PRESET: Preset = { schema: "music.neck-preset@1", tuning: [...STANDARD], frets: 12, capo: null, handed: "right", labels: "notes" };
const TASK = { id: "itm_maj3_A", kind: "play_target", assist: "none" as const, prompt: "Play the note a major third above A3.", payload: { schema: "music.notes@1", notes: [57] } };
let close = () => {};
afterEach(() => close());

describe("narai-labs/fretboard's manifest", () => {
  it("names the languages the tool has, its default first, as its words do (the SDK picks among them)", () => {
    expect(manifest.locales).toEqual([...LOCALES]);
  });

  it("is one the SDK takes, with no problems", () => {
    expect(manifestProblems(manifest)).toEqual([]);
    expect(manifest.id).toBe("narai-labs/fretboard");
    expect(manifest.state).toBe("music.neck-state@1");
    expect(manifest.task_payloads).toEqual({ play_target: "music.notes@1", play_passage: "music.notes@1" });
    expect(manifest.answers).toEqual({ play_target: "music.played@1", play_passage: "music.played@1" });
  });

  it("asks to play sound and to hear the microphone (Narai grants the microphone per step), and no network", () => {
    expect(manifest.capabilities).toEqual({ audio_out: true, microphone: true, network: "none" });
  });

  it("declares Narai's music payloads unchanged; a variant of one is refused", () => {
    const narai = musicPayloads("music.neck-preset@1", "music.played@1", "music.neck-state@1");
    for (const [ref, schema] of Object.entries(narai)) expect(manifest.payloads?.[ref]).toEqual(schema);
    const variant = structuredClone(manifest);
    ((variant.payloads ?? {})["music.played@1"] as { description: string }).description = "ours";
    expect(manifestProblems(variant).join("\n")).toMatch(/music\.played@1 is Narai's/);
  });
});

describe("a launch", () => {
  it("starts with Narai's neck preset and the task, whose payload says what to show", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard01", locale: "ja-JP", fallback: ["ja", "en"], preset: PRESET, task: TASK });
    close = run.close;
    expect(run.tool.start.preset).toMatchObject(PRESET);
    expect(run.tool.task).toEqual(TASK);
  });

  it("a passage task (Narai's play_passage) shows its notes and takes what was played, in music.played@1", async () => {
    const passage = { id: "itm_am_pent", kind: "play_passage", assist: "none" as const, prompt: "Play A minor pentatonic up from A3.",
      payload: { schema: "music.notes@1", notes: [57, 60, 62, 64, 67] } };
    const run = await launch(manifest, { launch: "lch_fretboard08", locale: "en", preset: PRESET, task: passage });
    close = run.close;
    expect(run.tool.task).toEqual(passage);
    run.tool.ready("en");
    let picks = toggle(PRESET, [], { string: 3, fret: 2 }, 400); // A3
    picks = toggle(PRESET, picks, { string: 2, fret: 1 }, 900); // C4
    run.tool.answer(answer(picks));
    await run.settle();
    expect(run.received.refused).toEqual([]);
    expect(run.received.answers.map((a) => (a.payload as unknown as { notes: { pitch: number }[] }).notes.map((n) => n.pitch))).toEqual([[57, 60]]);
  });

  it("a task's payload is the one its kind declares; another never reaches the tool", async () => {
    const wrong = { ...TASK, payload: { schema: "music.none@1" } };
    await expect(launch(manifest, { launch: "lch_fretboard06", locale: "en", preset: PRESET, task: wrong })).rejects.toThrow();
  });

  it("the learner's answer reaches Narai as music.played@1, untouched; an @2-style note is refused", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard02", locale: "en", preset: PRESET, task: TASK });
    close = run.close;
    run.tool.ready("en");
    const played = answer(toggle(PRESET, [], { string: 2, fret: 2 }, 4120));
    run.tool.answer(played);
    run.forge({ type: "tool.answer", v: 1, launch: "lch_fretboard02", task: TASK.id, payload: { schema: "music.played@1", notes: [{ pitch: 61, at_ms: 0, position: { key: 61 } }] } });
    await run.settle();
    expect(run.received.answers.map((a) => a.payload)).toEqual([played]);
    expect(run.received.refused).toHaveLength(1);
    expect(() => run.tool.answer({ ...played, correct: true })).toThrow();
  });

  it("its state goes to Narai as it changes, and Narai can ask for it", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard03", locale: "en", preset: PRESET });
    close = run.close;
    run.tool.ready("en");
    const shown = state(PRESET, highlighted(PRESET, { notes: [61], classes: [] }) ?? []);
    run.tool.state(shown);
    await run.settle();
    expect(run.received.states.map((s) => s.payload)).toEqual([shown]);
    expect(await run.host.requestState()).toEqual(shown);
  });

  it("the Tutor's highlight and clear are answered: an ack, or a refusal for notes not on this neck; others are never sent", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard04", locale: "en", preset: PRESET });
    close = run.close;
    run.tool.ready("en");
    run.tool.onCommand("highlight", (p: Payload) => {
      const show = readShow(p);
      if (!show || !highlighted(PRESET, show)) throw new CommandRefused("invalid_payload", "a highlight names notes on this neck");
    });
    run.tool.onCommand("clear", () => {});
    expect(await run.host.command("highlight", { schema: "music.notes@1", notes: [57, 61] })).toEqual({ ok: true });
    expect(await run.host.command("highlight", { schema: "music.notes@1", classes: [9, 0, 4] })).toEqual({ ok: true });
    expect(await run.host.command("highlight", { schema: "music.notes@1", notes: [108] })).toMatchObject({ ok: false, code: "invalid_payload" });
    expect(() => run.host.command("highlight", { schema: "music.notes@1", notes: ["A3"] })).toThrow(); // spelled: not Narai's
    expect(await run.host.command("clear", { schema: "music.none@1" })).toEqual({ ok: true });
    expect(() => run.host.command("play", { schema: "music.notes@1", notes: [57] })).toThrow();
  });

  it("the picks are this launch's own, kept in its storage", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard05", locale: "en", preset: PRESET, task: TASK });
    close = run.close;
    run.tool.ready("en");
    const picks = toggle(PRESET, [], { string: 2, fret: 2 }, 900);
    expect(await run.tool.storage.get("picks")).toMatchObject({ ok: false, error: "not_found" });
    expect(await run.tool.storage.set("picks", picks)).toEqual({ ok: true });
    expect(await run.tool.storage.get("picks")).toEqual({ ok: true, value: picks });
  });

  it("a reloaded tool reconnects to the same launch, and its picks are still in storage", async () => {
    const run = await launch(manifest, { launch: "lch_fretboard07", locale: "en", preset: PRESET, task: TASK });
    close = run.close;
    run.tool.ready("en");
    const picks = toggle(PRESET, [], { string: 2, fret: 2 }, 900);
    expect(await run.tool.storage.set("picks", picks)).toEqual({ ok: true });
    const again = await run.reconnect();
    again.ready("en");
    expect(again.launch).toBe("lch_fretboard07");
    expect(await again.storage.get("picks")).toEqual({ ok: true, value: picks });
  });
});
