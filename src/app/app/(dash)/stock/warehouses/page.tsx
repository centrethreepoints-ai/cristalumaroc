import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Warehouse, Boxes, Wallet, TriangleAlert } from "lucide-react";

export default async function WarehousesPage() {
  await requirePerm("warehouses");
  const { t, money, num } = await getI18n();

  const raw = all<any>(
    `SELECT w.id, w.code, w.name, w.address, w.manager_id, w.is_default,
            COALESCE((SELECT SUM(sl.quantity) FROM stock_levels sl WHERE sl.warehouse_id = w.id), 0) AS on_hand,
            COALESCE((SELECT SUM(sl.reserved) FROM stock_levels sl WHERE sl.warehouse_id = w.id), 0) AS reserved,
            COALESCE((SELECT SUM(sl.quantity * p.purchase_cost) FROM stock_levels sl JOIN products p ON p.id = sl.product_id
                      WHERE sl.warehouse_id = w.id), 0) AS value,
            (SELECT COUNT(*) FROM stock_levels sl WHERE sl.warehouse_id = w.id AND sl.quantity > 0) AS refs,
            u.full_name AS manager
     FROM warehouses w LEFT JOIN users u ON u.id = w.manager_id
     ORDER BY w.code`,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, code: r.code, name: r.name, address: r.address ?? "—", manager: r.manager ?? "—",
    refs: r.refs, on_hand: Math.round(r.on_hand), reserved: Math.round(r.reserved),
    available: Math.round(r.on_hand - r.reserved), value: Math.round(r.value),
  }));

  const totals = rows.reduce(
    (a, r) => ({ on_hand: a.on_hand + r.on_hand, value: a.value + r.value, refs: a.refs + r.refs }),
    { on_hand: 0, value: 0, refs: 0 },
  );
  const lowCount = get<any>(
    `SELECT COUNT(*) c FROM (SELECT p.id FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
      WHERE p.min_stock > 0 GROUP BY p.id HAVING COALESCE(SUM(s.quantity),0) <= p.min_stock)`,
  )?.c ?? 0;

  const kpis = [
    { label: t("menu.warehouses"), value: num(rows.length), icon: Warehouse },
    { label: t("stock.onHand"), value: num(totals.on_hand), icon: Boxes },
    { label: t("kpi.inventoryValue"), value: money(totals.value), icon: Wallet },
    { label: t("kpi.lowStock"), value: num(lowCount), icon: TriangleAlert, href: "/app/stock/alerts" },
  ];

  const cols: Col[] = [
    { key: "code", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "name", header: t("table.name") },
    { key: "address", header: t("table.city") },
    { key: "manager", header: t("users.role") },
    { key: "refs", header: t("menu.products"), type: "num", align: "end" },
    { key: "on_hand", header: t("table.onHand"), type: "num", align: "end" },
    { key: "reserved", header: t("table.reserved"), type: "num", align: "end" },
    { key: "available", header: t("table.available"), type: "num", align: "end" },
    { key: "value", header: t("table.value"), type: "money", align: "end" },
  ];

  return (
    <>
      <PageHeader
        title={t("stock.warehousesTitle")}
        subtitle={t("stock.warehousesSub")}
        breadcrumb={[{ label: t("nav.stock"), href: "/app/stock/warehouses" }, { label: t("menu.warehouses") }]}
        actions={<ExportButtons filename="cristalu-warehouses" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} href={k.href} />)}
      </div>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/stock/inventory" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
