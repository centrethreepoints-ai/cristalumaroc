"use client";

import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/i18n";
import { RANGES } from "@/lib/site-content";

/** Brand glyphs as inline SVG — lucide-react ships no brand icons. */
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
    { href: "/devis", label: t("nav.quote") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 bg-grid opacity-40" style={{ backgroundSize: "46px 46px" }} aria-hidden />
      <div
        className="pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-brand-600/20 blur-[120px]"
        aria-hidden
      />

      <div className="relative container-x">
        {/* CTA band */}
        <div className="flex flex-col items-start justify-between gap-5 border-b border-white/10 py-12 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t("home.ctaTitle")}</h3>
            <p className="mt-2 max-w-xl text-[15px] text-white/60">{t("home.ctaText")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/devis" className="btn-primary btn-lg">
              {t("nav.quote")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href="/projects" className="btn-outline-light btn-lg">
              {t("hero.cta3")}
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-display text-lg font-extrabold">
                C
              </span>
              <span className="leading-none">
                <span className="block font-display text-[15px] font-extrabold tracking-tight">CRISTALU</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-brand-500">Maroc</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-white/55">{t("footer.aboutText")}</p>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 text-white/60 transition hover:border-brand-500 hover:bg-brand-600 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t("footer.quickLinks")}</h4>
            <ul className="mt-4 space-y-2.5">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13.5px] text-white/65 transition hover:text-brand-500">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t("footer.productsTitle")}</h4>
            <ul className="mt-4 space-y-2.5">
              {RANGES.map((r) => (
                <li key={r.slug}>
                  <Link href={`/products/${r.slug}`} className="text-[13.5px] text-white/65 transition hover:text-brand-500">
                    {r.title[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t("footer.contactTitle")}</h4>
            <ul className="mt-4 space-y-3 text-[13.5px] text-white/65">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span>Zone Industrielle Sidi Ghanem, Lot 42, Casablanca 20250</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <a href="tel:+212522984512" dir="ltr">+212 522 98 45 12</a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <a href="mailto:contact@cristalu.ma">contact@cristalu.ma</a>
              </li>
            </ul>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-[13px] font-semibold">{t("footer.newsletterTitle")}</p>
              <p className="mt-1 text-[12px] text-white/50">{t("footer.newsletterText")}</p>
              <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  required
                  placeholder={t("footer.newsletterPh")}
                  className="input-dark flex-1 py-1.5 text-[13px]"
                />
                <button type="submit" className="btn-primary btn-sm" aria-label={t("footer.newsletterBtn")}>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-[12px] text-white/45 sm:flex-row">
          <p>
            © {year} {t("meta.brand")} SARL — ICE 001847293000045 — {t("meta.rights")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/contact" className="hover:text-white">{t("footer.legal")}</Link>
            <Link href="/contact" className="hover:text-white">{t("footer.terms")}</Link>
            <Link href="/contact" className="hover:text-white">{t("footer.privacy")}</Link>
            <Link href="/app/login" className="rounded-md border border-white/15 px-2.5 py-1 font-semibold transition hover:border-brand-500 hover:text-white">
              {t("nav.dashboard")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
