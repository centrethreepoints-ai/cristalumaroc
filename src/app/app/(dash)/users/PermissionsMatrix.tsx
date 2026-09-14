import { PERMISSIONS, ROLE_LABELS, ROLES, type ModuleKey, type Perm } from "@/lib/permissions";
import { NAV } from "@/lib/nav";
import { getI18n } from "@/i18n/server";

/** Read-only role × module permission grid, derived from the same matrix that guards the routes. */
export async function PermissionsMatrix({ activeCount }: { activeCount: number }) {
  const { t, locale, num } = await getI18n();

  const rows = NAV.flatMap((g) =>
    g.items.map((it) => ({ group: t(g.labelKey), label: t(it.labelKey), key: it.key as ModuleKey })),
  );

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/8 px-4 py-3">
        <div>
          <h2 className="font-display text-[15px] font-bold text-ink-900">{t("users.permissionsMatrix")}</h2>
          <p className="mt-0.5 text-[12px] text-ink-400">
            {num(activeCount)} {t("statuses.active")} · {num(rows.length)} {t("users.permissions")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-500">
          <span><b className="text-emerald-600">V</b> view</span>
          <span><b className="text-sky-600">C</b> create</span>
          <span><b className="text-amber-600">E</b> edit</span>
          <span><b className="text-brand-600">D</b> delete</span>
        </div>
      </div>

      <div className="scroll-thin overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="min-w-[190px]">{t("users.permissions")}</th>
              {ROLES.map((r) => (
                <th key={r} className="text-center">{ROLE_LABELS[r]?.[locale] ?? r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  <div className="font-semibold text-ink-800">{row.label}</div>
                  <div className="text-[11px] text-ink-400">{row.group}</div>
                </td>
                {ROLES.map((role) => {
                  const perms = (PERMISSIONS[role]?.[row.key] ?? []) as Perm[];
                  return (
                    <td key={role} className="text-center">
                      {perms.length === 0 ? (
                        <span className="text-ink-200">—</span>
                      ) : (
                        <span className="inline-flex gap-0.5">
                          {(["view", "create", "edit", "delete"] as Perm[]).map(
                            (p) =>
                              perms.includes(p) && (
                                <span
                                  key={p}
                                  title={p}
                                  className={
                                    "flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold " +
                                    (p === "view" ? "bg-emerald-500/15 text-emerald-700"
                                      : p === "create" ? "bg-sky-500/15 text-sky-700"
                                      : p === "edit" ? "bg-amber-500/18 text-amber-700"
                                      : "bg-brand-600/12 text-brand-700")
                                  }
                                >
                                  {p[0].toUpperCase()}
                                </span>
                              ),
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
