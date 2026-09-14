import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, Mail, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { FileText, PackageCheck, Receipt, Wallet } from "lucide-react";

export default async function SupplierDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("suppliers");
  const { t, money, num, date } = await getI18n();

  const s = get<any>(`SELECT * FROM suppliers WHERE id = ?`, [Number(id)]);
  if (!s) notFound();

  const pos = all<any>(
    `SELECT po.id, po.number, po.order_date, po.expected_date, po.status, po.total_ht, po.total_ttc
     FROM purchase_orders po WHERE po.supplier_id = ? ORDER BY po.order_date DESC, po.id DESC`,
    [s.id],
  );

  const receipts = all<any>(
    `SELECT r.id, r.number, r.date, r.status, w.name AS warehouse,
            COALESCE((SELECT SUM(rl.quantity * rl.unit_price) FROM receipt_lines rl WHERE rl.receipt_id = r.id), 0) AS value
     FROM receipts r LEFT JOIN warehouses w ON w.id = r.warehouse_id
     WHERE r.supplier_id = ? ORDER BY r.date DESC, r.id DESC`,
    [s.id],
  );

  const totals = get<any>(
    `SELECT COUNT(*) c, COALESCE(SUM(total_ttc),0) ttc,
            COALESCE(SUM(CASE WHEN status IN ('draft','sent','confirmed','partial') THEN total_ttc ELSE 0 END),0) open_ttc
     FROM purchase_orders WHERE supplier_id = ?`,
    [s.id],
  );
  const receivedValue = receipts.reduce((sum, r) => sum + (r.value ?? 0), 0);

  const poCols: Col[] = [
    { key: "number", header: t("table.reference"), type: "strong", link: true },
    { key: "order_date", header: t("table.date"), type: "date" },
    { key: "expected_date", header: t("table.dueDate"), type: "date" },
    { key: "total_ht", header: t("table.amountHT"), type: "money", align: "end" },
    { key: "total_ttc", header: t("table.amountTTC"), type: "money", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];
  const poRows: Row[] = pos.map((p) => ({
    id: p.id, number: p.number, order_date: p.order_date,
    expected_date: p.expected_date ?? "—",
    total_ht: Math.round(p.total_ht ?? 0), total_ttc: Math.round(p.total_ttc ?? 0), status: p.status,
  }));

  const recCols: Col[] = [
    { key: "number", header: t("table.reference"), type: "strong", link: true },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "warehouse", header: t("table.warehouse") },
    { key: "value", header: t("table.value"), type: "money", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];
  const recRows: Row[] = receipts.map((r) => ({
    id: r.id, number: r.number, date: (r.date ?? "").slice(0, 10),
    warehouse: r.warehouse ?? "—", value: Math.round(r.value ?? 0), status: r.status,
  }));

  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={`${s.code} · ${s.category ?? "—"}`}
        breadcrumb={[{ label: t("menu.suppliers"), href: "/app/purchasing/suppliers" }, { label: s.name }]}
        actions={<Link href={`/app/purchasing/suppliers/${s.id}/edit`} className="btn-outline btn-sm">{t("actions.edit")}</Link>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("menu.purchaseOrders")} value={num(totals?.c ?? 0)} sub={money(Math.round(totals?.ttc ?? 0))} icon={FileText} />
        <StatCard label={t("menu.receipts")} value={num(receipts.length)} sub={money(Math.round(receivedValue))} icon={Receipt} />
        <StatCard label={t("customers.openBalance")} value={money(Math.round(totals?.open_ttc ?? 0))} sub={t("purchasing.openOrders")} icon={Wallet} />
        <StatCard
          label={t("suppliers.rating")}
          value={`${num(s.rating ?? 0)} / 5`}
          icon={Star}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.purchaseOrders")}</h2>
            </div>
            <DataTable rows={poRows} columns={poCols} hrefPrefix="/app/purchasing/orders" dense emptyLabel={t("actions.noData")} />
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.receipts")}</h2>
            </div>
            <DataTable rows={recRows} columns={recCols} hrefPrefix="/app/purchasing/receipts" dense emptyLabel={t("purchasing.noReceipts")} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("customers.identity")}</h2>
            <div className="mt-4 space-y-2.5 text-[13px] text-ink-800">
              {s.contact_name && <p className="flex items-center gap-2"><User className="h-4 w-4 text-ink-300" />{s.contact_name}</p>}
              {s.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-ink-300" /><a href={`tel:${s.phone}`} className="hover:text-brand-600">{s.phone}</a></p>}
              {s.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-ink-300" /><a href={`mailto:${s.email}`} className="hover:text-brand-600">{s.email}</a></p>}
              {(s.address || s.city) && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" /><span>{[s.address, s.city].filter(Boolean).join(", ")}</span></p>}
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("customers.legal")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              {([["ICE", s.ice], ["IF", s.if_code], ["RC", s.rc]] as [string, any][]).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="font-mono font-semibold">{v ?? "—"}</dd>
                </div>
              ))}
              <div className="flex justify-between">
                <dt className="text-ink-500">{t("customers.paymentTerms")}</dt>
                <dd className="font-semibold">{s.payment_terms ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">{t("table.category")}</dt>
                <dd className="font-semibold">{s.category ?? "—"}</dd>
              </div>
            </dl>
          </section>

          {s.notes && (
            <section className="card card-pad">
              <h2 className="section-title">{t("table.notes")}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-600">{s.notes}</p>
            </section>
          )}

          <section className="card card-pad">
            <h2 className="section-title">{t("purchasing.performance")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-500">{t("purchasing.avgOrder")}</dt><dd className="font-semibold tnum">{money(Math.round((totals?.ttc ?? 0) / Math.max(1, totals?.c ?? 1)))}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("purchasing.lastOrder")}</dt><dd className="font-semibold">{pos[0] ? date(pos[0].order_date) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("purchasing.lastReceipt")}</dt><dd className="font-semibold">{receipts[0] ? date(receipts[0].date) : "—"}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
