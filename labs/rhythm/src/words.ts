// The tapper's own words, in the locales its manifest declares. Narai sends the task's prompt already localized;
// these are only the tool's controls. Bols stay in their Latin spelling in every language.
// #region locale
/** The languages the tool has, its default first: its manifest's `locales` (the contract test holds them equal).
 *  Which one to show comes from the SDK: `pickLocale(session.start, LOCALES)`. */
export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
// #endregion locale

interface Words { cycle: string; tap: string; send: string; clear: string; hand: Record<"clap" | "wave", string>; tapped: (n: number) => string }

const WORDS: Record<Locale, Words> = {
  en: { cycle: "Rupak tāl: 7 beats, 3 + 2 + 2", tap: "Tap", send: "Send", clear: "Clear", hand: { clap: "clap", wave: "wave" }, tapped: (n) => (n === 1 ? "1 tap" : `${n} taps`) },
  ja: { cycle: "ルパク・タール：7拍（3 + 2 + 2）", tap: "タップ", send: "送る", clear: "クリア", hand: { clap: "手を打つ", wave: "手を振る" }, tapped: (n) => `${n}回タップ` },
};


export const words = (l: Locale): Words => WORDS[l];
