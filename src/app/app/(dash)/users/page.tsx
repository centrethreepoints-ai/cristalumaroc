import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { PermissionsMatrix } from "./PermissionsMatrix";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { ROLE_LABELS, ROLES } from "@/lib/permissions";
import { UserCog, ShieldCheck, Clock, UserCheck } from "lucide-react";

export default async function UsersPage() {
  await requirePerm("users");
  const { t, num, date, locale } = await getI18n();

  const raw = all<any>(
    `SELECT u.id, u.email, u.full_name, u.role, u.job_title, u.phone, u.active, u.last_login, u.created_at,
            (SELECT COUNT(*) FROM audit_logs a WHERE a.user_id = u.id) AS actions
     FROM users u ORDER BY u.active DESC, u.role, u.full_name`,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id, full_name: r.full_name, email: r.email,
    role: ROLE_LABELS[r.role as keyof typeof ROLE_LABELS]?.[locale] ?? r.role,
    job_title: r.job_title ?? "—", phone: r.phone ?? "—",
    last_login: r.last_login ? date(String(r.last_login).slice(0, 10)) : t("users.never"),
    actions: r.actions, status: r.active ? t("statuses.active") : t("statuses.inactive"),
  }));

  const activeCount = raw.filter((r) => r.active).length;
  const kpis = [
    { label: t("menu.users"), value: num(raw.length), icon: UserCog },
    { label: t("statuses.active"), value: num(activeCount), icon: UserCheck },
    { label: t("users.role"), value: num(ROLES.length), icon: ShieldCheck },
    { label: t("users.lastLogin"), value: num(raw.filter((r) => r.last_login).length), icon: Clock },
  ];

  const cols: Col[] = [
    { key: "full_name", header: t("users.fullName"), link: true, sub: "email" },
    { key: "role", header: t("users.role") },
    { key: "job_title", header: t("users.jobTitle") },
    { key: "phone", header: t("users.phone") },
    { key: "last_login", header: t("users.lastLogin") },
    { key: "actions", header: t("menu.audit"), type: "num", align: "end" },
    { key: "status", header: t("table.status") },
  ];

  return (
    <>
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        breadcrumb={[{ label: t("menu.users") }]}
        actions={
          <>
            <Link href="/app/users/new" className="btn btn-primary">{t("users.newUser")}</Link>
            <Link href="/app/audit" className="btn-outline btn-sm">{t("menu.audit")}</Link>
            <ExportButtons filename="cristalu-users" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} hrefPrefix="/app/users" perPage={20} emptyLabel={t("actions.noData")} />
      </div>

      <PermissionsMatrix activeCount={get<any>(`SELECT COUNT(*) c FROM users WHERE active = 1`)?.c ?? 0} />
    </>
  );
}
