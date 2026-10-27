// The tapper's own words, in the locales its manifest declares. Narai sends the task's prompt already localized;
// these are only the tool's controls. Bols stay in their Latin spelling in every language.
export type Locale = "en" | "ja";

interface Words { cycle: string; tap: string; send: string; clear: string; hand: Record<"clap" | "wave", string>; tapped: (n: number) => string }

const WORDS: Record<Locale, Words> = {
  en: { cycle: "Rupak tāl: 7 beats, 3 + 2 + 2", tap: "Tap", send: "Send", clear: "Clear", hand: { clap: "clap", wave: "wave" }, tapped: (n) => (n === 1 ? "1 tap" : `${n} taps`) },
  ja: { cycle: "ルパク・タール：7拍（3 + 2 + 2）", tap: "タップ", send: "送る", clear: "クリア", hand: { clap: "手を打つ", wave: "手を振る" }, tapped: (n) => `${n}回タップ` },
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
