import { notFound } from "next/navigation";
import { CalendarDays, Clock, Mail, Phone, ShieldCheck, UserCog } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge, Pill } from "@/components/dash/StatusBadge";
import { PERMISSIONS, type Role } from "@/lib/permissions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { FileText, ScrollText, ShoppingCart, Wrench } from "lucide-react";

export default async function UserDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("users");
  const { t, num, date } = await getI18n();

  const u = get<any>(`SELECT * FROM users WHERE id = ?`, [Number(id)]);
  if (!u) notFound();

  const quotes = all<any>(
    `SELECT id, number, status, issue_date, total_ttc FROM quotes WHERE salesperson_id = ? ORDER BY issue_date DESC LIMIT 10`,
    [u.id],
  );
  const orders = all<any>(
    `SELECT id, number, status, order_date FROM orders WHERE salesperson_id = ? ORDER BY order_date DESC LIMIT 10`,
    [u.id],
  );
  const mos = all<any>(
    `SELECT id, number, status, end_date FROM manufacturing_orders WHERE assignee_id = ? ORDER BY end_date DESC LIMIT 10`,
    [u.id],
  );
  const auditRows = all<any>(
    `SELECT id, action, object_type, object_label, created_at FROM audit_logs WHERE user_id = ? ORDER BY id DESC LIMIT 15`,
    [u.id],
  );
  const stats = get<any>(
    `SELECT
       (SELECT COUNT(*) FROM quotes WHERE salesperson_id = ?) AS q_count,
       (SELECT COALESCE(SUM(total_ttc),0) FROM quotes WHERE salesperson_id = ? AND status = 'accepted') AS q_value,
       (SELECT COUNT(*) FROM orders WHERE salesperson_id = ?) AS o_count,
       (SELECT COUNT(*) FROM manufacturing_orders WHERE assignee_id = ?) AS mo_count,
       (SELECT COUNT(*) FROM audit_logs WHERE user_id = ?) AS a_count`,
    [u.id, u.id, u.id, u.id, u.id],
  );

  // Module keys are snake_case (`purchase_orders`) but menu keys are camelCase.
  const menuKey = (m: string) => m.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const perms = PERMISSIONS[u.role as Role] ?? {};
  const grantedModules = Object.entries(perms).filter(([, p]) => (p ?? []).includes("view")).map(([k]) => k);

  const quoteCols: Col[] = [
    { key: "number", header: t("quotes.number"), type: "strong", link: true },
    { key: "issue_date", header: t("table.date"), type: "date" },
    { key: "total_ttc", header: t("table.amountTTC"), type: "money", align: "end" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];
  const quoteRows: Row[] = quotes.map((q) => ({
    id: q.id, number: q.number, issue_date: q.issue_date,
    total_ttc: Math.round(q.total_ttc ?? 0), status: q.status,
  }));

  const moCols: Col[] = [
    { key: "number", header: t("table.reference"), type: "strong", link: true },
    { key: "end_date", header: t("table.dueDate"), type: "date" },
    { key: "status", header: t("table.status"), type: "badge" },
  ];
  const moRows: Row[] = mos.map((m) => ({
    id: m.id, number: m.number, end_date: (m.end_date ?? "").slice(0, 10), status: m.status,
  }));

  const auditCols: Col[] = [
    { key: "action", header: t("table.action"), type: "badge" },
    { key: "object_type", header: t("table.object") },
    { key: "object_label", header: t("table.reference") },
    { key: "created_at", header: t("table.date"), type: "date" },
  ];
  const auditData: Row[] = auditRows.map((a) => ({
    id: a.id, action: a.action, object_type: a.object_type,
    object_label: a.object_label ?? "—", created_at: (a.created_at ?? "").slice(0, 16).replace("T", " "),
  }));

  return (
    <>
      <PageHeader
        title={u.full_name}
        subtitle={`${t(`users.role_${u.role}`)} · ${u.job_title ?? "—"}`}
        breadcrumb={[{ label: t("menu.users"), href: "/app/users" }, { label: u.full_name }]}
        actions={<Link href={`/app/users/${u.id}/edit`} className="btn-outline btn-sm">{t("actions.edit")}</Link>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("menu.quotes")} value={num(stats?.q_count ?? 0)} sub={t("kpi.acceptedQuotes") + " " + num(Math.round(stats?.q_value ?? 0))} icon={FileText} />
        <StatCard label={t("menu.orders")} value={num(stats?.o_count ?? 0)} icon={ShoppingCart} />
        <StatCard label={t("menu.manufacturing")} value={num(stats?.mo_count ?? 0)} icon={Wrench} />
        <StatCard label={t("menu.audit")} value={num(stats?.a_count ?? 0)} sub={t("audit.actionsLogged")} icon={ScrollText} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {quoteRows.length > 0 && (
            <section className="card overflow-hidden">
              <div className="border-b border-ink-900/8 px-4 py-3">
                <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.quotes")}</h2>
              </div>
              <DataTable rows={quoteRows} columns={quoteCols} hrefPrefix="/app/commercial/quotes" dense />
            </section>
          )}

          {moRows.length > 0 && (
            <section className="card overflow-hidden">
              <div className="border-b border-ink-900/8 px-4 py-3">
                <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.manufacturing")}</h2>
              </div>
              <DataTable rows={moRows} columns={moCols} hrefPrefix="/app/production/manufacturing" dense />
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.audit")}</h2>
            </div>
            <DataTable rows={auditData} columns={auditCols} dense emptyLabel={t("actions.noData")} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("customers.identity")}</h2>
            <div className="mt-4 space-y-2.5 text-[13px] text-ink-800">
              <p className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-extrabold text-white" style={{ background: u.color ?? "#E30613" }}>
                  {String(u.full_name ?? "?").split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                </span>
                <span className="font-semibold">{u.full_name}</span>
              </p>
              {u.job_title && <p className="flex items-center gap-2"><UserCog className="h-4 w-4 text-ink-300" />{u.job_title}</p>}
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-ink-300" /><a href={`mailto:${u.email}`} className="hover:text-brand-600">{u.email}</a></p>
              {u.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-ink-300" />{u.phone}</p>}
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("table.status")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{t("table.status")}</dt>
                <dd><StatusBadge status={u.active ? "active" : "inactive"} label={t(`statuses.${u.active ? "active" : "inactive"}`)} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{t("users.role")}</dt>
                <dd><Pill tone="blue">{t(`users.role_${u.role}`)}</Pill></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{t("users.lastLogin")}</dt>
                <dd className="font-semibold">{u.last_login ? date(u.last_login) : "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{t("users.createdOn")}</dt>
                <dd className="font-semibold">{date(u.created_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("users.accessRights")}</h2>
            <p className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-500">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              {num(grantedModules.length)} {t("users.modulesGranted")}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {grantedModules.map((m) => (
                <Pill key={m} tone="neutral">{t(`menu.${menuKey(m)}`)}</Pill>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
