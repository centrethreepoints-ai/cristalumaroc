import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes, Factory, Layers, Package } from "lucide-react";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge, Pill } from "@/components/dash/StatusBadge";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function ProductDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("products");
  const { t, money, num } = await getI18n();

  const p = get<any>(
    `SELECT p.*, c.name AS category_name, c.code AS category_code
     FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
    [Number(id)],
  );
  if (!p) notFound();

  // Stock position across warehouses
  const levels = all<any>(
    `SELECT w.id, w.code, w.name, COALESCE(sl.quantity,0) AS quantity, COALESCE(sl.reserved,0) AS reserved
     FROM warehouses w LEFT JOIN stock_levels sl ON sl.warehouse_id = w.id AND sl.product_id = ?
     ORDER BY w.is_default DESC, w.code`,
    [p.id],
  );
  const onHand = levels.reduce((s, l) => s + l.quantity, 0);
  const reserved = levels.reduce((s, l) => s + l.reserved, 0);
  const available = onHand - reserved;
  const low = onHand < p.min_stock;

  // Bill of materials for this product
  const bom = get<any>(`SELECT * FROM boms WHERE product_id = ? AND active = 1 ORDER BY version DESC LIMIT 1`, [p.id]);
  const bomItems: Row[] = bom
    ? all<any>(
        `SELECT bi.id, c.sku, c.name, c.unit, bi.basis, bi.qty_per, bi.wastage, bi.note,
                c.purchase_cost, c.selling_price
         FROM bom_items bi JOIN products c ON c.id = bi.component_id
         WHERE bi.bom_id = ? ORDER BY c.sku`,
        [bom.id],
      ).map((i) => ({
        id: i.id, sku: i.sku, name: i.name, basis: i.basis,
        qty_per: i.qty_per, wastage: i.wastage, unit: i.unit,
        cost: Math.round((i.purchase_cost ?? 0) * i.qty_per), note: i.note ?? "—",
      }))
    : [];

  const bomCost = bomItems.reduce((s, i) => s + (i.cost as number), 0);

  // Where this product is used as a component
  const usedIn = all<any>(
    `SELECT DISTINCT pp.id, pp.sku, pp.name
     FROM bom_items bi
     JOIN boms b ON b.id = bi.bom_id AND b.active = 1
     JOIN products pp ON pp.id = b.product_id
     WHERE bi.component_id = ? ORDER BY pp.sku`,
    [p.id],
  );

  const movements = all<any>(
    `SELECT sm.id, sm.ref, sm.type, sm.quantity, sm.date, w.code AS warehouse, u.full_name AS user
     FROM stock_movements sm
     LEFT JOIN warehouses w ON w.id = sm.warehouse_id
     LEFT JOIN users u ON u.id = sm.user_id
     WHERE sm.product_id = ? ORDER BY sm.date DESC, sm.id DESC LIMIT 12`,
    [p.id],
  );

  const whCols: Col[] = [
    { key: "code", header: t("table.warehouse"), type: "strong" },
    { key: "name", header: t("table.name") },
    { key: "quantity", header: t("table.onHand"), type: "num", align: "end" },
    { key: "reserved", header: t("stock.reserved"), type: "num", align: "end" },
    { key: "available", header: t("table.available"), type: "num", align: "end" },
  ];
  const whRows: Row[] = levels.map((l) => ({
    id: l.id, code: l.code, name: l.name,
    quantity: Math.round(l.quantity * 100) / 100,
    reserved: Math.round(l.reserved * 100) / 100,
    available: Math.round((l.quantity - l.reserved) * 100) / 100,
  }));

  const bomCols: Col[] = [
    { key: "sku", header: t("table.sku"), type: "strong" },
    { key: "name", header: t("table.name") },
    { key: "basis", header: t("stock.basis"), type: "badge" },
    { key: "qty_per", header: t("stock.qtyPer"), type: "num", align: "end" },
    { key: "wastage", header: t("production.wastage"), type: "num", align: "end" },
    { key: "unit", header: t("table.unit") },
    { key: "cost", header: t("table.cost"), type: "money", align: "end" },
    { key: "note", header: t("table.notes"), type: "muted" },
  ];

  const mvCols: Col[] = [
    { key: "ref", header: t("table.reference"), type: "strong" },
    { key: "type", header: t("stock.movementType"), type: "badge" },
    { key: "quantity", header: t("stock.quantity"), type: "num", align: "end" },
    { key: "warehouse", header: t("table.warehouse") },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "user", header: t("table.user"), type: "muted" },
  ];
  const mvRows: Row[] = movements.map((m) => ({
    id: m.id, ref: m.ref, type: m.type, quantity: m.quantity,
    warehouse: m.warehouse ?? "—", date: (m.date ?? "").slice(0, 10), user: m.user ?? "—",
  }));

  const margin = p.selling_price > 0 ? Math.round(((p.selling_price - p.purchase_cost) / p.selling_price) * 100) : 0;

  return (
    <>
      <PageHeader
        title={p.name}
        subtitle={`${p.sku} · ${p.category_name ?? "—"}`}
        breadcrumb={[{ label: t("menu.products"), href: "/app/stock/products" }, { label: p.sku }]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("table.onHand")} value={num(Math.round(onHand * 100) / 100)} sub={p.unit} icon={Package} />
        <StatCard label={t("table.available")} value={num(Math.round(available * 100) / 100)} sub={t("table.minStock") + " " + num(p.min_stock)} icon={Boxes} />
        <StatCard label={t("table.value")} value={money(Math.round(onHand * p.purchase_cost))} sub={t("table.cost")} icon={Layers} />
        <StatCard
          label={t("table.price")}
          value={money(Math.round(p.selling_price))}
          sub={`${t("reports.rate")} ${num(margin)} %`}
          icon={Factory}
        />
      </div>

      {low && (
        <div className="card card-pad mt-4 flex items-center gap-3 border-s-4 border-s-brand-600">
          <TriangleAlertMark />
          <p className="text-[13.5px] font-semibold text-ink-900">
            {t("stock.lowStock")}: {num(Math.round(onHand))} {p.unit} &lt; {num(p.min_stock)} {p.unit}
          </p>
          <Link href="/app/stock/alerts" className="ms-auto text-[12.5px] font-bold text-brand-600 hover:text-brand-700">
            {t("menu.alerts")}
          </Link>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card card-pad">
            <h2 className="section-title">{t("stock.productInfo")}</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {([
                [t("table.sku"), p.sku],
                [t("table.category"), p.category_name ?? "—"],
                [t("stock.kind"), t(`stock.${p.kind}`)],
                [t("table.unit"), p.unit],
                [t("table.cost"), money(Math.round(p.purchase_cost))],
                [t("table.price"), money(Math.round(p.selling_price))],
                [t("table.vat"), `${p.vat_rate} %`],
                [t("table.minStock"), `${num(p.min_stock)} ${p.unit}`],
                [t("stock.weight"), p.weight ? `${num(p.weight)} kg` : "—"],
                [t("stock.color"), p.color ?? "—"],
              ] as [string, any][]).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-ink-900/6 pb-2">
                  <dt className="text-[12.5px] text-ink-500">{k}</dt>
                  <dd className="text-end text-[13.5px] font-semibold text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
            {p.description && (
              <p className="mt-4 text-[13px] leading-relaxed text-ink-600">{p.description}</p>
            )}
          </section>

          {bom && (
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/8 px-4 py-3">
                <h2 className="font-display text-[15px] font-bold text-ink-900">
                  {t("production.bom")} <span className="text-ink-400">{bom.version} — {bom.name ?? ""}</span>
                </h2>
                <Pill tone="neutral">{money(Math.round(bomCost))} / {p.unit}</Pill>
              </div>
              <DataTable rows={bomItems} columns={bomCols} dense emptyLabel={t("actions.noData")} />
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.movements")}</h2>
            </div>
            <DataTable rows={mvRows} columns={mvCols} dense emptyLabel={t("stock.noMovements")} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("table.status")}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={p.status} label={t(`statuses.${p.status}`)} />
              <Pill tone={low ? "red" : "green"}>{low ? t("stock.lowStock") : t("stock.inStock")}</Pill>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("stock.byWarehouse")}</h2>
            </div>
            <DataTable rows={whRows} columns={whCols} dense emptyLabel={t("actions.noData")} />
          </section>

          {usedIn.length > 0 && (
            <section className="card card-pad">
              <h2 className="section-title">{t("stock.usedIn")}</h2>
              <ul className="mt-3 space-y-2">
                {usedIn.map((u) => (
                  <li key={u.id}>
                    <Link href={`/app/stock/products/${u.id}`} className="text-[13px] font-semibold text-ink-800 hover:text-brand-600">
                      {u.sku} — {u.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function TriangleAlertMark() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    </span>
  );
}
