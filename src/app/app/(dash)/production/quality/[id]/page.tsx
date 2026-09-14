import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ClipboardCheck, Factory, User } from "lucide-react";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge, Pill } from "@/components/dash/StatusBadge";
import { QC_CRITERIA } from "@/lib/qc";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { CheckCircle2, Package, XCircle } from "lucide-react";

const RESULT_TONE: Record<string, "green" | "red" | "amber" | "neutral"> = {
  ok: "green", ko: "red", na: "neutral",
};

export default async function QualityControlDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("quality");
  const { t, num, date } = await getI18n();

  const qc = get<any>(
    `SELECT q.*, mo.number AS mo_number, mo.status AS mo_status, mo.workstation,
            o.number AS order_number, p.sku, p.name AS product_name, p.unit,
            u.full_name AS inspector, COALESCE(c.company, c.contact_name) AS customer
     FROM quality_controls q
     LEFT JOIN manufacturing_orders mo ON mo.id = q.mo_id
     LEFT JOIN orders o ON o.id = q.order_id
     LEFT JOIN products p ON p.id = q.product_id
     LEFT JOIN users u ON u.id = q.inspector_id
     LEFT JOIN customers c ON c.id = mo.customer_id
     WHERE q.id = ?`,
    [Number(id)],
  );
  if (!qc) notFound();

  const items = all<any>(`SELECT * FROM qc_items WHERE qc_id = ? ORDER BY id`, [qc.id]);

  // Map recorded results onto the configurable checklist so gaps are visible.
  const byCriterion = new Map(items.map((i) => [String(i.criterion).toLowerCase(), i]));
  const checklist = QC_CRITERIA.map((crit) => {
    const found = byCriterion.get(crit.label.toLowerCase())
      ?? byCriterion.get(crit.key.toLowerCase())
      ?? items.find((i) => String(i.criterion).toLowerCase().startsWith(crit.label.toLowerCase().slice(0, 5)));
    return { ...crit, result: found?.result ?? "na", note: found?.note ?? null, photo: found?.photo ?? null };
  });

  const okCount = checklist.filter((c) => c.result === "ok").length;
  const koCount = checklist.filter((c) => c.result === "ko").length;
  const naCount = checklist.filter((c) => c.result === "na").length;
  const score = qc.score ?? (checklist.length ? Math.round((okCount / checklist.length) * 100) : 0);

  const resultLabel = (r: string) =>
    r === "ok" ? t("qc.resultOk") : r === "ko" ? t("qc.resultKo") : t("qc.resultNa");

  return (
    <>
      <PageHeader
        title={qc.ref}
        subtitle={`${qc.product_name ?? "—"} · ${qc.sku ?? ""}`}
        breadcrumb={[{ label: t("menu.quality"), href: "/app/production/quality" }, { label: qc.ref }]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("table.status")} value={t(`statuses.${qc.status}`)} icon={qc.status === "passed" ? CheckCircle2 : XCircle} />
        <StatCard label={t("qc.score")} value={`${num(score)} %`} sub={`${num(okCount)} / ${num(checklist.length)} ${t("qc.criteria").toLowerCase()}`} icon={ClipboardCheck} />
        <StatCard label={t("table.quantity")} value={num(qc.quantity ?? 1)} sub={qc.unit ?? "U"} icon={Package} />
        <StatCard label={t("menu.manufacturing")} value={qc.mo_number ?? "—"} sub={qc.mo_status ? t(`statuses.${qc.mo_status}`) : ""} icon={Factory} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/8 px-4 py-3">
            <h2 className="font-display text-[15px] font-bold text-ink-900">{t("qc.criteria")}</h2>
            <div className="flex items-center gap-1.5">
              <Pill tone="green">{num(okCount)} {t("qc.resultOk")}</Pill>
              {koCount > 0 && <Pill tone="red">{num(koCount)} {t("qc.resultKo")}</Pill>}
              {naCount > 0 && <Pill tone="neutral">{num(naCount)} {t("qc.resultNa")}</Pill>}
            </div>
          </div>
          <ul className="divide-y divide-ink-900/6">
            {checklist.map((c) => (
              <li key={c.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-[170px] flex-1 text-[13.5px] font-semibold text-ink-900">{c.label}</span>
                <Pill tone={RESULT_TONE[c.result] ?? "neutral"}>{resultLabel(c.result)}</Pill>
                {c.note && <span className="w-full text-[12.5px] text-ink-500 sm:w-auto sm:flex-1">{c.note}</span>}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("qc.inspection")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.reference")}</dt><dd className="font-mono font-semibold">{qc.ref}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.date")}</dt><dd className="font-semibold">{date(qc.date)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("qc.inspector")}</dt><dd className="font-semibold">{qc.inspector ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("production.workstation")}</dt><dd className="font-semibold">{qc.workstation ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.customer")}</dt><dd className="font-semibold">{qc.customer ?? "—"}</dd></div>
            </dl>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("qc.score")}</h2>
            <p className="mt-4 font-display text-[34px] font-extrabold leading-none text-ink-900 tnum">{num(score)}<span className="text-[18px] text-ink-400"> %</span></p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-900/8">
              <div
                className={"h-full rounded-full transition-all " + (score >= 90 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-brand-600")}
                style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge status={qc.status} label={t(`statuses.${qc.status}`)} />
              <span className="text-[12.5px] text-ink-500">{date(qc.date)}</span>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("logistics.relatedDocs")}</h2>
            <div className="mt-4 space-y-2">
              {qc.mo_id && (
                <Link href={`/app/production/manufacturing/${qc.mo_id}`} className="btn-outline btn-sm inline-flex me-2">
                  <Factory className="h-3.5 w-3.5" />{qc.mo_number}
                </Link>
              )}
              {qc.order_id && (
                <Link href={`/app/commercial/orders/${qc.order_id}`} className="btn-outline btn-sm inline-flex">
                  <Package className="h-3.5 w-3.5" />{qc.order_number}
                </Link>
              )}
              {!qc.mo_id && !qc.order_id && <p className="text-[13px] text-ink-500">{t("actions.noData")}</p>}
            </div>
          </section>

          {qc.notes && (
            <section className="card card-pad">
              <h2 className="section-title">{t("table.notes")}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-600">{qc.notes}</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
