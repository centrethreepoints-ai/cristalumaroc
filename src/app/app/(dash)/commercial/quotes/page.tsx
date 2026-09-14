import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react";

const STATUSES = ["draft", "sent", "negotiation", "accepted", "rejected"];

export default async function QuotesPage({ searchParams }: { searchParams: any }) {
  await requirePerm("quotes");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = String(sp.status ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(qt.number LIKE ? OR COALESCE(c.company, c.contact_name) LIKE ? OR qt.project LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (status) { where.push("qt.status = ?"); params.push(status); }

  const raw = all<any>(
    `SELECT qt.id, qt.number, qt.status, qt.issue_date, qt.validity_date, qt.project, qt.total_ht, qt.total_ttc,
            COALESCE(c.company, c.contact_name) AS customer, u.full_name AS salesperson, o.number AS order_number
     FROM quotes qt
     LEFT JOIN customers c ON c.id = qt.customer_id
     LEFT JOIN users u ON u.id = qt.salesperson_id
     LEFT JOIN orders o ON o.id = qt.order_id
     WHERE ${where.join(" AND ")}
     ORDER BY qt.issue_date DESC, qt.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, number: r.number, customer: r.customer ?? "—",
    project: r.project ?? "—", salesperson: r.salesperson ?? "—",
    issue_date: (r.issue_date ?? "").slice(0, 10), validity_date: (r.validity_date ?? "").slice(0, 10),
    total_ht: Math.round(r.total_ht ?? 0), status: r.status, order: r.order_number ?? "—",
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM quotes WHERE status = ?`, [s])?.c ?? 0;
  const pendingAmount = get<any>(
    `SELECT COALESCE(SUM(total_ttc),0) v FROM quotes WHERE status IN ('sent','negotiation','draft')`,
  )?.v ?? 0;

  const kpis = [
    { label: t("kpi.pendingQuotes"), value: num(count("draft") + count("sent") + count("negotiation")), sub: money(Math.round(pendingAmount)), icon: Clock },
    { label: t("kpi.acceptedQuotes"), value: num(count("accepted")), sub: t("statuses.accepted"), icon: CheckCircle2 },
    { label: t("statuses.rejected"), value: num(count("rejected")), icon: XCircle },
    { label: t("kpi.conversionRate"), value: `${num(Math.round(
      ((count("accepted") / Math.max(1, count("accepted") + count("rejected"))) * 100),
    ))} %`, icon: FileText },
  ];

  const cols: Col[] = [
    { key: "number", header: t("quotes.number"), link: true },
    { key: "customer", header: t("table.customer") },
    { key: "project", header: t("table.project") },
    { key: "salesperson", header: t("table.salesperson") },
    { key: "issue_date", header: t("table.date"), type: "date" },
    { key: "validity_date", header: t("table.validity"), type: "date" },
    { key: "total_ht", header: t("table.amountHT"), type: "money", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
    { key: "order", header: t("menu.orders") },
  ];

  return (
    <>
      <PageHeader
        title={t("quotes.title")}
        subtitle={t("quotes.subtitle")}
        breadcrumb={[{ label: t("menu.commercial"), href: "/app/commercial/quotes" }, { label: t("menu.quotes") }]}
        actions={
          <>
            <Link href="/app/commercial/quotes/new" className="btn btn-primary">+ {t("quotes.newQuote")}</Link>
            <ExportButtons filename="cristalu-quotes" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="DEV-2026-…" />
        </div>
        <div>
          <label className="label">{t("table.status")}</label>
          <select className="select" name="status" defaultValue={status}>
            <option value="">{t("actions.all")}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/commercial/quotes" emptyLabel={t("quotes.empty")} />
      </div>
    </>
  );
}
