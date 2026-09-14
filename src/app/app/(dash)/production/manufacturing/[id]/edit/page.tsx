import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { MoForm } from "../../MoForm";
import { all, get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function EditMoPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePerm("manufacturing", "edit");
  const { id } = await params;
  const { t } = await getI18n();

  const mo = get<any>(`SELECT * FROM manufacturing_orders WHERE id = ?`, [id]);
  if (!mo) notFound();

  const customers = all<any>(`SELECT id, code, COALESCE(NULLIF(company, ''), contact_name) AS name FROM customers ORDER BY name`);
  const products = all<any>(`SELECT id, sku, name FROM products ORDER BY sku`);
  const orders = all<any>(
    `SELECT o.id, o.number, COALESCE(NULLIF(c.company, ''), c.contact_name) AS customer_name
     FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
     ORDER BY o.id DESC LIMIT 300`,
  );
  const employees = all<any>(`SELECT id, full_name, job_title FROM users WHERE active = 1 ORDER BY full_name`);

  return (
    <>
      <PageHeader
        title={mo.number}
        subtitle={t("production.editMo")}
        breadcrumb={[
          { label: t("menu.manufacturing"), href: "/app/production/manufacturing" },
          { label: mo.number, href: `/app/production/manufacturing/${mo.id}` },
          { label: t("actions.edit") },
        ]}
      />
      <MoForm
        customers={customers}
        products={products}
        orders={orders}
        employees={employees}
        initial={{
          id: mo.id,
          order_id: mo.order_id,
          customer_id: mo.customer_id,
          product_id: mo.product_id,
          description: mo.description ?? "",
          width: mo.width,
          height: mo.height,
          quantity: mo.quantity,
          priority: mo.priority,
          assignee_id: mo.assignee_id,
          workstation: mo.workstation ?? "",
          start_date: String(mo.start_date ?? "").slice(0, 10),
          end_date: String(mo.end_date ?? "").slice(0, 10),
          notes: mo.notes ?? "",
        }}
      />
    </>
  );
}
