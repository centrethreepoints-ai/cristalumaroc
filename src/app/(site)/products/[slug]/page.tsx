import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getCatalogProducts } from "@/lib/queries";
import { RANGES, RANGE_BY_SLUG, localise } from "@/lib/site-content";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export function generateStaticParams() {
  return RANGES.map((r) => ({ slug: r.slug }));
}

export default async function RangePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const range = RANGE_BY_SLUG[slug];
  if (!range) notFound();

  const { t, locale, money } = await getI18n();
  const variants = getCatalogProducts(range.skus);
  const others = RANGES.filter((r) => r.slug !== range.slug).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={t("nav.products")}
        title={range.title[locale]}
        subtitle={range.description[locale]}
        image={range.image}
        breadcrumb={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.products"), href: "/products" },
          { label: range.title[locale] },
        ]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/devis" className="btn-primary btn-lg">
            {t("products.getQuote")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link href="/projects" className="btn-outline-light btn-lg">{t("hero.cta3")}</Link>
        </div>
      </PageHero>

      {/* Variants */}
      <section className="bg-white py-20">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow" style={{ color: range.accent }}>{range.tagline[locale]}</span>
            <h2 className="section-title mt-3 text-ink-900">
              {variants.length} {t("table.product").toLowerCase()}
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {variants.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <Img src={p.image} alt={p.name} ratio="16/10" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-ink-400">{p.sku}</span>
                      <span className="badge-grey">{p.unit}</span>
                    </div>
                    <h3 className="mt-3 font-display text-[16px] font-bold leading-snug text-ink-900">
                      {locale === "ar" ? p.name_ar || p.name : locale === "en" ? p.name_en || p.name : p.name}
                    </h3>
                    <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-500">{p.description}</p>
                    <div className="mt-5 flex items-end justify-between border-t border-ink-900/8 pt-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{t("common.from")}</p>
                        <p className="font-display text-lg font-bold text-ink-900">{money(p.selling_price)}</p>
                      </div>
                      <Link href="/devis" className="btn-primary btn-sm">{t("nav.quote")}</Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Specs + features */}
      <section className="bg-ink-50 py-20">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-ink-900/8 bg-white p-8">
              <h2 className="font-display text-xl font-bold text-ink-900">{t("products.features")}</h2>
              <ul className="mt-6 space-y-3.5">
                {localise(range.features, locale).map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: range.accent }}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-[14px] leading-relaxed text-ink-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="h-full rounded-2xl bg-ink-900 p-8 text-white">
              <h2 className="font-display text-xl font-bold">{t("products.specs")}</h2>
              <dl className="mt-6 divide-y divide-white/10">
                {localise(range.specs, locale).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="text-[13px] text-white/55">{k}</dt>
                    <dd className="text-end font-display text-[14px] font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Applications + options */}
      <section className="bg-white py-20">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-xl font-bold text-ink-900">{t("products.applications")}</h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {localise(range.applications, locale).map((a) => (
                <span key={a} className="rounded-lg border border-ink-900/10 bg-ink-50 px-3.5 py-2 text-[13px] font-medium text-ink-700">
                  {a}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="font-display text-xl font-bold text-ink-900">{t("products.options")}</h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {localise(range.options, locale).map((o) => (
                <span key={o} className="rounded-lg bg-brand-600/8 px-3.5 py-2 text-[13px] font-medium text-brand-700">
                  {o}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Related ranges */}
      <section className="bg-ink-50 py-20">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="section-title text-ink-900">{t("products.related")}</h2>
            <Link href="/products" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("products.backToProducts")}
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {others.map((r, i) => (
              <Reveal key={r.slug} delay={i * 70}>
                <Link href={`/products/${r.slug}`} className="group block h-full overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                  <Img src={r.image} alt={r.title[locale]} ratio="16/9" />
                  <div className="p-5">
                    <h3 className="font-display text-[15px] font-bold text-ink-900 group-hover:text-brand-700">
                      {r.title[locale]}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{r.tagline[locale]}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
