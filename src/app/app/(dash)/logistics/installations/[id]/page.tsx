import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Camera, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { InstallationActions } from "../InstallationActions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { CheckCircle2, FileText, Package, Truck } from "lucide-react";

export default async function InstallationDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("installations");
  const { t, date } = await getI18n();

  const ins = get<any>(
    `SELECT i.*, o.number AS order_number, d.number AS delivery_number,
            COALESCE(c.company, c.contact_name) AS customer, c.phone, c.email,
            tm.name AS team, u.full_name AS team_leader
     FROM installations i
     LEFT JOIN orders o ON o.id = i.order_id
     LEFT JOIN deliveries d ON d.id = i.delivery_id
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN teams tm ON tm.id = i.team_id
     LEFT JOIN users u ON u.id = tm.leader_id
     WHERE i.id = ?`,
    [Number(id)],
  );
  if (!ins) notFound();

  const productNames = String(ins.products ?? "")
    .split(/[,;]/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const related = all<any>(
    `SELECT id, ref, status, appointment_date FROM installations
     WHERE customer_id = ? AND id <> ? ORDER BY appointment_date DESC LIMIT 6`,
    [ins.customer_id, ins.id],
  );

  return (
    <>
      <PageHeader
        title={ins.ref}
        subtitle={`${ins.customer ?? "—"} · ${ins.city ?? "—"}`}
        breadcrumb={[{ label: t("menu.installations"), href: "/app/logistics/installations" }, { label: ins.ref }]}
        actions={<InstallationActions id={ins.id} status={ins.status} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("table.status")} value={t(`statuses.${ins.status}`)} icon={CheckCircle2} />
        <StatCard label={t("logistics.appointment")} value={ins.appointment_date ? date(ins.appointment_date) : "—"} icon={CalendarDays} />
        <StatCard label={t("menu.orders")} value={ins.order_number ?? "—"} icon={FileText} />
        <StatCard label={t("logistics.team")} value={ins.team ?? "—"} sub={ins.team_leader ?? ""} icon={Users} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card card-pad">
            <h2 className="section-title">{t("logistics.beforeAfter")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(["before_photo", "after_photo"] as const).map((field) => (
                <div key={field} className="overflow-hidden rounded-xl border border-ink-900/10 bg-ink-50">
                  <div className="border-b border-ink-900/8 bg-white px-3 py-2">
                    <p className="text-[12.5px] font-bold uppercase tracking-wide text-ink-500">
                      {field === "before_photo" ? t("logistics.before") : t("logistics.after")}
                    </p>
                  </div>
                  {ins[field] ? (
                    <img src={ins[field]} alt={field === "before_photo" ? t("logistics.before") : t("logistics.after")} className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center gap-2 text-ink-300">
                      <Camera className="h-7 w-7" />
                      <p className="text-[12.5px]">{t("logistics.noPhoto")}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("logistics.installedProducts")}</h2>
            {productNames.length > 0 ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {productNames.map((p) => (
                  <li key={p} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[13px] font-medium text-ink-800">
                    <Package className="h-4 w-4 shrink-0 text-brand-600" />{p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[13px] text-ink-500">{t("actions.noData")}</p>
            )}
          </section>

          {ins.notes && (
            <section className="card card-pad">
              <h2 className="section-title">{t("table.notes")}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-600">{ins.notes}</p>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("logistics.installationInfo")}</h2>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-500">{t("table.status")}</dt><dd><StatusBadge status={ins.status} label={t(`statuses.${ins.status}`)} /></dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("logistics.appointment")}</dt><dd className="font-semibold">{ins.appointment_date ? date(ins.appointment_date) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("logistics.completedAt")}</dt><dd className="font-semibold">{ins.completed_at ? date(ins.completed_at) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">{t("logistics.team")}</dt><dd className="font-semibold">{ins.team ?? "—"}</dd></div>
              {ins.team_leader && <div className="flex justify-between"><dt className="text-ink-500">{t("logistics.teamLeader")}</dt><dd className="font-semibold">{ins.team_leader}</dd></div>}
            </dl>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("table.address")}</h2>
            <div className="mt-4 space-y-2.5 text-[13px] text-ink-800">
              {ins.customer && <p className="font-semibold">{ins.customer}</p>}
              {(ins.address || ins.city) && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
                  <span>{[ins.address, ins.city].filter(Boolean).join(", ")}</span>
                </p>
              )}
              {ins.phone && <p className="text-ink-600">{ins.phone}</p>}
              {ins.email && <p className="text-ink-600">{ins.email}</p>}
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("logistics.relatedDocs")}</h2>
            <div className="mt-4 space-y-2">
              {ins.order_id && (
                <Link href={`/app/commercial/orders/${ins.order_id}`} className="btn-outline btn-sm inline-flex me-2">
                  <FileText className="h-3.5 w-3.5" />{ins.order_number}
                </Link>
              )}
              {ins.delivery_id && (
                <Link href={`/app/logistics/deliveries/${ins.delivery_id}`} className="btn-outline btn-sm inline-flex">
                  <Truck className="h-3.5 w-3.5" />{ins.delivery_number}
                </Link>
              )}
              {!ins.order_id && !ins.delivery_id && <p className="text-[13px] text-ink-500">{t("actions.noData")}</p>}
            </div>
          </section>

          {related.length > 0 && (
            <section className="card card-pad">
              <h2 className="section-title">{t("logistics.otherInstallations")}</h2>
              <ul className="mt-3 space-y-2">
                {related.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <Link href={`/app/logistics/installations/${r.id}`} className="font-semibold text-ink-800 hover:text-brand-600">{r.ref}</Link>
                    <StatusBadge status={r.status} label={t(`statuses.${r.status}`)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
