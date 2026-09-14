"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { saveCustomer } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type OwnerOpt = { id: number; name: string };

/** Create form for both customers and prospects — `status` is fixed by the entry point. */
export function CustomerForm({ status, backTo, nextCode }: { status: "customer" | "prospect"; backTo: string; nextCode: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    type: "entreprise", company: "", contact_name: "", email: "", phone: "", phone2: "",
    ice: "", if_code: "", rc: "", cnss: "", patente: "", address: "", city: "", zip: "",
    website: "", activity: "", source: "Site web", tags: "", notes: "",
    credit_limit: 0, payment_terms: "30 jours",
  });

  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const isCompany = f.type === "entreprise";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.contact_name.trim() && !f.company.trim()) { setError(t("table.contact")); return; }
    const fd = new FormData();
    fd.set("status", status);
    for (const [k, v] of Object.entries(f)) fd.set(k, String(v));
    startTransition(async () => {
      const res = await saveCustomer(fd);
      if (res.ok) router.push(backTo);
      else setError(res.error ?? t("actions.noAccess"));
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="card card-pad">
        <h2 className="section-title">
          {t("table.contact")} <span className="text-ink-300">· {nextCode}</span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">{t("customers.type")}</label>
            <select className="select" value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option value="entreprise">{t("customers.company")}</option>
              <option value="particulier">{t("customers.individual")}</option>
            </select>
          </div>
          {isCompany && (
            <div>
              <label className="label">{t("customers.company")}</label>
              <input className="input" value={f.company} onChange={(e) => set("company", e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">{t("table.contact")} *</label>
            <input className="input" value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} required />
          </div>
          <div>
            <label className="label">{t("table.email")}</label>
            <input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="label">{t("table.phone")}</label>
            <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">{t("table.phone")} 2</label>
            <input className="input" value={f.phone2} onChange={(e) => set("phone2", e.target.value)} />
          </div>
        </div>
      </section>

      {isCompany && (
        <section className="card card-pad">
          <h2 className="section-title">{t("customers.legal")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {([["ice", "ICE"], ["if_code", "IF"], ["rc", "RC"], ["cnss", "CNSS"], ["patente", "Patente"]] as const).map(([k, label]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input className="input font-mono" value={f[k]} onChange={(e) => set(k, e.target.value)} />
              </div>
            ))}
            <div>
              <label className="label">{t("customers.website")}</label>
              <input className="input" value={f.website} onChange={(e) => set("website", e.target.value)} />
            </div>
          </div>
        </section>
      )}

      <section className="card card-pad">
        <h2 className="section-title">{t("table.address")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">{t("table.address")}</label>
            <input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className="label">{t("table.city")}</label>
            <input className="input" value={f.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="label">{t("table.zip")}</label>
            <input className="input font-mono" value={f.zip} onChange={(e) => set("zip", e.target.value)} />
          </div>
          <div>
            <label className="label">{t("customers.activity")}</label>
            <input className="input" value={f.activity} onChange={(e) => set("activity", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">{t("customers.commercialTerms")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">{t("customers.source")}</label>
            <select className="select" value={f.source} onChange={(e) => set("source", e.target.value)}>
              {["Site web", "Appel", "Recommandation", "Salon", "Prospection", "Réseau"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("customers.creditLimit")}</label>
            <input className="input tnum" type="number" min="0" value={f.credit_limit || ""} onChange={(e) => set("credit_limit", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">{t("customers.paymentTerms")}</label>
            <input className="input" value={f.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">{t("table.notes")}</label>
            <textarea className="input min-h-[80px]" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
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
        <Link href={backTo} className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
