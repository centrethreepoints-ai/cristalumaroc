import { fr, type Dict } from "./fr";
import { ar, type DeepPartial } from "./ar";
import { en } from "./en";

export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; native: string; dir: "ltr" | "rtl"; flag: string }> = {
  fr: { label: "Français", native: "Français", dir: "ltr", flag: "FR" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl", flag: "MA" },
  en: { label: "English", native: "English", dir: "ltr", flag: "EN" },
};

const DICTS: Record<Locale, object> = { fr, ar, en };

export function deepMerge<T>(base: T, override: unknown): T {
  if (!override || typeof override !== "object") return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof (base as any)?.[k] === "object") {
      out[k] = deepMerge((base as any)[k], v);
    } else if (v !== undefined && v !== null && v !== "") {
      out[k] = v;
    }
  }
  return out;
}

const MERGED: Record<Locale, Dict> = {
  fr,
  ar: deepMerge(fr, ar as DeepPartial<Dict>) as Dict,
  en: deepMerge(fr, en as DeepPartial<Dict>) as Dict,
};

export function getDict(locale: Locale): Dict {
  return MERGED[locale] ?? fr;
}

export type TranslateFn = (path: string, vars?: Record<string, string | number>) => string;

export function makeT(locale: Locale): TranslateFn {
  const dict = getDict(locale);
  return (path, vars) => {
    let node: any = dict;
    for (const part of path.split(".")) {
      if (node == null) break;
      node = node[part];
    }
    if (typeof node !== "string") {
      // Fallback to French
      let f: any = fr;
      for (const part of path.split(".")) {
        if (f == null) break;
        f = f[part];
      }
      node = typeof f === "string" ? f : path;
    }
    if (vars) {
      for (const [k, v] of Object.entries(vars)) node = node.replaceAll(`{${k}}`, String(v));
    }
    return node;
  };
}

/* ------------------------------- Formatting ------------------------------- */

export function money(n: number | null | undefined, currency = "MAD", locale: Locale = "fr") {
  const v = Number(n) || 0;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "fr-MA" : locale === "en" ? "en-US" : "fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
  return `${formatted} ${currency}`;
}

export function num(n: number | null | undefined, locale: Locale = "fr", decimals = 0) {
  return new Intl.NumberFormat(locale === "ar" ? "fr-MA" : locale === "en" ? "en-US" : "fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n) || 0);
}

export function compactMoney(n: number | null | undefined, locale: Locale = "fr") {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${num(v / 1_000_000, locale, 2)} M`;
  if (abs >= 1_000) return `${num(v / 1_000, locale, abs >= 10_000 ? 0 : 1)} k`;
  return num(v, locale, 0);
}

export function dateStr(input: string | null | undefined, locale: Locale = "fr", withTime = false) {
  if (!input) return "—";
  const d = new Date(input.includes("T") ? input : input.replace(" ", "T") + (input.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return input;
  return new Intl.DateTimeFormat(locale === "ar" ? "fr-MA" : locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function monthLabel(key: string, locale: Locale = "fr") {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "ar" ? "fr-MA" : locale === "en" ? "en-GB" : "fr-FR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(y, (m || 1) - 1, 1));
}

