"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { moveMo } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type Card = {
  id: number;
  number: string;
  customer: string;
  product: string;
  quantity: number;
  assignee: string;
  end_date: string;
  days_left: number;
  priority: string;
  status: string;
};

const COLUMNS = ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"];

export function KanbanBoard({ cards }: { cards: Card[] }) {
  const { t, num, date } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function moveTo(id: number, status: string) {
    startTransition(async () => {
      await moveMo(id, status);
      router.refresh();
    });
  }

  return (
    <div className="scroll-thin -mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
      {COLUMNS.map((status, idx) => {
        const items = cards.filter((c) => c.status === status);
        const canDrop = over === status && dragging !== null;
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setOver(status); }}
            onDragLeave={() => setOver((v) => (v === status ? null : v))}
            onDrop={() => {
              if (dragging !== null) moveTo(dragging, status);
              setDragging(null);
              setOver(null);
            }}
            className={cn(
              "flex w-[268px] shrink-0 flex-col rounded-xl border bg-ink-50/60 transition",
              canDrop ? "border-brand-600/60 bg-brand-600/4 ring-2 ring-brand-600/15" : "border-ink-900/8",
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-ink-900/8 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} label={t(`statuses.${status}`)} />
                <span className="rounded bg-ink-900/8 px-1.5 text-[11px] font-bold tnum text-ink-600">{items.length}</span>
              </div>
              {idx > 0 && <ChevronLeft className="h-3.5 w-3.5 text-ink-300" />}
            </div>

            <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
              {items.length === 0 && (
                <p className="px-1 py-6 text-center text-[12px] text-ink-300">{t("actions.noData")}</p>
              )}
              {items.map((c) => {
                const next = COLUMNS[idx + 1];
                const late = c.days_left < 0;
                return (
                  <div
                    key={c.id}
                    draggable={!busy}
                    onDragStart={() => setDragging(c.id)}
                    onDragEnd={() => { setDragging(null); setOver(null); }}
                    className={cn(
                      "group cursor-grab rounded-lg border border-ink-900/8 bg-white p-2.5 shadow-sm transition active:cursor-grabbing",
                      "hover:border-ink-900/20 hover:shadow-card",
                      dragging === c.id && "opacity-45",
                      busy && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/app/production/manufacturing/${c.id}`} className="font-mono text-[11.5px] font-bold text-ink-900 hover:text-brand-700">
                        {c.number}
                      </Link>
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-200 group-hover:text-ink-400" />
                    </div>
                    <p className="mt-1 line-clamp-1 text-[12.5px] font-semibold text-ink-800">{c.customer}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-ink-500">{c.product}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-500">
                      <span className="rounded bg-ink-900/6 px-1.5 py-0.5 font-semibold tnum">{num(c.quantity)}</span>
                      {c.assignee && <span className="line-clamp-1">{c.assignee}</span>}
                      {c.end_date && (
                        <span className={cn("tnum", late ? "font-bold text-brand-600" : "text-ink-400")}>
                          {late ? `${t("production.overdueRisk")} ${Math.abs(c.days_left)}j` : date(c.end_date)}
                        </span>
                      )}
                    </div>

                    {next && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => moveTo(c.id, next)}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-ink-900/10 py-1 text-[11px] font-bold text-ink-600 opacity-0 transition hover:border-brand-600/40 hover:text-brand-700 group-hover:opacity-100 disabled:opacity-40"
                      >
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                        {t("statuses." + next)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
