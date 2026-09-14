"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hammer, Loader2 } from "lucide-react";
import { saveInstallation } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type InstallationInput = {
  id?: number; order_id?: number | null; customer_id?: number | null; team_id?: number | null;
  appointment_date?: string; address?: string; city?: string; status?: string;
  products?: string; notes?: string;
};

const STATUSES = ["planned", "in_progress", "done", "cancelled"];

export function InstallationForm({
  initial, customers, orders, teams,
}: {
  initial?: InstallationInput;
  customers: { id: number; name: string; code?: string }[];
  orders: { id: number; number: string; customer_name?: string }[];
  teams: { id: number; name: string }[];
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
      const res = await saveInstallation(fd);
      if (res.ok) router.push("/app/logistics/installations");
      else setError(res.error ?? t("actions.failed"));
    });
  }

  return (
    <form onSubmit={submit} className="card card-pad max-w-4xl">
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">{t("logistics.order")}</label>
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
          <label className="label">{t("logistics.team")}</label>
          <select name="team_id" className="select" defaultValue={initial?.team_id ?? ""}>
            <option value="">—</option>
            {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("logistics.appointmentDate")}</label>
          <input name="appointment_date" className="input" type="date" required defaultValue={initial?.appointment_date ?? ""} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t("table.address")}</label>
          <input name="address" className="input" required defaultValue={initial?.address ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.city")}</label>
          <input name="city" className="input" defaultValue={initial?.city ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.status")}</label>
          <select name="status" className="select" defaultValue={initial?.status ?? "planned"}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">{t("logistics.products")}</label>
          <input name="products" className="input" defaultValue={initial?.products ?? ""} placeholder={t("logistics.productsPlaceholder")} />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">{t("table.notes")}</label>
          <textarea name="notes" className="input min-h-[80px]" defaultValue={initial?.notes ?? ""} />
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-brand-600/8 px-3 py-2 text-[13px] font-semibold text-brand-700">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Hammer className="h-4 w-4" />
          {t(isEdit ? "actions.save" : "actions.create")}
        </button>
        <Link href="/app/logistics/installations" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
