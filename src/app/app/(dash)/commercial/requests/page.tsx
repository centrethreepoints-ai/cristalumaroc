import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { CheckCircle2, Clock, Inbox, Send } from "lucide-react";

const STATUSES = ["new", "processing", "quoted", "converted", "closed"];
const CITIES = ["Casablanca", "Rabat", "Salé", "Kénitra", "Marrakech", "Tanger", "Fès", "Meknès", "Agadir", "Oujda", "Tétouan", "El Jadida"];

/** Public quote-request queue — every /devis submission lands here. */
export default async function RequestsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("requests");
  const { t, num, date } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = String(sp.status ?? "");
  const city = String(sp.city ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(r.ref LIKE ? OR r.customer_name LIKE ? OR COALESCE(r.company,'') LIKE ? OR r.product LIKE ? OR COALESCE(r.email,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (status) { where.push("r.status = ?"); params.push(status); }
  if (city) { where.push("r.city = ?"); params.push(city); }

  const raw = all<any>(
    `SELECT r.id, r.ref, r.customer_name, r.company, r.phone, r.email, r.city, r.product,
            r.quantity, r.width, r.height, r.status, r.priority, r.created_at,
            u.full_name AS assignee, qt.number AS quote_number
     FROM quote_requests r
     LEFT JOIN users u ON u.id = r.assignee_id
     LEFT JOIN quotes qt ON qt.id = r.quote_id
     WHERE ${where.join(" AND ")}
     ORDER BY CASE r.status WHEN 'new' THEN 0 WHEN 'processing' THEN 1 ELSE 2 END,
              r.created_at DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id,
    ref: r.ref,
    customer: r.company ? `${r.company} — ${r.customer_name}` : r.customer_name,
    contact: r.phone || r.email || "—",
    city: r.city ?? "—",
    product: r.product,
    dimensions: r.width && r.height ? `${r.width} × ${r.height}` : "—",
    quantity: Number(r.quantity ?? 1),
    priority: r.priority ?? "normal",
    assignee: r.assignee ?? "—",
    created_at: (r.created_at ?? "").slice(0, 10),
    status: r.status,
    quote: r.quote_number ?? "—",
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM quote_requests WHERE status = ?`, [s])?.c ?? 0;
  const total = get<any>(`SELECT COUNT(*) c FROM quote_requests`)?.c ?? 0;
  const quoted = count("quoted") + count("converted");

  const kpis = [
    { label: t("kpi.pendingQuotes"), value: num(count("new")), sub: t("requests.needTriaging"), icon: Inbox },
    { label: t("statuses.processing"), value: num(count("processing")), sub: t("requests.inProgress"), icon: Clock },
    { label: t("requests.quoted"), value: num(quoted), sub: t("requests.quotesGenerated"), icon: Send },
    {
      label: t("kpi.conversionRate"),
      value: `${num(Math.round((count("converted") / Math.max(1, total)) * 100))} %`,
      sub: `${num(count("converted"))} / ${num(total)}`,
      icon: CheckCircle2,
    },
  ];

  const cols: Col[] = [
    { key: "ref", header: t("table.reference"), link: true },
    { key: "customer", header: t("table.customer") },
    { key: "contact", header: t("table.contact"), type: "muted" },
    { key: "city", header: t("table.city") },
    { key: "product", header: t("table.product") },
    { key: "dimensions", header: t("quotes.dimensions"), align: "end" },
    { key: "quantity", header: t("table.quantity"), type: "num", align: "end" },
    { key: "priority", header: t("table.priority"), type: "badge" },
    { key: "assignee", header: t("table.assignee"), type: "muted" },
    { key: "created_at", header: t("table.date"), type: "date" },
    { key: "status", header: t("table.status"), type: "badge" },
    { key: "quote", header: t("quotes.number"), type: "muted" },
  ];

  return (
    <>
      <PageHeader
        title={t("requests.title")}
        subtitle={t("requests.subtitle")}
        breadcrumb={[{ label: t("menu.commercial"), href: "/app/commercial/customers" }, { label: t("requests.title") }]}
        actions={<ExportButtons filename="cristalu-quote-requests" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="DEM-2026-…" />
        </div>
        <div>
          <label className="label">{t("table.status")}</label>
          <select className="select" name="status" defaultValue={status}>
            <option value="">{t("actions.all")}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("table.city")}</label>
          <select className="select" name="city" defaultValue={city}>
            <option value="">{t("actions.all")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
        {status && <Link href="/app/commercial/requests" className="btn-outline btn-sm">{t("actions.reset")}</Link>}
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/commercial/requests" emptyLabel={t("requests.empty")} />
      </div>
    </>
  );
}
