"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Send } from "lucide-react";
import { recordPayment, setInvoiceStatus } from "@/lib/actions";
import { useI18n } from "@/i18n";

const METHODS = ["cash", "transfer", "cheque", "card", "other"];

/** Sends the invoice and records payments against the outstanding balance. */
export function InvoiceActions({
  id, status, balance, customerId,
}: { id: number; status: string; balance: number; customerId: number }) {
  const { t, money } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : "");
  const [method, setMethod] = useState("transfer");

  function run(fn: () => Promise<any>, ok?: string) {
    startTransition(async () => {
      const res = await fn();
      setMessage(res?.ok ? (ok ?? t("actions.saved")) : (res?.error ?? t("actions.noAccess")));
      if (res?.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
      {message && <span className="text-[12.5px] font-semibold text-ink-500">{message}</span>}

      {status === "draft" && (
        <button className="btn-outline btn-sm" disabled={pending} onClick={() => run(() => setInvoiceStatus(id, "sent"))}>
          <Send className="h-3.5 w-3.5" />{t("actions.send")}
        </button>
      )}

      {balance > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-900/10 bg-ink-50/60 p-1.5">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={money(balance)}
            className="input h-8 w-28 text-[12.5px] tnum"
            aria-label={t("table.amountTTC")}
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="select h-8 text-[12.5px]"
            aria-label={t("table.method")}
          >
            {METHODS.map((m) => <option key={m} value={m}>{t(`finance.${m}`)}</option>)}
          </select>
          <button
            className="btn btn-primary btn-sm"
            disabled={pending || !amount}
            onClick={() => {
              const fd = new FormData();
              fd.set("invoice_id", String(id));
              fd.set("amount", amount);
              fd.set("method", method);
              fd.set("customer_id", String(customerId));
              run(() => recordPayment(fd), t("finance.paid"));
            }}
          >
            <CreditCard className="h-3.5 w-3.5" />{t("finance.newPayment")}
          </button>
        </div>
      )}

      <button className="btn-outline btn-sm" onClick={() => window.print()}>{t("actions.print")}</button>

      {status !== "cancelled" && (
        <button
          className="btn-outline btn-sm text-brand-600 hover:border-brand-600/40"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(t("actions.confirmDelete"))) return;
            run(() => setInvoiceStatus(id, "cancelled"), t("actions.deleted"));
          }}
        >
          {t("actions.cancel")}
        </button>
      )}
    </div>
  );
}
