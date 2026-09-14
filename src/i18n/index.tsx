"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  LOCALES, LOCALE_META, getDict, makeT, money, num, compactMoney, dateStr, type Locale, type TranslateFn,
} from "./core";
import { fr } from "./fr";

export * from "./core";

/* --------------------------------- Context -------------------------------- */

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: "ltr" | "rtl";
  t: TranslateFn;
  money: (n?: number | null, currency?: string) => string;
  compact: (n?: number | null) => string;
  num: (n?: number | null, d?: number) => string;
  date: (s?: string | null, withTime?: boolean) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("cm_locale") as Locale | null) : null;
    if (saved && LOCALES.includes(saved) && saved !== locale) setLocaleState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("cm_locale", l);
      document.cookie = `cm_locale=${l};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = l;
      document.documentElement.dir = LOCALE_META[l].dir;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = LOCALE_META[locale].dir;
    }
  }, [locale]);

  const t = useMemo(() => makeT(locale), [locale]);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale,
      dir: LOCALE_META[locale].dir,
      t,
      money: (n, c = "MAD") => money(n, c, locale),
      compact: (n) => compactMoney(n, locale),
      num: (n, d = 0) => num(n, locale, d),
      date: (s, wt = false) => dateStr(s, locale, wt),
    }),
    [locale, setLocale, t],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Localised field picker for trilingual DB columns (name / name_ar / name_en). */
export function pickLocale(row: Record<string, any> | undefined | null, base: string, locale: Locale) {
  if (!row) return "";
  if (locale === "ar" && row[`${base}_ar`]) return row[`${base}_ar`];
  if (locale === "en" && row[`${base}_en`]) return row[`${base}_en`];
  return row[base] ?? "";
}
