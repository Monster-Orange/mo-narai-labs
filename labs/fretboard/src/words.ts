// The fretboard's own words, in the locales its manifest declares. Narai sends the task's prompt already localized;
// these are only the tool's controls. Pitches stay in scientific notation in every language (the wire's form).
export type Locale = "en" | "ja";

interface Words { neck: string; send: string; clear: string; spot: (string: number, fret: number, pitch: string) => string }

const WORDS: Record<Locale, Words> = {
  en: {
    neck: "Guitar neck",
    send: "Send",
    clear: "Clear",
    spot: (s, f, p) => (f === 0 ? `String ${s}, open: ${p}` : `String ${s}, fret ${f}: ${p}`),
  },
  ja: {
    neck: "ギターのネック",
    send: "送る",
    clear: "クリア",
    spot: (s, f, p) => (f === 0 ? `${s}弦 開放：${p}` : `${s}弦 ${f}フレット：${p}`),
  },
};

/** The first of a fallback chain the tool has ("ja-JP", "ja", "en" → ja); English when none. */
export function pickLocale(chain: readonly string[]): Locale {
  for (const l of chain) {
    const base = l.toLowerCase().split("-")[0];
    if (base === "en" || base === "ja") return base;
  }
  return "en";
}

export const words = (l: Locale): Words => WORDS[l];
