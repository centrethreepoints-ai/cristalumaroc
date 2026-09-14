"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, FileOutput, Loader2, Send, Trash2, XCircle } from "lucide-react";
import {
  convertQuoteToOrder, deleteQuote, duplicateQuote, setQuoteStatus,
} from "@/lib/actions";
import { useI18n } from "@/i18n";

/** All quote workflow transitions, wired to server actions. */
export function QuoteActions({ id, status }: { id: number; status: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(fn: () => Promise<any>, ok?: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.ok) {
        setMessage(ok ?? t("actions.saved"));
        router.refresh();
      } else {
        setMessage(res?.error ?? t("actions.noAccess"));
      }
    });
  }

  const accepted = status === "accepted";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
      {message && <span className="text-[12.5px] font-semibold text-ink-500">{message}</span>}

      {!accepted && status !== "rejected" && (
        <>
          {status === "draft" && (
            <button className="btn-outline btn-sm" disabled={pending}
              onClick={() => run(() => setQuoteStatus(id, "sent"), t("actions.sent") ?? t("actions.saved"))}>
              <Send className="h-3.5 w-3.5" />{t("quotes.sendQuote")}
            </button>
          )}
          {(status === "sent" || status === "negotiation") && (
            <button className="btn-outline btn-sm" disabled={pending}
              onClick={() => run(() => setQuoteStatus(id, "negotiation"))}>
              {t("statuses.negotiation")}
            </button>
          )}
          <button
            className="btn bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={pending}
            onClick={() => run(() => setQuoteStatus(id, "accepted"), t("quotes.converted"))}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />{t("quotes.acceptQuote")}
          </button>
          <button className="btn-outline btn-sm" disabled={pending}
            onClick={() => run(() => setQuoteStatus(id, "rejected"))}>
            <XCircle className="h-3.5 w-3.5" />{t("quotes.rejectQuote")}
          </button>
        </>
      )}

      {accepted && (
        <button className="btn btn-primary" disabled={pending}
          onClick={() => run(() => convertQuoteToOrder(id), t("quotes.converted"))}>
          <FileOutput className="h-3.5 w-3.5" />{t("quotes.convert")}
        </button>
      )}

      <button className="btn-outline btn-sm" disabled={pending}
        onClick={() => run(() => duplicateQuote(id), t("actions.duplicate"))}>
        <Copy className="h-3.5 w-3.5" />{t("quotes.duplicate")}
      </button>

      <button className="btn-outline btn-sm" disabled={pending}
        onClick={() => window.print()}>
        {t("actions.print")}
      </button>

      <button
        className="btn-outline btn-sm text-brand-600 hover:border-brand-600/40"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("actions.confirmDelete"))) return;
          run(() => deleteQuote(id), t("actions.deleted"));
          setTimeout(() => router.push("/app/commercial/quotes"), 600);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />{t("actions.delete")}
      </button>
    </div>
  );
}
