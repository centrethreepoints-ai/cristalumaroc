import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, SlidersHorizontal } from "lucide-react";

const TYPES = ["IN", "OUT", "TRANSFER", "ADJUSTMENT", "RETURN", "PRODUCTION_CONSUMPTION"];

export default async function MovementsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("movements");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const type = String(sp.type ?? "");
  const wh = String(sp.wh ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(p.sku LIKE ? OR p.name LIKE ? OR COALESCE(sm.ref,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (type) { where.push("sm.type = ?"); params.push(type); }
  if (wh) { where.push("sm.warehouse_id = ?"); params.push(Number(wh)); }

  const raw = all<any>(
    `SELECT sm.id, sm.date, sm.type, sm.quantity, sm.unit_cost, sm.ref, sm.note,
            p.sku, p.name AS product, w.name AS warehouse, fw.name AS from_warehouse, u.full_name AS user
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN warehouses w ON w.id = sm.warehouse_id
     LEFT JOIN warehouses fw ON fw.id = sm.from_warehouse_id
     LEFT JOIN users u ON u.id = sm.user_id
     WHERE ${where.join(" AND ")}
     ORDER BY sm.date DESC, sm.id DESC
     LIMIT 500`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, date: (r.date ?? "").slice(0, 10), type: r.type, ref: r.ref ?? "—",
    product: `${r.sku} — ${r.product}`, warehouse: r.from_warehouse ? `${r.from_warehouse} → ${r.warehouse}` : r.warehouse,
    quantity: Math.round(r.quantity), unit_cost: Math.round(r.unit_cost ?? 0),
    value: Math.round((r.unit_cost ?? 0) * r.quantity), user: r.user ?? "—",
  }));

  const warehouses = all<any>(`SELECT id, name, code FROM warehouses ORDER BY code`);
  const sum = (ty: string) => get<any>(`SELECT COALESCE(SUM(quantity),0) q FROM stock_movements WHERE type = ?`, [ty])?.q ?? 0;
  const kpis = [
    { label: t("statuses.IN"), value: num(Math.round(sum("IN"))), icon: ArrowDownCircle },
    { label: t("statuses.OUT"), value: num(Math.round(sum("OUT"))), icon: ArrowUpCircle },
    { label: t("statuses.PRODUCTION_CONSUMPTION"), value: num(Math.round(sum("PRODUCTION_CONSUMPTION"))), icon: ArrowLeftRight },
    { label: t("stock.movementType"), value: num(raw.length), icon: SlidersHorizontal },
  ];

  const cols: Col[] = [
    { key: "date", header: t("table.date"), type: "date", link: true },
    { key: "type", header: t("table.type"), type: "badge" },
    { key: "ref", header: t("table.reference"), className: "font-mono text-[11.5px]" },
    { key: "product", header: t("table.product") },
    { key: "warehouse", header: t("table.warehouse") },
    { key: "quantity", header: t("stock.quantity"), type: "num", align: "end" },
    { key: "unit_cost", header: t("table.cost"), type: "money", align: "end" },
    { key: "value", header: t("table.value"), type: "money", align: "end" },
    { key: "user", header: t("table.user") },
  ];

  return (
    <>
      <PageHeader
        title={t("stock.movementsTitle")}
        subtitle={t("stock.movementsSub")}
        breadcrumb={[{ label: t("nav.stock"), href: "/app/stock/movements" }, { label: t("menu.movements") }]}
        actions={
          <>
            <Link href="/app/stock/movements/new" className="btn btn-primary">+ {t("stock.newMovement")}</Link>
            <ExportButtons filename="cristalu-movements" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="SKU / référence" />
        </div>
        <div>
          <label className="label">{t("stock.movementType")}</label>
          <select className="select" name="type" defaultValue={type}>
            <option value="">{t("actions.all")}</option>
            {TYPES.map((ty) => <option key={ty} value={ty}>{t(`statuses.${ty}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("table.warehouse")}</label>
          <select className="select" name="wh" defaultValue={wh}>
            <option value="">{t("actions.all")}</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
