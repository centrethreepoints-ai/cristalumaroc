"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveQuote } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type ProductOpt = { id: number; sku: string; name: string; price: number; vat: number; unit: string };
export type CustomerOpt = { id: number; label: string };

type Line = {
  product_id: number | "";
  description: string;
  width: number;
  height: number;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  vat_rate: number;
};

const emptyLine = (vat = 20): Line => ({
  product_id: "", description: "", width: 0, height: 0,
  quantity: 1, unit_price: 0, discount_pct: 0, vat_rate: vat,
});

/** Quote builder: product-aware lines with live HT/TVA/TTC totals. */
export function QuoteForm({
  products, customers, salespeople, today, validity,
}: {
  products: ProductOpt[]; customers: CustomerOpt[];
  salespeople: { id: number; name: string }[]; today: string; validity: string;
}) {
  const { t, money, num } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<string>("");
  const [project, setProject] = useState("");
  const [salespersonId, setSalespersonId] = useState<string>(salespeople[0] ? String(salespeople[0].id) : "");
  const [issueDate, setIssueDate] = useState(today);
  const [validityDate, setValidityDate] = useState(validity);
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("30% à la commande");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function patch(i: number, part: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...part } : l)));
  }

  function pickProduct(i: number, id: string) {
    const p = byId.get(Number(id));
    patch(i, {
      product_id: id === "" ? "" : Number(id),
      description: p ? p.name : "",
      unit_price: p ? p.price : 0,
      vat_rate: p ? p.vat : 20,
    });
  }

  const subHT = lines.reduce(
    (s, l) => s + l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100), 0);
  const vat = lines.reduce(
    (s, l) => s + l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100) * ((l.vat_rate || 0) / 100), 0);
  const afterGlobal = subHT * (1 - (discountPct || 0) / 100);
  const totalTTC = afterGlobal + vat * (1 - (discountPct || 0) / 100);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId) { setError(t("customers.title")); return; }
    const valid = lines.filter((l) => l.quantity > 0 && (l.product_id !== "" || l.description));
    if (!valid.length) { setError(t("quotes.lines")); return; }

    const fd = new FormData();
    fd.set("customer_id", customerId);
    fd.set("project", project);
    fd.set("salesperson_id", salespersonId);
    fd.set("issue_date", issueDate);
    fd.set("validity_date", validityDate);
    fd.set("discount_pct", String(discountPct));
    fd.set("payment_terms", paymentTerms);
    fd.set("notes", notes);
    fd.set("lines", JSON.stringify(valid));

    startTransition(async () => {
      const res = await saveQuote(fd);
      if (res.ok && res.id) router.push(`/app/commercial/quotes/${res.id}`);
      else setError(res.error ?? t("actions.noAccess"));
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="card card-pad">
        <h2 className="section-title">{t("quotes.quoteDocument")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">{t("table.customer")} *</label>
            <select className="select" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">—</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t("table.project")}</label>
            <input className="input" value={project} onChange={(e) => setProject(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("table.salesperson")}</label>
            <select className="select" value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)}>
              {salespeople.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t("table.date")}</label>
            <input className="input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("table.validity")}</label>
            <input className="input" type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("quotes.paymentTerms")}</label>
            <input className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">
            {t("quotes.lines")} <span className="text-ink-400">({lines.length})</span>
          </h2>
          <button type="button" className="btn-outline btn-sm" onClick={() => setLines((l) => [...l, emptyLine()])}>
            <Plus className="h-3.5 w-3.5" />{t("quotes.addLine")}
          </button>
        </div>

        <div className="scroll-thin overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="min-w-[220px]">{t("quotes.product")}</th>
                <th className="w-[130px] text-end">{t("quotes.dimensions")}</th>
                <th className="w-[80px] text-end">{t("table.quantity")}</th>
                <th className="w-[120px] text-end">{t("table.unitPrice")}</th>
                <th className="w-[80px] text-end">{t("table.discount")}</th>
                <th className="w-[80px] text-end">{t("table.vat")}</th>
                <th className="w-[120px] text-end">{t("quotes.totalHT")}</th>
                <th className="w-[44px]" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const lineHT = l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100);
                return (
                  <tr key={i}>
                    <td>
                      <select
                        className="select"
                        value={l.product_id}
                        onChange={(e) => pickProduct(i, e.target.value)}
                      >
                        <option value="">—</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                        ))}
                      </select>
                      <input
                        className="input mt-1.5"
                        placeholder={t("table.description")}
                        value={l.description}
                        onChange={(e) => patch(i, { description: e.target.value })}
                      />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <input className="input w-[58px] text-end tnum" type="number" min="0"
                          value={l.width || ""} placeholder="L"
                          onChange={(e) => patch(i, { width: Number(e.target.value) })} />
                        <span className="text-ink-300">×</span>
                        <input className="input w-[58px] text-end tnum" type="number" min="0"
                          value={l.height || ""} placeholder="H"
                          onChange={(e) => patch(i, { height: Number(e.target.value) })} />
                      </div>
                    </td>
                    <td><input className="input text-end tnum" type="number" min="0" step="0.01"
                      value={l.quantity || ""} onChange={(e) => patch(i, { quantity: Number(e.target.value) })} /></td>
                    <td><input className="input text-end tnum" type="number" min="0" step="0.01"
                      value={l.unit_price || ""} onChange={(e) => patch(i, { unit_price: Number(e.target.value) })} /></td>
                    <td><input className="input text-end tnum" type="number" min="0" max="100"
                      value={l.discount_pct || ""} onChange={(e) => patch(i, { discount_pct: Number(e.target.value) })} /></td>
                    <td><input className="input text-end tnum" type="number" min="0" max="100"
                      value={l.vat_rate || ""} onChange={(e) => patch(i, { vat_rate: Number(e.target.value) })} /></td>
                    <td className="text-end font-semibold tnum">{money(Math.round(lineHT))}</td>
                    <td>
                      <button type="button" className="rounded-md p-1.5 text-ink-300 transition hover:bg-brand-600/10 hover:text-brand-600"
                        onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls))}
                        aria-label={t("actions.remove")}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="section-title">{t("quotes.notes")}</h2>
          <textarea className="input mt-3 min-h-[110px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("quotes.totalTtc")}</h2>
          <div className="mt-4">
            <label className="label">{t("quotes.globalDiscount")} (%)</label>
            <input className="input tnum" type="number" min="0" max="100"
              value={discountPct || ""} onChange={(e) => setDiscountPct(Number(e.target.value))} />
          </div>
          <dl className="mt-4 space-y-2 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-ink-500">{t("quotes.subtotal")}</dt><dd className="font-semibold tnum">{money(Math.round(subHT))}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">{t("table.vat")}</dt><dd className="font-semibold tnum">{money(Math.round(vat))}</dd></div>
            <div className="flex justify-between border-t border-ink-900/10 pt-2 text-[17px]">
              <dt className="font-bold text-ink-900">{t("quotes.totalTtc")}</dt>
              <dd className="font-display font-bold text-brand-600 tnum">{money(Math.round(totalTTC))}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[12px] text-ink-400">
            {num(lines.length)} {t("quotes.lines").toLowerCase()}
          </p>
        </section>
      </div>

      {error && (
        <p className="rounded-lg border border-brand-600/25 bg-brand-600/8 px-4 py-2.5 text-[13px] font-semibold text-brand-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}{t("actions.save")}
        </button>
        <Link href="/app/commercial/quotes" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
