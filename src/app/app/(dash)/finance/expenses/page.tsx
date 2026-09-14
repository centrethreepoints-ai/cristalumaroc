import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Wallet, TrendingDown, Receipt, CalendarRange } from "lucide-react";

export default async function ExpensesPage({ searchParams }: { searchParams: any }) {
  await requirePerm("expenses");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const cat = String(sp.cat ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(e.ref LIKE ? OR COALESCE(e.description,'') LIKE ? OR COALESCE(s.name,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (cat) { where.push("e.category = ?"); params.push(cat); }

  const raw = all<any>(
    `SELECT e.id, e.ref, e.date, e.category, e.description, e.amount, e.vat, e.ttc, e.status, e.payment_method,
            s.name AS supplier
     FROM expenses e LEFT JOIN suppliers s ON s.id = e.supplier_id
     WHERE ${where.join(" AND ")}
     ORDER BY e.date DESC, e.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, ref: r.ref, date: (r.date ?? "").slice(0, 10), category: r.category ?? "—",
    description: r.description ?? "—", supplier: r.supplier ?? "—",
    amount: Math.round(r.amount ?? 0), vat: Math.round(r.vat ?? 0), ttc: Math.round(r.ttc ?? 0),
    method: r.payment_method ? t(`finance.${r.payment_method}`) : "—", status: r.status,
  }));

  const categories = all<{ category: string }>(
    `SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL AND category != '' ORDER BY category`,
  );
  const total = get<any>(`SELECT COALESCE(SUM(ttc),0) v FROM expenses`)?.v ?? 0;
  const month = get<any>(
    `SELECT COALESCE(SUM(ttc),0) v FROM expenses WHERE strftime('%Y-%m', date) = strftime('%Y-%m','now')`,
  )?.v ?? 0;
  const kpis = [
    { label: t("menu.expenses"), value: num(rows.length), icon: Receipt },
    { label: t("reports.expenses"), value: money(Math.round(total)), icon: TrendingDown },
    { label: t("kpi.monthlyRevenue"), value: money(Math.round(month)), icon: CalendarRange },
    { label: t("purchasing.category"), value: num(categories.length), icon: Wallet },
  ];

  const cols: Col[] = [
    { key: "ref", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "date", header: t("table.date"), type: "date" },
    { key: "category", header: t("table.category") },
    { key: "description", header: t("table.description") },
    { key: "supplier", header: t("table.supplier") },
    { key: "amount", header: t("table.amountHT"), type: "money", align: "end" },
    { key: "vat", header: t("table.vat"), type: "money", align: "end" },
    { key: "ttc", header: t("table.amountTTC"), type: "money", align: "end" },
    { key: "method", header: t("table.method") },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("finance.expensesTitle")}
        subtitle={t("finance.expensesSub")}
        breadcrumb={[{ label: t("nav.finance"), href: "/app/finance/expenses" }, { label: t("menu.expenses") }]}
        actions={
          <>
            <Link href="/app/finance/expenses/new" className="btn btn-primary">{t("finance.newExpense")}</Link>
            <ExportButtons filename="cristalu-expenses" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="DEP-2026-… / description" />
        </div>
        <div>
          <label className="label">{t("table.category")}</label>
          <select className="select" name="cat" defaultValue={cat}>
            <option value="">{t("actions.all")}</option>
            {categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
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
