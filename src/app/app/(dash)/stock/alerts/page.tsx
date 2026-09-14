import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { TriangleAlert, Ban, PackageSearch, ShoppingCart } from "lucide-react";

export default async function AlertsPage() {
  await requirePerm("alerts");
  const { t, money, num } = await getI18n();

  const raw = all<any>(
    `SELECT p.id, p.sku, p.name, p.unit, p.min_stock, p.purchase_cost, p.status,
            COALESCE(SUM(sl.quantity), 0) AS on_hand,
            COALESCE(SUM(sl.reserved), 0) AS reserved,
            GROUP_CONCAT(DISTINCT w.code) AS warehouses
     FROM products p
     LEFT JOIN stock_levels sl ON sl.product_id = p.id
     LEFT JOIN warehouses w ON w.id = sl.warehouse_id AND sl.quantity > 0
     WHERE p.min_stock > 0 AND p.status != 'archived'
     GROUP BY p.id
     HAVING on_hand <= p.min_stock
     ORDER BY (on_hand - p.min_stock) ASC, p.sku`,
  );

  const rows: Row[] = raw.map((r) => {
    const gap = Math.round(r.min_stock - r.on_hand);
    return {
      id: r.id, sku: r.sku, product: r.name, warehouses: r.warehouses ?? "—",
      on_hand: Math.round(r.on_hand), min_stock: Math.round(r.min_stock), available: Math.round(r.on_hand - r.reserved),
      gap, reorder_value: Math.round(gap * r.purchase_cost),
      level: r.on_hand <= 0 ? t("statuses.cancelled") : t("kpi.lowStock"),
    };
  });

  const outOfStock = rows.filter((r) => r.on_hand <= 0).length;
  const reorderValue = rows.reduce((s, r) => s + r.reorder_value, 0);

  const kpis = [
    { label: t("stock.alertsTitle"), value: num(rows.length), icon: TriangleAlert },
    { label: t("statuses.OUT"), value: num(outOfStock), icon: Ban },
    { label: t("stock.stockValue"), value: money(reorderValue), icon: PackageSearch },
    { label: t("menu.products"), value: num(get<any>(`SELECT COUNT(*) c FROM products WHERE status != 'archived'`)?.c ?? 0), icon: ShoppingCart },
  ];

  const cols: Col[] = [
    { key: "sku", header: t("table.sku"), link: true, className: "font-mono text-[11.5px]" },
    { key: "product", header: t("table.product") },
    { key: "warehouses", header: t("table.warehouse") },
    { key: "on_hand", header: t("table.onHand"), type: "num", align: "end" },
    { key: "min_stock", header: t("table.minStock"), type: "num", align: "end" },
    { key: "available", header: t("table.available"), type: "num", align: "end" },
    { key: "gap", header: t("purchasing.pending"), type: "num", align: "end" },
    { key: "reorder_value", header: t("table.value"), type: "money", align: "end" },
    { key: "level", header: t("table.level") },
  ];

  return (
    <>
      <PageHeader
        title={t("stock.alertsTitle")}
        subtitle={t("stock.alertsSub")}
        breadcrumb={[{ label: t("nav.stock"), href: "/app/stock/alerts" }, { label: t("menu.alerts") }]}
        actions={
          <>
            <Link href="/app/purchasing/orders" className="btn btn-primary"><ShoppingCart className="h-4 w-4" />{t("purchasing.newPO")}</Link>
            <ExportButtons filename="cristalu-alerts" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      {rows.length === 0 ? (
        <div className="card mt-4 flex items-center gap-4 p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600">
            <PackageSearch className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-[16px] font-bold text-ink-900">{t("stock.noAlerts")}</p>
            <p className="mt-0.5 text-[13px] text-ink-500">{t("stock.inventorySub")}</p>
          </div>
        </div>
      ) : (
        <div className="card mt-4">
          <DataTable rows={rows} columns={cols} hrefPrefix="/app/stock/products" perPage={20} emptyLabel={t("stock.noAlerts")} />
        </div>
      )}
    </>
  );
}
