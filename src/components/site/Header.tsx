"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LayoutGrid, Menu, Phone, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { RANGES } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProductsOpen(false);
  }, [pathname, locale]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const mainNav = [
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
      {/* Utility bar */}
      <div className="relative z-50 hidden bg-ink-950 text-white lg:block">
        <div className="container-x flex h-9 items-center justify-between text-[12px]">
          <div className="flex items-center gap-5 text-white/60">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-brand-500" /> +212 522 98 45 12
            </span>
            <span className="hidden xl:inline">contact@cristalu.ma</span>
            <span className="hidden xl:inline">Zone Industrielle Sidi Ghanem, Casablanca</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="me-3 hidden text-white/40 xl:inline">{t("meta.madeIn")}</span>
            <LocaleSwitcher variant="dark" />
            <Link
              href="/app/login"
              className="ms-2 rounded-md bg-white/8 px-2.5 py-1 font-semibold text-white/85 transition hover:bg-brand-600 hover:text-white"
            >
              {t("nav.dashboard")}
            </Link>
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled ? "border-b border-ink-900/8 bg-white/92 glass shadow-card" : "bg-white",
        )}
      >
        <div className="container-x flex h-[68px] items-center justify-between gap-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={t("meta.brand")}>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-display text-lg font-extrabold text-white shadow-[0_6px_18px_-6px_rgba(227,6,19,.9)]">
              C
              <span className="absolute -bottom-0.5 -end-0.5 h-2 w-2 rounded-full bg-ink-900" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[15px] font-extrabold tracking-tight text-ink-900">
                CRISTALU
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600">Maroc</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {mainNav.slice(0, 2).map((item) => (
              <NavLink key={item.href} href={item.href} active={isActive(item.href)}>
                {item.label}
              </NavLink>
            ))}

            {/* Products mega menu */}
            <div className="relative" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
              <NavLink href="/products" active={isActive("/products")} chevron>
                {t("nav.products")}
              </NavLink>
              <div
                className={cn(
                  "absolute start-0 top-full w-[560px] pt-3 transition-all duration-200",
                  productsOpen ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-1 opacity-0",
                )}
              >
                <div className="grid grid-cols-2 gap-1 rounded-2xl border border-ink-900/10 bg-white p-3 shadow-lift">
                  {RANGES.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/products/${r.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-ink-50"
                    >
                      <span
                        className="mt-0.5 h-8 w-1.5 shrink-0 rounded-full transition-transform group-hover:scale-y-110"
                        style={{ background: r.accent }}
                      />
                      <span>
                        <span className="block text-[13px] font-bold text-ink-900 group-hover:text-brand-700">
                          {r.title[locale]}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-400">{r.tagline[locale]}</span>
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/products"
                    className="col-span-2 mt-1 flex items-center justify-center gap-2 rounded-xl bg-ink-900 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-600"
                  >
                    <LayoutGrid className="h-4 w-4" /> {t("products.title")}
                  </Link>
                </div>
              </div>
            </div>

            {mainNav.slice(3).map((item) => (
              <NavLink key={item.href} href={item.href} active={isActive(item.href)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <LocaleSwitcher />
            </div>
            <Link href="/devis" className="btn-primary hidden sm:inline-flex">
              {t("nav.quote")}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="btn-icon h-10 w-10 lg:hidden"
              aria-label={t("nav.menu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn("absolute inset-0 bg-ink-950/60 transition-opacity duration-300", menuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 end-0 flex w-[86%] max-w-sm flex-col bg-white transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0 rtl:translate-x-0" : "translate-x-full rtl:-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-ink-900/8 px-5">
            <span className="font-display text-sm font-bold">{t("nav.menu")}</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="btn-icon" aria-label={t("nav.close")}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="scroll-thin flex-1 overflow-y-auto px-3 py-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold transition",
                  isActive(item.href) ? "bg-brand-600/8 text-brand-700" : "text-ink-800 hover:bg-ink-50",
                )}
              >
                {item.label}
              </Link>
            ))}

            <p className="mt-5 px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
              {t("nav.productsGroup")}
            </p>
            {RANGES.map((r) => (
              <Link
                key={r.slug}
                href={`/products/${r.slug}`}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-ink-700 transition hover:bg-ink-50"
              >
                <span className="h-6 w-1 rounded-full" style={{ background: r.accent }} />
                {r.title[locale]}
              </Link>
            ))}
          </div>

          <div className="border-t border-ink-900/8 p-4">
            <Link href="/devis" className="btn-primary w-full">
              {t("nav.quote")}
            </Link>
            <Link href="/app/login" className="btn-outline mt-2 w-full">
              {t("nav.dashboard")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function NavLink({
  href,
  active,
  children,
  chevron,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  chevron?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
        active ? "text-brand-700" : "text-ink-700 hover:text-ink-900",
      )}
    >
      {children}
      {chevron && <ChevronDown className="h-3.5 w-3.5 opacity-50" />}
      {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />}
    </Link>
  );
}
