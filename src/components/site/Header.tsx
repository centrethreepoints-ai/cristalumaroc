"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { RANGES } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname, locale]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/products", label: t("nav.products") },
    { href: "/projects", label: t("nav.projects") },
    { href: "/gallery", label: t("nav.gallery") },
    { href: "/news", label: t("nav.news") },
    { href: "/contact", label: t("nav.contact") },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 bg-white/85 backdrop-blur-md transition-shadow duration-300",
          scrolled ? "shadow-[0_1px_0_0_rgb(11_11_14/0.08)]" : "shadow-none",
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-6">
          {/* Wordmark */}
          <Link href="/" className="group flex items-baseline gap-1.5" aria-label="Cristalu Maroc">
            <span className="m-display text-[19px] font-extrabold tracking-tight text-ink-950">
              CRISTALU
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600 transition-transform duration-300 group-hover:scale-150" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink-400">Maroc</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {nav.slice(1, 6).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "m-link text-[12px] font-bold uppercase tracking-[0.16em] transition-colors",
                  isActive(n.href) ? "text-ink-950" : "text-ink-400 hover:text-ink-950",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <LocaleSwitcher />
            <Link
              href="/devis"
              className="group hidden items-center gap-1 border border-ink-950 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-ink-950 transition-colors duration-300 hover:bg-ink-950 hover:text-white sm:inline-flex"
            >
              {t("nav.quote")}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:rotate-90" />
            </Link>
            <Link
              href="/app/login"
              className="hidden text-[12px] font-bold uppercase tracking-[0.16em] text-ink-400 transition hover:text-ink-950 lg:inline"
            >
              {t("nav.dashboard")}
            </Link>
            <button
              type="button"
              className="p-1 text-ink-950 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={t("nav.menu")}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] flex flex-col bg-white transition-all duration-500",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!menuOpen}
      >
        <div className="container-x flex h-16 items-center justify-between">
          <span className="m-display text-[19px] font-extrabold text-ink-950">CRISTALU</span>
          <button type="button" className="p-1 text-ink-950" onClick={() => setMenuOpen(false)} aria-label={t("nav.close")}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="scroll-thin flex-1 overflow-y-auto px-6 pb-10 pt-6" aria-label="Mobile">
          <ul className="divide-y divide-ink-900/8">
            {nav.map((n, i) => (
              <li key={n.href} className={cn("transition-all duration-500", menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")} style={{ transitionDelay: `${80 + i * 50}ms` }}>
                <Link href={n.href} className="flex items-center justify-between py-4 font-display text-2xl font-bold text-ink-950">
                  {n.label}
                  <ArrowUpRight className="h-5 w-5 text-brand-600 rtl:rotate-90" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.28em] text-ink-400">{t("nav.productsGroup")}</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
            {RANGES.map((r) => (
              <li key={r.slug}>
                <Link href={`/products/${r.slug}`} className="text-[13.5px] text-ink-500 transition hover:text-ink-950">
                  {r.title[locale]}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex items-center gap-3">
            <Link href="/devis" className="flex-1 bg-ink-950 px-5 py-3 text-center text-[13px] font-bold uppercase tracking-[0.16em] text-white">
              {t("nav.quote")}
            </Link>
            <Link href="/app/login" className="border border-ink-900/15 px-5 py-3 text-[13px] font-bold uppercase tracking-[0.16em] text-ink-700">
              {t("nav.dashboard")}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
