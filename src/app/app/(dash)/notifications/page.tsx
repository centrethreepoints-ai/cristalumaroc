import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { ExportButtons } from "@/components/dash/ExportButtons";
import { StatCard } from "@/components/dash/StatCard";
import { MarkAllReadButton } from "./MarkAllReadButton";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Bell, BellOff, TriangleAlert, CheckCircle2 } from "lucide-react";

const LEVELS = ["info", "success", "warning", "critical"];

export default async function NotificationsPage({ searchParams }: { searchParams: any }) {
  await requirePerm("notifications");
  const { t, num, date } = await getI18n();
  const sp = await searchParams;
  const level = String(sp.level ?? "");
  const unreadOnly = sp.unread === "1";

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (level) { where.push("n.level = ?"); params.push(level); }
  if (unreadOnly) where.push("n.read = 0");

  const raw = all<any>(
    `SELECT n.id, n.type, n.level, n.title, n.body, n.link, n.read, n.created_at
     FROM notifications n WHERE ${where.join(" AND ")}
     ORDER BY n.created_at DESC, n.id DESC LIMIT 400`,
    params,
  );

  const rows: Row[] = raw.map((r) => ({
    id: r.id,
    type: t(`notificationsTypes.${r.type}`),
    level: r.level,
    title: r.title,
    body: r.body ?? "—",
    created: date(String(r.created_at ?? "").slice(0, 10)),
    state: r.read ? t("statuses.closed") : t("menu.notifications"),
  }));

  const total = get<any>(`SELECT COUNT(*) c FROM notifications`)?.c ?? 0;
  const unread = get<any>(`SELECT COUNT(*) c FROM notifications WHERE read = 0`)?.c ?? 0;
  const critical = get<any>(`SELECT COUNT(*) c FROM notifications WHERE level IN ('warning','critical') AND read = 0`)?.c ?? 0;

  const kpis = [
    { label: t("menu.notifications"), value: num(total), icon: Bell },
    { label: t("dash.alerts"), value: num(unread), icon: BellOff },
    { label: t("statuses.warning"), value: num(critical), icon: TriangleAlert },
    { label: t("statuses.success"), value: num(get<any>(`SELECT COUNT(*) c FROM notifications WHERE level = 'success'`)?.c ?? 0), icon: CheckCircle2 },
  ];

  const cols: Col[] = [
    { key: "title", header: t("table.title"), link: true },
    { key: "type", header: t("table.type"), type: "badge" },
    { key: "level", header: t("table.level") },
    { key: "body", header: t("actions.notes") },
    { key: "created", header: t("table.date") },
    { key: "state", header: t("table.status") },
  ];

  return (
    <>
      <PageHeader
        title={t("menu.notifications")}
        subtitle={t("dash.quoteRequestsSub")}
        breadcrumb={[{ label: t("menu.notifications") }]}
        tabs={[
          { label: t("actions.all"), href: "/app/notifications", active: !level && !unreadOnly, count: total },
          { label: t("dash.alerts"), href: "/app/notifications?unread=1", active: unreadOnly, count: unread },
          ...LEVELS.map((l) => ({
            label: l, href: `/app/notifications?level=${l}`, active: level === l,
            count: get<any>(`SELECT COUNT(*) c FROM notifications WHERE level = ?`, [l])?.c ?? 0,
          })),
        ]}
        actions={
          <>
            <MarkAllReadButton />
            <ExportButtons filename="cristalu-notifications" rows={rows} columns={cols.map((c) => ({ key: c.key, label: c.header }))} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <div className="card mt-4">
        <DataTable rows={rows} columns={cols} perPage={20} emptyLabel={t("actions.noData")} />
      </div>
    </>
  );
}
