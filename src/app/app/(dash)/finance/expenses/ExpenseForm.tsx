"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Wallet } from "lucide-react";
import { saveExpense } from "@/lib/actions";
import { useI18n } from "@/i18n";

const CATEGORIES = [
  "Matières premières", "Outillage", "Maintenance machines", "Transport",
  "Loyer", "Énergie", "Salaires", "Assurances", "Marketing",
];
const METHODS = ["transfer", "cash", "cheque", "card", "other"];
const STATUSES = ["paid", "pending"];

export function ExpenseForm({
  suppliers,
}: {
  suppliers: { id: number; code: string; name: string }[];
}) {
  const { t, money } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("0");
  const [vat, setVat] = useState("0");

  const ttc = Number(amount || 0) + Number(vat || 0);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveExpense(fd);
      if (res.ok) router.push("/app/finance/expenses");
      else setError(res.error ?? t("actions.failed"));
    });
  }

  return (
    <form onSubmit={submit} className="card card-pad max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">{t("table.date")}</label>
          <input name="date" className="input" type="date" required />
        </div>

        <div>
          <label className="label">{t("table.category")}</label>
          <select name="category" className="select" required>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("table.supplier")}</label>
          <select name="supplier_id" className="select" defaultValue="">
            <option value="">—</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">{t("table.description")}</label>
          <input name="description" className="input" required />
        </div>

        <div>
          <label className="label">{t("table.amountHt")}</label>
          <input
            name="amount"
            className="input text-end tnum"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="label">{t("table.vat")}</label>
          <input
            name="vat"
            className="input text-end tnum"
            type="number"
            min="0"
            step="0.01"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
          />
        </div>

        <div>
          <label className="label">{t("table.totalTTC")}</label>
          <div className="input flex items-center justify-end bg-ink-50/70 font-display font-bold text-ink-900 tnum">
            {money(ttc)}
          </div>
        </div>

        <div>
          <label className="label">{t("finance.paymentMethod")}</label>
          <select name="payment_method" className="select" defaultValue="transfer">
            {METHODS.map((m) => <option key={m} value={m}>{t(`finance.${m}`)}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("table.status")}</label>
          <select name="status" className="select" defaultValue="paid">
            {STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("table.notes")}</label>
          <input name="notes" className="input" />
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-brand-600/8 px-3 py-2 text-[13px] font-semibold text-brand-700">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Wallet className="h-4 w-4" />
          {t("actions.create")}
        </button>
        <Link href="/app/finance/expenses" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
