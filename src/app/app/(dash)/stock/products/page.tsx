import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Package, Boxes, TriangleAlert, Layers } from "lucide-react";

export default async function ProductsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("products");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const cat = String(sp.cat ?? "");
  const kind = String(sp.kind ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(p.sku LIKE ? OR p.name LIKE ? OR COALESCE(p.name_ar,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (cat) { where.push("p.category_id = ?"); params.push(Number(cat)); }
  if (kind) { where.push("p.kind = ?"); params.push(kind); }

  const raw = all<any>(
    `SELECT p.*, ct.name AS category_name, ct.code AS category_code,
            COALESCE((SELECT SUM(sl.quantity) FROM stock_levels sl WHERE sl.product_id = p.id), 0) AS on_hand
     FROM products p LEFT JOIN categories ct ON ct.id = p.category_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.sku`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, sku: r.sku, name: r.name, category: r.category_name ?? "—",
    kind: r.kind === "finished" ? t("stock.finished") : t("stock.material"),
    unit: r.unit, purchase_cost: Math.round(r.purchase_cost), selling_price: Math.round(r.selling_price),
    vat: r.vat_rate, on_hand: Math.round(r.on_hand), min_stock: Math.round(r.min_stock),
    status: r.status,
  }));

  const categories = all<any>(`SELECT id, name, code FROM categories ORDER BY name`);
  const invValue = get<any>(`SELECT COALESCE(SUM(sl.quantity * p.purchase_cost),0) v FROM stock_levels sl JOIN products p ON p.id = sl.product_id`)?.v ?? 0;
  const low = get<any>(
    `SELECT COUNT(*) c FROM (SELECT p.id FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
      WHERE p.min_stock > 0 AND p.status != 'archived' GROUP BY p.id HAVING COALESCE(SUM(s.quantity),0) <= p.min_stock)`,
  )?.c ?? 0;

  const kpis = [
    { label: t("menu.products"), value: num(raw.length), icon: Package },
    { label: t("stock.categories"), value: num(categories.length), icon: Layers },
    { label: t("kpi.inventoryValue"), value: money(Math.round(invValue)), icon: Boxes },
    { label: t("kpi.lowStock"), value: num(low), icon: TriangleAlert, href: "/app/stock/alerts" },
  ];

  const cols: Col[] = [
    { key: "sku", header: t("table.sku"), link: true, className: "font-mono text-[11.5px]" },
    { key: "name", header: t("table.name") },
    { key: "category", header: t("table.category") },
    { key: "kind", header: t("stock.kind") },
    { key: "unit", header: t("table.unit"), align: "center" },
    { key: "purchase_cost", header: t("table.cost"), type: "money", align: "end" },
    { key: "selling_price", header: t("table.price"), type: "money", align: "end" },
    { key: "vat", header: t("table.vat"), type: "num", align: "end" },
    { key: "on_hand", header: t("table.onHand"), type: "num", align: "end" },
    { key: "min_stock", header: t("table.minStock"), type: "num", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("menu.products")}
        subtitle={t("stock.subtitle")}
        breadcrumb={[{ label: t("nav.stock"), href: "/app/stock/products" }, { label: t("menu.products") }]}
        actions={
          <>
            <Link href="/app/stock/products/new" className="btn btn-primary">+ {t("stock.newProduct")}</Link>
            <ExportButtons filename="cristalu-products" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
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
          <label className="label">{t("table.category")}</label>
          <select className="select" name="cat" defaultValue={cat}>
            <option value="">{t("actions.all")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("stock.kind")}</label>
          <select className="select" name="kind" defaultValue={kind}>
            <option value="">{t("actions.all")}</option>
            <option value="finished">{t("stock.finished")}</option>
            <option value="material">{t("stock.material")}</option>
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/stock/products" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
