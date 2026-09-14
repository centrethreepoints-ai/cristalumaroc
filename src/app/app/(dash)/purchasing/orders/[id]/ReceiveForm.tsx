"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, PackageCheck, X } from "lucide-react";
import { receivePurchaseOrder } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type PoLine = {
  id: number; sku: string; name: string; unit: string;
  quantity: number; received_qty: number;
};

/** Lets the stock manager receive all or part of a purchase order. */
export function ReceiveForm({
  poId, poNumber, lines, warehouses, warehouseId, onClose,
}: {
  poId: number; poNumber: string; lines: PoLine[];
  warehouses: { id: number; code: string; name: string }[];
  warehouseId: number | null; onClose: () => void;
}) {
  const { t, num } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [wh, setWh] = useState(warehouseId ? String(warehouseId) : warehouses[0] ? String(warehouses[0].id) : "");

  // Default each line to its outstanding quantity.
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(lines.map((l) => [String(l.id), Math.max(0, Math.round((l.quantity - l.received_qty) * 100) / 100)])),
  );

  const total = Object.values(qty).reduce((s, q) => s + (Number(q) || 0), 0);
  const linesToReceive = Object.values(qty).filter((q) => Number(q) > 0).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const received: Record<string, number> = {};
    for (const [id, q] of Object.entries(qty)) if (Number(q) > 0) received[id] = Number(q);
    if (!Object.keys(received).length) { setError(t("purchasing.enterQuantity")); return; }

    const fd = new FormData();
    fd.set("po_id", String(poId));
    fd.set("warehouse_id", wh);
    fd.set("received", JSON.stringify(received));

    startTransition(async () => {
      const res = await receivePurchaseOrder(fd);
      if (res.ok) { router.refresh(); onClose(); }
      else setError(res.error === "nothing_received" ? t("purchasing.enterQuantity") : (res.error ?? "error"));
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={submit}
        className="card w-full max-w-3xl overflow-hidden shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={t("purchasing.receivePo")}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">
            {t("purchasing.receivePo")} <span className="text-ink-400">· {poNumber}</span>
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-900/6 hover:text-ink-900" aria-label={t("actions.cancel")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scroll-thin max-h-[52vh] overflow-y-auto px-4 py-3">
          <div className="mb-3">
            <label className="label">{t("table.warehouse")}</label>
            <select className="select" value={wh} onChange={(e) => setWh(e.target.value)} required>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
            </select>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>{t("table.sku")}</th>
                <th>{t("table.name")}</th>
                <th className="text-end">{t("table.quantity")}</th>
                <th className="text-end">{t("purchasing.receivedQty")}</th>
                <th className="w-[120px] text-end">{t("purchasing.receiveNow")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const outstanding = Math.max(0, Math.round((l.quantity - l.received_qty) * 100) / 100);
                return (
                  <tr key={l.id}>
                    <td className="font-mono text-[12.5px]">{l.sku}</td>
                    <td className="text-[13px]">{l.name}</td>
                    <td className="text-end tnum">{num(l.quantity)}</td>
                    <td className="text-end tnum text-ink-500">{num(l.received_qty)}</td>
                    <td>
                      <input
                        className="input text-end tnum"
                        type="number"
                        min="0"
                        step="0.01"
                        max={outstanding}
                        value={qty[String(l.id)] || ""}
                        placeholder="0"
                        onChange={(e) => setQty((q) => ({ ...q, [String(l.id)]: Number(e.target.value) }))}
                        aria-label={`${t("purchasing.receiveNow")} ${l.sku}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink-900/8 px-4 py-3">
          <p className="me-auto text-[12.5px] text-ink-500">
            {num(linesToReceive)} {t("purchasing.lines").toLowerCase()} · {t("table.quantity")}{" "}
            <b className="text-ink-900 tnum">{num(Math.round(total * 100) / 100)}</b>
          </p>
          <button type="submit" className="btn btn-primary" disabled={pending || total <= 0}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            {t("actions.save")}
          </button>
          <Link href="#" onClick={onClose} className="btn-outline btn-sm">{t("actions.cancel")}</Link>
        </div>

        {error && (
          <p className="border-t border-brand-600/20 bg-brand-600/8 px-4 py-2.5 text-[13px] font-semibold text-brand-700">{error}</p>
        )}
      </form>
    </div>
  );
}
