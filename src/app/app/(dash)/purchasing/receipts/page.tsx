import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { PackageCheck, FileInput, Boxes, Wallet } from "lucide-react";

export default async function ReceiptsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("receipts");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(r.number LIKE ? OR COALESCE(s.name,'') LIKE ? OR COALESCE(po.number,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const raw = all<any>(
    `SELECT r.id, r.number, r.date, r.status, po.number AS po_number, s.name AS supplier,
            w.code AS warehouse, u.full_name AS user,
            COALESCE((SELECT SUM(rl.quantity) FROM receipt_lines rl WHERE rl.receipt_id = r.id), 0) AS qty,
            COALESCE((SELECT SUM(rl.quantity * rl.unit_price) FROM receipt_lines rl WHERE rl.receipt_id = r.id), 0) AS value,
            (SELECT COUNT(*) FROM receipt_lines rl WHERE rl.receipt_id = r.id) AS lines
     FROM receipts r
     LEFT JOIN purchase_orders po ON po.id = r.po_id
     LEFT JOIN suppliers s ON s.id = r.supplier_id
     LEFT JOIN warehouses w ON w.id = r.warehouse_id
     LEFT JOIN users u ON u.id = r.user_id
     WHERE ${where.join(" AND ")}
     ORDER BY r.date DESC, r.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, number: r.number, date: (r.date ?? "").slice(0, 10), po: r.po_number ?? "—",
    supplier: r.supplier ?? "—", warehouse: r.warehouse ?? "—", lines: r.lines,
    qty: Math.round(r.qty), value: Math.round(r.value), user: r.user ?? "—", status: r.status,
  }));

  const totals = rows.reduce((a, r) => ({ qty: a.qty + r.qty, value: a.value + r.value }), { qty: 0, value: 0 });
  const kpis = [
    { label: t("menu.receipts"), value: num(rows.length), icon: PackageCheck },
    { label: t("table.quantity"), value: num(totals.qty), icon: Boxes },
    { label: t("table.value"), value: money(totals.value), icon: Wallet },
    { label: t("purchasing.pending"), value: num(get<any>(`SELECT COUNT(*) c FROM purchase_orders WHERE status IN ('confirmed','partial')`)?.c ?? 0), icon: FileInput },
  ];

  const cols: Col[] = [
    { key: "number", header: t("purchasing.receiptNumber"), link: true, className: "font-mono text-[11.5px]" },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "po", header: t("menu.purchaseOrders") },
    { key: "supplier", header: t("table.supplier") },
    { key: "warehouse", header: t("table.warehouse") },
    { key: "lines", header: t("quotes.lines"), type: "num", align: "end" },
    { key: "qty", header: t("table.quantity"), type: "num", align: "end" },
    { key: "value", header: t("table.value"), type: "money", align: "end" },
    { key: "user", header: t("table.user") },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("purchasing.receiptsTitle")}
        subtitle={t("purchasing.receiptsSub")}
        breadcrumb={[{ label: t("nav.purchasing"), href: "/app/purchasing/receipts" }, { label: t("menu.receipts") }]}
        actions={
          <>
            <Link href="/app/purchasing/orders" className="btn-outline btn-sm">{t("menu.purchaseOrders")}</Link>
            <ExportButtons filename="cristalu-receipts" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="REC-2026-… / fournisseur" />
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/purchasing/orders" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
