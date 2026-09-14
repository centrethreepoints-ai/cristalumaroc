"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";
import { Img } from "./Img";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative isolate overflow-hidden bg-ink-950">
      <Img
        src="/images/hero.jpg"
        alt="Façade rideau aluminium Cristalu Maroc"
        className="absolute inset-0 h-full w-full opacity-45"
        priority
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,.55)_0%,rgba(8,8,10,.82)_55%,#08080A_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-grid opacity-30" style={{ backgroundSize: "58px 58px" }} aria-hidden />
      <div
        className="pointer-events-none absolute -start-40 top-1/3 h-[520px] w-[520px] rounded-full bg-brand-600/25 blur-[140px]"
        aria-hidden
      />

      <div className="relative container-x flex min-h-[calc(100vh-68px)] flex-col justify-center pb-24 pt-16 sm:min-h-[620px]">
        <div className="max-w-4xl">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 glass">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-500" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
            </span>
            {t("hero.eyebrow")}
          </div>

          <h1
            className="animate-fade-up mt-6 font-display text-[clamp(2.4rem,7vw,5rem)] font-extrabold leading-[0.98] tracking-tight text-white text-balance"
            style={{ animationDelay: "80ms" }}
          >
            {t("hero.title")}
            <span className="mt-2 block bg-gradient-to-r from-brand-500 via-brand-600 to-brand-800 bg-clip-text text-[clamp(1.15rem,3.1vw,2.35rem)] font-bold leading-tight text-transparent">
              {t("hero.subtitle")}
            </span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-[17px]"
            style={{ animationDelay: "160ms" }}
          >
            {t("hero.text")}
          </p>

          <div
            className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link href="/products" className="btn-primary btn-lg">
              {t("hero.cta1")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href="/devis" className="btn-outline-light btn-lg">
              <Sparkles className="h-4 w-4" /> {t("hero.cta2")}
            </Link>
            <Link
              href="/projects"
              className="btn-lg inline-flex items-center gap-2 text-[15px] font-semibold text-white/75 transition hover:text-white"
            >
              {t("hero.cta3")}
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 transition group-hover:border-white">
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </span>
            </Link>
          </div>

          <div
            className="animate-fade-up mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] font-medium text-white/45"
            style={{ animationDelay: "320ms" }}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-500" /> ISO 9001:2015
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" />
            <span>{t("stats.years")}: 18</span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" />
            <span>{t("stats.capacity")}: 12 000 m²/{t("common.sqm").replace("m²", "").trim() || "mois"}</span>
          </div>
        </div>

        <a
          href="#gammes"
          className="absolute bottom-8 start-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 transition hover:text-white/70 sm:flex"
        >
          {t("hero.scroll")}
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
