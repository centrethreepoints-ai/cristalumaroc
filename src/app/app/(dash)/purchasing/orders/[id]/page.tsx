import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { PackageCheck, Receipt, Truck, Wallet } from "lucide-react";
import { ReceiveButton } from "../[id]/ReceiveButton";

export default async function PurchaseOrderDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("purchase_orders");
  const { t, money, num } = await getI18n();

  const po = get<any>(
    `SELECT po.*, s.name AS supplier, s.code AS supplier_code, s.contact_name, s.phone, s.email, s.city,
            w.name AS warehouse
     FROM purchase_orders po
     LEFT JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN warehouses w ON w.id = po.warehouse_id
     WHERE po.id = ?`,
    [Number(id)],
  );
  if (!po) notFound();

  const lines = all<any>(
    `SELECT pl.id, p.sku, p.name, p.unit, pl.quantity, pl.received_qty, pl.unit_price, pl.vat_rate, pl.position
     FROM po_lines pl JOIN products p ON p.id = pl.product_id
     WHERE pl.po_id = ? ORDER BY pl.position, pl.id`,
    [po.id],
  );

  const warehouses = all<any>(`SELECT id, code, name FROM warehouses ORDER BY is_default DESC, code`);

  const ordered = lines.reduce((s, l) => s + l.quantity, 0);
  const received = lines.reduce((s, l) => s + l.received_qty, 0);
  const pending = ordered - received;
  const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;

  const receipts = all<any>(
    `SELECT r.id, r.number, r.date, r.status, u.full_name AS user, w.name AS warehouse,
            (SELECT COUNT(*) FROM receipt_lines rl WHERE rl.receipt_id = r.id) AS line_count
     FROM receipts r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN warehouses w ON w.id = r.warehouse_id
     WHERE r.po_id = ? ORDER BY r.date DESC, r.id DESC`,
    [po.id],
  );

  const lineCols: Col[] = [
    { key: "position", header: "#", type: "muted", width: "48px" },
    { key: "sku", header: t("table.sku"), type: "strong" },
    { key: "name", header: t("table.name") },
    { key: "quantity", header: t("table.quantity"), type: "num", align: "end" },
    { key: "received_qty", header: t("purchasing.receivedQty"), type: "num", align: "end" },
    { key: "pending", header: t("purchasing.pendingQty"), type: "num", align: "end" },
    { key: "unit_price", header: t("table.unitPrice"), type: "money", align: "end" },
    { key: "vat_rate", header: t("table.vat"), type: "num", align: "end" },
    { key: "total", header: t("table.amountHT"), type: "money", align: "end" },
  ];
  const lineRows: Row[] = lines.map((l) => ({
    id: l.id, position: l.position, sku: l.sku, name: l.name,
    quantity: l.quantity, received_qty: l.received_qty,
    pending: Math.round((l.quantity - l.received_qty) * 100) / 100,
    unit_price: Math.round(l.unit_price), vat_rate: l.vat_rate,
    total: Math.round(l.quantity * l.unit_price),
  }));

  const recCols: Col[] = [
    { key: "number", header: t("table.reference"), type: "strong", link: true },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "warehouse", header: t("table.warehouse") },
    { key: "line_count", header: t("purchasing.lines"), type: "num", align: "end" },
    { key: "user", header: t("table.user"), type: "muted" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];
  const recRows: Row[] = receipts.map((r) => ({
    id: r.id, number: r.number, date: (r.date ?? "").slice(0, 10),
    warehouse: r.warehouse ?? "—", line_count: r.line_count, user: r.user ?? "—", status: r.status,
  }));

  return (
    <>
      <PageHeader
        title={po.number}
        subtitle={`${t("table.supplier")}: ${po.supplier ?? "—"}`}
        breadcrumb={[{ label: t("menu.purchaseOrders"), href: "/app/purchasing/orders" }, { label: po.number }]}
        actions={
          <ReceiveButton
            poId={po.id}
            poNumber={po.number}
            lines={lines.map((l) => ({
              id: l.id, sku: l.sku, name: l.name, unit: l.unit,
              quantity: l.quantity, received_qty: l.received_qty,
            }))}
            warehouses={warehouses}
            warehouseId={po.warehouse_id ?? null}
            disabled={["received", "cancelled"].includes(po.status)}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("table.amountHT")} value={money(Math.round(po.total_ht ?? 0))} sub={`${t("table.amountTTC")} ${money(Math.round(po.total_ttc ?? 0))}`} icon={Wallet} />
        <StatCard label={t("purchasing.ordered")} value={num(Math.round(ordered * 100) / 100)} sub={`${lines.length} ${t("purchasing.lines")}`} icon={Truck} />
        <StatCard label={t("purchasing.receivedQty")} value={num(Math.round(received * 100) / 100)} sub={`${num(pct)} %`} icon={PackageCheck} />
        <StatCard label={t("menu.receipts")} value={num(receipts.length)} sub={`${num(Math.round(pending * 100) / 100)} ${t("purchasing.pendingQty")}`} icon={Receipt} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("purchasing.lines")}</h2>
            </div>
            <DataTable rows={lineRows} columns={lineCols} dense emptyLabel={t("actions.noData")} />
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("purchasing.receiptsHistory")}</h2>
            </div>
            <DataTable rows={recRows} columns={recCols} hrefPrefix="/app/purchasing/receipts" dense emptyLabel={t("purchasing.noReceipts")} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("table.status")}</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.status")}</span>
                <StatusBadge status={po.status} label={t(`statuses.${po.status}`)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.date")}</span>
                <span className="text-[13px] font-semibold text-ink-900">{po.order_date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.dueDate")}</span>
                <span className="text-[13px] font-semibold text-ink-900">{po.expected_date ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.warehouse")}</span>
                <span className="text-[13px] font-semibold text-ink-900">{po.warehouse ?? "—"}</span>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-900/8">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-ink-500">{num(pct)} % {t("purchasing.receivedQty").toLowerCase()}</p>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("table.supplier")}</h2>
            <div className="mt-4 space-y-1.5 text-[13px] text-ink-800">
              <Link href={`/app/purchasing/suppliers/${po.supplier_id}`} className="block font-semibold text-brand-600 hover:text-brand-700">
                {po.supplier}
              </Link>
              {po.contact_name && <p className="text-ink-600">{po.contact_name}</p>}
              {po.phone && <p className="text-ink-600">{po.phone}</p>}
              {po.email && <p className="text-ink-600">{po.email}</p>}
              {po.city && <p className="text-ink-600">{po.city}</p>}
            </div>
          </section>

          {po.notes && (
            <section className="card card-pad">
              <h2 className="section-title">{t("table.notes")}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-600">{po.notes}</p>
            </section>
          )}

          <section className="card card-pad">
            <h2 className="section-title">{t("table.amountTTC")}</h2>
            <dl className="mt-3 space-y-1.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.amountHT")}</dt><dd className="font-semibold tnum">{money(Math.round(po.total_ht ?? 0))}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.vat")}</dt><dd className="font-semibold tnum">{money(Math.round(po.total_vat ?? 0))}</dd></div>
              <div className="flex justify-between border-t border-ink-900/10 pt-1.5"><dt className="font-bold">{t("table.amountTTC")}</dt><dd className="font-display font-bold text-brand-600 tnum">{money(Math.round(po.total_ttc ?? 0))}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
