"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { StatusBadge } from "./StatusBadge";

/**
 * Column descriptors are plain data — server components must never hand a
 * client component a `render` function (it cannot cross the boundary).
 * The cell is drawn here from `type` instead.
 */
export type CellType = "text" | "money" | "num" | "date" | "badge" | "strong" | "muted";

export type Col = {
  key: string;
  header: string;
  type?: CellType;
  align?: "start" | "end" | "center";
  /** Secondary line rendered under the value. */
  sub?: string;
  /** Column used for the row link. */
  link?: boolean;
  width?: string;
  className?: string;
};

export type Row = Record<string, any> & { id: number | string };

/** Sortable value derived from the declared type so no callback is needed. */
function sortValue(row: Row, col: Col) {
  const v = row[col.key];
  if (v === null || v === undefined) return "";
  return typeof v === "number" ? v : String(v);
}

export function DataTable({
  rows,
  columns,
  hrefPrefix,
  perPage = 15,
  emptyLabel = "Aucune donnée",
  dense,
  footer,
  initialSort,
}: {
  rows: Row[];
  columns: Col[];
  /** Rows link to `${hrefPrefix}/${row.id}` when provided. */
  hrefPrefix?: string;
  perPage?: number;
  emptyLabel?: string;
  dense?: boolean;
  footer?: React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const { money, num, date } = useI18n();
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = sortValue(a, col);
      const vb = sortValue(b, col);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
      return String(va).localeCompare(String(vb)) * factor;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const current = Math.min(page, pageCount);
  const slice = sorted.slice((current - 1) * perPage, current * perPage);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    setPage(1);
  }

  function cell(row: Row, col: Col) {
    const raw = row[col.key];
    const type = col.type ?? "text";
    switch (type) {
      case "money":
        return <span className="font-semibold text-ink-900">{raw === null || raw === undefined ? "—" : money(Number(raw))}</span>;
      case "num":
        return num(Number(raw) || 0);
      case "date":
        return raw ? date(String(raw).slice(0, 10)) : "—";
      case "badge":
        return raw ? <StatusBadge status={String(raw)} /> : "—";
      case "muted":
        return <span className="text-ink-500">{raw ?? "—"}</span>;
      case "strong":
        return <span className="font-semibold text-ink-900">{raw ?? "—"}</span>;
      default:
        return <span>{raw === null || raw === undefined || raw === "" ? "—" : String(raw)}</span>;
    }
  }

  function cellWithSub(row: Row, col: Col) {
    const main = cell(row, col);
    if (!col.sub) return main;
    const sub = row[col.sub];
    if (!sub) return main;
    return (
      <div>
        <div>{main}</div>
        <div className="mt-0.5 text-[11.5px] font-normal text-ink-400">{String(sub)}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="table-wrap scroll-thin">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn(
                      c.align === "end" && "text-end",
                      c.align === "center" && "text-center",
                      "cursor-pointer select-none hover:text-ink-800",
                      c.className,
                    )}
                    onClick={() => toggleSort(c.key)}
                  >
                    <span className={cn("inline-flex items-center gap-1", c.align === "end" && "flex-row-reverse")}>
                      {c.header}
                      <ArrowUpDown className={cn("h-3 w-3 transition", active ? "text-brand-600" : "text-ink-300")} />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center text-[13px] text-ink-400">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr key={row.id} className="group">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        dense && "py-2",
                        c.align === "end" && "text-end",
                        c.align === "center" && "text-center",
                        c.className,
                      )}
                    >
                      {c.link && hrefPrefix ? (
                        <Link href={`${hrefPrefix}/${row.id}`} className="font-semibold text-ink-900 transition group-hover:text-brand-700">
                          {cellWithSub(row, c)}
                        </Link>
                      ) : (
                        cellWithSub(row, c)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer}

      {sorted.length > perPage && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/8 px-4 py-3">
          <p className="text-[12.5px] text-ink-400">
            {(current - 1) * perPage + 1}–{Math.min(current * perPage, sorted.length)} / {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="rounded-lg border border-ink-900/12 p-1.5 text-ink-500 transition hover:bg-ink-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-[12.5px] font-semibold text-ink-700">{current} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={current === pageCount}
              className="rounded-lg border border-ink-900/12 p-1.5 text-ink-500 transition hover:bg-ink-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
