import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { StatusBadge } from "@/components/dash/StatusBadge";
import { QuoteActions } from "./QuoteActions";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function QuoteDetailPage({ params }: { params: any }) {
  await requirePerm("quotes");
  const { t, money, num, date } = await getI18n();
  const p = await params;
  const id = Number(p.id);

  const q = get<any>(
    `SELECT q.*, COALESCE(c.company, c.contact_name) AS customer_name, c.code AS customer_code,
            c.address, c.city, c.zip, c.ice, c.if_code, c.email, c.phone, c.contact_name,
            u.full_name AS salesperson, o.number AS order_number
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN users u ON u.id = q.salesperson_id
     LEFT JOIN orders o ON o.id = q.order_id
     WHERE q.id = ?`,
    [id],
  );
  if (!q) notFound();

  const lines = all<any>(
    `SELECT ql.*, p.sku, p.name AS product_name, p.unit
     FROM quote_lines ql LEFT JOIN products p ON p.id = ql.product_id
     WHERE ql.quote_id = ? ORDER BY ql.position`,
    [id],
  );

  const subHT = lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - (l.discount_pct ?? 0) / 100), 0);
  const totalVat = lines.reduce(
    (s, l) => s + l.quantity * l.unit_price * (1 - (l.discount_pct ?? 0) / 100) * ((l.vat_rate ?? 0) / 100),
    0,
  );

  const fact = (label: string, value: any) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-ink-800">{value || "—"}</p>
    </div>
  );

  return (
    <>
      <PageHeader
        title={q.number}
        subtitle={`${q.customer_name} · ${date(String(q.issue_date).slice(0, 10))}`}
        breadcrumb={[{ label: t("quotes.title"), href: "/app/commercial/quotes" }, { label: q.number }]}
        actions={<QuoteActions id={id} status={q.status} />}
      />

      {q.order_number && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
          <span className="text-[13px] font-semibold text-emerald-800">{t("quotes.converted")}</span>
          <Link href={`/app/commercial/orders?search=${q.order_number}`} className="font-mono text-[12.5px] font-bold text-emerald-900 underline">
            {q.order_number}
          </Link>
        </div>
      )}

      <div className="print-doc grid gap-4 lg:grid-cols-3">
        <section className="card card-pad">
          <h2 className="section-title">{t("table.customer")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.company"), q.customer_name)}
            {fact(t("customers.contact"), q.contact_name)}
            {fact(t("table.email"), q.email)}
            {fact(t("table.phone"), q.phone)}
            {fact("ICE", q.ice)}
            {fact("IF", q.if_code)}
            {fact(t("logistics.address"), [q.address, q.zip, q.city].filter(Boolean).join(", "))}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("quotes.quoteDocument")}</h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {fact(t("table.status"), <StatusBadge status={q.status} label={t(`statuses.${q.status}`)} />)}
            {fact(t("table.salesperson"), q.salesperson)}
            {fact(t("table.date"), date(String(q.issue_date).slice(0, 10)))}
            {fact(t("table.validity"), date(String(q.validity_date ?? "").slice(0, 10)))}
            {fact(t("table.project"), q.project)}
            {fact(t("quotes.paymentTerms"), q.payment_terms)}
            {fact(t("quotes.globalDiscount"), q.discount_pct ? `${num(q.discount_pct)} %` : "—")}
            {fact(t("quotes.fromRequest"), q.source === "web" ? t("dash.quoteRequests") : "—")}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">{t("quotes.totalTtc")}</h2>
          <dl className="mt-4 space-y-2 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-ink-500">{t("quotes.subtotal")}</dt><dd className="font-semibold tnum">{money(Math.round(subHT))}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">{t("table.vat")}</dt><dd className="font-semibold tnum">{money(Math.round(totalVat))}</dd></div>
            <div className="flex justify-between border-t border-ink-900/10 pt-2 text-[16px]">
              <dt className="font-bold text-ink-900">{t("quotes.totalTtc")}</dt>
              <dd className="font-display font-bold text-brand-600 tnum">{money(Math.round(q.total_ttc ?? subHT + totalVat))}</dd>
            </div>
          </dl>
        </section>
      </div>

      {q.notes && (
        <div className="card card-pad mt-4">
          <h2 className="section-title">{t("actions.notes")}</h2>
          <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-600">{q.notes}</p>
        </div>
      )}

      <div className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-900/8 px-4 py-3">
          <h2 className="font-display text-[15px] font-bold text-ink-900">
            {t("quotes.lines")} <span className="text-ink-400">({lines.length})</span>
          </h2>
        </div>
        <div className="table-wrap scroll-thin">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("quotes.product")}</th>
                <th className="text-end">{t("quotes.dimensions")}</th>
                <th className="text-end">{t("table.quantity")}</th>
                <th className="text-end">{t("table.unitPrice")}</th>
                <th className="text-end">{t("table.discount")}</th>
                <th className="text-end">{t("table.vat")}</th>
                <th className="text-end">{t("quotes.totalHT")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const lineHT = l.quantity * l.unit_price * (1 - (l.discount_pct ?? 0) / 100);
                return (
                  <tr key={l.id}>
                    <td className="tnum text-ink-400">{i + 1}</td>
                    <td>
                      <div className="font-semibold text-ink-900">{l.product_name ?? l.description}</div>
                      <div className="text-[11.5px] text-ink-400">
                        {[l.sku, l.description !== l.product_name ? l.description : null].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className="text-end tnum text-ink-600">
                      {l.width ? `${Math.round(l.width)} × ${Math.round(l.height)} mm` : "—"}
                    </td>
                    <td className="text-end tnum">{num(l.quantity)}</td>
                    <td className="text-end tnum">{money(Math.round(l.unit_price))}</td>
                    <td className="text-end tnum text-ink-500">{l.discount_pct ? `${num(l.discount_pct)} %` : "—"}</td>
                    <td className="text-end tnum text-ink-500">{num(l.vat_rate ?? 0)} %</td>
                    <td className="text-end font-semibold tnum">{money(Math.round(lineHT))}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-ink-50/70">
                <td colSpan={7} className="text-end text-[12.5px] font-bold uppercase tracking-wider text-ink-500">
                  {t("quotes.totalHT")}
                </td>
                <td className="text-end font-display text-[15px] font-bold text-ink-900 tnum">
                  {money(Math.round(q.total_ht ?? subHT))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
