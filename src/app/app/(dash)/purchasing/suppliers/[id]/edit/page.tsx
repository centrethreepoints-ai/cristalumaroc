import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dash/PageHeader";
import { SupplierForm } from "../../SupplierForm";
import { get } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePerm("suppliers", "edit");
  const { id } = await params;
  const { t } = await getI18n();

  const s = get<any>(`SELECT * FROM suppliers WHERE id = ?`, [id]);
  if (!s) notFound();

  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={t("suppliers.editSupplier")}
        breadcrumb={[
          { label: t("menu.suppliers"), href: "/app/purchasing/suppliers" },
          { label: s.name, href: `/app/purchasing/suppliers/${s.id}` },
          { label: t("actions.edit") },
        ]}
      />
      <SupplierForm
        initial={{
          id: s.id, name: s.name, category: s.category ?? "", contact_name: s.contact_name ?? "",
          email: s.email ?? "", phone: s.phone ?? "", address: s.address ?? "", city: s.city ?? "",
          ice: s.ice ?? "", if_code: s.if_code ?? "", rc: s.rc ?? "",
          payment_terms: s.payment_terms ?? "30 jours", rating: s.rating ?? 3, notes: s.notes ?? "",
        }}
      />
    </>
  );
}
