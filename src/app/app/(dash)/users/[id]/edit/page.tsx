import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { UserForm } from "../../UserForm";
import { get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePerm("users", "edit");
  const { id } = await params;
  const { t } = await getI18n();

  const u = get<any>(`SELECT id, email, full_name, role, job_title, phone, active FROM users WHERE id = ?`, [id]);
  if (!u) notFound();

  return (
    <>
      <PageHeader
        title={u.full_name}
        subtitle={t("users.editUser")}
        breadcrumb={[
          { label: t("menu.users"), href: "/app/users" },
          { label: u.full_name, href: `/app/users/${u.id}` },
          { label: t("actions.edit") },
        ]}
      />
      <UserForm
        initial={{
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          jobTitle: u.job_title ?? "",
          phone: u.phone ?? "",
          active: u.active,
        }}
      />
    </>
  );
}
