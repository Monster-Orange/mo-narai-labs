// The tapper's own words, in the locales its manifest declares. Narai sends the task's prompt already localized;
// these are only the tool's controls. Syllables (a tāl's bols) and a cycle's name stay as the step wrote them.
// #region locale
/** The languages the tool has, its default first: its manifest's `locales` (the contract test holds them equal).
 *  Which one to show comes from the SDK: `pickLocale(session.start, LOCALES)`. */
export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
// #endregion locale

interface Words {
  cycle: (name: string | null, beats: number, groups: readonly number[]) => string;
  tap: string; send: string; clear: string; hand: Record<"clap" | "wave", string>; tapped: (n: number) => string; countIn: (n: number) => string;
}

const WORDS: Record<Locale, Words> = {
  en: {
    cycle: (name, beats, groups) => `${name ? `${name}: ` : ""}${beats} beats, ${groups.join(" + ")}`,
    tap: "Tap", send: "Send", clear: "Clear", hand: { clap: "clap", wave: "wave" }, tapped: (n) => (n === 1 ? "1 tap" : `${n} taps`),
    countIn: (n) => `Starting in ${n}`,
  },
  ja: {
    cycle: (name, beats, groups) => `${name ? `${name}：` : ""}${beats}拍（${groups.join(" + ")}）`,
    tap: "タップ", send: "送る", clear: "クリア", hand: { clap: "手を打つ", wave: "手を振る" }, tapped: (n) => `${n}回タップ`,
    countIn: (n) => `あと${n}拍で始まります`,
  },
};


export const words = (l: Locale): Words => WORDS[l];
