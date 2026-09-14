"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { RANGES } from "@/lib/site-content";
import { Img } from "./Img";
import { Reveal } from "./Reveal";

export function Hero() {
  const { t, locale } = useI18n();

  return (
    <section className="relative bg-white pt-16">
      <div className="container-x pb-12 pt-14 sm:pt-20">
        <p className="m-eyebrow animate-fade-up">{t("hero.eyebrow")}</p>

        <h1 className="m-display mt-6 text-[clamp(2.6rem,7.5vw,6rem)] text-ink-950">
          <span className="m-line">
            <span className="m-line-in">{t("hero.title")}</span>
          </span>
          <span className="m-line text-ink-300">
            <span className="m-line-in" style={{ animationDelay: "120ms" }}>
              {t("hero.subtitle")}
            </span>
          </span>
        </h1>

        <Reveal delay={250} className="mt-8 max-w-xl">
          <p className="text-[15px] leading-relaxed text-ink-500 sm:text-[16px]">{t("hero.text")}</p>
        </Reveal>

        <Reveal delay={350} className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 bg-ink-950 px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-brand-600"
          >
            {t("hero.cta1")}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
          <Link href="/devis" className="m-link text-[13px] font-bold uppercase tracking-[0.16em] text-ink-950">
            {t("hero.cta2")}
          </Link>
          <Link href="/projects" className="m-link text-[13px] font-bold uppercase tracking-[0.16em] text-ink-400">
            {t("hero.cta3")}
          </Link>
        </Reveal>
      </div>

      {/* Full-bleed breathing image */}
      <Reveal variant="scale" className="m-kb">
        <Img src="/images/hero.jpg" alt="Cristalu Maroc" ratio="21/9" className="w-full" priority />
      </Reveal>

      {/* Hairline stats */}
      <div className="container-x">
        <Reveal className="grid grid-cols-2 divide-ink-900/8 border-x border-ink-900/8 sm:grid-cols-4 sm:divide-x">
          {[
            { v: "15+", l: t("stats.years") },
            { v: "1200+", l: t("stats.projects") },
            { v: "3500", l: t("stats.sqmMonth") },
            { v: "40+", l: t("stats.capacity") },
          ].map((s) => (
            <div key={s.l} className="px-6 py-7">
              <p className="m-display text-3xl text-ink-950 sm:text-4xl">{s.v}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">{s.l}</p>
            </div>
          ))}
        </Reveal>
      </div>

      {/* Marquee */}
      <div className="m-marquee mt-16 border-y border-ink-900/8 py-4" aria-hidden>
        <div className="m-marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {RANGES.map((r) => (
                <span key={`${copy}-${r.slug}`} className="flex items-center gap-6 pe-6 text-[13px] font-bold uppercase tracking-[0.24em] text-ink-400">
                  {r.title[locale]}
                  <span className="h-1 w-1 rounded-full bg-brand-600" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
