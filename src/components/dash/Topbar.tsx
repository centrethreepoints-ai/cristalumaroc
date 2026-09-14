"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bell, CheckCheck, ExternalLink, LogOut, Search, X,
  AlertTriangle, CheckCircle2, Info, PackageSearch, FileText, ShoppingCart, Factory, Receipt, Truck, Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { useI18n } from "@/i18n";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { logout } from "@/app/app/login/actions";
import { cn, initials } from "@/lib/utils";

type Hit = { kind: string; id: number; label: string; sub?: string; href: string };

const KIND_ICON: Record<string, any> = {
  customer: Users, product: PackageSearch, quote: FileText, order: ShoppingCart,
  invoice: Receipt, supplier: Truck, mo: Factory,
};

export function Topbar({
  user,
  notifications,
  unread,
}: {
  user: SessionUser;
  notifications: any[];
  unread: number;
}) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [openSearch, setOpenSearch] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);

  // Global search across customers, products, quotes, orders, invoices, suppliers, MOs.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setHits(await res.json());
      } catch {
        /* network error — leave previous results */
      }
    }, 180);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpenSearch(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>();
    for (const h of hits) {
      const arr = map.get(h.kind) ?? [];
      arr.push(h);
      map.set(h.kind, arr);
    }
    return [...map.entries()];
  }, [hits]);

  function markAllRead() {
    startTransition(async () => {
      await fetch("/api/notifications", { method: "POST" });
      router.refresh();
      setNotifOpen(false);
    });
  }

  const levelIcon = (l: string) =>
    l === "critical" || l === "warning" ? AlertTriangle : l === "success" ? CheckCircle2 : Info;
  const levelColor = (l: string) =>
    l === "critical" ? "text-brand-600 bg-brand-600/10"
      : l === "warning" ? "text-amber-600 bg-amber-500/12"
      : l === "success" ? "text-emerald-600 bg-emerald-500/12"
      : "text-sky-600 bg-sky-500/12";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-900/8 bg-white/92 px-4 glass sm:px-6 lg:px-8">
      {/* Search */}
      <div ref={searchRef} className="relative min-w-0 flex-1 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenSearch(true);
            }}
            onFocus={() => setOpenSearch(true)}
            placeholder={t("app.searchPlaceholder")}
            className="input ps-9"
            aria-label={t("app.searchHint")}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="btn-icon absolute inset-y-0 end-1 my-auto h-7 w-7" aria-label={t("actions.close")}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {openSearch && query.trim().length >= 2 && (
          <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-ink-900/10 bg-white p-2 shadow-lift scroll-thin">
            {grouped.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-ink-400">{t("actions.noResults")}</p>
            ) : (
              grouped.map(([kind, items]) => (
                <div key={kind} className="mb-1">
                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{kind}</p>
                  {items.map((h) => {
                    const Icon = KIND_ICON[h.kind] ?? FileText;
                    return (
                      <Link
                        key={`${h.kind}-${h.id}`}
                        href={h.href}
                        onClick={() => setOpenSearch(false)}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-ink-50"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-ink-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-ink-900">{h.label}</span>
                          {h.sub && <span className="block truncate text-[11.5px] text-ink-400">{h.sub}</span>}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="ms-auto flex items-center gap-1">
        <LocaleSwitcher />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((v) => !v); setMenuOpen(false); }}
            className="btn-icon relative h-9 w-9"
            aria-label={t("app.notifications")}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute end-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-lift">
              <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-3">
                <p className="text-[13px] font-bold text-ink-900">{t("app.notifications")}</p>
                {unread > 0 && (
                  <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700">
                    <CheckCheck className="h-3.5 w-3.5" /> {t("app.markAllRead")}
                  </button>
                )}
              </div>
              <div className="max-h-[380px] overflow-y-auto scroll-thin">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[13px] text-ink-400">{t("app.noNotifications")}</p>
                ) : (
                  notifications.map((n) => {
                    const Icon = levelIcon(n.level);
                    const Inner = (
                      <div className={cn("flex gap-3 px-4 py-3 transition hover:bg-ink-50", !n.read && "bg-brand-600/[.03]")}>
                        <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", levelColor(n.level))}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold leading-snug text-ink-900">{n.title}</p>
                          {n.body && <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-500">{n.body}</p>}
                          <p className="mt-1 text-[10.5px] font-medium uppercase tracking-wider text-ink-300">{n.created_at}</p>
                        </div>
                        {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                      </div>
                    );
                    return n.link ? (
                      <Link key={n.id} href={n.link} onClick={() => setNotifOpen(false)} className="block">
                        {Inner}
                      </Link>
                    ) : (
                      <div key={n.id}>{Inner}</div>
                    );
                  })
                )}
              </div>
              <Link
                href="/app/notifications"
                onClick={() => setNotifOpen(false)}
                className="flex items-center justify-center gap-1.5 border-t border-ink-900/8 py-2.5 text-[12.5px] font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
              >
                {t("common.seeAll")} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setMenuOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-ink-900/5"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold text-white"
              style={{ background: user.color || "#E30613" }}
            >
              {initials(user.fullName)}
            </span>
            <span className="hidden text-start leading-tight sm:block">
              <span className="block text-[12.5px] font-bold text-ink-900">{user.fullName}</span>
              <span className="block text-[10.5px] text-ink-400">{ROLE_LABELS[user.role]?.[locale]}</span>
            </span>
          </button>

          {menuOpen && (
            <div className="absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ink-900/10 bg-white py-1 shadow-lift">
              <div className="border-b border-ink-900/8 px-4 py-3">
                <p className="text-[13px] font-bold text-ink-900">{user.fullName}</p>
                <p className="truncate text-[11.5px] text-ink-400">{user.email}</p>
              </div>
              <Link href="/" className="flex items-center gap-2 px-4 py-2 text-[13px] text-ink-700 transition hover:bg-ink-50">
                <ExternalLink className="h-4 w-4 text-ink-400" /> {t("app.viewSite")}
              </Link>
              <form
                action={async () => {
                  await logout();
                }}
              >
                <button type="submit" className="flex w-full items-center gap-2 px-4 py-2 text-[13px] font-semibold text-brand-600 transition hover:bg-brand-600/6">
                  <LogOut className="h-4 w-4" /> {t("app.logout")}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
