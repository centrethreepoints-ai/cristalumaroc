import { PageHeader } from "@/components/dash/PageHeader";
import { MovementForm, type ProductOpt, type WarehouseOpt } from "../MovementForm";
import { all } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewMovementPage() {
  await requirePerm("movements", "create");
  const { t } = await getI18n();

  const products: ProductOpt[] = all<any>(
    `SELECT p.id, p.sku, p.name, p.unit,
            COALESCE((SELECT SUM(sl.quantity) FROM stock_levels sl WHERE sl.product_id = p.id), 0) AS on_hand
     FROM products p WHERE p.status = 'active' ORDER BY p.sku`,
  ).map((p) => ({ id: p.id, sku: p.sku, name: p.name, unit: p.unit, onHand: Number(p.on_hand ?? 0) }));

  const warehouses: WarehouseOpt[] = all<any>(
    `SELECT id, code, name FROM warehouses ORDER BY is_default DESC, code`,
  ).map((w) => ({ id: w.id, code: w.code, name: w.name }));

  return (
    <>
      <PageHeader
        title={t("stock.newMovement")}
        subtitle={t("stock.subtitle")}
        breadcrumb={[{ label: t("menu.movements"), href: "/app/stock/movements" }, { label: t("actions.new") }]}
      />
      <MovementForm products={products} warehouses={warehouses} />
    </>
  );
}
