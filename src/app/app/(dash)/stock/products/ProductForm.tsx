"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { saveProduct } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type CategoryOpt = { id: number; name: string; code: string };

export function ProductForm({ categories }: { categories: CategoryOpt[] }) {
  const { t, money } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: "", name: "", name_ar: "", category_id: categories[0] ? String(categories[0].id) : "",
    kind: "finished", unit: "U", description: "", purchase_cost: 0, selling_price: 0,
    vat_rate: 20, min_stock: 10, weight: 0, status: "active",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const margin = form.selling_price > 0
    ? Math.round(((form.selling_price - form.purchase_cost) / form.selling_price) * 100)
    : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.sku.trim() || !form.name.trim()) { setError(t("actions.noData")); return; }
    const fd = new FormData();
    for (const [k, v] of Object.entries(form)) fd.set(k, String(v));
    startTransition(async () => {
      const res = await saveProduct(fd);
      if (res.ok && res.id) router.push("/app/stock/products");
      else setError(res.error ?? t("actions.noAccess"));
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="card card-pad">
        <h2 className="section-title">{t("stock.newProduct")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">{t("table.sku")} *</label>
            <input className="input font-mono" value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} required />
          </div>
          <div>
            <label className="label">{t("table.name")} *</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="label">{t("table.name")} (AR)</label>
            <input className="input" dir="rtl" value={form.name_ar} onChange={(e) => set("name_ar", e.target.value)} />
          </div>
          <div>
            <label className="label">{t("table.category")}</label>
            <select className="select" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t("stock.kind")}</label>
            <select className="select" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
              <option value="finished">{t("stock.finished")}</option>
              <option value="material">{t("stock.material")}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("table.unit")}</label>
            <select className="select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              {["U", "ML", "M2", "KG"].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">{t("table.description")}</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">{t("table.price")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">{t("table.cost")}</label>
            <input className="input tnum" type="number" min="0" step="0.01"
              value={form.purchase_cost || ""} onChange={(e) => set("purchase_cost", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">{t("table.price")}</label>
            <input className="input tnum" type="number" min="0" step="0.01"
              value={form.selling_price || ""} onChange={(e) => set("selling_price", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">{t("table.vat")} (%)</label>
            <input className="input tnum" type="number" min="0" max="100"
              value={form.vat_rate || ""} onChange={(e) => set("vat_rate", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">{t("table.minStock")}</label>
            <input className="input tnum" type="number" min="0"
              value={form.min_stock || ""} onChange={(e) => set("min_stock", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">{t("table.unit")} (kg)</label>
            <input className="input tnum" type="number" min="0" step="0.01"
              value={form.weight || ""} onChange={(e) => set("weight", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">{t("table.status")}</label>
            <select className="select" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {["active", "inactive", "archived"].map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex items-end">
            <p className="text-[12.5px] text-ink-500">
              {t("reports.rate")}: <b className="text-ink-900 tnum">{margin} %</b>
              <span className="ms-2 text-ink-400">TTC {money(Math.round(form.selling_price * (1 + form.vat_rate / 100)))}</span>
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-brand-600/25 bg-brand-600/8 px-4 py-2.5 text-[13px] font-semibold text-brand-700">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}{t("actions.save")}
        </button>
        <Link href="/app/stock/products" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
