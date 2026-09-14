import Link from "next/link";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatCard } from "@/components/dash/StatCard";
import { KanbanBoard, type Card } from "./KanbanBoard";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { KanbanSquare, TriangleAlert, Clock, CheckCircle2 } from "lucide-react";

const COLUMNS = ["to_prepare", "cutting", "machining", "assembly", "glazing", "quality_control", "completed"];

export default async function KanbanPage({ searchParams }: { searchParams: any }) {
  await requirePerm("kanban");
  const { t, num } = await getI18n();
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (q) {
    where.push(`(m.number LIKE ? OR COALESCE(c.company, c.contact_name) LIKE ? OR COALESCE(p.name,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const raw = all<any>(
    `SELECT m.id, m.number, m.status, m.priority, m.quantity, m.end_date,
            COALESCE(c.company, c.contact_name) AS customer,
            COALESCE(p.name, m.description, '—') AS product, u.full_name AS assignee,
            CAST(julianday(m.end_date) - julianday('now') AS INTEGER) AS days_left
     FROM manufacturing_orders m
     LEFT JOIN customers c ON c.id = m.customer_id
     LEFT JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.assignee_id
     WHERE ${where.join(" AND ")}
     ORDER BY m.priority DESC, m.end_date IS NULL, m.end_date ASC
     LIMIT 400`,
    params,
  );

  const cards: Card[] = raw.map((r) => ({
    id: r.id,
    number: r.number,
    customer: r.customer ?? "—",
    product: r.product ?? "—",
    quantity: Math.round(r.quantity),
    assignee: r.assignee ?? "",
    end_date: (r.end_date ?? "").slice(0, 10),
    days_left: r.days_left ?? 0,
    priority: r.priority ?? "normal",
    status: r.status,
  }));

  const count = (s: string) => get<any>(`SELECT COUNT(*) c FROM manufacturing_orders WHERE status = ?`, [s])?.c ?? 0;
  const late = get<any>(
    `SELECT COUNT(*) c FROM manufacturing_orders WHERE status != 'completed'
      AND end_date IS NOT NULL AND end_date < date('now')`,
  )?.c ?? 0;

  const kpis = [
    { label: t("production.kanbanTitle"), value: num(cards.length), icon: KanbanSquare },
    { label: t("production.overdueRisk"), value: num(late), icon: TriangleAlert },
    { label: t("statuses.quality_control"), value: num(count("quality_control")), icon: Clock },
    { label: t("production.completedCount"), value: num(count("completed")), icon: CheckCircle2 },
  ];

  return (
    <>
      <PageHeader
        title={t("production.kanbanTitle")}
        subtitle={t("production.kanbanSub")}
        breadcrumb={[{ label: t("nav.production"), href: "/app/production/kanban" }, { label: t("menu.kanban") }]}
        actions={
          <>
            <Link href="/app/production/manufacturing" className="btn-outline btn-sm">{t("menu.manufacturing")}</Link>
            <Link href="/app/production/planning" className="btn-outline btn-sm">{t("menu.planning")}</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />)}
      </div>

      <form className="card card-pad mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="label">{t("actions.search")}</label>
          <input className="input" name="q" defaultValue={q} placeholder="OF-2026-… / client" />
        </div>
        <button className="btn btn-secondary">{t("actions.filter")}</button>
      </form>

      <div className="mt-4">
        <KanbanBoard cards={cards} />
      </div>

      <p className="mt-3 text-[12px] text-ink-400">
        {COLUMNS.map((c) => t(`statuses.${c}`)).join(" → ")}
      </p>
    </>
  );
}
