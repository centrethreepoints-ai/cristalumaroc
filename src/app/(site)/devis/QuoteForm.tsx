"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Send, Upload, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { COLORS, GLASS_TYPES, OPENING_SYSTEMS } from "./options";
import { submitQuoteRequest } from "./actions";

export function QuoteForm({ products }: { products: { sku: string; name: string; name_ar?: string | null; name_en?: string | null }[] }) {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: true; ref: string } | { ok: false; error: string; field?: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const productName = (p: (typeof products)[number]) =>
    locale === "ar" ? p.name_ar || p.name : locale === "en" ? p.name_en || p.name : p.name;

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await submitQuoteRequest(formData);
      setResult(res);
      if (res.ok) {
        setFileName(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[.06] p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="mt-5 font-display text-2xl font-bold text-ink-900">{t("quote.successTitle")}</h2>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-600">{t("quote.successText")}</p>
        <p className="mt-4 inline-block rounded-lg bg-ink-900 px-5 py-2.5 font-mono text-[15px] font-bold tracking-wider text-white">
          {result.ref}
        </p>
        <p className="mt-4 text-[13px] text-ink-500">{t("quote.successHint")}</p>
        <button type="button" onClick={() => setResult(null)} className="btn-outline mt-8">
          {t("quote.newRequest")}
        </button>
      </div>
    );
  }

  const fieldError = (f?: string) => (result && !result.ok && result.field === f ? t(`quote.${result.error}`) : null);

  return (
    <form action={onSubmit} className="space-y-8">
      {result && !result.ok && !result.field && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-600/8 px-4 py-3 text-[13.5px] font-semibold text-brand-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {t(`quote.${result.error}`)}
        </div>
      )}

      {/* ------------------------- Identity ------------------------- */}
      <fieldset>
        <SectionTitle index="01" title={t("quote.sectionIdentity")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${t("quote.name")} *`} error={fieldError("customer_name")}>
            <input name="customer_name" required className="input" autoComplete="name" placeholder="Youssef El Amrani" />
          </Field>
          <Field label={`${t("quote.company")} (${t("common.optional")})`}>
            <input name="company" className="input" autoComplete="organization" placeholder="Atlas Immobilier SA" />
          </Field>
          <Field label={`${t("quote.phone")} *`} error={fieldError("phone")}>
            <input name="phone" required className="input" type="tel" dir="ltr" autoComplete="tel" placeholder="+212 6 61 20 45 12" />
          </Field>
          <Field label={`${t("quote.email")} *`} error={fieldError("email")}>
            <input name="email" required type="email" className="input" dir="ltr" autoComplete="email" placeholder="contact@societe.ma" />
          </Field>
          <Field label={t("quote.city")} className="sm:col-span-2">
            <input name="city" className="input" placeholder="Casablanca" />
          </Field>
        </div>
      </fieldset>

      {/* -------------------------- Project ------------------------- */}
      <fieldset>
        <SectionTitle index="02" title={t("quote.sectionProduct")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={`${t("quote.product")} *`} error={fieldError("product")} className="sm:col-span-2 lg:col-span-3">
            <select name="product" required className="select">
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.sku} value={`${p.sku} — ${p.name}`}>
                  {p.sku} · {productName(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("quote.width")}>
            <input name="width" type="number" min={0} step={10} className="input" placeholder="1200" />
          </Field>
          <Field label={t("quote.height")}>
            <input name="height" type="number" min={0} step={10} className="input" placeholder="1400" />
          </Field>
          <Field label={t("quote.quantity")}>
            <input name="quantity" type="number" min={1} defaultValue={1} className="input" />
          </Field>
        </div>
      </fieldset>

      {/* -------------------------- Options ------------------------- */}
      <fieldset>
        <SectionTitle index="03" title={t("quote.sectionOptions")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("quote.color")}>
            <select name="color" className="select">
              <option value="">—</option>
              {COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label={t("quote.glassType")}>
            <select name="glass_type" className="select">
              <option value="">—</option>
              {GLASS_TYPES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label={t("quote.openingSystem")} className="sm:col-span-2">
            <select name="opening_system" className="select">
              <option value="">—</option>
              {OPENING_SYSTEMS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label={`${t("quote.accessories")} (${t("common.optional")})`} className="sm:col-span-2">
            <input name="accessories" className="input" placeholder="Volet roulant, moustiquaire, seuil PMR…" />
          </Field>

          <fieldset className="sm:col-span-2">
            <legend className="label">{t("quote.installation")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <RadioCard name="installation" value="1" label={t("quote.installationYes")} defaultChecked />
              <RadioCard name="installation" value="0" label={t("quote.installationNo")} />
            </div>
          </fieldset>

          <Field label={t("quote.comments")} className="sm:col-span-2">
            <textarea name="comments" rows={4} className="input resize-y" placeholder={t("quote.commentsPh")} />
          </Field>
        </div>
      </fieldset>

      {/* --------------------------- Files -------------------------- */}
      <fieldset>
        <SectionTitle index="04" title={t("quote.sectionFiles")} />
        <label
          htmlFor="quote-file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-900/15 bg-ink-50/60 px-6 py-10 text-center transition hover:border-brand-600/40 hover:bg-brand-600/[.03]"
        >
          <Upload className="h-6 w-6 text-ink-400" />
          <span className="text-[13.5px] font-semibold text-ink-700">{t("quote.file")}</span>
          <span className="text-[12px] text-ink-400">{t("quote.fileHint")}</span>
          <input
            id="quote-file"
            ref={fileRef}
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        {fileName && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[13px] text-ink-700">
            <FileText className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="flex-1 truncate">{fileName}</span>
            <button
              type="button"
              onClick={() => {
                if (fileRef.current) fileRef.current.value = "";
                setFileName(null);
              }}
              className="btn-icon h-7 w-7"
              aria-label={t("actions.remove")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {fieldError("file") && <p className="field-error">{fieldError("file")}</p>}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-ink-900/8 pt-6">
        <button type="submit" disabled={pending} className="btn-primary btn-lg">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t("quote.sending")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> {t("quote.send")}
            </>
          )}
        </button>
        <p className="text-[12px] text-ink-400">
          {t("quote.s1")} · {t("quote.s3")}
        </p>
      </div>
    </form>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 font-mono text-[11px] font-bold text-white">
        {index}
      </span>
      <legend className="font-display text-[15px] font-bold text-ink-900">{title}</legend>
      <span className="h-px flex-1 bg-ink-900/10" />
    </div>
  );
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function RadioCard({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-ink-900/12 bg-white px-4 py-3 transition has-checked:border-brand-600 has-checked:bg-brand-600/[.05] hover:border-ink-900/25">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[#E30613]"
      />
      <span className="text-[13.5px] font-medium text-ink-700">{label}</span>
    </label>
  );
}
