import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { FileInput, PackageCheck, Clock, CheckCircle2 } from "lucide-react";

const STATUSES = ["draft", "sent", "confirmed", "partial", "received", "cancelled"];

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: any }) {
  await requirePerm("purchase_orders");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = String(sp.status ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(po.number LIKE ? OR COALESCE(s.name,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like);
  }
  if (status) { where.push("po.status = ?"); params.push(status); }

  const raw = all<any>(
    `SELECT po.id, po.number, po.status, po.order_date, po.expected_date, po.total_ht, po.total_ttc, po.notes,
            s.name AS supplier, w.code AS warehouse,
            COALESCE((SELECT SUM(pl.quantity) FROM po_lines pl WHERE pl.po_id = po.id), 0) AS qty,
            COALESCE((SELECT SUM(pl.received_qty) FROM po_lines pl WHERE pl.po_id = po.id), 0) AS received
     FROM purchase_orders po
     LEFT JOIN suppliers s ON s.id = po.supplier_id
     LEFT JOIN warehouses w ON w.id = po.warehouse_id
     WHERE ${where.join(" AND ")}
     ORDER BY po.order_date DESC, po.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => {
    const pct = r.qty > 0 ? Math.round((r.received / r.qty) * 100) : 0;
    return {
      id: r.id, number: r.number, supplier: r.supplier ?? "—", warehouse: r.warehouse ?? "—",
      order_date: (r.order_date ?? "").slice(0, 10), expected_date: (r.expected_date ?? "").slice(0, 10),
      qty: Math.round(r.qty), received: Math.round(r.received), progress: pct,
      total_ht: Math.round(r.total_ht ?? 0), status: r.status,
    };
  });

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM purchase_orders WHERE status = ?`, [s])?.c ?? 0;
  const openValue = get<any>(
    `SELECT COALESCE(SUM(total_ttc),0) v FROM purchase_orders WHERE status IN ('sent','confirmed','partial')`,
  )?.v ?? 0;
  const kpis = [
    { label: t("menu.purchaseOrders"), value: num(raw.length), icon: FileInput },
    { label: t("purchasing.pending"), value: money(Math.round(openValue)), icon: Clock },
    { label: t("statuses.partial"), value: num(count("partial")), icon: PackageCheck },
    { label: t("statuses.received"), value: num(count("received")), icon: CheckCircle2 },
  ];

  const cols: Col[] = [
    { key: "number", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "supplier", header: t("table.supplier") },
    { key: "warehouse", header: t("table.warehouse") },
    { key: "order_date", header: t("table.date"), type: "date" },
    { key: "expected_date", header: t("table.dueDate"), type: "date" },
    { key: "qty", header: t("table.quantity"), type: "num", align: "end" },
    { key: "received", header: t("purchasing.received"), type: "num", align: "end" },
    { key: "progress", header: t("table.progress"), type: "num", align: "end" },
    { key: "total_ht", header: t("table.amountHT"), type: "money", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("purchasing.poTitle")}
        subtitle={t("purchasing.poSub")}
        breadcrumb={[{ label: t("nav.purchasing"), href: "/app/purchasing/orders" }, { label: t("menu.purchaseOrders") }]}
        actions={
          <>
            <Link href="/app/purchasing/orders/new" className="btn btn-primary">{t("purchasing.newPo")}</Link>
            <Link href="/app/purchasing/receipts" className="btn-outline btn-sm">{t("menu.receipts")}</Link>
            <ExportButtons filename="cristalu-po" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="CA-2026-… / fournisseur" />
        </div>
        <div>
          <label className="label">{t("table.status")}</label>
          <select className="select" name="status" defaultValue={status}>
            <option value="">{t("actions.all")}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/purchasing/orders" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
