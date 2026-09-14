import { PageHeader } from "@/components/dash/PageHeader";
import { CustomerForm } from "../../CustomerForm";
import { peekSeq } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewProspectPage() {
  await requirePerm("customers", "create");
  const { t } = await getI18n();
  const year = new Date().getFullYear();
  const nextCode = `CLI-${year}-${String(peekSeq("CLI", year) + 1).padStart(4, "0")}`;

  return (
    <>
      <PageHeader
        title={t("customers.newProspect")}
        subtitle={t("customers.subtitle")}
        breadcrumb={[{ label: t("menu.prospects"), href: "/app/commercial/prospects" }, { label: t("actions.new") }]}
      />
      <CustomerForm status="prospect" backTo="/app/commercial/prospects" nextCode={nextCode} />
    </>
  );
}
