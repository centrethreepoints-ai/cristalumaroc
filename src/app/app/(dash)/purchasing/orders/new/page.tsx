import { PageHeader } from "@/components/dash/PageHeader";
import { PoForm } from "../PoForm";
import { all } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewPoPage() {
  await requirePerm("purchase_orders", "create");
  const { t } = await getI18n();

  const suppliers = all<any>(`SELECT id, code, name FROM suppliers ORDER BY name`);
  const products = all<any>(
    `SELECT id, sku, name, purchase_cost, vat_rate FROM products WHERE status = 'active' ORDER BY sku`,
  );
  const warehouses = all<any>(`SELECT id, code, name FROM warehouses ORDER BY is_default DESC, code`);

  return (
    <>
      <PageHeader
        title={t("purchasing.newPo")}
        subtitle={t("purchasing.newPoSub")}
        breadcrumb={[{ label: t("menu.purchaseOrders"), href: "/app/purchasing/orders" }, { label: t("actions.create") }]}
      />
      <PoForm suppliers={suppliers} products={products} warehouses={warehouses} />
    </>
  );
}
