"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setDeliveryStatus } from "@/lib/actions";
import { useI18n } from "@/i18n";

const STEPS = ["preparing", "ready", "shipped", "delivered"];

/** Moves a delivery note along Preparing → Ready → Shipped → Delivered. */
export function DeliveryActions({ id, status }: { id: number; status: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const current = STEPS.indexOf(status);
  const next = current >= 0 && current < STEPS.length - 1 ? STEPS[current + 1] : null;

  function setStatus(value: string) {
    setError(null);
    startTransition(async () => {
      const res = await setDeliveryStatus(id, value);
      if (res.ok) router.refresh();
      else setError(res.error ?? "error");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && (
        <button onClick={() => setStatus(next)} disabled={pending} className="btn btn-primary">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("logistics.markAs")} {t(`statuses.${next}`)}
        </button>
      )}
      {STEPS.filter((s) => s !== status).map((s) => (
        <button key={s} onClick={() => setStatus(s)} disabled={pending} className="btn-outline btn-sm">
          {t(`statuses.${s}`)}
        </button>
      ))}
      {error && <span className="text-[12.5px] font-semibold text-brand-600">{error}</span>}
    </div>
  );
}
