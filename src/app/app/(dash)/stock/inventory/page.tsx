import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Boxes, TriangleAlert, CheckCircle2, Wallet } from "lucide-react";

export default async function InventoryPage({ searchParams }: { searchParams: any }) {
  await requirePerm("inventory");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const wh = String(sp.wh ?? "");
  const lowOnly = sp.low === "1";

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(p.sku LIKE ? OR p.name LIKE ?)`);
    params.push(`%${q}%`, `%${q}%`);
  }
  if (wh) { where.push("sl.warehouse_id = ?"); params.push(Number(wh)); }

  const raw = all<any>(
    `SELECT sl.id, p.id AS product_id, p.sku, p.name, p.unit, p.purchase_cost, p.min_stock,
            sl.quantity, sl.reserved, w.name AS warehouse, w.code AS wh_code, sl.updated_at
     FROM stock_levels sl
     JOIN products p ON p.id = sl.product_id
     JOIN warehouses w ON w.id = sl.warehouse_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.sku, w.code`,
    params,
  );

  const mapped = raw.map((r) => {
    const available = r.quantity - r.reserved;
    const low = r.min_stock > 0 && r.quantity <= r.min_stock;
    return { r, available, low, value: r.quantity * r.purchase_cost };
  });
  const shown = lowOnly ? mapped.filter((m) => m.low) : mapped;

  const rows: Row[] = shown.map((m, i) => ({
    id: m.r.id ?? i, sku: m.r.sku, product: m.r.name, warehouse: m.r.warehouse, unit: m.r.unit,
    on_hand: Math.round(m.r.quantity), reserved: Math.round(m.r.reserved), available: Math.round(m.available),
    min_stock: Math.round(m.r.min_stock), value: Math.round(m.value),
    flag: m.low ? t("stock.alertsTitle") : "—",
  }));

  const warehouses = all<any>(`SELECT id, name, code FROM warehouses ORDER BY code`);
  const totals = get<any>(
    `SELECT COALESCE(SUM(sl.quantity * p.purchase_cost),0) v, COALESCE(SUM(sl.quantity),0) q,
            COALESCE(SUM(sl.reserved),0) r
     FROM stock_levels sl JOIN products p ON p.id = sl.product_id`,
  );
  const lowCount = get<any>(
    `SELECT COUNT(*) c FROM (SELECT p.id FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
      WHERE p.min_stock > 0 GROUP BY p.id HAVING COALESCE(SUM(s.quantity),0) <= p.min_stock)`,
  )?.c ?? 0;

  const kpis = [
    { label: t("kpi.inventoryValue"), value: money(Math.round(totals?.v ?? 0)), icon: Wallet },
    { label: t("stock.onHand"), value: num(Math.round(totals?.q ?? 0)), icon: Boxes },
    { label: t("stock.reserved"), value: num(Math.round(totals?.r ?? 0)), icon: CheckCircle2 },
    { label: t("kpi.lowStock"), value: num(lowCount), icon: TriangleAlert, href: "/app/stock/alerts" },
  ];

  const cols: Col[] = [
    { key: "sku", header: t("table.sku"), link: true, className: "font-mono text-[11.5px]" },
    { key: "product", header: t("table.product") },
    { key: "warehouse", header: t("table.warehouse") },
    { key: "on_hand", header: t("table.onHand"), type: "num", align: "end" },
    { key: "reserved", header: t("table.reserved"), type: "num", align: "end" },
    { key: "available", header: t("table.available"), type: "num", align: "end" },
    { key: "min_stock", header: t("table.minStock"), type: "num", align: "end" },
    { key: "value", header: t("table.value"), type: "money", align: "end" },
    { key: "flag", header: t("stock.alertsTitle") },
  ];

  return (
    <>
      <PageHeader
        title={t("stock.inventoryTitle")}
        subtitle={t("stock.inventorySub")}
        breadcrumb={[{ label: t("nav.stock"), href: "/app/stock/inventory" }, { label: t("menu.inventory") }]}
        actions={
          <>
            <Link href={`/app/stock/inventory${lowOnly ? "" : "?low=1"}`} className="btn-outline btn-sm">
              <TriangleAlert className="h-3.5 w-3.5" />{t("stock.alertsTitle")}
            </Link>
            <ExportButtons filename="cristalu-inventory" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} href={k.href} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="SKU / nom" />
        </div>
        <div>
          <label className="label">{t("table.warehouse")}</label>
          <select className="select" name="wh" defaultValue={wh}>
            <option value="">{t("actions.all")}</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
          </select>
        </div>
        {lowOnly && <input type="hidden" name="low" value="1" />}
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/stock/products" perPage={20} emptyLabel={t("stock.noAlerts")} />
      </div>
    </>
  );
}
