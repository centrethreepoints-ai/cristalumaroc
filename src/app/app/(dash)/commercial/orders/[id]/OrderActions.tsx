"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Factory, FileOutput, Loader2, PackageOpen, Receipt } from "lucide-react";
import {
  createInvoiceFromOrder, createMosForOrder, saveDelivery, setOrderStatus,
} from "@/lib/actions";
import { useI18n } from "@/i18n";

const FLOW = ["confirmed", "to_produce", "in_production", "quality_control", "ready", "delivered", "installed", "completed"];

/** Order lifecycle + the downstream documents an order spawns. */
export function OrderActions({
  id, status, hasInvoice, hasMos,
}: { id: number; status: string; hasInvoice: boolean; hasMos: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(fn: () => Promise<any>, ok?: string) {
    startTransition(async () => {
      const res = await fn();
      setMessage(res?.ok ? (ok ?? t("actions.saved")) : (res?.error ?? t("actions.noAccess")));
      if (res?.ok) router.refresh();
    });
  }

  const idx = FLOW.indexOf(status);
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
      {message && <span className="text-[12.5px] font-semibold text-ink-500">{message}</span>}

      {next && (
        <button className="btn btn-primary" disabled={pending} onClick={() => run(() => setOrderStatus(id, next))}>
          {t(`statuses.${next}`)}
        </button>
      )}

      {!hasMos && status !== "cancelled" && (
        <button className="btn-outline btn-sm" disabled={pending} onClick={() => run(() => createMosForOrder(id), t("orders.createMO"))}>
          <Factory className="h-3.5 w-3.5" />{t("orders.createMO")}
        </button>
      )}

      {!hasInvoice && status !== "cancelled" && (
        <button className="btn-outline btn-sm" disabled={pending} onClick={() => run(() => createInvoiceFromOrder(id), t("orders.createInvoice"))}>
          <Receipt className="h-3.5 w-3.5" />{t("orders.createInvoice")}
        </button>
      )}

      <button
        className="btn-outline btn-sm"
        disabled={pending}
        onClick={() => run(() => {
          const fd = new FormData();
          fd.set("order_id", String(id));
          fd.set("status", "preparing");
          return saveDelivery(fd);
        }, t("orders.createDelivery"))}
      >
        <PackageOpen className="h-3.5 w-3.5" />{t("orders.createDelivery")}
      </button>

      <button className="btn-outline btn-sm" onClick={() => window.print()}>{t("actions.print")}</button>

      {status !== "cancelled" && status !== "completed" && (
        <button
          className="btn-outline btn-sm text-brand-600 hover:border-brand-600/40"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(t("actions.confirmDelete"))) return;
            run(() => setOrderStatus(id, "cancelled"), t("actions.deleted"));
          }}
        >
          {t("actions.cancel")}
        </button>
      )}
    </div>
  );
}
