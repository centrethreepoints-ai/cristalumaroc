import { cn } from "@/lib/utils";

type Tone = "neutral" | "red" | "green" | "amber" | "blue" | "violet";

/** Every status used across the ERP maps to one visual tone. */
export const STATUS_TONE: Record<string, Tone> = {
  // quotes
  draft: "neutral", sent: "blue", negotiation: "amber", accepted: "green", rejected: "red",
  // orders
  new: "blue", confirmed: "violet", to_produce: "violet", in_production: "amber",
  quality_control: "blue", ready: "green", delivered: "green", installed: "green",
  completed: "green", cancelled: "red",
  // production kanban
  to_prepare: "neutral", cutting: "blue", machining: "blue", assembly: "violet", glazing: "violet",
  // qc
  passed: "green", failed: "red", correction: "amber",
  // purchasing
  partial: "amber", received: "green",
  // invoices
  paid: "green", overdue: "red",
  // logistics
  preparing: "amber", shipped: "blue", planned: "blue", in_progress: "amber", done: "green",
  // crm
  prospect: "amber", customer: "green",
  // products
  active: "green", inactive: "neutral", archived: "neutral",
  // requests
  processing: "amber", quoted: "blue", converted: "green", closed: "neutral",
  // movements
  IN: "green", OUT: "red", TRANSFER: "blue", ADJUSTMENT: "amber",
  RETURN: "violet", PRODUCTION_CONSUMPTION: "red",
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-ink-900/7 text-ink-600 ring-ink-900/10",
  red: "bg-brand-600/10 text-brand-700 ring-brand-600/20",
  green: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  amber: "bg-amber-500/14 text-amber-700 ring-amber-500/22",
  blue: "bg-sky-500/12 text-sky-700 ring-sky-500/20",
  violet: "bg-violet-500/12 text-violet-700 ring-violet-500/20",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? status}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset", TONE_CLASS[tone])}>
      {children}
    </span>
  );
}
