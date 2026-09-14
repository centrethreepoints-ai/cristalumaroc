"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Truck } from "lucide-react";
import { saveSupplier } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type SupplierInput = {
  id?: number; name?: string; category?: string; contact_name?: string; email?: string;
  phone?: string; address?: string; city?: string; ice?: string; if_code?: string;
  rc?: string; payment_terms?: string; rating?: number; notes?: string;
};

const CATEGORIES = [
  "Profils aluminium", "Profils PVC", "Vitrage", "Quincaillerie", "Motorisation",
  "Étanchéité", "Traitement de surface", "Acier", "Isolation", "Transport",
];
const TERMS = ["Comptant", "30 jours", "45 jours", "60 jours"];

export function SupplierForm({ initial }: { initial?: SupplierInput }) {
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
      const res = await saveSupplier(fd);
      if (res.ok) router.push("/app/purchasing/suppliers");
      else setError(res.error ?? t("actions.failed"));
    });
  }

  return (
    <form onSubmit={submit} className="card card-pad max-w-4xl">
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label">{t("table.name")}</label>
          <input name="name" className="input" required defaultValue={initial?.name ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.category")}</label>
          <select name="category" className="select" defaultValue={initial?.category ?? ""}>
            <option value="">—</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("suppliers.contactName")}</label>
          <input name="contact_name" className="input" defaultValue={initial?.contact_name ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.email")}</label>
          <input name="email" className="input" type="email" defaultValue={initial?.email ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.phone")}</label>
          <input name="phone" className="input" defaultValue={initial?.phone ?? ""} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t("table.address")}</label>
          <input name="address" className="input" defaultValue={initial?.address ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.city")}</label>
          <input name="city" className="input" defaultValue={initial?.city ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.ice")}</label>
          <input name="ice" className="input tnum" defaultValue={initial?.ice ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.ifCode")}</label>
          <input name="if_code" className="input tnum" defaultValue={initial?.if_code ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.rc")}</label>
          <input name="rc" className="input tnum" defaultValue={initial?.rc ?? ""} />
        </div>

        <div>
          <label className="label">{t("suppliers.paymentTerms")}</label>
          <select name="payment_terms" className="select" defaultValue={initial?.payment_terms ?? "30 jours"}>
            {TERMS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("suppliers.rating")}</label>
          <input name="rating" className="input tnum" type="number" min="1" max="5" step="1" defaultValue={initial?.rating ?? 3} />
        </div>

        <div>
          <label className="label">{t("table.notes")}</label>
          <input name="notes" className="input" defaultValue={initial?.notes ?? ""} />
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-brand-600/8 px-3 py-2 text-[13px] font-semibold text-brand-700">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Truck className="h-4 w-4" />
          {t(isEdit ? "actions.save" : "actions.create")}
        </button>
        <Link href="/app/purchasing/suppliers" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
