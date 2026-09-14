import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Plus, Users } from "lucide-react";

export async function CustomerList({ status, searchParams }: { status: "customer" | "prospect"; searchParams: any }) {
  await requirePerm("customers");
  const { t, money, num, pick } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const city = String(sp.city ?? "");
  const type = String(sp.type ?? "");
  const isProspect = status === "prospect";

  const where: string[] = ["c.status = ?"];
  const params: any[] = [status];
  if (q) {
    where.push(`(c.company LIKE ? OR c.contact_name LIKE ? OR c.email LIKE ? OR c.code LIKE ? OR c.ice LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (city) { where.push("c.city = ?"); params.push(city); }
  if (type) { where.push("c.type = ?"); params.push(type); }

  const raw = all<any>(
    `SELECT c.id, c.code, c.company, c.contact_name, c.email, c.phone, c.city, c.ice, c.type,
            u.full_name AS owner,
            (SELECT COUNT(*) FROM quotes q WHERE q.customer_id = c.id) AS quotes,
            (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders,
            (SELECT COALESCE(SUM(total_ht),0) FROM invoices i WHERE i.customer_id = c.id) AS revenue
     FROM customers c LEFT JOIN users u ON u.id = c.owner_id
     WHERE ${where.join(" AND ")}
     ORDER BY revenue DESC, c.company COLLATE NOCASE`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id,
    name: pick(r.company, r.contact_name) ?? r.code,
    sub: [r.code, r.contact_name].filter(Boolean).join(" · "),
    contact: [r.email, r.phone].filter(Boolean).join("  ·  ") || "—",
    city: r.city ?? "—",
    ice: r.ice ?? "—",
    owner: r.owner ?? "—",
    quotes: r.quotes,
    orders: r.orders,
    revenue: Math.round(r.revenue),
  }));

  const cities = all<{ city: string }>(`SELECT DISTINCT city FROM customers WHERE city IS NOT NULL ORDER BY city`);
  const totalRevenue = raw.reduce((s, r) => s + r.revenue, 0);
  const kpis = [
    { label: isProspect ? t("customers.prospectsTitle") : t("customers.title"), value: num(rows.length) },
    { label: t("table.ice"), value: num(raw.filter((r) => r.ice).length) },
    { label: t("customers.quotesCount"), value: num(raw.reduce((s, r) => s + r.quotes, 0)) },
    { label: t("customers.totalRevenue"), value: money(Math.round(totalRevenue)) },
  ];

  const cols: Col[] = [
    { key: "name", header: t("table.company"), link: true, sub: "sub" },
    { key: "contact", header: t("customers.contact") },
    { key: "city", header: t("table.city") },
    { key: "ice", header: "ICE", className: "font-mono text-[11.5px]" },
    { key: "owner", header: t("customers.owner") },
    { key: "quotes", header: t("menu.quotes"), type: "num", align: "end" },
    { key: "orders", header: t("menu.orders"), type: "num", align: "end" },
    { key: "revenue", header: t("customers.totalRevenue"), type: "money", align: "end" },
  ];

  const base = isProspect ? "/app/commercial/prospects" : "/app/commercial/customers";

  return (
    <>
      <PageHeader
        title={isProspect ? t("customers.prospectsTitle") : t("customers.title")}
        subtitle={t("customers.subtitle")}
        breadcrumb={[{ label: t("nav.commercial"), href: "/app/commercial/customers" },
          { label: isProspect ? t("customers.prospectsTitle") : t("customers.title") }]}
        tabs={[
          { label: t("customers.title"), href: "/app/commercial/customers", active: !isProspect,
            count: get<any>(`SELECT COUNT(*) c FROM customers WHERE status='customer'`)?.c ?? 0 },
          { label: t("customers.prospectsTitle"), href: "/app/commercial/prospects", active: isProspect,
            count: get<any>(`SELECT COUNT(*) c FROM customers WHERE status='prospect'`)?.c ?? 0 },
        ]}
        actions={
          <>
            <Link href={`${base}/new`} className="btn btn-primary"><Plus className="h-4 w-4" />{t("actions.new")}</Link>
            <ExportButtons filename={`cristalu-${status}`} rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={Users} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[200px] flex-1">
          <label className="label">{t("common.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder={t("common.search")} />
        </div>
        <div>
          <label className="label">{t("table.city")}</label>
          <select className="select" name="city" defaultValue={city}>
            <option value="">{t("actions.all")}</option>
            {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("customers.type")}</label>
          <select className="select" name="type" defaultValue={type}>
            <option value="">{t("actions.all")}</option>
            <option value="entreprise">{t("customers.business")}</option>
            <option value="particulier">{t("customers.individual")}</option>
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix={base} emptyLabel={t("actions.noResults")} />
      </div>
    </>
  );
}
