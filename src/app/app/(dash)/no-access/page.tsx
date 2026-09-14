import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { getSessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { ShieldOff } from "lucide-react";

/** Shown instead of a 500 when the signed-in role lacks permission for a module. */
export default async function NoAccessPage({ searchParams }: { searchParams: any }) {
  const { t, locale } = await getI18n();
  const sp = await searchParams;
  const user = await getSessionUser();
  const module = String(sp.module ?? "");

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="card card-pad text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600">
          <ShieldOff className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-[22px] font-bold tracking-tight text-ink-900">
          {t("actions.noAccess")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
          {user
            ? `${user.fullName} — ${ROLE_LABELS[user.role]?.[locale] ?? user.role}`
            : t("actions.noAccess")}
          {module ? ` · ${module}` : ""}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/app/dashboard" className="btn btn-primary">{t("menu.dashboard")}</Link>
          <Link href="/app/login" className="btn-outline btn-sm">{t("users.role")}</Link>
        </div>
      </div>
    </div>
  );
}
