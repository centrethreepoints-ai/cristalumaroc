import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { ShoppingCart, Factory, Truck, CheckCircle2 } from "lucide-react";

const STATUSES = ["new", "confirmed", "to_produce", "in_production", "quality_control", "ready",
  "delivered", "installed", "completed", "cancelled"];

export default async function OrdersPage({ searchParams }: { searchParams: any }) {
  await requirePerm("orders");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = String(sp.status ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(o.number LIKE ? OR COALESCE(c.company, c.contact_name) LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like);
  }
  if (status) { where.push("o.status = ?"); params.push(status); }

  const raw = all<any>(
    `SELECT o.id, o.number, o.status, o.order_date, o.expected_date, o.priority, o.total_ht, o.total_ttc, o.city,
            COALESCE(c.company, c.contact_name) AS customer, u.full_name AS salesperson,
            qt.number AS quote_number,
            (SELECT COUNT(*) FROM manufacturing_orders m WHERE m.order_id = o.id) AS mos
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = o.salesperson_id
     LEFT JOIN quotes qt ON qt.id = o.quote_id
     WHERE ${where.join(" AND ")}
     ORDER BY o.order_date DESC, o.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, number: r.number, customer: r.customer ?? "—", quote: r.quote_number ?? "—",
    order_date: (r.order_date ?? "").slice(0, 10), expected_date: (r.expected_date ?? "").slice(0, 10),
    priority: t(`production.${r.priority}`), mos: r.mos,
    total_ht: Math.round(r.total_ht ?? 0), status: r.status,
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM orders WHERE status = ?`, [s])?.c ?? 0;
  const inProd = count("in_production") + count("quality_control") + count("to_produce");
  const kpis = [
    { label: t("kpi.activeOrders"), value: num(STATUSES.filter((s) => !["cancelled", "completed", "installed"].includes(s)).reduce((a, s) => a + count(s), 0)), icon: ShoppingCart },
    { label: t("kpi.ordersInProduction"), value: num(inProd), icon: Factory },
    { label: t("statuses.ready"), value: num(count("ready")), sub: t("dash.readyForDelivery"), icon: Truck },
    { label: t("statuses.completed"), value: num(count("completed") + count("installed")), icon: CheckCircle2 },
  ];

  const cols: Col[] = [
    { key: "number", header: t("table.reference"), link: true },
    { key: "customer", header: t("table.customer") },
    { key: "quote", header: t("menu.quotes") },
    { key: "order_date", header: t("orders.orderDate"), type: "date" },
    { key: "expected_date", header: t("orders.expected"), type: "date" },
    { key: "priority", header: t("table.priority") },
    { key: "mos", header: t("menu.manufacturing"), type: "num", align: "end" },
    { key: "total_ht", header: t("table.amountHT"), type: "money", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("orders.title")}
        subtitle={t("orders.subtitle")}
        breadcrumb={[{ label: t("menu.commercial"), href: "/app/commercial/orders" }, { label: t("menu.orders") }]}
        actions={
          <>
            <Link href="/app/commercial/quotes" className="btn btn-primary">+ {t("orders.fromQuote")}</Link>
            <ExportButtons filename="cristalu-orders" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="CMD-2026-…" />
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
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/commercial/orders" emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
