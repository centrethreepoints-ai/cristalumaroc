import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { CreditCard, Wallet, Banknote, Landmark } from "lucide-react";

const METHODS = ["cash", "transfer", "cheque", "card", "other"];

export default async function PaymentsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("payments");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const method = String(sp.method ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(p.ref LIKE ? OR COALESCE(c.company, c.contact_name) LIKE ? OR COALESCE(i.number,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (method) { where.push("p.method = ?"); params.push(method); }

  const raw = all<any>(
    `SELECT p.id, p.ref, p.date, p.method, p.amount, p.reference, p.notes,
            COALESCE(c.company, c.contact_name) AS customer, i.number AS invoice, u.full_name AS user
     FROM payments p
     LEFT JOIN customers c ON c.id = p.customer_id
     LEFT JOIN invoices i ON i.id = p.invoice_id
     LEFT JOIN users u ON u.id = p.user_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.date DESC, p.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, ref: r.ref, date: (r.date ?? "").slice(0, 10), customer: r.customer ?? "—",
    invoice: r.invoice ?? "—", method: t(`finance.${r.method}`), amount: Math.round(r.amount ?? 0),
    reference: r.reference ?? "—", user: r.user ?? "—",
  }));

  const sum = (m: string) => get<any>(`SELECT COALESCE(SUM(amount),0) v FROM payments WHERE method = ?`, [m])?.v ?? 0;
  const total = get<any>(`SELECT COALESCE(SUM(amount),0) v FROM payments`)?.v ?? 0;
  const kpis = [
    { label: t("menu.payments"), value: money(Math.round(total)), icon: CreditCard },
    { label: t("finance.transfer"), value: money(Math.round(sum("transfer"))), icon: Landmark },
    { label: t("finance.cheque"), value: money(Math.round(sum("cheque"))), icon: Banknote },
    { label: t("finance.cash"), value: money(Math.round(sum("cash"))), icon: Wallet },
  ];

  const cols: Col[] = [
    { key: "ref", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "customer", header: t("table.customer") },
    { key: "invoice", header: t("menu.invoices") },
    { key: "method", header: t("table.method") },
    { key: "amount", header: t("table.amountTTC"), type: "money", align: "end" },
    { key: "reference", header: t("finance.reference") },
    { key: "user", header: t("table.user") },
  ];

  return (
    <>
      <PageHeader
        title={t("finance.paymentsTitle")}
        subtitle={t("finance.paymentsSub")}
        breadcrumb={[{ label: t("nav.finance"), href: "/app/finance/payments" }, { label: t("menu.payments") }]}
        actions={
          <>
            <Link href="/app/finance/invoices" className="btn-outline btn-sm">{t("menu.invoices")}</Link>
            <ExportButtons filename="cristalu-payments" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="PAY-2026-… / client" />
        </div>
        <div>
          <label className="label">{t("table.method")}</label>
          <select className="select" name="method" defaultValue={method}>
            <option value="">{t("actions.all")}</option>
            {METHODS.map((m) => <option key={m} value={m}>{t(`finance.${m}`)}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
