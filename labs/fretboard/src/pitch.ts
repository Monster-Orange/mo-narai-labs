// What the microphone hears, as notes: a window of samples to a pitch (the McLeod method: the normalized square
// difference, its first peak near the highest, interpolated), a pitch to its MIDI number, and the frames to notes, each
// note once, when it has held for a few frames. Only notes leave this file, never audio. Pure, so the tests read it.

/** A pitch heard in a window: its frequency and how periodic the window was (1 is a pure tone). */
export interface Heard { hz: number; clarity: number }

/** Quieter than this (RMS) is silence. */
export const SILENCE = 0.01;
/** Less periodic than this is noise, not a note. */
export const CLARITY = 0.8;
/** A guitar's range, with room: below a drop-D low string to well above the 24th fret. */
const LOW_HZ = 60, HIGH_HZ = 1400;

// #region pitch
/** The pitch in a window of samples, or null for silence or noise. */
export function detect(x: Float32Array, rate: number): Heard | null {
  const n = x.length;
  let energy = 0;
  for (const v of x) energy += v * v;
  if (Math.sqrt(energy / n) < SILENCE) return null;
  const maxLag = Math.min(n - 1, Math.ceil(rate / LOW_HZ)), minLag = Math.floor(rate / HIGH_HZ);
  const nsdf = new Float32Array(maxLag + 1);
  for (let tau = 0; tau <= maxLag; tau++) {
    let acf = 0, m = 0;
    for (let i = 0; i < n - tau; i++) { const a = x[i] as number, b = x[i + tau] as number; acf += a * b; m += a * a + b * b; }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }
  // the peak of each positive lobe but the first (the window against itself, its peak at 0)
  const peaks: number[] = [];
  let tau = 0;
  while (tau <= maxLag) {
    while (tau <= maxLag && (nsdf[tau] as number) <= 0) tau++;
    let best = -1;
    while (tau <= maxLag && (nsdf[tau] as number) > 0) { if (best < 0 || (nsdf[tau] as number) > (nsdf[best] as number)) best = tau; tau++; }
    if (best >= minLag && best > 0 && best < maxLag) peaks.push(best);
  }
  if (peaks.length === 0) return null;
  const highest = Math.max(...peaks.map((p) => nsdf[p] as number));
  const at = peaks.find((p) => (nsdf[p] as number) >= 0.9 * highest) as number;
  const [l, c, r] = [nsdf[at - 1] as number, nsdf[at] as number, nsdf[at + 1] as number];
  const shift = (l - r) / (2 * (l - 2 * c + r) || 1);
  const clarity = c - ((l - r) * shift) / 4;
  return clarity < CLARITY ? null : { hz: rate / (at + shift), clarity };
}
// #endregion pitch

/** A frequency's nearest MIDI number (A4 = 440 Hz = 69). */
export const midiOf = (hz: number): number => Math.round(69 + 12 * Math.log2(hz / 440));
/** A MIDI number's frequency. */
export const hzOf = (n: number): number => 440 * 2 ** ((n - 69) / 12);

/** A note heard: its MIDI pitch and when it began (ms, on the caller's clock). */
export interface HeardNote { pitch: number; at_ms: number }

/** Frames to notes: a pitch that holds `hold` frames in a row is a note, timed from its first frame, and reported
 *  once; the same pitch again is a new note only after `hold` frames of silence (or another note) between. */
export function listener(hold = 3): (frame: { pitch: number | null; at_ms: number }) => HeardNote | null {
  let candidate: number | null = null, count = 0, since = 0, sounding: number | null = null, quiet = 0;
  return ({ pitch, at_ms }) => {
    if (pitch === null) {
      candidate = null;
      count = 0;
      if (++quiet >= hold) sounding = null;
      return null;
    }
    quiet = 0;
    if (pitch === candidate) count++;
    else { candidate = pitch; count = 1; since = at_ms; }
    if (count !== hold || pitch === sounding) return null;
    sounding = pitch;
    return { pitch, at_ms: since };
  };
}
