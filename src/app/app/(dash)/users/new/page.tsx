import { PageHeader } from "@/components/dash/PageHeader";
import { UserForm } from "../UserForm";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewUserPage() {
  await requirePerm("users", "create");
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t("users.newUser")}
        subtitle={t("users.newUserSub")}
        breadcrumb={[{ label: t("menu.users"), href: "/app/users" }, { label: t("actions.create") }]}
      />
      <UserForm />
    </>
  );
}
