import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  tabs,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  tabs?: { label: string; href: string; active?: boolean; count?: number }[];
}) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-400">
          <Link href="/app/dashboard" className="transition hover:text-ink-700">ERP</Link>
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-ink-300">/</span>
              {b.href ? (
                <Link href={b.href} className="transition hover:text-ink-700">{b.label}</Link>
              ) : (
                <span className="font-semibold text-ink-600">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink-900 sm:text-[26px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[13.5px] text-ink-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="scroll-thin -mx-1 mt-5 flex gap-1 overflow-x-auto px-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition",
                tab.active ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-900/6 hover:text-ink-900",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn("rounded px-1.5 text-[10.5px] font-bold", tab.active ? "bg-white/20" : "bg-ink-900/8")}>
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
