"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight, BarChart3, Bell, Boxes, CalendarRange, ClipboardCheck, CreditCard, Factory,
  FileInput, FileText, KanbanSquare, LayoutDashboard, Package, PackageCheck, PackageOpen,
  PanelLeftClose, PanelLeftOpen, Receipt, ScrollText, Settings, ShoppingCart, TriangleAlert,
  Truck, UserCog, UserPlus, Users, Warehouse, Wrench, X,
} from "lucide-react";
import { can, type Role } from "@/lib/permissions";
import { NAV } from "@/lib/nav";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const ICONS: Record<string, any> = {
  LayoutDashboard, Users, UserPlus, FileText, ShoppingCart, CalendarRange, Factory,
  KanbanSquare, ClipboardCheck, Package, Boxes, ArrowLeftRight, Warehouse, TriangleAlert,
  Truck, FileInput, PackageCheck, Receipt, CreditCard, Wallet: CreditCard, PackageOpen,
  Wrench, BarChart3, Bell, UserCog, ScrollText, Settings,
};

export function Sidebar({ role }: { role: Role }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => can(role, i.key, "view")),
  })).filter((g) => g.items.length > 0);

  const body = (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-white/8 px-5">
        <Link href="/app/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-display text-lg font-extrabold text-white">
            C
          </span>
          <span className="leading-none">
            <span className="block font-display text-[14px] font-extrabold tracking-tight text-white">CRISTALU</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-brand-500">ERP Usine</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ms-auto text-white/50 transition hover:text-white lg:hidden"
          aria-label={t("nav.close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.key} className="mb-5">
            {g.key !== "main" && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                {t(g.labelKey)}
              </p>
            )}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = ICONS[item.icon] ?? Package;
                const active =
                  pathname === item.href ||
                  (item.href !== "/app/dashboard" && pathname.startsWith(item.href + "/"));
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                        active ? "bg-brand-600 text-white" : "text-white/60 hover:bg-white/[.07] hover:text-white",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-white/45 group-hover:text-white")} />
                      <span className="truncate">{t(item.labelKey)}</span>
                      {active && <span className="absolute inset-y-1.5 -start-3 w-0.5 rounded-full bg-white/70" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/55 transition hover:bg-white/[.07] hover:text-white"
        >
          <PanelLeftClose className="h-4 w-4 shrink-0" />
          {t("app.viewSite")}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[248px] flex-col bg-ink-950 lg:flex">
        {body}
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-ink-950/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 start-0 flex w-[262px] flex-col bg-ink-950 transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          )}
        >
          {body}
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 start-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift lg:hidden"
        aria-label={t("app.sidebar")}
      >
        <PanelLeftOpen className="h-5 w-5" />
      </button>
    </>
  );
}
