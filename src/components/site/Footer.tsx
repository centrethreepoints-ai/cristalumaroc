"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { RANGES } from "@/lib/site-content";

const SOCIALS = [
  { label: "Facebook", path: "M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.2-1.5 1.5-1.5h1.4V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.5v7h3Z" },
  { label: "Instagram", path: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1Zm0 3.2a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 0 0 0-13.2Zm0 2.3a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Zm6.9-2.5a1.5 1.5 0 1 1-3.1 0 1.5 1.5 0 0 1 3.1 0Z" },
  { label: "LinkedIn", path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.5c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21h-4V9Z" },
  { label: "YouTube", path: "M21.6 7.2c-.2-1-.9-1.7-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3c-1 .2-1.7.9-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8c.2 1 .9 1.7 1.9 1.9 1.7.3 7.7.3 7.7.3s6 0 7.7-.3c1-.2 1.7-.9 1.9-1.9.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z" },
];

export function Footer() {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();

  const links = [
    { href: "/about", label: t("nav.about") },
    { href: "/projects", label: t("nav.projects") },
    { href: "/gallery", label: t("nav.gallery") },
    { href: "/news", label: t("nav.news") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <footer className="bg-ink-950 text-white">
      <div className="container-x">
        {/* CTA */}
        <Link href="/devis" className="group flex items-center justify-between border-b border-white/10 py-12 sm:py-16">
          <span className="m-display text-[clamp(1.8rem,5vw,3.6rem)] text-white transition-colors duration-300 group-hover:text-brand-500">
            {t("home.ctaTitle")}
          </span>
          <ArrowUpRight className="h-8 w-8 shrink-0 text-brand-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 rtl:rotate-90 sm:h-12 sm:w-12" />
        </Link>

        {/* Columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="m-display text-2xl font-extrabold">
              CRISTALU<span className="text-brand-500">.</span>
            </p>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/50">{t("footer.aboutText")}</p>
            <div className="mt-6 flex items-center gap-4">
              {SOCIALS.map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className="text-white/40 transition-colors hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">{t("footer.productsTitle")}</p>
            <ul className="mt-5 space-y-2.5">
              {RANGES.slice(0, 6).map((r) => (
                <li key={r.slug}>
                  <Link href={`/products/${r.slug}`} className="text-[13.5px] text-white/60 transition hover:text-white">
                    {r.title[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">{t("footer.quickLinks")}</p>
            <ul className="mt-5 space-y-2.5">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13.5px] text-white/60 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/app/login" className="text-[13.5px] text-white/60 transition hover:text-white">
                  {t("nav.dashboard")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">{t("footer.newsletterTitle")}</p>
            <p className="mt-5 text-[13.5px] leading-relaxed text-white/50">{t("footer.newsletterText")}</p>
            <form className="mt-5 flex border-b border-white/20 focus-within:border-white" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder={t("footer.newsletterPh")}
                className="w-full bg-transparent py-2.5 text-[13.5px] text-white placeholder:text-white/30 focus:outline-none"
              />
              <button type="submit" aria-label={t("footer.newsletterBtn")} className="p-2 text-white/60 transition hover:text-brand-500">
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </form>
          </div>
        </div>

        {/* Legal */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 py-6 text-[12px] text-white/40 sm:flex-row sm:items-center">
          <p>© {year} {t("meta.brand")} — {t("meta.rights")}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition hover:text-white">{t("footer.legal")}</a>
            <a href="#" className="transition hover:text-white">{t("footer.privacy")}</a>
            <a href="#" className="transition hover:text-white">{t("footer.terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
