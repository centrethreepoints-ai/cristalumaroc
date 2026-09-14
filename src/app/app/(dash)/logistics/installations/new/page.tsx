import { PageHeader } from "@/components/dash/PageHeader";
import { InstallationForm } from "../InstallationForm";
import { all } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewInstallationPage() {
  await requirePerm("installations", "create");
  const { t } = await getI18n();

  const customers = all<any>(
    `SELECT id, code, COALESCE(NULLIF(company, ''), contact_name) AS name FROM customers ORDER BY name`,
  );
  const orders = all<any>(
    `SELECT o.id, o.number, COALESCE(NULLIF(c.company, ''), c.contact_name) AS customer_name
     FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.status NOT IN ('cancelled')
     ORDER BY o.id DESC LIMIT 300`,
  );
  const teams = all<any>(`SELECT id, name FROM teams ORDER BY name`);

  return (
    <>
      <PageHeader
        title={t("logistics.newInstallation")}
        subtitle={t("logistics.newInstallationSub")}
        breadcrumb={[{ label: t("menu.installations"), href: "/app/logistics/installations" }, { label: t("actions.create") }]}
      />
      <InstallationForm customers={customers} orders={orders} teams={teams} />
    </>
  );
}
