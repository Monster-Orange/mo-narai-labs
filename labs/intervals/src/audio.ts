// The trainer's sound (the manifest's `audio_out`): sine tones through Web Audio, made on the learner's first press
// (a browser starts audio only after one). The page's only use of the capability.
import { frequency } from "./theory.ts";

export interface Player {
  /** Sound MIDI notes one after another, `gap` seconds apart. */
  play(notes: readonly number[], gap?: number): void;
}

// #region play
export function webAudio(): Player {
  let ctx: AudioContext | null = null;
  return {
    play(notes, gap = 0.7) {
      const c = (ctx ??= new AudioContext());
      const t0 = c.currentTime + 0.05;
      notes.forEach((n, i) => {
        const osc = c.createOscillator(), gain = c.createGain();
        const at = t0 + i * gap;
        osc.frequency.value = frequency(n);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.25, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, at + gap * 0.95);
        osc.connect(gain).connect(c.destination);
        osc.start(at);
        osc.stop(at + gap);
      });
    },
  };
}
// #endregion play
