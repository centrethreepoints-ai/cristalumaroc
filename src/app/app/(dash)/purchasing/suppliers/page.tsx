import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Truck, FileInput, Star, MapPin } from "lucide-react";

export default async function SuppliersPage({ searchParams }: { searchParams: any }) {
  await requirePerm("suppliers");
  const { t, money, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const cat = String(sp.cat ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(s.name LIKE ? OR COALESCE(s.contact_name,'') LIKE ? OR COALESCE(s.email,'') LIKE ? OR COALESCE(s.code,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (cat) { where.push("s.category = ?"); params.push(cat); }

  const raw = all<any>(
    `SELECT s.*,
            (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id) AS pos,
            COALESCE((SELECT SUM(po.total_ttc) FROM purchase_orders po WHERE po.supplier_id = s.id), 0) AS spend,
            (SELECT COALESCE(SUM(po.total_ttc),0) FROM purchase_orders po
              WHERE po.supplier_id = s.id AND po.status IN ('confirmed','partial')) AS open_amount
     FROM suppliers s
     WHERE ${where.join(" AND ")}
     ORDER BY spend DESC, s.name COLLATE NOCASE`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, code: r.code ?? "—", name: r.name, category: r.category ?? "—",
    contact: [r.contact_name, r.email].filter(Boolean).join(" · ") || "—",
    phone: r.phone ?? "—", city: r.city ?? "—", ice: r.ice ?? "—",
    rating: "★".repeat(Math.max(0, Math.min(5, r.rating ?? 0))),
    pos: r.pos, spend: Math.round(r.spend), open_amount: Math.round(r.open_amount),
    payment_terms: r.payment_terms ?? "—",
  }));

  const categories = all<{ category: string }>(
    `SELECT DISTINCT category FROM suppliers WHERE category IS NOT NULL AND category != '' ORDER BY category`,
  );
  const totalSpend = raw.reduce((s, r) => s + r.spend, 0);
  const kpis = [
    { label: t("menu.suppliers"), value: num(raw.length), icon: Truck },
    { label: t("purchasing.category"), value: num(categories.length), icon: MapPin },
    { label: t("reports.purchases"), value: money(Math.round(totalSpend)), icon: FileInput },
    { label: t("purchasing.rating"), value: `${num(Math.round(raw.reduce((s, r) => s + (r.rating ?? 0), 0) / Math.max(1, raw.length) * 10) / 10)} / 5`, icon: Star },
  ];

  const cols: Col[] = [
    { key: "code", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "name", header: t("table.supplier"), sub: "category" },
    { key: "contact", header: t("table.email") },
    { key: "phone", header: t("table.phone") },
    { key: "city", header: t("table.city") },
    { key: "ice", header: "ICE", className: "font-mono text-[11.5px]" },
    { key: "rating", header: t("purchasing.rating") },
    { key: "pos", header: t("menu.purchaseOrders"), type: "num", align: "end" },
    { key: "open_amount", header: t("purchasing.pending"), type: "money", align: "end" },
    { key: "spend", header: t("reports.purchases"), type: "money", align: "end" },
  ];

  return (
    <>
      <PageHeader
        title={t("menu.suppliers")}
        subtitle={t("purchasing.subtitle")}
        breadcrumb={[{ label: t("nav.purchasing"), href: "/app/purchasing/suppliers" }, { label: t("menu.suppliers") }]}
        actions={
          <>
            <Link href="/app/purchasing/suppliers/new" className="btn btn-primary">{t("suppliers.newSupplier")}</Link>
            <Link href="/app/purchasing/orders" className="btn-outline btn-sm">{t("menu.purchaseOrders")}</Link>
            <ExportButtons filename="cristalu-suppliers" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="Nom / contact / ICE" />
        </div>
        <div>
          <label className="label">{t("purchasing.category")}</label>
          <select className="select" name="cat" defaultValue={cat}>
            <option value="">{t("actions.all")}</option>
            {categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/purchasing/suppliers" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
