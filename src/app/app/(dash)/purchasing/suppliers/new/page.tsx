import { PageHeader } from "@/components/dash/PageHeader";
import { SupplierForm } from "../SupplierForm";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewSupplierPage() {
  await requirePerm("suppliers", "create");
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t("suppliers.newSupplier")}
        subtitle={t("suppliers.newSupplierSub")}
        breadcrumb={[{ label: t("menu.suppliers"), href: "/app/purchasing/suppliers" }, { label: t("actions.create") }]}
      />
      <SupplierForm />
    </>
  );
}
