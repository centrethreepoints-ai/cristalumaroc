import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { FileText, ShoppingCart, Receipt, Wrench, Wallet } from "lucide-react";

export default async function CustomerDetailPage({ params }: { params: any }) {
  await requirePerm("customers");
  const { t, money, num, date, pick } = await getI18n();
  const p = await params;
  const id = Number(p.id);

  const c = get<any>(
    `SELECT c.*, u.full_name AS owner FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE c.id = ?`,
    [id],
  );
  if (!c) notFound();

  const name = pick(c.company, c.contact_name) ?? c.code;

  const quotes = all<any>(
    `SELECT q.id, q.number, q.status, q.issue_date, q.total_ttc, u.full_name AS salesperson
     FROM quotes q LEFT JOIN users u ON u.id = q.salesperson_id
     WHERE q.customer_id = ? ORDER BY q.issue_date DESC`, [id]);
  const orders = all<any>(
    `SELECT o.id, o.number, o.status, o.order_date, o.expected_date, o.total_ttc
     FROM orders o WHERE o.customer_id = ? ORDER BY o.order_date DESC`, [id]);
  const invoices = all<any>(
    `SELECT i.id, i.number, i.status, i.issue_date, i.due_date, i.total_ttc, i.paid_amount
     FROM invoices i WHERE i.customer_id = ? ORDER BY i.issue_date DESC`, [id]);
  const payments = all<any>(
    `SELECT p.id, p.ref, p.date, p.method, p.amount FROM payments p
     WHERE p.customer_id = ? ORDER BY p.date DESC`, [id]);
  const installs = all<any>(
    `SELECT i.id, i.ref, i.status, i.appointment_date, i.address, i.city, tm.name AS team
     FROM installations i LEFT JOIN teams tm ON tm.id = i.team_id
     WHERE i.customer_id = ? ORDER BY i.appointment_date DESC`, [id]);
  const requests = all<any>(
    `SELECT id, ref, status, product, city, created_at FROM quote_requests
     WHERE customer_id = ? ORDER BY created_at DESC`, [id]);

  const revenue = orders.reduce((s, o) => s + (o.total_ttc ?? 0), 0);
  const invoiced = invoices.reduce((s, i) => s + (i.total_ttc ?? 0), 0);
  const paid = payments.reduce((s, x) => s + (x.amount ?? 0), 0);
  const balance = invoiced - paid;

  const kpis = [
    { label: t("customers.totalRevenue"), value: money(Math.round(revenue)), icon: Wallet },
    { label: t("customers.openBalance"), value: money(Math.round(balance)), icon: Receipt },
    { label: t("customers.ordersCount"), value: num(orders.length), icon: ShoppingCart },
    { label: t("customers.quotesCount"), value: num(quotes.length), icon: FileText },
  ];

  const fact = (label: string, value: any) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-0.5 text-[13.5px] font-semibold text-ink-800">{value || "—"}</p>
    </div>
  );

  const quoteRows: Row[] = quotes.map((q) => ({
    id: q.id, number: q.number, date: (q.issue_date ?? "").slice(0, 10),
    salesperson: q.salesperson ?? "—", total: Math.round(q.total_ttc ?? 0), status: q.status,
  }));
  const orderRows: Row[] = orders.map((o) => ({
    id: o.id, number: o.number, date: (o.order_date ?? "").slice(0, 10),
    expected: (o.expected_date ?? "").slice(0, 10), total: Math.round(o.total_ttc ?? 0), status: o.status,
  }));
  const invoiceRows: Row[] = invoices.map((i) => ({
    id: i.id, number: i.number, date: (i.issue_date ?? "").slice(0, 10), due: (i.due_date ?? "").slice(0, 10),
    total: Math.round(i.total_ttc ?? 0), paid: Math.round(i.paid_amount ?? 0),
    balance: Math.round((i.total_ttc ?? 0) - (i.paid_amount ?? 0)), status: i.status,
  }));
  const paymentRows: Row[] = payments.map((x) => ({
    id: x.id, ref: x.ref, date: (x.date ?? "").slice(0, 10), method: t(`finance.${x.method}`),
    amount: Math.round(x.amount ?? 0),
  }));
  const installRows: Row[] = installs.map((i) => ({
    id: i.id, ref: i.ref, appointment: i.appointment_date ? date(String(i.appointment_date).slice(0, 10)) : "—",
    team: i.team ?? "—", city: i.city ?? "—", address: i.address ?? "—", status: i.status,
  }));

  return (
    <>
      <PageHeader
        title={name}
        subtitle={`${c.code} · ${c.status === "prospect" ? t("statuses.prospect") : t("statuses.customer")}`}
        breadcrumb={[{ label: t("customers.title"), href: "/app/commercial/customers" }, { label: name }]}
        actions={
          <>
            {c.status === "prospect" && (
              <Link href="/app/commercial/quotes" className="btn-outline btn-sm">{t("customers.convertToCustomer")}</Link>
            )}
            <Link href={`/app/commercial/quotes?customer=${id}`} className="btn btn-primary">+ {t("quotes.newQuote")}</Link>
            <ExportButtons
              filename={`cristalu-${c.code}`}
              rows={[
                ...quoteRows.map((r) => ({ type: t("menu.quotes"), ...r })),
                ...orderRows.map((r) => ({ type: t("menu.orders"), ...r })),
                ...invoiceRows.map((r) => ({ type: t("menu.invoices"), ...r })),
                ...paymentRows.map((r) => ({ type: t("menu.payments"), ...r })),
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card card-pad">
          <h2 className="section-title">{t("customers.identity")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.company"), c.company)}
            {fact(t("customers.contact"), c.contact_name)}
            {fact(t("customers.type"), c.type === "particulier" ? t("customers.individual") : t("customers.business"))}
            {fact(t("customers.activity"), c.activity)}
            {fact(t("customers.source"), c.source)}
            {fact(t("customers.owner"), c.owner)}
            {fact(t("customers.tags"), c.tags)}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("customers.fiscal")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact("ICE", c.ice)}
            {fact("IF", c.if_code)}
            {fact("RC", c.rc)}
            {fact("CNSS", c.cnss)}
            {fact(t("customers.paymentTerms"), c.payment_terms)}
            {fact(t("customers.creditLimit"), c.credit_limit ? money(Math.round(c.credit_limit)) : "—")}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("contact.title")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.email"), c.email)}
            {fact(t("table.phone"), c.phone)}
            {fact(t("customers.contact"), c.phone2)}
            {fact(t("table.city"), [c.zip, c.city].filter(Boolean).join(" "))}
            {fact(t("logistics.address"), c.address)}
            {fact(t("common.learnMore"), c.website)}
          </div>
        </section>
      </div>

      {c.notes && (
        <div className="card card-pad mt-4">
          <h2 className="section-title">{t("actions.notes")}</h2>
          <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-600">{c.notes}</p>
        </div>
      )}

      <h2 className="mt-6 font-display text-[16px] font-bold text-ink-900">{t("customers.history")}</h2>

      {requests.length > 0 && (
        <div className="card mt-3">
          <div className="border-b border-ink-900/8 px-4 py-2.5 text-[13px] font-bold text-ink-700">
            {t("dash.quoteRequests")} <span className="text-ink-400">({requests.length})</span>
          </div>
          <ul className="divide-y divide-ink-900/6">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="font-mono text-[12px] font-bold text-ink-900">{r.ref}</p>
                  <p className="text-[12.5px] text-ink-500">{r.product} · {r.city ?? "—"} · {date(String(r.created_at).slice(0, 10))}</p>
                </div>
                <StatusBadge status={r.status} label={t(`statuses.${r.status}`)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <HistoryTable
        title={t("menu.quotes")} count={quotes.length} href="/app/commercial/quotes"
        rows={quoteRows}
        cols={[
          { key: "number", header: t("quotes.number"), link: true },
          { key: "date", header: t("table.date"), type: "date" },
          { key: "salesperson", header: t("table.salesperson") },
          { key: "total", header: t("table.amountTTC"), type: "money", align: "end" },
          { key: "status", header: t("table.status"), type: "badge" },
        ]}
        empty={t("quotes.empty")}
      />

      <HistoryTable
        title={t("menu.orders")} count={orders.length} href="/app/commercial/orders"
        rows={orderRows}
        cols={[
          { key: "number", header: t("table.reference"), link: true },
          { key: "date", header: t("orders.orderDate"), type: "date" },
          { key: "expected", header: t("orders.expected"), type: "date" },
          { key: "total", header: t("table.amountTTC"), type: "money", align: "end" },
          { key: "status", header: t("table.status"), type: "badge" },
        ]}
        empty={t("actions.noData")}
      />

      <HistoryTable
        title={t("menu.invoices")} count={invoices.length} href="/app/finance/invoices"
        rows={invoiceRows}
        cols={[
          { key: "number", header: t("table.reference"), link: true },
          { key: "date", header: t("table.date"), type: "date" },
          { key: "due", header: t("table.dueDate"), type: "date" },
          { key: "total", header: t("table.amountTTC"), type: "money", align: "end" },
          { key: "paid", header: t("table.paid"), type: "money", align: "end" },
          { key: "balance", header: t("table.balance"), type: "money", align: "end" },
          { key: "status", header: t("table.status"), type: "badge" },
        ]}
        empty={t("actions.noData")}
      />

      <div className="card mt-3">
        <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-2.5">
          <span className="text-[13px] font-bold text-ink-700">{t("menu.payments")} <span className="text-ink-400">({payments.length})</span></span>
          <Link href="/app/finance/payments" className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">{t("common.seeAll")}</Link>
        </div>
        <DataTable
          rows={paymentRows}
          perPage={10}
          columns={[
            { key: "ref", header: t("table.reference"), className: "font-mono text-[11.5px]" },
            { key: "date", header: t("table.date"), type: "date" },
            { key: "method", header: t("table.method") },
            { key: "amount", header: t("table.amountTTC"), type: "money", align: "end" },
          ]}
          emptyLabel={t("actions.noData")}
        />
      </div>

      <HistoryTable
        title={t("customers.installationsCount")} count={installs.length} href="/app/logistics/installations"
        rows={installRows} icon={<Wrench className="h-3.5 w-3.5" />}
        cols={[
          { key: "ref", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
          { key: "appointment", header: t("logistics.appointment") },
          { key: "team", header: t("logistics.team") },
          { key: "city", header: t("table.city") },
          { key: "address", header: t("logistics.address") },
          { key: "status", header: t("table.status"), type: "badge" },
        ]}
        empty={t("actions.noData")}
      />
    </>
  );
}

function HistoryTable({
  title, count, href, rows, cols, empty, icon,
}: {
  title: string; count: number; href: string; rows: Row[]; cols: Col[]; empty: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card mt-3">
      <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink-700">
          {icon}{title} <span className="text-ink-400">({count})</span>
        </span>
        <Link href={href} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">→</Link>
      </div>
      <DataTable rows={rows} columns={cols} hrefPrefix={href} perPage={10} emptyLabel={empty} />
    </div>
  );
}
