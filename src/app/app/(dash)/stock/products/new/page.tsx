import { PageHeader } from "@/components/dash/PageHeader";
import { ProductForm, type CategoryOpt } from "../ProductForm";
import { all } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewProductPage() {
  await requirePerm("products", "create");
  const { t } = await getI18n();

  const categories: CategoryOpt[] = all<any>(
    `SELECT id, name, code FROM categories ORDER BY name`,
  ).map((c) => ({ id: c.id, name: c.name, code: c.code }));

  return (
    <>
      <PageHeader
        title={t("stock.newProduct")}
        subtitle={t("stock.subtitle")}
        breadcrumb={[{ label: t("menu.products"), href: "/app/stock/products" }, { label: t("actions.new") }]}
      />
      <ProductForm categories={categories} />
    </>
  );
}
