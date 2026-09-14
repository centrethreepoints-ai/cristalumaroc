import { cookies } from "next/headers";
import {
  LOCALES, LOCALE_META, getDict, money, num, compactMoney, dateStr, monthLabel,
  type Locale, type TranslateFn,
} from "./core";

export { LOCALES, LOCALE_META, getDict, money, num, compactMoney, dateStr, monthLabel };
export type { Locale };

function makeT(dict: any, locale: Locale): TranslateFn {
  const fr = getDict("fr");
  return (path, vars) => {
    const read = (root: any) => {
      let node = root;
      for (const part of path.split(".")) {
        if (node == null) return undefined;
        node = node[part];
      }
      return node;
    };
    let value = read(dict);
    if (typeof value !== "string") value = read(fr);
    if (typeof value !== "string") value = path;
    if (vars) for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
    return value;
  };
}

export type ServerI18n = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: TranslateFn;
  money: (n?: number | null, currency?: string) => string;
  compact: (n?: number | null) => string;
  num: (n?: number | null, d?: number) => string;
  date: (s?: string | null, withTime?: boolean) => string;
  month: (key: string) => string;
  /** Pick the localised column of a DB row (name / name_ar / name_en). */
  pick: (row: Record<string, any> | undefined | null, base: string) => string;
};

/** Reads the locale cookie and returns fully-bound formatting helpers. */
export async function getI18n(): Promise<ServerI18n> {
  const store = await cookies();
  const raw = store.get("cm_locale")?.value as Locale;
  const locale: Locale = LOCALES.includes(raw) ? raw : "fr";
  return buildI18n(locale);
}

export function buildI18n(locale: Locale): ServerI18n {
  const dict = getDict(locale);
  return {
    locale,
    dir: LOCALE_META[locale].dir,
    t: makeT(dict, locale),
    money: (n, c = "MAD") => money(n, c, locale),
    compact: (n) => compactMoney(n, locale),
    num: (n, d = 0) => num(n, locale, d),
    date: (s, wt = false) => dateStr(s, locale, wt),
    month: (key) => monthLabel(key, locale),
    pick: (row, base) => {
      if (!row) return "";
      if (locale === "ar" && row[`${base}_ar`]) return row[`${base}_ar`];
      if (locale === "en" && row[`${base}_en`]) return row[`${base}_en`];
      return row[base] ?? "";
    },
  };
}
