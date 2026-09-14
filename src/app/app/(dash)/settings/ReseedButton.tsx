"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, Loader2 } from "lucide-react";
import { reseedDemoData } from "@/lib/actions";
import { useI18n } from "@/i18n";

export function ReseedButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("settings.reseedConfirm"))) return;
          startTransition(async () => {
            const res = await reseedDemoData();
            setMessage(res.ok ? t("settings.saved") : (res.error ?? t("actions.deleted")));
            router.refresh();
          });
        }}
        className="btn bg-brand-600 text-white hover:bg-brand-700"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
        {t("settings.reseedBtn")}
      </button>
      {message && <span className="text-[12.5px] font-semibold text-emerald-600">{message}</span>}
    </div>
  );
}
