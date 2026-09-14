import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Factory, KanbanSquare, CheckCircle2, Boxes } from "lucide-react";

const STATUSES = ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"];

export default async function ManufacturingPage({ searchParams }: { searchParams: any }) {
  await requirePerm("manufacturing");
  const { t, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = String(sp.status ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(m.number LIKE ? OR COALESCE(c.company, c.contact_name) LIKE ? OR COALESCE(p.name,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (status) { where.push("m.status = ?"); params.push(status); }

  const raw = all<any>(
    `SELECT m.id, m.number, m.status, m.priority, m.width, m.height, m.quantity, m.produced_qty, m.progress,
            m.start_date, m.end_date, m.workstation, m.materials_reserved,
            COALESCE(c.company, c.contact_name) AS customer, p.name AS product, p.sku,
            u.full_name AS assignee, o.number AS order_number,
            (SELECT COUNT(*) FROM mo_materials mm WHERE mm.mo_id = m.id) AS material_lines
     FROM manufacturing_orders m
     LEFT JOIN customers c ON c.id = m.customer_id
     LEFT JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.assignee_id
     LEFT JOIN orders o ON o.id = m.order_id
     WHERE ${where.join(" AND ")}
     ORDER BY m.number DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, number: r.number, customer: r.customer ?? "—",
    product: r.product ? `${r.sku} — ${r.product}` : (r.description ?? "—"),
    order: r.order_number ?? "—",
    dimensions: r.width ? `${Math.round(r.width)} × ${Math.round(r.height)}` : "—",
    quantity: Math.round(r.quantity), produced: Math.round(r.produced_qty ?? 0),
    assignee: r.assignee ?? "—", progress: r.progress ?? 0,
    priority: t(`production.${r.priority}`),
    materials: r.materials_reserved ? t("production.reservedOk") : `${r.material_lines}`,
    status: r.status,
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM manufacturing_orders WHERE status = ?`, [s])?.c ?? 0;
  const kpis = [
    { label: t("production.title"), value: num(raw.length), icon: Factory },
    { label: t("menu.kanban"), value: num(STATUSES.filter((s) => s !== "completed").reduce((a, s) => a + count(s), 0)), icon: KanbanSquare },
    { label: t("production.materials"), value: num(get<any>(`SELECT COUNT(*) c FROM mo_materials`)?.c ?? 0), icon: Boxes },
    { label: t("production.completedCount"), value: num(count("completed")), icon: CheckCircle2 },
  ];

  const cols: Col[] = [
    { key: "number", header: t("production.number"), link: true, className: "font-mono text-[11.5px]" },
    { key: "customer", header: t("table.customer") },
    { key: "product", header: t("production.product") },
    { key: "order", header: t("menu.orders") },
    { key: "dimensions", header: t("production.dimensions"), align: "end" },
    { key: "quantity", header: t("production.quantity"), type: "num", align: "end" },
    { key: "assignee", header: t("table.assignee") },
    { key: "progress", header: t("table.progress"), type: "num", align: "end" },
    { key: "materials", header: t("production.materials") },
    { key: "priority", header: t("table.priority") },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("production.title")}
        subtitle={t("production.subtitle")}
        breadcrumb={[{ label: t("nav.production"), href: "/app/production/manufacturing" }, { label: t("menu.manufacturing") }]}
        actions={
          <>
            <Link href="/app/production/manufacturing/new" className="btn btn-primary">{t("production.newMo")}</Link>
            <Link href="/app/production/kanban" className="btn-outline btn-sm"><KanbanSquare className="h-3.5 w-3.5" />{t("menu.kanban")}</Link>
            <ExportButtons filename="cristalu-mo" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="OF-2026-…" />
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
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/production/manufacturing" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
