import { PageHeader } from "@/components/dash/PageHeader";
import { ExpenseForm } from "../ExpenseForm";
import { all } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { requirePerm } from "@/lib/auth";

export default async function NewExpensePage() {
  await requirePerm("expenses", "create");
  const { t } = await getI18n();

  const suppliers = all<any>(`SELECT id, code, name FROM suppliers ORDER BY name`);

  return (
    <>
      <PageHeader
        title={t("finance.newExpense")}
        subtitle={t("finance.expensesSub")}
        breadcrumb={[{ label: t("menu.expenses"), href: "/app/finance/expenses" }, { label: t("actions.create") }]}
      />
      <ExpenseForm suppliers={suppliers} />
    </>
  );
}
