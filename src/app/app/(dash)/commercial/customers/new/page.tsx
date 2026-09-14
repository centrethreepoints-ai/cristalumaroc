import { PageHeader } from "@/components/dash/PageHeader";
import { CustomerForm } from "../../CustomerForm";
import { peekSeq } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewCustomerPage() {
  await requirePerm("customers", "create");
  const { t } = await getI18n();
  const year = new Date().getFullYear();
  const nextCode = `CLI-${year}-${String(peekSeq("CLI", year) + 1).padStart(4, "0")}`;

  return (
    <>
      <PageHeader
        title={t("customers.newCustomer")}
        subtitle={t("customers.subtitle")}
        breadcrumb={[{ label: t("menu.customers"), href: "/app/commercial/customers" }, { label: t("actions.new") }]}
      />
      <CustomerForm status="customer" backTo="/app/commercial/customers" nextCode={nextCode} />
    </>
  );
}
