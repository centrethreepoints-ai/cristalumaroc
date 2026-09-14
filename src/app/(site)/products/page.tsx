import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getCatalogProducts } from "@/lib/queries";
import { RANGES } from "@/lib/site-content";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export default async function ProductsPage() {
  const { t, locale, money } = await getI18n();
  const products = getCatalogProducts();

  return (
    <>
      <PageHero
        eyebrow={t("nav.products")}
        title={t("products.title")}
        subtitle={t("products.subtitle")}
        image="/images/ranges/aluminium.jpg"
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("nav.products") }]}
      />

      {/* Ranges */}
      <section className="bg-white py-20">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{t("nav.productsGroup")}</span>
            <h2 className="section-title mt-3 text-ink-900">{t("home.categoriesTitle")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-500">{t("products.heroSub")}</p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {RANGES.map((r, i) => {
              const rangeProducts = products.filter((p) => r.skus.includes(p.sku));
              return (
                <Reveal key={r.slug} delay={i * 60}>
                  <Link
                    href={`/products/${r.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <div className="relative">
                      <Img src={r.image} alt={r.title[locale]} ratio="16/10" />
                      <span
                        className="absolute start-0 top-0 h-full w-1 transition-all group-hover:w-1.5"
                        style={{ background: r.accent }}
                        aria-hidden
                      />
                      <span className="absolute bottom-3 end-3 rounded-md bg-ink-950/80 px-2.5 py-1 text-[11px] font-bold text-white glass">
                        {rangeProducts.length} {t("common.results")}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-lg font-bold text-ink-900 group-hover:text-brand-700">
                        {r.title[locale]}
                      </h3>
                      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-500">{r.tagline[locale]}</p>
                      <ul className="mt-4 space-y-1.5">
                        {r.features[locale].slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[12.5px] text-ink-500">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: r.accent }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600">
                        {t("common.discover")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full catalogue */}
      <section className="bg-ink-50 py-20">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">{t("products.specs")}</span>
              <h2 className="section-title mt-3 text-ink-900">
                {products.length} {t("table.product").toLowerCase()}
              </h2>
            </div>
            <Link href="/devis" className="btn-primary">{t("nav.quote")}</Link>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 8) * 40}>
                <div className="group flex h-full flex-col rounded-xl border border-ink-900/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-600/25 hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[11px] font-semibold text-ink-400">{p.sku}</span>
                    <span className="badge-grey">{p.category_name}</span>
                  </div>
                  <h3 className="mt-3 flex-1 font-display text-[14.5px] font-bold leading-snug text-ink-900">
                    {locale === "ar" ? p.name_ar || p.name : locale === "en" ? p.name_en || p.name : p.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">{p.description}</p>
                  <div className="mt-4 flex items-end justify-between border-t border-ink-900/8 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{t("common.from")}</p>
                      <p className="font-display text-[15px] font-bold text-ink-900">{money(p.selling_price)}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-ink-400">/ {p.unit}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-ink-900/8 bg-white p-8 text-center">
              <Layers className="h-8 w-8 text-brand-600" />
              <h3 className="font-display text-xl font-bold text-ink-900">
                {locale === "ar" ? "تصنيع حسب المقاس" : locale === "en" ? "Bespoke manufacturing" : "Fabrication sur mesure"}
              </h3>
              <p className="max-w-xl text-[14px] leading-relaxed text-ink-500">
                {locale === "ar"
                  ? "كل منتجاتنا تُصنَّع حسب مقاساتكم. أرسلوا مخططاتكم واحصلوا على دراسة مسعّرة خلال 48 ساعة."
                  : locale === "en"
                    ? "Every product is manufactured to your dimensions. Send us your drawings and receive a costed study within 48 hours."
                    : "Tous nos produits sont fabriqués à vos dimensions. Envoyez vos plans et recevez une étude chiffrée sous 48 h."}
              </p>
              <Link href="/devis" className="btn-primary btn-lg">
                {t("products.getQuote")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
