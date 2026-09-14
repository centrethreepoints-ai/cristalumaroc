"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Boxes, CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { consumeMoMaterials, moveMo, reserveMoMaterials } from "@/lib/actions";
import { useI18n } from "@/i18n";

const FLOW = ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"];

/** Kanban moves plus the two material steps (reserve on start, deduct on confirmed consumption). */
export function MoActions({
  id, status, reserved,
}: { id: number; status: string; reserved: boolean }) {
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
        <button className="btn btn-primary" disabled={pending} onClick={() => run(() => moveMo(id, next))}>
          <CheckCircle2 className="h-3.5 w-3.5" />{t("statuses." + next)}
        </button>
      )}

      {!reserved && status !== "completed" && (
        <button className="btn-outline btn-sm" disabled={pending}
          onClick={() => run(() => reserveMoMaterials(id), t("production.reservedOk"))}>
          <Boxes className="h-3.5 w-3.5" />{t("production.reserveMaterials")}
        </button>
      )}

      {reserved && status !== "completed" && (
        <button className="btn-outline btn-sm" disabled={pending}
          onClick={() => run(() => consumeMoMaterials(id), t("production.consumedOk"))}>
          <PackageCheck className="h-3.5 w-3.5" />{t("production.consumeMaterials")}
        </button>
      )}

      <button className="btn-outline btn-sm" onClick={() => window.print()}>{t("actions.print")}</button>
    </div>
  );
}
