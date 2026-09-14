import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Truck, User } from "lucide-react";
import { PageHeader } from "@/components/dash/PageHeader";
import { DataTable, type Col, type Row } from "@/components/dash/DataTable";
import { StatCard } from "@/components/dash/StatCard";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { DeliveryActions } from "../DeliveryActions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";
import { Boxes, FileText, Package, ShoppingCart } from "lucide-react";

export default async function DeliveryDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("deliveries");
  const { t, num, date } = await getI18n();

  const d = get<any>(
    `SELECT d.*, o.number AS order_number, o.status AS order_status,
            COALESCE(c.company, c.contact_name) AS customer, c.phone AS customer_phone, c.email AS customer_email,
            u.full_name AS driver
     FROM deliveries d
     LEFT JOIN orders o ON o.id = d.order_id
     LEFT JOIN customers c ON c.id = d.customer_id
     LEFT JOIN users u ON u.id = d.driver_id
     WHERE d.id = ?`,
    [Number(id)],
  );
  if (!d) notFound();

  const lines = all<any>(
    `SELECT dl.id, dl.description, dl.quantity, p.sku, p.name, p.unit
     FROM delivery_lines dl LEFT JOIN products p ON p.id = dl.product_id
     WHERE dl.delivery_id = ? ORDER BY dl.id`,
    [d.id],
  );

  const installations = all<any>(
    `SELECT id, ref, appointment_date, status, city FROM installations WHERE delivery_id = ? ORDER BY appointment_date DESC`,
    [d.id],
  );

  const totalQty = lines.reduce((s, l) => s + (l.quantity ?? 0), 0);

  const lineCols: Col[] = [
    { key: "sku", header: t("table.sku"), type: "strong" },
    { key: "name", header: t("table.name") },
    { key: "description", header: t("table.description"), type: "muted" },
    { key: "quantity", header: t("table.quantity"), type: "num", align: "end" },
    { key: "unit", header: t("table.unit") },
  ];
  const lineRows: Row[] = lines.map((l) => ({
    id: l.id, sku: l.sku ?? "—", name: l.name ?? "—",
    description: l.description ?? "—", quantity: l.quantity, unit: l.unit ?? "U",
  }));

  const insCols: Col[] = [
    { key: "ref", header: t("table.reference"), type: "strong", link: true },
    { key: "appointment_date", header: t("logistics.appointment"), type: "date" },
    { key: "city", header: t("table.city") },
    { key: "status", header: t("table.status"), type: "badge" },
  ];
  const insRows: Row[] = installations.map((i) => ({
    id: i.id, ref: i.ref, appointment_date: (i.appointment_date ?? "").slice(0, 10),
    city: i.city ?? "—", status: i.status,
  }));

  const STEPS = ["preparing", "ready", "shipped", "delivered"];
  const stepIndex = STEPS.indexOf(d.status);

  return (
    <>
      <PageHeader
        title={d.number}
        subtitle={`${t("table.customer")}: ${d.customer ?? "—"} · ${date(d.date)}`}
        breadcrumb={[{ label: t("menu.deliveries"), href: "/app/logistics/deliveries" }, { label: d.number }]}
        actions={<DeliveryActions id={d.id} status={d.status} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("table.status")} value={t(`statuses.${d.status}`)} icon={Truck} />
        <StatCard label={t("table.quantity")} value={num(Math.round(totalQty * 100) / 100)} sub={`${lines.length} ${t("logistics.lines").toLowerCase()}`} icon={Boxes} />
        <StatCard label={t("menu.orders")} value={d.order_number ?? "—"} sub={d.order_status ? t(`statuses.${d.order_status}`) : "—"} icon={ShoppingCart} />
        <StatCard label={t("menu.installations")} value={num(installations.length)} sub={t("logistics.scheduled")} icon={CalendarDays} />
      </div>

      <section className="card card-pad mt-4">
        <h2 className="section-title">{t("logistics.progress")}</h2>
        <ol className="mt-4 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={
                  "rounded-full px-3 py-1.5 text-[12.5px] font-bold ring-1 " +
                  (i < stepIndex
                    ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20"
                    : i === stepIndex
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-ink-900/6 text-ink-400 ring-ink-900/10")
                }
              >
                {t(`statuses.${s}`)}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-6 bg-ink-900/12" />}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card overflow-hidden">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-[15px] font-bold text-ink-900">{t("logistics.lines")}</h2>
            </div>
            <DataTable rows={lineRows} columns={lineCols} dense emptyLabel={t("actions.noData")} />
          </section>

          {installations.length > 0 && (
            <section className="card overflow-hidden">
              <div className="border-b border-ink-900/8 px-4 py-3">
                <h2 className="font-display text-[15px] font-bold text-ink-900">{t("menu.installations")}</h2>
              </div>
              <DataTable rows={insRows} columns={insCols} hrefPrefix="/app/logistics/installations" dense emptyLabel={t("actions.noData")} />
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("logistics.deliveryInfo")}</h2>
            <div className="mt-4 space-y-2.5 text-[13px] text-ink-800">
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-ink-300" />{date(d.date)}</p>
              {d.driver && <p className="flex items-center gap-2"><User className="h-4 w-4 text-ink-300" />{d.driver}</p>}
              {d.vehicle && <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-ink-300" />{d.vehicle}</p>}
              {(d.address || d.city) && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
                  <span>{[d.address, d.city].filter(Boolean).join(", ")}</span>
                </p>
              )}
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("table.customer")}</h2>
            <div className="mt-4 space-y-1.5 text-[13px]">
              {d.customer_id ? (
                <Link href={`/app/commercial/customers/${d.customer_id}`} className="block font-semibold text-brand-600 hover:text-brand-700">
                  {d.customer}
                </Link>
              ) : (
                <p className="text-ink-500">—</p>
              )}
              {d.customer_phone && <p className="text-ink-600">{d.customer_phone}</p>}
              {d.customer_email && <p className="text-ink-600">{d.customer_email}</p>}
            </div>
            {d.order_id && (
              <Link href={`/app/commercial/orders/${d.order_id}`} className="btn-outline btn-sm mt-4 inline-flex">
                <FileText className="h-3.5 w-3.5" />{d.order_number}
              </Link>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("table.status")}</h2>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge status={d.status} label={t(`statuses.${d.status}`)} />
              <span className="text-[12.5px] text-ink-500">{date(d.created_at)}</span>
            </div>
          </section>

          {d.notes && (
            <section className="card card-pad">
              <h2 className="section-title">{t("table.notes")}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-600">{d.notes}</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
