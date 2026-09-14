import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { ClipboardCheck, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { QC_CRITERIA } from "@/lib/qc";


export default async function QualityPage({ searchParams }: { searchParams: any }) {
  await requirePerm("quality");
  const { t, num } = await getI18n();
  const sp = await searchParams;
  const status = String(sp.status ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (status) { where.push("qc.status = ?"); params.push(status); }

  const raw = all<any>(
    `SELECT qc.id, qc.ref, qc.status, qc.score, qc.date, qc.quantity, qc.notes,
            m.number AS mo_number, p.name AS product, u.full_name AS inspector,
            (SELECT COUNT(*) FROM qc_items i WHERE i.qc_id = qc.id AND i.result = 'ko') AS ko_count,
            (SELECT COUNT(*) FROM qc_items i WHERE i.qc_id = qc.id) AS items
     FROM quality_controls qc
     LEFT JOIN manufacturing_orders m ON m.id = qc.mo_id
     LEFT JOIN products p ON p.id = qc.product_id
     LEFT JOIN users u ON u.id = qc.inspector_id
     WHERE ${where.join(" AND ")}
     ORDER BY qc.date DESC, qc.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, ref: r.ref, mo: r.mo_number ?? "—", product: r.product ?? "—",
    inspector: r.inspector ?? "—", date: (r.date ?? "").slice(0, 10),
    quantity: Math.round(r.quantity ?? 0), items: r.items, ko: r.ko_count,
    score: Math.round(r.score ?? 0), status: r.status,
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM quality_controls WHERE status = ?`, [s])?.c ?? 0;
  const avg = get<any>(`SELECT COALESCE(AVG(score),0) v FROM quality_controls`)?.v ?? 0;
  const kpis = [
    { label: t("qc.title"), value: num(raw.length), icon: ClipboardCheck },
    { label: t("statuses.passed"), value: num(count("passed")), icon: CheckCircle2 },
    { label: t("statuses.correction"), value: num(count("correction")), icon: Wrench },
    { label: t("qc.score"), value: `${num(Math.round(avg))} %`, icon: XCircle },
  ];

  const cols: Col[] = [
    { key: "ref", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "mo", header: t("production.number") },
    { key: "product", header: t("qc.product") },
    { key: "inspector", header: t("qc.inspector") },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "quantity", header: t("table.quantity"), type: "num", align: "end" },
    { key: "items", header: t("qc.criteria"), type: "num", align: "end" },
    { key: "ko", header: t("qc.ko"), type: "num", align: "end" },
    { key: "score", header: t("qc.score"), type: "num", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("qc.title")}
        subtitle={t("qc.subtitle")}
        breadcrumb={[{ label: t("menu.production"), href: "/app/production/quality" }, { label: t("menu.quality") }]}
        tabs={[
          { label: t("actions.all"), href: "/app/production/quality", active: !status, count: get<any>(`SELECT COUNT(*) c FROM quality_controls`)?.c ?? 0 },
          { label: t("statuses.passed"), href: "/app/production/quality?status=passed", active: status === "passed", count: count("passed") },
          { label: t("statuses.correction"), href: "/app/production/quality?status=correction", active: status === "correction", count: count("correction") },
          { label: t("statuses.failed"), href: "/app/production/quality?status=failed", active: status === "failed", count: count("failed") },
        ]}
        actions={
          <>
            <Link href="/app/production/quality/new" className="btn btn-primary">{t("qc.newQc")}</Link>
            <ExportButtons filename="cristalu-qc" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/production/quality" perPage={20} emptyLabel={t("actions.noData")} />
      </div>

      <div className="card card-pad mt-4">
        <h2 className="section-title">{t("qc.checklistConfig")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QC_CRITERIA.map((c, i) => (
            <span key={c.key} className="inline-flex items-center gap-2 rounded-lg border border-ink-900/10 bg-ink-50/60 px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-700">
              <span className="rounded bg-ink-900/8 px-1.5 text-[10.5px] font-bold tnum text-ink-500">{i + 1}</span>
              {t(`qc.${c.key}`)}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
