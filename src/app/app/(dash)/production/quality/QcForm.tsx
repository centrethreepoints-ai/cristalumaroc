"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { saveQualityControl } from "@/lib/actions";
import { QC_CRITERIA } from "@/lib/qc";
import { useI18n } from "@/i18n";

type Result = "ok" | "ko" | "na";

export function QcForm({
  orders,
}: {
  orders: { id: number; number: string; product_name?: string; quantity?: number }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Every criterion starts conform.
  const [results, setResults] = useState<Record<string, Result>>(() =>
    Object.fromEntries(QC_CRITERIA.map((c) => [c.key, "ok" as Result])),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(QC_CRITERIA.map((c) => [c.key, ""])),
  );
  const [general, setGeneral] = useState("");

  const ko = Object.values(results).filter((r) => r === "ko").length;
  const scored = Object.values(results).filter((r) => r !== "na").length;
  const okCount = Object.values(results).filter((r) => r === "ok").length;
  const score = scored ? Math.round((okCount / scored) * 100) : 100;
  const suggested = ko === 0 ? "passed" : ko <= 1 ? "correction" : "failed";

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set(
      "items",
      JSON.stringify(
        QC_CRITERIA.map((c) => ({
          criterion: c.label,
          result: results[c.key],
          note: notes[c.key] || undefined,
        })),
      ),
    );
    startTransition(async () => {
      const res = await saveQualityControl(fd);
      if (res.ok) router.push("/app/production/quality");
      else setError(res.error ?? t("actions.failed"));
    });
  }

  return (
    <form onSubmit={submit} className="card card-pad max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("qc.mo")}</label>
          <select name="mo_id" className="select" required defaultValue="">
            <option value="">—</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.number}{o.product_name ? ` · ${o.product_name}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("qc.status")}</label>
          <select name="status" className="select" defaultValue={suggested} key={suggested}>
            {["passed", "correction", "failed"].map((s) => (
              <option key={s} value={s}>{t(`statuses.${s}`)}</option>
            ))}
          </select>
          <p className="mt-1 text-[11.5px] text-ink-400">{t("qc.autoStatus")}</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-ink-900/8">
        <table className="table">
          <thead>
            <tr>
              <th>{t("qc.criterion")}</th>
              <th className="w-[220px]">{t("qc.result")}</th>
              <th>{t("table.notes")}</th>
            </tr>
          </thead>
          <tbody>
            {QC_CRITERIA.map((c) => (
              <tr key={c.key}>
                <td className="text-[13px] font-semibold text-ink-800">{c.label}</td>
                <td>
                  <div className="inline-flex rounded-lg border border-ink-900/10 p-0.5">
                    {(["ok", "ko", "na"] as Result[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResults((s) => ({ ...s, [c.key]: r }))}
                        className={`rounded-md px-2.5 py-1 text-[11.5px] font-bold transition ${
                          results[c.key] === r
                            ? r === "ok"
                              ? "bg-green-600/12 text-green-700"
                              : r === "ko"
                                ? "bg-brand-600/12 text-brand-700"
                                : "bg-ink-900/10 text-ink-600"
                            : "text-ink-400 hover:text-ink-700"
                        }`}
                        aria-pressed={results[c.key] === r}
                      >
                        {t(`qc.${r}`)}
                      </button>
                    ))}
                  </div>
                </td>
                <td>
                  <input
                    className="input"
                    value={notes[c.key]}
                    placeholder={t("qc.notePlaceholder")}
                    onChange={(e) => setNotes((s) => ({ ...s, [c.key]: e.target.value }))}
                    aria-label={`${t("table.notes")} ${c.label}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-ink-900/8 bg-ink-50/60 px-3 py-2.5">
        <span className="text-[12px] font-bold uppercase tracking-wider text-ink-400">{t("qc.score")}</span>
        <span className="font-display text-[20px] font-bold text-ink-900 tnum">{score}%</span>
        <span className={`badge-${ko === 0 ? "green" : ko <= 1 ? "amber" : "red"}`}>
          {ko} {t("qc.nonConforming")}
        </span>
        <span className="badge-neutral">{t(`statuses.${suggested}`)}</span>
      </div>

      <div className="mt-4">
        <label className="label">{t("qc.generalNotes")}</label>
        <textarea
          name="notes"
          className="input min-h-[80px]"
          value={general}
          onChange={(e) => setGeneral(e.target.value)}
          placeholder={t("qc.generalNotesPlaceholder")}
        />
      </div>

      {error && <p className="mt-3 rounded-lg bg-brand-600/8 px-3 py-2 text-[13px] font-semibold text-brand-700">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <ClipboardCheck className="h-4 w-4" />
          {t("actions.create")}
        </button>
        <Link href="/app/production/quality" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
