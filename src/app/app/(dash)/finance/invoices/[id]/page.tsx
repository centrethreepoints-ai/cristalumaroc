import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { StatCard } from "@/components/dash/StatCard";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { InvoiceActions } from "./InvoiceActions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Receipt, CreditCard, Clock, Wallet } from "lucide-react";

export default async function InvoiceDetailPage({ params }: { params: any }) {
  await requirePerm("invoices");
  const { t, money, num, date } = await getI18n();
  const p = await params;
  const id = Number(p.id);

  const inv = get<any>(
    `SELECT i.*, COALESCE(c.company, c.contact_name) AS customer_name, c.code AS customer_code,
            c.address, c.city, c.zip, c.ice, c.if_code, c.email, c.phone,
            o.number AS order_number
     FROM invoices i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN orders o ON o.id = i.order_id
     WHERE i.id = ?`,
    [id],
  );
  if (!inv) notFound();

  const lines = all<any>(
    `SELECT il.*, p.sku, p.name AS product_name
     FROM invoice_lines il LEFT JOIN products p ON p.id = il.product_id
     WHERE il.invoice_id = ? ORDER BY il.position`,
    [id],
  );
  const payments = all<any>(
    `SELECT id, ref, date, method, amount, reference, notes FROM payments
     WHERE invoice_id = ? ORDER BY date`,
    [id],
  );

  const balance = (inv.total_ttc ?? 0) - (inv.paid_amount ?? 0);
  const overdue = inv.due_date && balance > 0.5 && String(inv.due_date).slice(0, 10) < new Date().toISOString().slice(0, 10);

  const paymentRows: Row[] = payments.map((x) => ({
    id: x.id, ref: x.ref, date: (x.date ?? "").slice(0, 10), method: t(`finance.${x.method}`),
    reference: x.reference ?? "—", amount: Math.round(x.amount ?? 0),
  }));

  const fact = (label: string, value: any) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-ink-800">{value || "—"}</p>
    </div>
  );

  const payCols: Col[] = [
    { key: "ref", header: t("table.reference"), className: "font-mono text-[11.5px]" },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "method", header: t("table.method") },
    { key: "reference", header: t("finance.reference") },
    { key: "amount", header: t("table.amountTTC"), type: "money", align: "end" },
  ];

  return (
    <>
      <PageHeader
        title={inv.number}
        subtitle={`${inv.customer_name} · ${date(String(inv.issue_date).slice(0, 10))}`}
        breadcrumb={[{ label: t("finance.title"), href: "/app/finance/invoices" }, { label: inv.number }]}
        actions={<InvoiceActions id={id} status={inv.status} balance={Math.round(balance)} customerId={inv.customer_id} />}
      />

      {overdue && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-600/25 bg-brand-600/8 px-4 py-3">
          <Clock className="h-4 w-4 text-brand-600" />
          <span className="text-[13px] font-semibold text-brand-700">
            {t("finance.overdue")} — {t("table.dueDate")} {date(String(inv.due_date).slice(0, 10))}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("table.amountHT")} value={money(Math.round(inv.total_ht ?? 0))} icon={Receipt} />
        <StatCard label={t("table.vat")} value={money(Math.round(inv.total_vat ?? 0))} icon={Wallet} />
        <StatCard label={t("table.paid")} value={money(Math.round(inv.paid_amount ?? 0))} icon={CreditCard} />
        <StatCard label={t("table.balance")} value={money(Math.round(balance))} icon={Clock} tone={balance > 0 ? "red" : "green"} />
      </div>

      <div className="print-doc mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card card-pad">
          <h2 className="section-title">{t("table.customer")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.company"), inv.customer_name)}
            {fact(t("table.email"), inv.email)}
            {fact(t("table.phone"), inv.phone)}
            {fact("ICE", inv.ice)}
            {fact("IF", inv.if_code)}
            {fact(t("logistics.address"), [inv.address, inv.zip, inv.city].filter(Boolean).join(", "))}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("finance.invoiceDocument")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.status"), <StatusBadge status={inv.status} label={t(`statuses.${inv.status}`)} />)}
            {fact(t("table.date"), date(String(inv.issue_date).slice(0, 10)))}
            {fact(t("table.dueDate"), inv.due_date ? date(String(inv.due_date).slice(0, 10)) : "—")}
            {fact(t("finance.fromOrder"), inv.order_number ? (
              <Link href={`/app/commercial/orders/${inv.order_id}`} className="font-mono text-brand-600 hover:underline">
                {inv.order_number}
              </Link>
            ) : "—")}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("table.amountTTC")}</h2>
          <dl className="mt-4 space-y-2 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-ink-500">{t("table.totalHT")}</dt><dd className="font-semibold tnum">{money(Math.round(inv.total_ht ?? 0))}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">{t("table.vat")}</dt><dd className="font-semibold tnum">{money(Math.round(inv.total_vat ?? 0))}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">{t("table.amountTTC")}</dt><dd className="font-semibold tnum">{money(Math.round(inv.total_ttc ?? 0))}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">{t("table.paid")}</dt><dd className="font-semibold text-emerald-600 tnum">{money(Math.round(inv.paid_amount ?? 0))}</dd></div>
            <div className="flex justify-between border-t border-ink-900/10 pt-2 text-[16px]">
              <dt className="font-bold text-ink-900">{t("table.balance")}</dt>
              <dd className={"font-display font-bold tnum " + (balance > 0 ? "text-brand-600" : "text-emerald-600")}>
                {money(Math.round(balance))}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">
            {t("quotes.lines")} <span className="text-ink-400">({lines.length})</span>
          </h2>
        </div>
        <div className="table-wrap scroll-thin">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("table.product")}</th>
                <th className="text-end">{t("table.quantity")}</th>
                <th className="text-end">{t("table.unitPrice")}</th>
                <th className="text-end">{t("table.discount")}</th>
                <th className="text-end">{t("table.vat")}</th>
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
                    <td className="text-end tnum">{num(l.quantity)}</td>
                    <td className="text-end tnum">{money(Math.round(l.unit_price))}</td>
                    <td className="text-end tnum text-ink-500">{l.discount_pct ? `${num(l.discount_pct)} %` : "—"}</td>
                    <td className="text-end tnum text-ink-500">{num(l.vat_rate ?? 0)} %</td>
                    <td className="text-end font-semibold tnum">{money(Math.round(lineHT))}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-ink-50/70">
                <td colSpan={6} className="text-end text-[12.5px] font-bold uppercase tracking-wider text-ink-500">
                  {t("table.totalTTC")}
                </td>
                <td className="text-end font-display text-[15px] font-bold text-ink-900 tnum">
                  {money(Math.round(inv.total_ttc ?? 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">
            {t("menu.payments")} <span className="text-ink-400">({payments.length})</span>
          </h2>
          <Link href="/app/finance/payments" className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">
            {t("finance.paymentsTitle")} →
          </Link>
        </div>
        <DataTable rows={paymentRows} columns={payCols} perPage={10} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
