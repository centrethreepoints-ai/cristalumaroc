import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { PackageOpen, Truck, CheckCircle2, Clock } from "lucide-react";

export default async function DeliveriesPage({ searchParams }: { searchParams: any }) {
  await requirePerm("deliveries");
  const { t, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = String(sp.status ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(d.number LIKE ? OR COALESCE(c.company, c.contact_name) LIKE ? OR COALESCE(o.number,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (status) { where.push("d.status = ?"); params.push(status); }

  const raw = all<any>(
    `SELECT d.id, d.number, d.date, d.status, d.vehicle, d.city, d.address,
            COALESCE(c.company, c.contact_name) AS customer, o.number AS order_number, u.full_name AS driver,
            (SELECT COUNT(*) FROM delivery_lines dl WHERE dl.delivery_id = d.id) AS lines,
            COALESCE((SELECT SUM(dl.quantity) FROM delivery_lines dl WHERE dl.delivery_id = d.id), 0) AS qty
     FROM deliveries d
     LEFT JOIN customers c ON c.id = d.customer_id
     LEFT JOIN orders o ON o.id = d.order_id
     LEFT JOIN users u ON u.id = d.driver_id
     WHERE ${where.join(" AND ")}
     ORDER BY d.date DESC, d.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, number: r.number, date: (r.date ?? "").slice(0, 10), customer: r.customer ?? "—",
    order: r.order_number ?? "—", driver: r.driver ?? "—", vehicle: r.vehicle ?? "—",
    city: r.city ?? "—", lines: r.lines, qty: Math.round(r.qty), status: r.status,
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM deliveries WHERE status = ?`, [s])?.c ?? 0;
  const kpis = [
    { label: t("menu.deliveries"), value: num(rows.length), icon: PackageOpen },
    { label: t("statuses.preparing"), value: num(count("preparing") + count("ready")), icon: Clock },
    { label: t("statuses.shipped"), value: num(count("shipped")), icon: Truck },
    { label: t("statuses.delivered"), value: num(count("delivered")), icon: CheckCircle2 },
  ];

  const cols: Col[] = [
    { key: "number", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "customer", header: t("table.customer") },
    { key: "order", header: t("menu.orders") },
    { key: "driver", header: t("logistics.driver") },
    { key: "vehicle", header: t("logistics.vehicle") },
    { key: "city", header: t("table.city") },
    { key: "lines", header: t("quotes.lines"), type: "num", align: "end" },
    { key: "qty", header: t("table.quantity"), type: "num", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("menu.deliveries")}
        subtitle={t("logistics.subtitle")}
        breadcrumb={[{ label: t("nav.logistics"), href: "/app/logistics/deliveries" }, { label: t("menu.deliveries") }]}
        actions={
          <>
            <Link href="/app/logistics/installations" className="btn-outline btn-sm">{t("menu.installations")}</Link>
            <ExportButtons filename="cristalu-deliveries" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="BL-2026-… / client" />
        </div>
        <div>
          <label className="label">{t("table.status")}</label>
          <select className="select" name="status" defaultValue={status}>
            <option value="">{t("actions.all")}</option>
            {["preparing", "ready", "shipped", "delivered"].map((s) => (
              <option key={s} value={s}>{t(`statuses.${s}`)}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/logistics/deliveries" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
