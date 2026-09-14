import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { StatCard } from "@/components/dash/StatCard";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { MoActions } from "./MoActions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Boxes, Factory, Layers, Ruler } from "lucide-react";

const FLOW = ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"];

export default async function MoDetailPage({ params }: { params: any }) {
  await requirePerm("manufacturing");
  const { t, money, num, date } = await getI18n();
  const p = await params;
  const id = Number(p.id);

  const m = get<any>(
    `SELECT m.*, COALESCE(c.company, c.contact_name) AS customer_name, p.name AS product_name, p.sku,
            p.unit, u.full_name AS assignee, o.number AS order_number, b.id AS bom_id, b.name AS bom_name
     FROM manufacturing_orders m
     LEFT JOIN customers c ON c.id = m.customer_id
     LEFT JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.assignee_id
     LEFT JOIN orders o ON o.id = m.order_id
     LEFT JOIN boms b ON b.product_id = m.product_id AND b.active = 1
     WHERE m.id = ?`,
    [id],
  );
  if (!m) notFound();

  const materials = all<any>(
    `SELECT mm.id, mm.required_qty, mm.reserved_qty, mm.consumed_qty,
            p.sku, p.name AS product_name, p.unit, p.purchase_cost,
            COALESCE(SUM(sl.quantity), 0) AS on_hand
     FROM mo_materials mm
     JOIN products p ON p.id = mm.product_id
     LEFT JOIN stock_levels sl ON sl.product_id = mm.product_id
     WHERE mm.mo_id = ?
     GROUP BY mm.id ORDER BY p.sku`,
    [id],
  );

  const qcs = all<any>(
    `SELECT id, ref, status, score, date FROM quality_controls WHERE mo_id = ? ORDER BY date DESC`,
    [id],
  );

  const matRows: Row[] = materials.map((x) => ({
    id: x.id, sku: x.sku, product: x.product_name, unit: x.unit,
    required: Math.round(x.required_qty * 100) / 100,
    reserved: Math.round(x.reserved_qty * 100) / 100,
    consumed: Math.round(x.consumed_qty * 100) / 100,
    on_hand: Math.round(x.on_hand),
    value: Math.round(x.required_qty * (x.purchase_cost ?? 0)),
  }));

  const materialCost = matRows.reduce((s, r) => s + r.value, 0);
  const consumedCost = materials.reduce((s, x) => s + x.consumed_qty * (x.purchase_cost ?? 0), 0);
  const idx = FLOW.indexOf(m.status);

  const fact = (label: string, value: any) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-ink-800">{value || "—"}</p>
    </div>
  );

  const matCols: Col[] = [
    { key: "sku", header: t("table.sku"), className: "font-mono text-[11.5px]" },
    { key: "product", header: t("table.product") },
    { key: "unit", header: t("table.unit"), align: "center" },
    { key: "required", header: t("production.required"), type: "num", align: "end" },
    { key: "reserved", header: t("production.reserved"), type: "num", align: "end" },
    { key: "consumed", header: t("production.consumed"), type: "num", align: "end" },
    { key: "on_hand", header: t("table.onHand"), type: "num", align: "end" },
    { key: "value", header: t("table.value"), type: "money", align: "end" },
  ];

  return (
    <>
      <PageHeader
        title={m.number}
        subtitle={`${m.product_name ?? m.description ?? "—"} · ${m.customer_name ?? "—"}`}
        breadcrumb={[
          { label: t("production.title"), href: "/app/production/manufacturing" },
          { label: m.number },
        ]}
        actions={<MoActions id={id} status={m.status} reserved={!!m.materials_reserved} />}
      />

      {/* Station progression */}
      <div className="card card-pad mb-4">
        <div className="scroll-thin flex items-center gap-1.5 overflow-x-auto">
          {FLOW.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            return (
              <div key={s} className="flex shrink-0 items-center gap-1.5">
                <span
                  className={
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-bold " +
                    (active ? "bg-ink-900 text-white"
                      : done ? "bg-emerald-500/14 text-emerald-700"
                      : "bg-ink-900/6 text-ink-400")
                  }
                >
                  <span className={"h-1.5 w-1.5 rounded-full " + (active ? "bg-white" : done ? "bg-emerald-500" : "bg-ink-300")} />
                  {t(`statuses.${s}`)}
                </span>
                {i < FLOW.length - 1 && <span className="text-ink-200">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("production.quantity")} value={num(Math.round(m.quantity))} icon={<Factory className="h-4 w-4" />} />
        <StatCard label={t("table.progress")} value={`${num(m.progress ?? 0)} %`} icon={<Layers className="h-4 w-4" />} />
        <StatCard label={t("production.materials")} value={num(matRows.length)} sub={money(materialCost)} icon={<Boxes className="h-4 w-4" />} />
        <StatCard label={t("production.consumed")} value={money(Math.round(consumedCost))} icon={<Ruler className="h-4 w-4" />} />
      </div>

      <div className="print-doc mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card card-pad">
          <h2 className="section-title">{t("production.product")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.product"), m.product_name ?? m.description)}
            {fact(t("table.sku"), m.sku)}
            {fact(t("production.dimensions"), m.width ? `${Math.round(m.width)} × ${Math.round(m.height)} mm` : "—")}
            {fact(t("production.quantity"), `${num(Math.round(m.quantity))} ${m.unit ?? ""}`)}
            {fact(t("production.perUnit"), num(Math.round(m.produced_qty ?? 0)))}
            {fact(t("table.customer"), m.customer_name)}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("production.title")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.status"), <StatusBadge status={m.status} label={t(`statuses.${m.status}`)} />)}
            {fact(t("table.priority"), t(`production.${m.priority}`))}
            {fact(t("table.assignee"), m.assignee)}
            {fact(t("production.workstation"), m.workstation)}
            {fact(t("table.startDate"), m.start_date ? date(String(m.start_date).slice(0, 10)) : "—")}
            {fact(t("table.endDate"), m.end_date ? date(String(m.end_date).slice(0, 10)) : "—")}
            {fact(t("menu.orders"), m.order_number ? (
              <Link href={`/app/commercial/orders/${m.order_id}`} className="font-mono text-brand-600 hover:underline">
                {m.order_number}
              </Link>
            ) : "—")}
            {fact(t("production.bom"), m.bom_name ?? "—")}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("production.materials")}</h2>
          <div className="mt-4 space-y-3">
            {fact(t("production.required"), num(matRows.reduce((s, r) => s + r.required, 0)))}
            {fact(t("production.reserved"), num(matRows.reduce((s, r) => s + r.reserved, 0)))}
            {fact(t("production.consumed"), num(matRows.reduce((s, r) => s + r.consumed, 0)))}
            <div className="border-t border-ink-900/10 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{t("stock.stockValue")}</p>
              <p className="mt-0.5 font-display text-[20px] font-bold text-ink-900 tnum">{money(materialCost)}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">
            {t("production.bom")} <span className="text-ink-400">({matRows.length})</span>
          </h2>
          <Link href="/app/stock/inventory" className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">
            {t("menu.inventory")} →
          </Link>
        </div>
        {matRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-ink-400">{t("stock.bomEmpty")}</p>
        ) : (
          <DataTable rows={matRows} columns={matCols} perPage={15} emptyLabel={t("stock.bomEmpty")} />
        )}
      </div>

      {qcs.length > 0 && (
        <div className="card mt-4">
          <div className="border-b border-ink-900/8 px-4 py-3 text-[13px] font-bold text-ink-700">
            {t("qc.title")} <span className="text-ink-400">({qcs.length})</span>
          </div>
          <ul className="divide-y divide-ink-900/6">
            {qcs.map((qc) => (
              <li key={qc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="font-mono text-[12px] font-bold text-ink-900">{qc.ref}</p>
                  <p className="text-[12.5px] text-ink-500">
                    {qc.date ? date(String(qc.date).slice(0, 10)) : "—"} · {t("qc.score")} {num(Math.round(qc.score ?? 0))} %
                  </p>
                </div>
                <StatusBadge status={qc.status} label={t(`statuses.${qc.status}`)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
