import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { CalendarRange, Factory, TriangleAlert, CheckCircle2 } from "lucide-react";

export default async function PlanningPage({ searchParams }: { searchParams: any }) {
  await requirePerm("planning");
  const { t, num } = await getI18n();
  const sp = await searchParams;
  const status = String(sp.status ?? "");
  const late = sp.late === "1";

  const where: string[] = ["m.status != 'completed'"];
  const params: any[] = [];
  if (status) { where.push("m.status = ?"); params.push(status); }
  if (late) where.push(`m.end_date IS NOT NULL AND m.end_date < date('now')`);

  const raw = all<any>(
    `SELECT m.id, m.number, m.status, m.priority, m.start_date, m.end_date, m.quantity, m.produced_qty,
            m.width, m.height, m.description,
            m.progress, m.workstation, COALESCE(c.company, c.contact_name) AS customer,
            p.name AS product, p.sku, u.full_name AS assignee, o.number AS order_number,
            CAST(julianday(m.end_date) - julianday('now') AS INTEGER) AS days_left
     FROM manufacturing_orders m
     LEFT JOIN customers c ON c.id = m.customer_id
     LEFT JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.assignee_id
     LEFT JOIN orders o ON o.id = m.order_id
     WHERE ${where.join(" AND ")}
     ORDER BY m.end_date IS NULL, m.end_date ASC, m.priority DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, number: r.number, customer: r.customer ?? "—",
    product: r.product ? `${r.sku} — ${r.product}` : (r.description ?? "—"),
    dimensions: r.width ? `${Math.round(r.width)} × ${Math.round(r.height)} mm` : "—",
    quantity: Math.round(r.quantity), assignee: r.assignee ?? "—",
    start_date: (r.start_date ?? "").slice(0, 10), end_date: (r.end_date ?? "").slice(0, 10),
    days_left: r.days_left ?? 0, progress: r.progress ?? 0,
    priority: t(`production.${r.priority}`), status: r.status,
  }));

  const active = get<any>(`SELECT COUNT(*) c FROM manufacturing_orders WHERE status != 'completed'`)?.c ?? 0;
  const lateCount = get<any>(
    `SELECT COUNT(*) c FROM manufacturing_orders WHERE status != 'completed' AND end_date IS NOT NULL AND end_date < date('now')`,
  )?.c ?? 0;
  const dueWeek = get<any>(
    `SELECT COUNT(*) c FROM manufacturing_orders WHERE status != 'completed'
      AND end_date BETWEEN date('now') AND date('now', '+7 day')`,
  )?.c ?? 0;
  const done = get<any>(`SELECT COUNT(*) c FROM manufacturing_orders WHERE status = 'completed'`)?.c ?? 0;

  const kpis = [
    { label: t("production.planningTitle"), value: num(active), icon: CalendarRange },
    { label: t("production.overdueRisk"), value: num(lateCount), icon: TriangleAlert, href: "/app/production/planning?late=1" },
    { label: t("dash.deadlines"), value: num(dueWeek), icon: Factory },
    { label: t("production.completedCount"), value: num(done), icon: CheckCircle2 },
  ];

  const cols: Col[] = [
    { key: "number", header: t("production.number"), link: true, className: "font-mono text-[11.5px]" },
    { key: "customer", header: t("table.customer") },
    { key: "product", header: t("production.product") },
    { key: "dimensions", header: t("production.dimensions") },
    { key: "quantity", header: t("production.quantity"), type: "num", align: "end" },
    { key: "assignee", header: t("table.assignee") },
    { key: "start_date", header: t("table.startDate"), type: "date" },
    { key: "end_date", header: t("table.endDate"), type: "date" },
    { key: "days_left", header: t("common.days"), type: "num", align: "end" },
    { key: "priority", header: t("table.priority") },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("production.planningTitle")}
        subtitle={t("production.planningSub")}
        breadcrumb={[{ label: t("nav.production"), href: "/app/production/planning" }, { label: t("menu.planning") }]}
        tabs={[
          { label: t("actions.all"), href: "/app/production/planning", active: !status && !late, count: active },
          { label: t("production.overdueRisk"), href: "/app/production/planning?late=1", active: late, count: lateCount },
        ]}
        actions={
          <>
            <Link href="/app/production/kanban" className="btn-outline btn-sm">{t("menu.kanban")}</Link>
            <Link href="/app/production/manufacturing" className="btn btn-primary">+ {t("production.newMO")}</Link>
            <ExportButtons filename="cristalu-planning" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} href={k.href} />)}
      </div>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/production/manufacturing" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
