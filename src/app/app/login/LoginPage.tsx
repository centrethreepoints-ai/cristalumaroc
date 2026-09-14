"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { login } from "./actions";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";

const DEMO_PASSWORD = "cristalu2026";

export function LoginPage({
  demoUsers,
}: {
  demoUsers: { email: string; full_name: string; role: string; job_title: string; color: string }[];
}) {
  const { t, locale } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await login(formData);
      if (res && !res.ok) setError(res.error ?? "credentials");
    });
  }

  function fill(email: string) {
    const form = document.getElementById("login-form") as HTMLFormElement | null;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = email;
    (form.elements.namedItem("password") as HTMLInputElement).value = DEMO_PASSWORD;
    (form.elements.namedItem("email") as HTMLInputElement).focus();
  }

  const roleLabel = (r: string) => ROLE_LABELS[r as Role]?.[locale] ?? r;

  return (
    <div className="relative flex min-h-screen bg-ink-950">
      <div className="absolute inset-0 bg-grid opacity-30" style={{ backgroundSize: "48px 48px" }} aria-hidden />
      <div className="pointer-events-none absolute -start-40 top-1/4 h-[520px] w-[520px] rounded-full bg-brand-600/20 blur-[150px]" aria-hidden />
      <div className="pointer-events-none absolute -end-32 bottom-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[130px]" aria-hidden />

      {/* Brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between p-12 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 font-display text-xl font-extrabold text-white">
            C
          </span>
          <span className="leading-none">
            <span className="block font-display text-lg font-extrabold tracking-tight text-white">CRISTALU</span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-brand-500">Maroc</span>
          </span>
        </Link>

        <div>
          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-white">
            {t("app.loginTitle")}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
            ERP industriel — CRM, production, stock, achats, facturation et logistique pour
            l'usine de Sidi Ghanem.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              ["CRM & devis", "Devis, commandes, clients"],
              ["Production", "OF, kanban, contrôle qualité"],
              ["Stock & achats", "6 entrepôts, alertes automatiques"],
              ["Finance", "Factures, paiements, dépenses"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-[13px] font-bold text-white">{a}</p>
                <p className="mt-1 text-[11.5px] text-white/45">{b}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-white/40">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Accès restreint — toutes les actions sont journalisées.
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div className="absolute end-6 top-6">
          <LocaleSwitcher variant="dark" />
        </div>

        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("app.backToSite")}
          </Link>

          <div className="rounded-2xl border border-white/10 bg-ink-900/90 p-8 shadow-lift glass">
            <div className="lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 font-display text-xl font-extrabold text-white">
                C
              </span>
            </div>

            <h2 className="mt-5 font-display text-xl font-bold text-white lg:mt-0">{t("app.loginTitle")}</h2>
            <p className="mt-1.5 text-[13.5px] text-white/50">{t("app.loginSub")}</p>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-lg bg-brand-600/12 px-3.5 py-2.5 text-[13px] font-semibold text-brand-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error === "inactive" ? t("app.inactive") : t("app.badCredentials")}
              </div>
            )}

            <form id="login-form" action={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-white/70">{t("app.email")}</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    dir="ltr"
                    defaultValue="admin@cristalu.ma"
                    className="input-dark ps-9"
                    placeholder="prenom.nom@cristalu.ma"
                  />
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-ink-400">
                    <Lock className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-white/70">{t("app.password")}</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    required
                    dir="ltr"
                    defaultValue={DEMO_PASSWORD}
                    className="input-dark pe-10 ps-3"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 end-2 flex items-center px-1 text-ink-400 transition hover:text-white"
                    aria-label="password"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={pending} className="btn-primary btn-lg w-full">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("app.signingIn")}
                  </>
                ) : (
                  t("app.signIn")
                )}
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-ink-900/60 p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40">{t("app.demoTitle")}</p>
            <p className="mt-1.5 text-[12px] text-white/45">
              {t("app.demoHint")}
              <code className="ms-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/80">{DEMO_PASSWORD}</code>
            </p>
            <div className="mt-3 grid gap-1.5">
              {demoUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fill(u.email)}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-start transition hover:bg-white/[.06]"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                    style={{ background: u.color }}
                  >
                    {u.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-white/85">{roleLabel(u.role)}</span>
                    <span className="block truncate font-mono text-[10.5px] text-white/40">{u.email}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
