import { PageHeader } from "@/components/dash/PageHeader";
import { QcForm } from "../QcForm";
import { all } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewQcPage() {
  await requirePerm("quality", "create");
  const { t } = await getI18n();

  // Only orders still in flight are worth inspecting.
  const orders = all<any>(
    `SELECT mo.id, mo.number, p.name AS product_name, mo.quantity
     FROM manufacturing_orders mo
     LEFT JOIN products p ON p.id = mo.product_id
     WHERE mo.status IN ('glazing','quality_control','assembly','machining')
     ORDER BY mo.id DESC LIMIT 300`,
  );

  return (
    <>
      <PageHeader
        title={t("qc.newQc")}
        subtitle={t("qc.newQcSub")}
        breadcrumb={[{ label: t("menu.quality"), href: "/app/production/quality" }, { label: t("actions.create") }]}
      />
      <QcForm orders={orders} />
    </>
  );
}
