import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { ScrollText, UserCog, Activity, FileEdit } from "lucide-react";

export default async function AuditPage({ searchParams }: { searchParams: any }) {
  await requirePerm("audit");
  const { t, num, date } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const action = String(sp.action ?? "");
  const objectType = String(sp.object ?? "");

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(COALESCE(a.user_name,'') LIKE ? OR COALESCE(a.object_label,'') LIKE ? OR COALESCE(a.ip,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (action) { where.push("a.action = ?"); params.push(action); }
  if (objectType) { where.push("a.object_type = ?"); params.push(objectType); }

  const raw = all<any>(
    `SELECT a.id, a.user_name, a.action, a.object_type, a.object_id, a.object_label,
            a.old_value, a.new_value, a.ip, a.created_at
     FROM audit_logs a WHERE ${where.join(" AND ")}
     ORDER BY a.created_at DESC, a.id DESC LIMIT 500`,
    params,
  );

  const trim = (v: any, n = 90) => {
    const s = typeof v === "string" ? v : JSON.stringify(v ?? "");
    return s.length > n ? `${s.slice(0, n)}…` : s || "—";
  };

  const rows: Row[] = raw.map((r) => ({
    id: r.id,
    created: `${date(String(r.created_at ?? "").slice(0, 10))} ${String(r.created_at ?? "").slice(11, 16)}`,
    user: r.user_name ?? "—",
    action: r.action,
    object: [r.object_type, r.object_label].filter(Boolean).join(" · ") || "—",
    old_value: trim(r.old_value),
    new_value: trim(r.new_value),
    ip: r.ip ?? "—",
  }));

  const actions = all<{ action: string }>(`SELECT DISTINCT action FROM audit_logs ORDER BY action`);
  const types = all<{ object_type: string }>(
    `SELECT DISTINCT object_type FROM audit_logs WHERE object_type IS NOT NULL ORDER BY object_type`,
  );
  const users = get<any>(`SELECT COUNT(DISTINCT user_id) c FROM audit_logs`)?.c ?? 0;
  const todayCount = get<any>(`SELECT COUNT(*) c FROM audit_logs WHERE date(created_at) = date('now')`)?.c ?? 0;

  const kpis = [
    { label: t("audit.title"), value: num(raw.length), icon: ScrollText },
    { label: t("audit.user"), value: num(users), icon: UserCog },
    { label: t("table.action"), value: num(actions.length), icon: Activity },
    { label: t("audit.date"), value: num(todayCount), icon: FileEdit },
  ];

  const cols: Col[] = [
    { key: "created", header: t("audit.date") },
    { key: "user", header: t("audit.user") },
    { key: "action", header: t("table.action"), type: "badge" },
    { key: "object", header: t("audit.object") },
    { key: "old_value", header: t("audit.old"), className: "max-w-[240px] truncate text-[11.5px] text-ink-500" },
    { key: "new_value", header: t("audit.new"), className: "max-w-[240px] truncate text-[11.5px] text-ink-500" },
    { key: "ip", header: "IP", className: "font-mono text-[11px]" },
  ];

  return (
    <>
      <PageHeader
        title={t("audit.title")}
        subtitle={t("audit.subtitle")}
        breadcrumb={[{ label: t("menu.audit") }]}
        actions={<ExportButtons filename="cristalu-audit" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder={t("audit.user")} />
        </div>
        <div>
          <label className="label">{t("table.action")}</label>
          <select className="select" name="action" defaultValue={action}>
            <option value="">{t("actions.all")}</option>
            {actions.map((a) => <option key={a.action} value={a.action}>{a.action}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("audit.object")}</label>
          <select className="select" name="object" defaultValue={objectType}>
            <option value="">{t("actions.all")}</option>
            {types.map((o) => <option key={o.object_type} value={o.object_type}>{o.object_type}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} perPage={20} emptyLabel={t("audit.empty")} />
      </div>
    </>
  );
}
