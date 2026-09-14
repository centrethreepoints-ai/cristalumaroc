"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Factory, Loader2 } from "lucide-react";
import { saveMo } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type MoInput = {
  id?: number; order_id?: number | null; customer_id?: number | null;
  product_id?: number | null; description?: string; width?: number; height?: number;
  quantity?: number; priority?: string; assignee_id?: number | null;
  workstation?: string; start_date?: string; end_date?: string; notes?: string;
};

const PRIORITIES = ["normal", "high", "urgent"];
const WORKSTATIONS = ["Découpe 2", "Usinage CN", "Assemblage A", "Assemblage B", "Vitrage", "Contrôle"];

export function MoForm({
  initial, customers, products, orders, employees,
}: {
  initial?: MoInput;
  customers: { id: number; name: string; code?: string }[];
  products: { id: number; sku: string; name: string }[];
  orders: { id: number; number: string; customer_name?: string }[];
  employees: { id: number; full_name: string; job_title?: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial?.id);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveMo(fd);
      if (res.ok) router.push("/app/production/manufacturing");
      else setError(res.error ?? t("actions.failed"));
    });
  }

  return (
    <form onSubmit={submit} className="card card-pad max-w-5xl">
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">{t("production.order")}</label>
          <select name="order_id" className="select" defaultValue={initial?.order_id ?? ""}>
            <option value="">—</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>{o.number}{o.customer_name ? ` · ${o.customer_name}` : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("table.customer")}</label>
          <select name="customer_id" className="select" defaultValue={initial?.customer_id ?? ""}>
            <option value="">—</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.code ? `${c.code} · ` : ""}{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("table.product")}</label>
          <select name="product_id" className="select" defaultValue={initial?.product_id ?? ""} required>
            <option value="">—</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">{t("table.description")}</label>
          <input name="description" className="input" defaultValue={initial?.description ?? ""} />
        </div>

        <div>
          <label className="label">{t("production.width")}</label>
          <input name="width" className="input tnum" type="number" min="0" step="1" defaultValue={initial?.width ?? ""} />
        </div>

        <div>
          <label className="label">{t("production.height")}</label>
          <input name="height" className="input tnum" type="number" min="0" step="1" defaultValue={initial?.height ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.quantity")}</label>
          <input name="quantity" className="input tnum" type="number" min="1" step="1" defaultValue={initial?.quantity ?? 1} required />
        </div>

        <div>
          <label className="label">{t("production.priority")}</label>
          <select name="priority" className="select" defaultValue={initial?.priority ?? "normal"}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(`statuses.${p}`)}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("production.assignee")}</label>
          <select name="assignee_id" className="select" defaultValue={initial?.assignee_id ?? ""}>
            <option value="">—</option>
            {employees.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}{u.job_title ? ` · ${u.job_title}` : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("production.workstation")}</label>
          <select name="workstation" className="select" defaultValue={initial?.workstation ?? ""}>
            <option value="">—</option>
            {WORKSTATIONS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("production.startDate")}</label>
          <input name="start_date" className="input" type="date" defaultValue={initial?.start_date ?? ""} />
        </div>

        <div>
          <label className="label">{t("production.endDate")}</label>
          <input name="end_date" className="input" type="date" defaultValue={initial?.end_date ?? ""} />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">{t("production.notes")}</label>
          <textarea name="notes" className="input min-h-[80px]" defaultValue={initial?.notes ?? ""} />
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-ink-900/4 px-3 py-2 text-[12px] text-ink-500">
        {t("production.bomHint")}
      </p>

      {error && <p className="mt-3 rounded-lg bg-brand-600/8 px-3 py-2 text-[13px] font-semibold text-brand-700">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Factory className="h-4 w-4" />
          {t(isEdit ? "actions.save" : "actions.create")}
        </button>
        <Link href="/app/production/manufacturing" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
