"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

type Row = Record<string, any>;

function toCsv(rows: Row[], headers: string[]) {
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",;\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\r\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** HTML-table workbook — opens natively in Excel and LibreOffice. */
function toXls(rows: Row[], headers: string[], labels: string[], sheetName: string) {
  const th = labels.map((l) => `<th style="background:#0B0B0E;color:#fff;padding:6px 10px;text-align:left">${l}</th>`).join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${headers.map((h) => `<td style="padding:5px 10px;border-bottom:1px solid #eee">${r[h] ?? ""}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>
<table border="1"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}

export function ExportButtons({
  rows,
  columns,
  filename,
  printSelector = ".print-doc",
}: {
  rows: Row[];
  /** [{ key, label }]. Defaults to the keys of the first row, labelled with the key itself. */
  columns?: { key: string; label: string }[];
  filename: string;
  printSelector?: string;
}) {
  const [open, setOpen] = useState(false);
  const cols = columns ?? Object.keys(rows[0] ?? {}).map((k) => ({ key: k, label: k }));
  const headers = cols.map((c) => c.key);
  const labels = cols.map((c) => c.label);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} onBlur={() => setTimeout(() => setOpen(false), 150)} className="btn-outline btn-sm">
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      {open && (
        <div className="absolute end-0 top-full z-40 mt-1.5 w-44 overflow-hidden rounded-lg border border-ink-900/10 bg-white py-1 shadow-lift">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => download(`${filename}-${stamp}.csv`, toCsv(rows, headers), "text/csv")}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink-700 transition hover:bg-ink-50"
          >
            <FileText className="h-4 w-4 text-ink-400" /> CSV
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => download(`${filename}-${stamp}.xls`, toXls(rows, headers, labels, filename), "application/vnd.ms-excel")}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink-700 transition hover:bg-ink-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-ink-400" /> Excel
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const el = document.querySelector(printSelector);
              if (el) {
                const w = window.open("", "_blank", "width=1000,height=700");
                if (w) {
                  const styles = [...document.querySelectorAll("style,link[rel=stylesheet]")]
                    .map((n) => n.outerHTML)
                    .join("");
                  w.document.write(`<html><head><title>${filename}</title>${styles}</head><body class="bg-white p-8">${el.outerHTML}</body></html>`);
                  w.document.close();
                  setTimeout(() => w.print(), 400);
                }
              } else {
                window.print();
              }
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink-700 transition hover:bg-ink-50"
          >
            <Printer className="h-4 w-4 text-ink-400" /> PDF
          </button>
        </div>
      )}
    </div>
  );
}
