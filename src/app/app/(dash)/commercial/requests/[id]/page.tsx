import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Mail, MapPin, Paperclip, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatusBadge, Pill } from "@/components/dash/StatusBadge";
import { RequestActions } from "../RequestActions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function RequestDetailPage({ params }: { params: any }) {
  const { id } = await params;
  await requirePerm("requests");
  const { t, num, date, money } = await getI18n();

  const r = get<any>(`SELECT * FROM quote_requests WHERE id = ?`, [Number(id)]);
  if (!r) notFound();

  const salespeople = all<any>(
    `SELECT id, full_name AS name FROM users WHERE role IN ('commercial','admin','direction') AND active = 1 ORDER BY full_name`,
  );
  const assignee = r.assignee_id ? get<any>(`SELECT full_name, email FROM users WHERE id = ?`, [r.assignee_id]) : null;
  const quote = r.quote_id ? get<any>(`SELECT id, number, status, total_ttc FROM quotes WHERE id = ?`, [r.quote_id]) : null;
  const customer = r.customer_id ? get<any>(`SELECT id, code, company, contact_name FROM customers WHERE id = ?`, [r.customer_id]) : null;

  const spec: [string, any][] = [
    [t("requests.product"), r.product],
    [t("quotes.dimensions"), r.width && r.height ? `${num(r.width)} × ${num(r.height)} mm` : "—"],
    [t("table.quantity"), `${num(r.quantity ?? 1)}`],
    [t("requests.color"), r.color || "—"],
    [t("requests.glassType"), r.glass_type || "—"],
    [t("requests.openingSystem"), r.opening_system || "—"],
    [t("requests.accessories"), r.accessories || "—"],
    [t("requests.installation"), r.installation ? t("requests.yes") : t("requests.no")],
  ];

  return (
    <>
      <PageHeader
        title={r.ref}
        subtitle={`${t("requests.fromSite")} · ${date(r.created_at)}`}
        breadcrumb={[
          { label: t("menu.commercial"), href: "/app/commercial/customers" },
          { label: t("requests.title"), href: "/app/commercial/requests" },
          { label: r.ref },
        ]}
        actions={
          <RequestActions
            id={r.id}
            status={r.status}
            assigneeId={r.assignee_id ?? null}
            quoteId={quote?.id ?? null}
            salespeople={salespeople}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card card-pad">
            <h2 className="section-title">{t("requests.spec")}</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {spec.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-ink-900/6 pb-2">
                  <dt className="text-[12.5px] text-ink-500">{label}</dt>
                  <dd className="text-end text-[13.5px] font-semibold text-ink-900">{value}</dd>
                </div>
              ))}
            </dl>
            {r.comments && (
              <div className="mt-4 rounded-lg bg-ink-50 p-3">
                <p className="label">{t("requests.comments")}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-700">{r.comments}</p>
              </div>
            )}
            {r.file_path && (
              <a
                href={r.file_path}
                target="_blank"
                rel="noreferrer"
                className="btn-outline btn-sm mt-4 inline-flex"
              >
                <Paperclip className="h-3.5 w-3.5" />{r.file_name || t("requests.attachment")}
              </a>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("customers.identity")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-[13.5px] text-ink-800">
                <User className="h-4 w-4 text-ink-300" />{r.customer_name}
              </p>
              {r.company && (
                <p className="flex items-center gap-2 text-[13.5px] text-ink-800">
                  <Building2 className="h-4 w-4 text-ink-300" />{r.company}
                </p>
              )}
              <p className="flex items-center gap-2 text-[13.5px] text-ink-800">
                <Phone className="h-4 w-4 text-ink-300" />
                <a href={`tel:${r.phone}`} className="hover:text-brand-600">{r.phone}</a>
              </p>
              <p className="flex items-center gap-2 text-[13.5px] text-ink-800">
                <Mail className="h-4 w-4 text-ink-300" />
                <a href={`mailto:${r.email}`} className="hover:text-brand-600">{r.email}</a>
              </p>
              <p className="flex items-center gap-2 text-[13.5px] text-ink-800">
                <MapPin className="h-4 w-4 text-ink-300" />{r.city || "—"}
              </p>
            </div>
            {customer && (
              <p className="mt-4 text-[12.5px] text-ink-500">
                {t("table.customer")}:{" "}
                <Link href={`/app/commercial/customers/${customer.id}`} className="font-semibold text-brand-600 hover:text-brand-700">
                  {customer.company ?? customer.contact_name} ({customer.code})
                </Link>
              </p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="section-title">{t("table.status")}</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.status")}</span>
                <StatusBadge status={r.status} label={t(`statuses.${r.status}`)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.priority")}</span>
                <Pill tone={r.priority === "high" ? "amber" : "neutral"}>{t(`production.${r.priority ?? "normal"}`)}</Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.assignee")}</span>
                <span className="text-[13px] font-semibold text-ink-900">{assignee?.full_name ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-500">{t("table.date")}</span>
                <span className="text-[13px] font-semibold text-ink-900">{date(r.created_at)}</span>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">{t("requests.followUp")}</h2>
            {quote ? (
              <div className="mt-4 space-y-2">
                <Link href={`/app/commercial/quotes/${quote.id}`} className="block font-display text-[15px] font-bold text-brand-600 hover:text-brand-700">
                  {quote.number}
                </Link>
                <div className="flex items-center justify-between text-[13px]">
                  <StatusBadge status={quote.status} label={t(`statuses.${quote.status}`)} />
                  <span className="font-semibold tnum">{money(Math.round(quote.total_ttc ?? 0))}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[13px] leading-relaxed text-ink-500">{t("requests.noQuoteYet")}</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
