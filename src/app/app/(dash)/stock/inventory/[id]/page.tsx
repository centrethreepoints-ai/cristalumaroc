import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { StatCard } from "@/components/dash/StatCard";
import { Pill } from "@/components/dash/StatusBadge";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Boxes, Layers, Package, TriangleAlert } from "lucide-react";

export default async function StockPositionDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("inventory");
  const { t, money, num, date } = await getI18n();

  const sl = get<any>(
    `SELECT sl.*, p.sku, p.name, p.unit, p.min_stock, p.purchase_cost, p.selling_price, p.id AS product_id,
            w.name AS warehouse, w.code AS wh_code, w.address
     FROM stock_levels sl
     JOIN products p ON p.id = sl.product_id
     JOIN warehouses w ON w.id = sl.warehouse_id
     WHERE sl.id = ?`,
    [Number(id)],
  );
  if (!sl) notFound();

  const available = sl.quantity - sl.reserved;
  const low = sl.min_stock > 0 && sl.quantity <= sl.min_stock;
  const value = sl.quantity * sl.purchase_cost;

  // Movements for this product in this warehouse only
  const movements = all<any>(
    `SELECT sm.id, sm.ref, sm.type, sm.quantity, sm.date, sm.note, u.full_name AS user,
            ow.code AS from_wh
     FROM stock_movements sm
     LEFT JOIN users u ON u.id = sm.user_id
     LEFT JOIN warehouses ow ON ow.id = sm.from_warehouse_id
     WHERE sm.product_id = ? AND (sm.warehouse_id = ? OR sm.from_warehouse_id = ?)
     ORDER BY sm.date DESC, sm.id DESC LIMIT 40`,
    [sl.product_id, sl.warehouse_id, sl.warehouse_id],
  );

  const inflow = movements.filter((m) => m.warehouse_id !== sl.warehouse_id || ["IN", "RETURN"].includes(m.type))
    .reduce((s, m) => s + Math.abs(m.quantity), 0);
  const outflow = movements.filter((m) => ["OUT", "PRODUCTION_CONSUMPTION"].includes(m.type))
    .reduce((s, m) => s + Math.abs(m.quantity), 0);

  const mvCols: Col[] = [
    { key: "ref", header: t("table.reference"), type: "strong" },
    { key: "type", header: t("stock.movementType"), type: "badge" },
    { key: "quantity", header: t("stock.quantity"), type: "num", align: "end" },
    { key: "direction", header: t("stock.direction") },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "user", header: t("table.user"), type: "muted" },
    { key: "note", header: t("table.notes"), type: "muted" },
  ];
  const mvRows: Row[] = movements.map((m) => ({
    id: m.id, ref: m.ref, type: m.type, quantity: m.quantity,
    direction: ["OUT", "PRODUCTION_CONSUMPTION"].includes(m.type)
      ? t("stock.outbound")
      : m.from_wh === sl.wh_code ? t("stock.outbound") : t("stock.inbound"),
    date: (m.date ?? "").slice(0, 10), user: m.user ?? "—", note: m.note ?? "—",
  }));

  return (
    <>
      <PageHeader
        title={sl.name}
        subtitle={`${sl.sku} · ${sl.wh_code} — ${sl.warehouse}`}
        breadcrumb={[{ label: t("menu.inventory"), href: "/app/stock/inventory" }, { label: `${sl.sku} @ ${sl.wh_code}` }]}
        actions={<Link href={`/app/stock/products/${sl.product_id}`} className="btn-outline btn-sm">{t("stock.productInfo")}</Link>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("table.onHand")} value={num(Math.round(sl.quantity * 100) / 100)} sub={sl.unit} icon={Package} />
        <StatCard label={t("stock.reserved")} value={num(Math.round(sl.reserved * 100) / 100)} sub={sl.unit} icon={Layers} />
        <StatCard label={t("table.available")} value={num(Math.round(available * 100) / 100)} sub={`${t("table.minStock")} ${num(sl.min_stock)}`} icon={Boxes} />
        <StatCard label={t("table.value")} value={money(Math.round(value))} sub={money(Math.round(sl.purchase_cost)) + " / " + sl.unit} icon={TriangleAlert} />
      </div>

      {low && (
        <div className="card card-pad mt-4 flex flex-wrap items-center gap-3 border-s-4 border-s-brand-600">
          <Pill tone="red">{t("stock.lowStock")}</Pill>
          <p className="text-[13.5px] font-semibold text-ink-900">
            {num(Math.round(sl.quantity))} {sl.unit} ≤ {t("table.minStock")} {num(sl.min_stock)} {sl.unit}
          </p>
          <Link href="/app/stock/alerts" className="ms-auto text-[12.5px] font-bold text-brand-600 hover:text-brand-700">
            {t("menu.alerts")}
          </Link>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-ink-900/8 px-4 py-3">
            <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.movements")}</h2>
          </div>
          <DataTable rows={mvRows} columns={mvCols} dense emptyLabel={t("stock.noMovements")} />
        </section>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("table.warehouse")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.reference")}</dt><dd className="font-semibold">{sl.wh_code}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.name")}</dt><dd className="font-semibold">{sl.warehouse}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.address")}</dt><dd className="font-semibold">{sl.address ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.date")}</dt><dd className="font-semibold">{date(sl.updated_at)}</dd></div>
            </dl>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("stock.flows")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-500">{t("stock.inbound")}</dt><dd className="font-semibold text-emerald-600 tnum">+{num(Math.round(inflow))}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("stock.outbound")}</dt><dd className="font-semibold text-brand-600 tnum">−{num(Math.round(outflow))}</dd></div>
              <div className="flex justify-between border-t border-ink-900/10 pt-2">
                <dt className="font-bold">{t("table.onHand")}</dt>
                <dd className="font-display font-bold text-ink-900 tnum">{num(Math.round(sl.quantity * 100) / 100)}</dd>
              </div>
            </dl>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("stock.productInfo")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.sku")}</dt><dd className="font-mono font-semibold">{sl.sku}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.unit")}</dt><dd className="font-semibold">{sl.unit}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.cost")}</dt><dd className="font-semibold tnum">{money(Math.round(sl.purchase_cost))}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.price")}</dt><dd className="font-semibold tnum">{money(Math.round(sl.selling_price))}</dd></div>
            </dl>
            <Link href={`/app/stock/products/${sl.product_id}`} className="btn-outline btn-sm mt-4 inline-flex">
              {t("actions.view")}
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
