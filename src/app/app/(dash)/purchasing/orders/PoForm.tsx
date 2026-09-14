"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileInput, Loader2, Plus, Trash2 } from "lucide-react";
import { savePurchaseOrder } from "@/lib/actions";
import { useI18n } from "@/i18n";

type Line = { product_id: string; quantity: string; unit_price: string; vat_rate: string };

export type PoInput = {
  id?: number; supplier_id?: number | null; warehouse_id?: number | null;
  order_date?: string; expected_date?: string; status?: string; notes?: string;
  lines?: { product_id: number; quantity: number; unit_price: number; vat_rate: number }[];
};

const STATUSES = ["draft", "sent", "confirmed"];

const EMPTY: Line = { product_id: "", quantity: "1", unit_price: "0", vat_rate: "20" };

export function PoForm({
  initial, suppliers, products, warehouses,
}: {
  initial?: PoInput;
  suppliers: { id: number; code: string; name: string }[];
  products: { id: number; sku: string; name: string; purchase_cost?: number; vat_rate?: number }[];
  warehouses: { id: number; code: string; name: string }[];
}) {
  const { t, money, num } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial?.id);

  const [lines, setLines] = useState<Line[]>(() =>
    initial?.lines?.length
      ? initial.lines.map((l) => ({
          product_id: String(l.product_id),
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
          vat_rate: String(l.vat_rate ?? 20),
        }))
      : [{ ...EMPTY }],
  );

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  }

  // Pull the catalogue cost and VAT in when a product is chosen.
  function pickProduct(i: number, id: string) {
    const p = products.find((x) => String(x.id) === id);
    setLine(i, {
      product_id: id,
      unit_price: p?.purchase_cost ? String(p.purchase_cost) : lines[i]?.unit_price || "0",
      vat_rate: p?.vat_rate != null ? String(p.vat_rate) : lines[i]?.vat_rate || "20",
    });
  }

  const valid = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
  const ht = valid.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price || 0), 0);
  const vat = valid.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price || 0) * (Number(l.vat_rate || 0) / 100), 0);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!valid.length) { setError(t("purchasing.atLeastOneLine")); return; }
    const fd = new FormData(e.currentTarget);
    fd.set(
      "lines",
      JSON.stringify(
        valid.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price || 0),
          vat_rate: Number(l.vat_rate || 0),
        })),
      ),
    );
    startTransition(async () => {
      const res = await savePurchaseOrder(fd);
      if (res.ok) router.push("/app/purchasing/orders");
      else setError(res.error ?? t("actions.failed"));
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="card card-pad">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="id" value={initial?.id ?? ""} />

          <div>
            <label className="label">{t("table.supplier")}</label>
            <select name="supplier_id" className="select" required defaultValue={initial?.supplier_id ?? ""}>
              <option value="">—</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">{t("table.warehouse")}</label>
            <select name="warehouse_id" className="select" defaultValue={initial?.warehouse_id ?? ""}>
              <option value="">—</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">{t("table.status")}</label>
            <select name="status" className="select" defaultValue={initial?.status ?? "draft"} disabled={!isEdit}>
              {STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
            </select>
          </div>

          <div>
            <label className="label">{t("purchasing.orderDate")}</label>
            <input name="order_date" className="input" type="date" defaultValue={initial?.order_date ?? ""} />
          </div>

          <div>
            <label className="label">{t("purchasing.expectedDate")}</label>
            <input name="expected_date" className="input" type="date" defaultValue={initial?.expected_date ?? ""} />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">{t("table.notes")}</label>
            <input name="notes" className="input" defaultValue={initial?.notes ?? ""} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[14px] font-bold text-ink-900">{t("purchasing.poLines")}</h2>
          <button type="button" className="btn-outline btn-sm" onClick={() => setLines((ls) => [...ls, { ...EMPTY }])}>
            <Plus className="h-3.5 w-3.5" />{t("actions.addLine")}
          </button>
        </div>

        <div className="scroll-thin overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t("table.product")}</th>
                <th className="w-[110px] text-end">{t("table.quantity")}</th>
                <th className="w-[130px] text-end">{t("table.unitPrice")}</th>
                <th className="w-[100px] text-end">{t("table.vat")}</th>
                <th className="w-[130px] text-end">{t("table.total")}</th>
                <th className="w-[44px]" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const lineTotal = Number(l.quantity || 0) * Number(l.unit_price || 0);
                return (
                  <tr key={i}>
                    <td>
                      <select
                        className="select"
                        value={l.product_id}
                        onChange={(e) => pickProduct(i, e.target.value)}
                        required
                        aria-label={`${t("table.product")} ${i + 1}`}
                      >
                        <option value="">—</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="input text-end tnum" type="number" min="0" step="0.01" value={l.quantity}
                        onChange={(e) => setLine(i, { quantity: e.target.value })} aria-label={`${t("table.quantity")} ${i + 1}`} />
                    </td>
                    <td>
                      <input className="input text-end tnum" type="number" min="0" step="0.01" value={l.unit_price}
                        onChange={(e) => setLine(i, { unit_price: e.target.value })} aria-label={`${t("table.unitPrice")} ${i + 1}`} />
                    </td>
                    <td>
                      <input className="input text-end tnum" type="number" min="0" max="100" step="0.1" value={l.vat_rate}
                        onChange={(e) => setLine(i, { vat_rate: e.target.value })} aria-label={`${t("table.vat")} ${i + 1}`} />
                    </td>
                    <td className="text-end font-semibold text-ink-900 tnum">{money(lineTotal)}</td>
                    <td>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-ink-400 transition hover:bg-brand-600/10 hover:text-brand-600"
                        onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, k) => k !== i) : ls))}
                        disabled={lines.length <= 1}
                        aria-label={t("actions.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="text-end text-[12.5px] font-semibold text-ink-500">{t("table.totalHT")}</td>
                <td className="text-end tnum">{money(ht)}</td>
                <td />
              </tr>
              <tr>
                <td colSpan={4} className="text-end text-[12.5px] font-semibold text-ink-500">{t("table.vat")}</td>
                <td className="text-end tnum">{money(vat)}</td>
                <td />
              </tr>
              <tr>
                <td colSpan={4} className="text-end text-[13px] font-bold text-ink-900">{t("table.totalTTC")}</td>
                <td className="text-end font-display text-[15px] font-bold text-ink-900 tnum">{money(ht + vat)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error && <p className="rounded-lg bg-brand-600/8 px-3 py-2 text-[13px] font-semibold text-brand-700">{error}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending || !valid.length}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <FileInput className="h-4 w-4" />
          {t(isEdit ? "actions.save" : "actions.create")}
        </button>
        <Link href="/app/purchasing/orders" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
        <span className="text-[12.5px] text-ink-500">
          {num(valid.length)} {t("purchasing.poLines").toLowerCase()}
        </span>
      </div>
    </form>
  );
}
