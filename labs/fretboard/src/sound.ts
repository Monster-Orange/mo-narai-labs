// The neck's sound: a tapped position plucks its string (Karplus-Strong: a burst of noise, fed back through a short
// delay one period long and gently averaged, so it rings and dies like a string). The samples are made here, pure, so
// the tests can listen to them; `player` hands them to the page's audio once the learner has touched the neck.
import { hzOf } from "./pitch.ts";

/** How long a pluck rings. */
const RING_S = 1.6;

/** The samples of a plucked string at a MIDI pitch. `random` is the noise (seeded in the tests). */
export function pluck(pitch: number, rate: number, random: () => number = Math.random): Float32Array<ArrayBuffer> {
  const out = new Float32Array(Math.round(rate * RING_S));
  const period = Math.max(2, Math.round(rate / hzOf(pitch)));
  for (let i = 0; i < period && i < out.length; i++) out[i] = (random() * 2 - 1) * 0.5;
  // higher strings die faster, as a real one does
  const decay = 0.996 - Math.min(0.006, Math.max(0, pitch - 40) * 0.0001);
  for (let i = period; i < out.length; i++) out[i] = decay * 0.5 * ((out[i - period] as number) + (out[i - period - 1] ?? 0));
  return out;
}

/** Plays plucks on the page. Browsers start audio only after the learner's gesture: the first tap makes the context. */
export interface Player { play(pitch: number): void }

export function player(): Player {
  let ctx: AudioContext | null = null;
  return {
    play(pitch) {
      ctx ??= new AudioContext();
      if (ctx.state === "suspended") void ctx.resume();
      const samples = pluck(pitch, ctx.sampleRate);
      const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buffer.copyToChannel(samples, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    },
  };
}
