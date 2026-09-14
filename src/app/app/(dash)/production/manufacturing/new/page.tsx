import { PageHeader } from "@/components/dash/PageHeader";
import { MoForm } from "../MoForm";
import { all } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewMoPage() {
  await requirePerm("manufacturing", "create");
  const { t } = await getI18n();

  const customers = all<any>(`SELECT id, code, COALESCE(NULLIF(company, ''), contact_name) AS name FROM customers ORDER BY name`);
  const products = all<any>(`SELECT id, sku, name FROM products WHERE status = 'active' ORDER BY sku`);
  const orders = all<any>(
    `SELECT o.id, o.number, COALESCE(NULLIF(c.company, ''), c.contact_name) AS customer_name
     FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.status NOT IN ('completed','cancelled')
     ORDER BY o.id DESC LIMIT 300`,
  );
  const employees = all<any>(
    `SELECT id, full_name, job_title FROM users WHERE active = 1 ORDER BY full_name`,
  );

  return (
    <>
      <PageHeader
        title={t("production.newMo")}
        subtitle={t("production.newMoSub")}
        breadcrumb={[{ label: t("menu.manufacturing"), href: "/app/production/manufacturing" }, { label: t("actions.create") }]}
      />
      <MoForm customers={customers} products={products} orders={orders} employees={employees} />
    </>
  );
}
