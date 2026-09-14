import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Wrench, CalendarDays, CheckCircle2, Users } from "lucide-react";

export default async function InstallationsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("installations");
  const { t, num, date } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const status = String(sp.status ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(i.ref LIKE ? OR COALESCE(c.company, c.contact_name) LIKE ? OR COALESCE(o.number,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (status) { where.push("i.status = ?"); params.push(status); }

  const raw = all<any>(
    `SELECT i.id, i.ref, i.status, i.appointment_date, i.address, i.city, i.products, i.completed_at,
            COALESCE(c.company, c.contact_name) AS customer, o.number AS order_number, tm.name AS team,
            d.number AS delivery_number
     FROM installations i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN orders o ON o.id = i.order_id
     LEFT JOIN teams tm ON tm.id = i.team_id
     LEFT JOIN deliveries d ON d.id = i.delivery_id
     WHERE ${where.join(" AND ")}
     ORDER BY i.appointment_date DESC, i.id DESC`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, ref: r.ref,
    appointment: r.appointment_date ? date(String(r.appointment_date).slice(0, 10)) : "—",
    customer: r.customer ?? "—", order: r.order_number ?? "—", team: r.team ?? "—",
    city: r.city ?? "—", products: r.products ?? "—",
    delivery: r.delivery_number ?? "—", status: r.status,
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM installations WHERE status = ?`, [s])?.c ?? 0;
  const upcoming = get<any>(
    `SELECT COUNT(*) c FROM installations WHERE status = 'planned' AND appointment_date >= date('now')`,
  )?.c ?? 0;
  const kpis = [
    { label: t("menu.installations"), value: num(rows.length), icon: Wrench },
    { label: t("statuses.planned"), value: num(upcoming), icon: CalendarDays },
    { label: t("statuses.in_progress"), value: num(count("in_progress")), icon: Users },
    { label: t("statuses.done"), value: num(count("done")), icon: CheckCircle2 },
  ];

  const cols: Col[] = [
    { key: "ref", header: t("table.reference"), link: true, className: "font-mono text-[11.5px]" },
    { key: "appointment", header: t("logistics.appointment") },
    { key: "customer", header: t("table.customer") },
    { key: "order", header: t("menu.orders") },
    { key: "team", header: t("logistics.team") },
    { key: "city", header: t("table.city") },
    { key: "products", header: t("logistics.products") },
    { key: "delivery", header: t("menu.deliveries") },
    { key: "status", header: t("table.status"), type: "badge" },
  ];

  return (
    <>
      <PageHeader
        title={t("logistics.installationsTitle")}
        subtitle={t("logistics.installationsSub")}
        breadcrumb={[{ label: t("nav.logistics"), href: "/app/logistics/installations" }, { label: t("menu.installations") }]}
        actions={
          <>
            <Link href="/app/logistics/installations/new" className="btn btn-primary">{t("logistics.newInstallation")}</Link>
            <Link href="/app/logistics/deliveries" className="btn-outline btn-sm">{t("menu.deliveries")}</Link>
            <ExportButtons filename="cristalu-installations" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="INS-2026-… / client" />
        </div>
        <div>
          <label className="label">{t("table.status")}</label>
          <select className="select" name="status" defaultValue={status}>
            <option value="">{t("actions.all")}</option>
            {["planned", "in_progress", "done"].map((s) => (
              <option key={s} value={s}>{t(`statuses.${s}`)}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/logistics/installations" perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
