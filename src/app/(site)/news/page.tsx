import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getNews } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export default async function NewsPage() {
  const { t, locale, date } = await getI18n();
  const posts = getNews();
  const [lead, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow={t("nav.news")}
        title={t("news.title")}
        subtitle={t("news.subtitle")}
        image="/images/ranges/curtain-walls.jpg"
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("nav.news") }]}
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x">
          {lead && (
            <Reveal>
              <Link href={`/news/${lead.slug}`} className="group grid gap-8 overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition hover:shadow-lift lg:grid-cols-2">
                <Img src={lead.image} alt={lead.title} ratio="16/10" className="h-full w-full" />
                <div className="flex flex-col justify-center p-8">
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    <span className="rounded bg-brand-600/10 px-2 py-0.5 text-brand-700">{lead.category}</span>
                    <span>{date(lead.published_at)}</span>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-bold leading-snug text-ink-900 group-hover:text-brand-700 sm:text-3xl">
                    {locale === "ar" ? lead.title_ar || lead.title : lead.title}
                  </h2>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-ink-500">
                    {locale === "ar" ? lead.excerpt_ar || lead.excerpt : lead.excerpt}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600">
                    {t("news.read")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                  </span>
                </div>
              </Link>
            </Reveal>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((n, i) => (
              <Reveal key={n.id} delay={(i % 6) * 60}>
                <Link href={`/news/${n.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                  <Img src={n.image} alt={n.title} ratio="16/9" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                      <span className="rounded bg-ink-900/6 px-2 py-0.5 text-ink-600">{n.category}</span>
                      <span>{date(n.published_at)}</span>
                    </div>
                    <h3 className="mt-3 font-display text-[16px] font-bold leading-snug text-ink-900 group-hover:text-brand-700">
                      {locale === "ar" ? n.title_ar || n.title : n.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-500 line-clamp-3">
                      {locale === "ar" ? n.excerpt_ar || n.excerpt : n.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600">
                      {t("news.read")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                    </span>
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
