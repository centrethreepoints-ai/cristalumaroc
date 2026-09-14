import { PageHeader } from "@/components/dash/PageHeader";
import { QuoteForm, type CustomerOpt, type ProductOpt } from "../QuoteForm";
import { all, peekSeq } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewQuotePage() {
  await requirePerm("quotes", "create");
  const { t, pick } = await getI18n();

  const products: ProductOpt[] = all<any>(
    `SELECT id, sku, name, selling_price AS price, vat_rate AS vat, unit
     FROM products WHERE kind = 'finished' AND status = 'active' ORDER BY sku`,
  ).map((p) => ({ id: p.id, sku: p.sku, name: p.name, price: p.price, vat: p.vat, unit: p.unit }));

  const customers: CustomerOpt[] = all<any>(
    `SELECT id, code, company, contact_name FROM customers ORDER BY company COLLATE NOCASE, contact_name`,
  ).map((c) => ({ id: c.id, label: `${pick(c.company, c.contact_name) ?? c.code} (${c.code})` }));

  const salespeople = all<any>(
    `SELECT id, full_name AS name FROM users WHERE role IN ('commercial','admin','direction') AND active = 1 ORDER BY full_name`,
  );

  const today = new Date().toISOString().slice(0, 10);
  const validity = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  const next = `DEV-${year}-${String(peekSeq("DEV", year) + 1).padStart(4, "0")}`;

  return (
    <>
      <PageHeader
        title={t("quotes.newQuote")}
        subtitle={`${t("quotes.number")} ${next}`}
        breadcrumb={[{ label: t("quotes.title"), href: "/app/commercial/quotes" }, { label: t("actions.new") }]}
      />
      <QuoteForm
        products={products}
        customers={customers}
        salespeople={salespeople}
        today={today}
        validity={validity}
      />
    </>
  );
}
