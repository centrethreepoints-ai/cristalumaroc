import Link from "next/link";
import { isValidElement } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
  delta,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: any;
  tone?: "neutral" | "brand" | "green" | "amber" | "red" | "blue";
  delta?: { value: number; label: string };
  href?: string;
}) {
  const toneClass = {
    neutral: "bg-ink-900 text-white",
    brand: "bg-brand-600 text-white",
    green: "bg-emerald-500/12 text-emerald-700",
    amber: "bg-amber-500/14 text-amber-700",
    red: "bg-brand-600/10 text-brand-700",
    blue: "bg-sky-500/12 text-sky-700",
  }[tone];

  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-ink-900/8 bg-white p-5 transition-all duration-300",
        href && "hover:-translate-y-0.5 hover:border-ink-900/15 hover:shadow-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
        {Icon && (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClass)}>
            {/* Accept a component reference (lucide icons are forwardRef objects, not functions)
                or an already-created element. */}
            {isValidElement(Icon) ? Icon : <Icon className="h-[18px] w-[18px]" />}
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-[26px] font-bold leading-none tracking-tight text-ink-900 tnum">{value}</p>

      {(sub || delta) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold",
                delta.value >= 0 ? "bg-emerald-500/12 text-emerald-700" : "bg-brand-600/10 text-brand-700",
              )}
            >
              {delta.value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta.value).toFixed(1)}%
            </span>
          )}
          {sub && <span className="text-[12px] text-ink-400">{sub}</span>}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-ink-900/8 bg-white shadow-card", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/8 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-[14.5px] font-bold text-ink-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12px] text-ink-400">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900/5 text-ink-300">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-[14px] font-semibold text-ink-700">{title}</p>
      {hint && <p className="max-w-sm text-[12.5px] text-ink-400">{hint}</p>}
      {action}
    </div>
  );
}
