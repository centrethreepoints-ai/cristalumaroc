import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, FileText, PackageCheck, Truck, User, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function ReceiptDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("receipts");
  const { t, money, num, date } = await getI18n();

  const r = get<any>(
    `SELECT r.*, s.name AS supplier, s.code AS supplier_code, po.number AS po_number, po.status AS po_status,
            w.name AS warehouse, w.code AS wh_code, u.full_name AS user
     FROM receipts r
     LEFT JOIN suppliers s ON s.id = r.supplier_id
     LEFT JOIN purchase_orders po ON po.id = r.po_id
     LEFT JOIN warehouses w ON w.id = r.warehouse_id
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [Number(id)],
  );
  if (!r) notFound();

  const lines = all<any>(
    `SELECT rl.id, rl.quantity, rl.unit_price, p.sku, p.name, p.unit
     FROM receipt_lines rl JOIN products p ON p.id = rl.product_id
     WHERE rl.receipt_id = ? ORDER BY rl.id`,
    [r.id],
  );

  const totalQty = lines.reduce((s, l) => s + (l.quantity ?? 0), 0);
  const totalValue = lines.reduce((s, l) => s + (l.quantity ?? 0) * (l.unit_price ?? 0), 0);

  // The stock movements this receipt generated — proof the stock was increased.
  const movements = all<any>(
    `SELECT sm.id, sm.type, sm.quantity, sm.product_id, p.sku, p.name, w.code AS wh, sm.date
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     LEFT JOIN warehouses w ON w.id = sm.warehouse_id
     WHERE sm.ref = ? ORDER BY sm.id`,
    [r.number],
  );

  const lineCols: Col[] = [
    { key: "sku", header: t("table.sku"), type: "strong" },
    { key: "name", header: t("table.name") },
    { key: "quantity", header: t("purchasing.receivedQty"), type: "num", align: "end" },
    { key: "unit", header: t("table.unit") },
    { key: "unit_price", header: t("table.unitPrice"), type: "money", align: "end" },
    { key: "total", header: t("table.amountHT"), type: "money", align: "end" },
  ];
  const lineRows: Row[] = lines.map((l) => ({
    id: l.id, sku: l.sku, name: l.name, quantity: l.quantity, unit: l.unit,
    unit_price: Math.round(l.unit_price ?? 0),
    total: Math.round((l.quantity ?? 0) * (l.unit_price ?? 0)),
  }));

  const mvCols: Col[] = [
    { key: "sku", header: t("table.sku"), type: "strong" },
    { key: "name", header: t("table.product") },
    { key: "type", header: t("stock.movementType"), type: "badge" },
    { key: "quantity", header: t("stock.quantity"), type: "num", align: "end" },
    { key: "wh", header: t("table.warehouse") },
    { key: "date", header: t("table.date"), type: "date" },
  ];
  const mvRows: Row[] = movements.map((m) => ({
    id: m.id, sku: m.sku, name: m.name, type: m.type, quantity: m.quantity,
    wh: m.wh ?? "—", date: (m.date ?? "").slice(0, 10),
  }));

  return (
    <>
      <PageHeader
        title={r.number}
        subtitle={`${t("table.supplier")}: ${r.supplier ?? "—"} · ${date(r.date)}`}
        breadcrumb={[{ label: t("menu.receipts"), href: "/app/purchasing/receipts" }, { label: r.number }]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("purchasing.lines")} value={num(lines.length)} sub={t("purchasing.receiptValue") + " " + money(Math.round(totalValue))} icon={FileText} />
        <StatCard label={t("purchasing.receivedQty")} value={num(Math.round(totalQty * 100) / 100)} icon={PackageCheck} />
        <StatCard label={t("menu.movements")} value={num(movements.length)} sub={t("purchasing.stockUpdated")} icon={Truck} />
        <StatCard label={t("table.warehouse")} value={r.wh_code ?? "—"} sub={r.warehouse ?? ""} icon={Warehouse} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("purchasing.receivedLines")}</h2>
            </div>
            <DataTable rows={lineRows} columns={lineCols} dense emptyLabel={t("actions.noData")} />
          </section>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("purchasing.generatedMovements")}</h2>
              <span className="text-[12.5px] text-ink-500">{num(movements.length)} {t("menu.movements").toLowerCase()}</span>
            </div>
            <DataTable rows={mvRows} columns={mvCols} dense emptyLabel={t("stock.noMovements")} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("purchasing.receiptInfo")}</h2>
            <div className="mt-4 space-y-2.5 text-[13px] text-ink-800">
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-ink-300" />{date(r.date)}</p>
              {r.user && <p className="flex items-center gap-2"><User className="h-4 w-4 text-ink-300" />{r.user}</p>}
              {r.warehouse && <p className="flex items-center gap-2"><Warehouse className="h-4 w-4 text-ink-300" />{r.wh_code} — {r.warehouse}</p>}
            </div>
            <dl className="mt-4 space-y-2 border-t border-ink-900/8 pt-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">{t("table.status")}</dt>
                <dd><StatusBadge status={r.status} label={t(`statuses.${r.status}`)} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">{t("table.amountHT")}</dt>
                <dd className="font-semibold tnum">{money(Math.round(totalValue))}</dd>
              </div>
            </dl>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("logistics.relatedDocs")}</h2>
            <div className="mt-4 space-y-2">
              {r.po_id && (
                <Link href={`/app/purchasing/orders/${r.po_id}`} className="btn-outline btn-sm inline-flex me-2">
                  <FileText className="h-3.5 w-3.5" />{r.po_number}
                </Link>
              )}
              {r.supplier_id && (
                <Link href={`/app/purchasing/suppliers/${r.supplier_id}`} className="btn-outline btn-sm inline-flex">
                  <Truck className="h-3.5 w-3.5" />{r.supplier}
                </Link>
              )}
              {!r.po_id && !r.supplier_id && <p className="text-[13px] text-ink-500">{t("actions.noData")}</p>}
            </div>
            {r.po_status && (
              <p className="mt-4 text-[12.5px] text-ink-500">
                {t("menu.purchaseOrders")}: <StatusBadge status={r.po_status} label={t(`statuses.${r.po_status}`)} />
              </p>
            )}
          </section>

          {r.notes && (
            <section className="card card-pad">
              <h2 className="section-title">{t("table.notes")}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-600">{r.notes}</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
