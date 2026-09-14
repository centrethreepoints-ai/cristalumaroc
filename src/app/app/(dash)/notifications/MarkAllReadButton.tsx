"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { markAllNotificationsRead } from "@/lib/actions";
import { useI18n } from "@/i18n";

export function MarkAllReadButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || done}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsRead();
          setDone(true);
          router.refresh();
        })
      }
      className="btn-outline btn-sm"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
      {done ? t("actions.saved") : t("actions.confirm")}
    </button>
  );
}
