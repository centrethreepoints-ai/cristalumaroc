import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { OrderActions } from "./OrderActions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function OrderDetailPage({ params }: { params: any }) {
  await requirePerm("orders");
  const { t, money, num, date } = await getI18n();
  const p = await params;
  const id = Number(p.id);

  const o = get<any>(
    `SELECT o.*, COALESCE(c.company, c.contact_name) AS customer_name, c.code AS customer_code,
            c.email, c.phone, c.ice, u.full_name AS salesperson, q.number AS quote_number
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = o.salesperson_id
     LEFT JOIN quotes q ON q.id = o.quote_id
     WHERE o.id = ?`,
    [id],
  );
  if (!o) notFound();

  const lines = all<any>(
    `SELECT ol.*, p.sku, p.name AS product_name
     FROM order_lines ol LEFT JOIN products p ON p.id = ol.product_id
     WHERE ol.order_id = ? ORDER BY ol.position`,
    [id],
  );

  const mos = all<any>(
    `SELECT m.id, m.number, m.status, m.progress, m.quantity, m.start_date, m.end_date,
            p.name AS product, u.full_name AS assignee
     FROM manufacturing_orders m
     LEFT JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.assignee_id
     WHERE m.order_id = ? ORDER BY m.number`,
    [id],
  );

  const invoices = all<any>(
    `SELECT id, number, status, issue_date, total_ttc, paid_amount FROM invoices WHERE order_id = ? ORDER BY issue_date`,
    [id],
  );
  const deliveries = all<any>(
    `SELECT id, number, status, date FROM deliveries WHERE order_id = ? ORDER BY date`,
    [id],
  );
  const installations = all<any>(
    `SELECT i.id, i.ref, i.status, i.appointment_date, tm.name AS team
     FROM installations i LEFT JOIN teams tm ON tm.id = i.team_id
     WHERE i.order_id = ? ORDER BY i.appointment_date`,
    [id],
  );

  const fact = (label: string, value: any) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-ink-800">{value || "—"}</p>
    </div>
  );

  const moRows: Row[] = mos.map((m) => ({
    id: m.id, number: m.number, product: m.product ?? "—", assignee: m.assignee ?? "—",
    quantity: Math.round(m.quantity), progress: m.progress ?? 0,
    start_date: (m.start_date ?? "").slice(0, 10), end_date: (m.end_date ?? "").slice(0, 10),
    status: m.status,
  }));
  const invoiceRows: Row[] = invoices.map((i) => ({
    id: i.id, number: i.number, date: (i.issue_date ?? "").slice(0, 10),
    total: Math.round(i.total_ttc ?? 0), paid: Math.round(i.paid_amount ?? 0),
    balance: Math.round((i.total_ttc ?? 0) - (i.paid_amount ?? 0)), status: i.status,
  }));
  const deliveryRows: Row[] = deliveries.map((d) => ({
    id: d.id, number: d.number, date: (d.date ?? "").slice(0, 10), status: d.status,
  }));
  const installRows: Row[] = installations.map((i) => ({
    id: i.id, ref: i.ref, team: i.team ?? "—",
    appointment: i.appointment_date ? date(String(i.appointment_date).slice(0, 10)) : "—",
    status: i.status,
  }));

  const moCols: Col[] = [
    { key: "number", header: t("production.number"), link: true, className: "font-mono text-[11.5px]" },
    { key: "product", header: t("production.product") },
    { key: "assignee", header: t("table.assignee") },
    { key: "quantity", header: t("table.quantity"), type: "num", align: "end" },
    { key: "start_date", header: t("table.startDate"), type: "date" },
    { key: "end_date", header: t("table.endDate"), type: "date" },
    { key: "progress", header: t("table.progress"), type: "num", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={o.number}
        subtitle={`${o.customer_name} · ${date(String(o.order_date).slice(0, 10))}`}
        breadcrumb={[{ label: t("orders.title"), href: "/app/commercial/orders" }, { label: o.number }]}
        actions={
          <OrderActions id={id} status={o.status} hasInvoice={invoices.length > 0} hasMos={mos.length > 0} />
        }
      />

      <div className="print-doc grid gap-4 lg:grid-cols-3">
        <section className="card card-pad">
          <h2 className="section-title">{t("table.customer")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.company"), o.customer_name)}
            {fact(t("table.email"), o.email)}
            {fact(t("table.phone"), o.phone)}
            {fact("ICE", o.ice)}
            {fact(t("orders.deliveryAddress"), o.delivery_address)}
            {fact(t("table.city"), o.city)}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("orders.orderDocument")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.status"), <StatusBadge status={o.status} label={t(`statuses.${o.status}`)} />)}
            {fact(t("table.priority"), t(`production.${o.priority}`))}
            {fact(t("orders.orderDate"), date(String(o.order_date).slice(0, 10)))}
            {fact(t("orders.expected"), o.expected_date ? date(String(o.expected_date).slice(0, 10)) : "—")}
            {fact(t("table.salesperson"), o.salesperson)}
            {fact(t("orders.fromQuote"), o.quote_number ? (
              <Link href={`/app/commercial/quotes?search=${o.quote_number}`} className="font-mono text-brand-600 hover:underline">
                {o.quote_number}
              </Link>
            ) : "—")}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("orders.progress")}</h2>
          <div className="mt-4 space-y-3">
            {fact(t("orders.lines"), num(lines.length))}
            {fact(t("menu.manufacturing"), num(mos.length))}
            {fact(t("menu.invoices"), num(invoices.length))}
            {fact(t("menu.deliveries"), num(deliveries.length))}
            {fact(t("menu.installations"), num(installations.length))}
            <div className="border-t border-ink-900/10 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{t("table.amountTTC")}</p>
              <p className="mt-0.5 font-display text-[20px] font-bold text-brand-600 tnum">
                {money(Math.round(o.total_ttc ?? 0))}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">
            {t("orders.lines")} <span className="text-ink-400">({lines.length})</span>
          </h2>
        </div>
        <div className="table-wrap scroll-thin">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("table.product")}</th>
                <th className="text-end">{t("table.dimensions")}</th>
                <th className="text-end">{t("table.quantity")}</th>
                <th className="text-end">{t("orders.progress")}</th>
                <th className="text-end">{t("table.unitPrice")}</th>
                <th className="text-end">{t("table.discount")}</th>
                <th className="text-end">{t("table.amountHT")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const lineHT = l.quantity * l.unit_price * (1 - (l.discount_pct ?? 0) / 100);
                return (
                  <tr key={l.id}>
                    <td className="tnum text-ink-400">{i + 1}</td>
                    <td>
                      <div className="font-semibold text-ink-900">{l.product_name ?? l.description}</div>
                      <div className="text-[11.5px] text-ink-400">{l.sku}</div>
                    </td>
                    <td className="text-end tnum text-ink-600">
                      {l.width ? `${Math.round(l.width)} × ${Math.round(l.height)} mm` : "—"}
                    </td>
                    <td className="text-end tnum">{num(l.quantity)}</td>
                    <td className="text-end tnum text-ink-500">{num(Math.round(l.delivered_qty ?? 0))}</td>
                    <td className="text-end tnum">{money(Math.round(l.unit_price))}</td>
                    <td className="text-end tnum text-ink-500">{l.discount_pct ? `${num(l.discount_pct)} %` : "—"}</td>
                    <td className="text-end font-semibold tnum">{money(Math.round(lineHT))}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-ink-50/70">
                <td colSpan={7} className="text-end text-[12.5px] font-bold uppercase tracking-wider text-ink-500">
                  {t("table.totalHT")}
                </td>
                <td className="text-end font-display text-[15px] font-bold text-ink-900 tnum">
                  {money(Math.round(o.total_ht ?? 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {moRows.length > 0 && (
        <div className="card mt-4">
          <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-3">
            <h2 className="font-display text-[15px] font-bold text-ink-900">
              {t("menu.manufacturing")} <span className="text-ink-400">({mos.length})</span>
            </h2>
            <Link href="/app/production/kanban" className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">
              {t("menu.kanban")} →
            </Link>
          </div>
          <DataTable rows={moRows} columns={moCols} hrefPrefix="/app/production/manufacturing" perPage={10} emptyLabel={t("actions.noData")} />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-ink-900/8 px-4 py-3 text-[13px] font-bold text-ink-700">
            {t("menu.invoices")} <span className="text-ink-400">({invoices.length})</span>
          </div>
          <DataTable
            rows={invoiceRows}
            perPage={5}
            columns={[
              { key: "number", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
              { key: "date", header: t("table.date"), type: "date" },
              { key: "total", header: t("table.amountTTC"), type: "money", align: "end" },
              { key: "balance", header: t("table.balance"), type: "money", align: "end" },
              { key: "status", header: t("table.status"), type: "badge" },
            ]}
            hrefPrefix="/app/finance/invoices"
            emptyLabel={t("actions.noData")}
          />
        </div>

        <div className="card">
          <div className="border-b border-ink-900/8 px-4 py-3 text-[13px] font-bold text-ink-700">
            {t("menu.deliveries")} <span className="text-ink-400">({deliveries.length})</span>
          </div>
          <DataTable
            rows={deliveryRows}
            perPage={5}
            columns={[
              { key: "number", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
              { key: "date", header: t("table.date"), type: "date" },
              { key: "status", header: t("table.status"), type: "badge" },
            ]}
            hrefPrefix="/app/logistics/deliveries"
            emptyLabel={t("actions.noData")}
          />
        </div>
      </div>

      {installRows.length > 0 && (
        <div className="card mt-4">
          <div className="border-b border-ink-900/8 px-4 py-3 text-[13px] font-bold text-ink-700">
            {t("menu.installations")} <span className="text-ink-400">({installations.length})</span>
          </div>
          <DataTable
            rows={installRows}
            perPage={5}
            columns={[
              { key: "ref", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
              { key: "appointment", header: t("logistics.appointment") },
              { key: "team", header: t("logistics.team") },
              { key: "status", header: t("table.status"), type: "badge" },
            ]}
            hrefPrefix="/app/logistics/installations"
            emptyLabel={t("actions.noData")}
          />
        </div>
      )}
    </>
  );
}
