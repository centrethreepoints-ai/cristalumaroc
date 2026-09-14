"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, UserPlus } from "lucide-react";
import { assignRequest, createQuoteFromRequest, setRequestStatus } from "@/lib/actions";
import { useI18n } from "@/i18n";

const STATUSES = ["new", "processing", "quoted", "converted", "closed"];

export function RequestActions({
  id, status, assigneeId, quoteId, salespeople,
}: {
  id: number; status: string; assigneeId: number | null; quoteId: number | null;
  salespeople: { id: number; name: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [assignee, setAssignee] = useState(assigneeId ? String(assigneeId) : "");

  function setStatus(next: string) {
    setError(null);
    startTransition(async () => {
      const res = await setRequestStatus(id, next);
      if (res.ok) router.refresh();
      else setError(res.error ?? "error");
    });
  }

  function doAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set("assignee_id", assignee);
    fd.set("priority", "normal");
    startTransition(async () => {
      const res = await assignRequest(fd);
      if (res.ok) router.refresh();
      else setError(res.error ?? "error");
    });
  }

  function convert() {
    setError(null);
    startTransition(async () => {
      const res = await createQuoteFromRequest(id);
      if (res.ok && res.id) router.push(`/app/commercial/quotes/${res.id}`);
      else setError(res.error ?? "error");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!quoteId && (
        <button onClick={convert} disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {t("requests.createQuote")}
        </button>
      )}
      {quoteId && (
        <Link href={`/app/commercial/quotes/${quoteId}`} className="btn btn-primary">
          <FileText className="h-4 w-4" />{t("requests.openQuote")}
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.filter((s) => s !== status).map((s) => (
          <button key={s} onClick={() => setStatus(s)} disabled={pending} className="btn-outline btn-sm">
            {t(`statuses.${s}`)}
          </button>
        ))}
      </div>

      <form onSubmit={doAssign} className="flex items-center gap-1.5">
        <select className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">—</option>
          {salespeople.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" disabled={pending || !assignee} className="btn-outline btn-sm">
          <UserPlus className="h-3.5 w-3.5" />{t("requests.assign")}
        </button>
      </form>

      {error && <span className="text-[12.5px] font-semibold text-brand-600">{error}</span>}
    </div>
  );
}
