import { CheckCircle2, Clock, FileSpreadsheet, User } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getCatalogProducts } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { QuoteForm } from "./QuoteForm";

export default async function QuotePage() {
  const { t } = await getI18n();
  const products = getCatalogProducts().map((p) => ({
    sku: p.sku,
    name: p.name,
    name_ar: p.name_ar,
    name_en: p.name_en,
  }));

  const promises = [
    { icon: FileSpreadsheet, t: t("quote.s1") },
    { icon: FileSpreadsheet, t: t("quote.s2") },
    { icon: Clock, t: t("quote.s3") },
    { icon: User, t: t("quote.s4") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("nav.quote")}
        title={t("quote.title")}
        subtitle={t("quote.subtitle")}
        image="/images/ranges/aluminium.jpg"
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("nav.quote") }]}
      />

      <section className="bg-ink-50 py-16 sm:py-20">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
          <div className="rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card sm:p-10">
            <QuoteForm products={products} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-ink-900 p-7 text-white">
              <h2 className="font-display text-lg font-bold">{t("quote.sideTitle")}</h2>
              <ul className="mt-5 space-y-4">
                {promises.map((p) => (
                  <li key={p.t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-white/75">{p.t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink-900/8 bg-white p-7">
              <h3 className="font-display text-[15px] font-bold text-ink-900">{t("contact.phoneLabel")}</h3>
              <a href="tel:+212522984512" dir="ltr" className="mt-2 block font-display text-xl font-bold text-brand-600">
                +212 522 98 45 12
              </a>
              <p className="mt-4 text-[13px] leading-relaxed text-ink-500">{t("contact.hours")}</p>
              <a href="mailto:devis@cristalu.ma" className="mt-4 block text-[13.5px] font-semibold text-ink-800 hover:text-brand-600">
                devis@cristalu.ma
              </a>
            </div>

            <div className="rounded-2xl border border-ink-900/8 bg-white p-7">
              <h3 className="font-display text-[15px] font-bold text-ink-900">{t("quote.tracking")}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
                {t("quote.successHint")}
              </p>
              <p className="mt-4 rounded-lg bg-ink-50 px-3 py-2 font-mono text-[12px] text-ink-500">
                {t("table.reference")}: DEM-2026-XXXX
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
