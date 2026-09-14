import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getNews, getNewsPost } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getNewsPost(slug);
  if (!post) notFound();

  const { t, locale, date } = await getI18n();
  const others = getNews({ limit: 4 }).filter((n) => n.slug !== post.slug).slice(0, 3);
  const title = locale === "ar" ? post.title_ar || post.title : post.title;
  const excerpt = locale === "ar" ? post.excerpt_ar || post.excerpt : post.excerpt;

  return (
    <>
      <PageHero
        eyebrow={post.category}
        title={title}
        subtitle={`${t("news.publishedOn")} ${date(post.published_at)}`}
        image={post.image}
        breadcrumb={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.news"), href: "/news" },
          { label: title },
        ]}
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-14">
          <article>
            <Reveal>
              <Img src={post.image} alt={title} ratio="16/9" className="rounded-2xl border border-ink-900/8" priority />
            </Reveal>
            <Reveal delay={80}>
              <div className="prose-cristalu mt-8 max-w-none space-y-5 text-[15.5px] leading-[1.75] text-ink-700">
                <p className="text-[17px] font-medium leading-relaxed text-ink-900">{excerpt}</p>
                {(post.content ?? "")
                  .split("\n")
                  .filter(Boolean)
                  .map((para: string, i: number) => (
                    <p key={i} className={i > 0 && locale === "ar" ? "text-ink-500" : ""}>
                      {para}
                    </p>
                  ))}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="mt-12 rounded-2xl bg-ink-900 p-8 text-white">
                <h3 className="font-display text-xl font-bold">{t("home.ctaTitle")}</h3>
                <p className="mt-2 text-[14.5px] text-white/60">{t("home.ctaText")}</p>
                <Link href="/devis" className="btn-primary btn-lg mt-6">
                  {t("nav.quote")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </Reveal>
          </article>

          <aside className="space-y-4">
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 hover:text-brand-700"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("nav.news")}
            </Link>
            {others.map((n) => (
              <Reveal key={n.id}>
                <Link href={`/news/${n.slug}`} className="group flex gap-4 rounded-xl border border-ink-900/8 bg-white p-3 transition hover:border-brand-600/30 hover:shadow-card">
                  <Img src={n.image} alt={n.title} ratio="1/1" className="h-20 w-20 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{date(n.published_at)}</p>
                    <h4 className="mt-1 line-clamp-3 font-display text-[13.5px] font-bold leading-snug text-ink-900 group-hover:text-brand-700">
                      {locale === "ar" ? n.title_ar || n.title : n.title}
                    </h4>
                  </div>
                </Link>
              </Reveal>
            ))}
          </aside>
        </div>
      </section>
    </>
  );
}
