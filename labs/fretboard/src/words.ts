// The fretboard's own words, in the locales its manifest declares. Narai sends the task's prompt already localized;
// these are only the tool's controls. Pitches stay in scientific notation in every language (the wire's form).
// #region locale
/** The languages the tool has, its default first: its manifest's `locales` (the contract test holds them equal).
 *  Which one to show comes from the SDK: `pickLocale(session.start, LOCALES)`. */
export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
// #endregion locale

interface Words {
  /** With no task: the line it shows instead of a prompt (it's never dead). */
  practice: string;
  neck: string; send: string; clear: string; spot: (string: number, fret: number, pitch: string) => string;
  listen: string; stop: string; heard: (notes: string) => string; micRefused: string;
}

const WORDS: Record<Locale, Words> = {
  en: {
    practice: "Practice: Narai isn't asking anything yet.",
    neck: "Guitar neck",
    send: "Send",
    clear: "Clear",
    spot: (s, f, p) => (f === 0 ? `String ${s}, open: ${p}` : `String ${s}, fret ${f}: ${p}`),
    listen: "Play on your guitar",
    stop: "Stop listening",
    heard: (n) => `Heard: ${n}`,
    micRefused: "No microphone. Tap the neck instead.",
  },
  ja: {
    practice: "練習モード：Narai からの質問はまだありません。",
    neck: "ギターのネック",
    send: "送る",
    clear: "クリア",
    spot: (s, f, p) => (f === 0 ? `${s}弦 開放：${p}` : `${s}弦 ${f}フレット：${p}`),
    listen: "ギターで弾く",
    stop: "聞くのをやめる",
    heard: (n) => `聞こえた音：${n}`,
    micRefused: "マイクが使えません。ネックをタップしてください。",
  },
};


export const words = (l: Locale): Words => WORDS[l];
