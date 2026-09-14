"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserRound } from "lucide-react";
import { saveUser } from "@/lib/actions";
import { useI18n } from "@/i18n";

export type UserInput = {
  id?: number; email?: string; fullName?: string; role?: string;
  jobTitle?: string; phone?: string; active?: number;
};

const ROLES = ["admin", "direction", "commercial", "stock", "production", "accountant", "installer"];

export function UserForm({ initial }: { initial?: UserInput }) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial?.id);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveUser(fd);
      if (res.ok) router.push("/app/users");
      else setError(res.error ?? t("actions.failed"));
    });
  }

  return (
    <form onSubmit={submit} className="card card-pad max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={initial?.id ?? ""} />

        <div>
          <label className="label">{t("users.email")}</label>
          <input name="email" className="input" required type="email" defaultValue={initial?.email ?? ""} placeholder="prenom.nom@cristalu.ma" />
        </div>

        <div>
          <label className="label">{t("users.fullName")}</label>
          <input name="full_name" className="input" required defaultValue={initial?.fullName ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.role")}</label>
          <select name="role" className="select" defaultValue={initial?.role ?? "commercial"}>
            {ROLES.map((r) => <option key={r} value={r}>{t(`users.role_${r}`)}</option>)}
          </select>
        </div>

        <div>
          <label className="label">{t("users.jobTitle")}</label>
          <input name="job_title" className="input" defaultValue={initial?.jobTitle ?? ""} />
        </div>

        <div>
          <label className="label">{t("table.phone")}</label>
          <input name="phone" className="input" defaultValue={initial?.phone ?? ""} />
        </div>

        <div>
          <label className="label">{t("users.password")}</label>
          <input
            name="password"
            className="input"
            type="password"
            minLength={isEdit ? 6 : 6}
            required={!isEdit}
            placeholder={isEdit ? t("users.passwordKeep") : "cristalu2026"}
          />
          {isEdit && <p className="mt-1 text-[11.5px] text-ink-400">{t("users.passwordHint")}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-700">
            <input type="checkbox" name="active" value="1" defaultChecked={(initial?.active ?? 1) === 1} className="h-4 w-4 accent-brand-600" />
            {t("users.active")}
          </label>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-brand-600/8 px-3 py-2 text-[13px] font-semibold text-brand-700">{error}</p>}

      <div className="mt-5 flex items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <UserRound className="h-4 w-4" />
          {t(isEdit ? "actions.save" : "actions.create")}
        </button>
        <Link href="/app/users" className="btn-outline btn-sm">{t("actions.cancel")}</Link>
      </div>
    </form>
  );
}
