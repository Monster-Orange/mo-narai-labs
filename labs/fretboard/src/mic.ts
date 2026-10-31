// The microphone, when the step grants it: Narai frames the tool with the microphone allowed only on a step that grants
// it, and says so in the start (`granted`). The learner starts it with a click; what it hears becomes notes here
// (pitch.ts) and only the notes leave: no audio is kept, stored or sent. Stop ends the stream.
import { detect, listener, midiOf, type HeardNote } from "./pitch.ts";

const WINDOW = 2048, EVERY_MS = 20;

// #region mic
/** Whether to offer the microphone: the step granted it, and the frame and the browser allow it. */
export function micAllowed(granted: unknown): boolean {
  if (!Array.isArray(granted) || !granted.includes("microphone")) return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  const policy = (document as Document & { permissionsPolicy?: { allowsFeature(f: string): boolean } }).permissionsPolicy;
  return policy ? policy.allowsFeature("microphone") : true;
}

/** Listening: each note heard, on the caller's clock; how late it hears (ms); and stop. */
export interface Listening { latency_ms: number; stop(): void }

/** Starts listening (call it from the learner's click: the browser asks them first). Rejects when they say no. */
export async function listen(now: () => number, hear: (note: HeardNote) => void): Promise<Listening> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const ctx = new AudioContext();
  const analyser = Object.assign(ctx.createAnalyser(), { fftSize: WINDOW });
  ctx.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(WINDOW);
  const notes = listener();
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    const pitch = detect(samples, ctx.sampleRate);
    const note = notes({ pitch: pitch ? midiOf(pitch.hz) : null, at_ms: now() });
    if (note) hear(note);
  }, EVERY_MS);
  // the input's own delay, and a window's worth of listening before a note is sure
  const input = stream.getAudioTracks()[0]?.getSettings() as MediaTrackSettings & { latency?: number };
  const latency_ms = Math.round(((input?.latency ?? 0) + ctx.baseLatency + WINDOW / ctx.sampleRate) * 1000);
  return {
    latency_ms,
    stop() {
      clearInterval(timer);
      for (const t of stream.getTracks()) t.stop();
      void ctx.close();
    },
  };
}
// #endregion mic
