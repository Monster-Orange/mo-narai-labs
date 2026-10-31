// The trainer's own words, in the locales its manifest declares. Narai sends the task's prompt already localized;
// these are only the tool's controls. Pitches stay in scientific notation in every language (the wire's form).
import type { Interval } from "./theory.ts";

// #region locale
/** The languages the tool has, its default first: its manifest's `locales` (the contract test holds them equal).
 *  Which one to show comes from the SDK: `pickLocale(session.start, LOCALES)`. */
export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
// #endregion locale

interface Words { listen: string; keyboard: string; intervals: string; send: string; clear: string; interval: Record<Interval, string> }

const WORDS: Record<Locale, Words> = {
  en: {
    listen: "Listen", keyboard: "Keyboard", intervals: "Intervals", send: "Send", clear: "Clear",
    interval: {
      P1: "Unison", m2: "Minor 2nd", M2: "Major 2nd", m3: "Minor 3rd", M3: "Major 3rd", P4: "Perfect 4th", TT: "Tritone",
      P5: "Perfect 5th", m6: "Minor 6th", M6: "Major 6th", m7: "Minor 7th", M7: "Major 7th", P8: "Octave",
    },
  },
  ja: {
    listen: "聴く", keyboard: "鍵盤", intervals: "音程", send: "送る", clear: "クリア",
    interval: {
      P1: "完全1度", m2: "短2度", M2: "長2度", m3: "短3度", M3: "長3度", P4: "完全4度", TT: "増4度",
      P5: "完全5度", m6: "短6度", M6: "長6度", m7: "短7度", M7: "長7度", P8: "完全8度",
    },
  },
};


export const words = (l: Locale): Words => WORDS[l];
