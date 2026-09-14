"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useI18n, LOCALES, LOCALE_META } from "@/i18n";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
        aria-label="Language"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition",
          variant === "dark"
            ? "text-white/80 hover:bg-white/10 hover:text-white"
            : "text-ink-600 hover:bg-ink-900/5 hover:text-ink-900",
        )}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_META[locale].native}</span>
        <span className="sm:hidden">{LOCALE_META[locale].flag}</span>
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-ink-900/10 bg-white py-1 shadow-lift">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setLocale(l);
                setOpen(false);
                // Server components read the locale cookie, so the tree must be re-fetched.
                setTimeout(() => router.refresh(), 0);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-start text-sm transition",
                l === locale ? "bg-brand-600/8 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-50",
              )}
            >
              <span>{LOCALE_META[l].native}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-300">{LOCALE_META[l].flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
