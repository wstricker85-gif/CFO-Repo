import { english, templates } from "./i18n/en.ts";
export type Language = "de" | "en";
let activeLanguage: Language = "de";
const listeners = new Set<() => void>();
export function getLanguage(): Language {
  return typeof window === "undefined" ? "de" : activeLanguage;
}
export function getLocale(language: Language = getLanguage()) {
  return language === "en" ? "en-GB" : "de-DE";
}
export function setLanguage(language: Language) {
  if (typeof window === "undefined") return;
  activeLanguage = language;
  try {
    localStorage.setItem("cfo-language", language);
  } catch {
    /* Preference remains usable without storage. */
  }
  listeners.forEach((listener) => listener());
}
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const serverLanguage = (): Language => "de";
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = Object.entries(templates)
  .sort((a, b) => b[0].replace(/\{\d+\}/g, "").length - a[0].replace(/\{\d+\}/g, "").length)
  .map(([de, en]) => ({
    regex: new RegExp(
      "^" +
        de
          .split(/\{\d+\}/)
          .map(escape)
          .join("(.+?)")
          .replace(de.startsWith("Der Umsatz beträgt im") ? "(.+?)" : "\uFFFF", "(.+? \\d{4})") +
        "$",
    ),
    en,
  }));
const fragments = Object.entries(english)
  .filter(([de, en]) => de !== en && de.length > 1)
  .sort((a, b) => b[0].length - a[0].length);
export function translate<T extends string | null | undefined>(
  value: T,
  language: Language = getLanguage(),
): T {
  if (language === "de" || typeof value !== "string") return value;
  const text = normalize(value);
  const pad = (result: string) =>
    ((/^\s/.test(value) ? " " : "") + result + (/\s$/.test(value) ? " " : "")) as T;
  if (Object.hasOwn(english, text)) return pad(english[text]);
  const markdownPrefix = text.match(/^(#{1,6} |[>\-] )(.+)$/);
  if (markdownPrefix) return pad(markdownPrefix[1] + translate(markdownPrefix[2], language));
  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match)
      return pad(
        pattern.en.replace(/\{(\d+)\}/g, (_, i) =>
          String(translate(match[Number(i) + 1], language)),
        ),
      );
  }
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/u);
  if (sentences.length > 1)
    return pad(sentences.map((sentence) => translate(sentence, language)).join(" "));
  // Compose generated financial explanations from translated, non-overlapping phrases.
  const tokens: string[] = [];
  let composed = text;
  for (const [de, en] of fragments) {
    if (!composed.includes(de)) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}_])${escape(de)}(?![\\p{L}\\p{N}_])`, "gu");
    composed = composed.replace(re, () => {
      tokens.push(en);
      return `\uE000${tokens.length - 1}\uE001`;
    });
  }
  return pad(composed.replace(/\uE000(\d+)\uE001/g, (_, i) => tokens[Number(i)]));
}
