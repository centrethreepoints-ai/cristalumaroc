import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, MapPin, Ruler } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getProject, getProjects } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const { t, locale, num } = await getI18n();
  const related = getProjects({ category: p.category, limit: 4 }).filter((x) => x.slug !== p.slug).slice(0, 3);

  const facts = [
    { icon: Building2, k: t("projects.client"), v: p.client },
    { icon: MapPin, k: t("projects.location"), v: p.city },
    { icon: CalendarDays, k: t("projects.year"), v: String(p.year) },
    { icon: Ruler, k: t("projects.surface"), v: p.surface ? `${num(p.surface)} m²` : "—" },
  ];

  return (
    <>
      <PageHero
        eyebrow={p.category}
        title={locale === "ar" ? p.title_ar || p.title : locale === "en" ? p.title_en || p.title : p.title}
        subtitle={`${p.client} · ${p.city} · ${p.year}`}
        image={p.image}
        breadcrumb={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.projects"), href: "/projects" },
          { label: p.title },
        ]}
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div>
            <Reveal>
              <Img src={p.image} alt={p.title} ratio="16/10" className="rounded-2xl border border-ink-900/8" priority />
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-10 font-display text-2xl font-bold text-ink-900">{t("projects.overview")}</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-600">
                {(locale === "ar" ? p.description_ar || p.description : locale === "en" ? p.description_en || p.description : p.description)
                  .split("\n")
                  .map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="mt-10 rounded-2xl bg-ink-900 p-8 text-white">
                <h3 className="font-display text-xl font-bold">{t("home.ctaTitle")}</h3>
                <p className="mt-2 text-[14.5px] text-white/60">{t("home.ctaText")}</p>
                <Link href="/devis" className="btn-primary btn-lg mt-6">
                  {t("nav.quote")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </Reveal>
          </div>

          <aside>
            <Reveal delay={60}>
              <div className="rounded-2xl border border-ink-900/8 bg-ink-50 p-7">
                <h3 className="font-display text-[15px] font-bold uppercase tracking-wider text-ink-500">
                  {t("projects.category")}
                </h3>
                <p className="mt-2 font-display text-xl font-bold text-brand-600">{p.category}</p>
                <dl className="mt-6 divide-y divide-ink-900/8">
                  {facts.map((f) => (
                    <div key={f.k} className="flex items-start gap-3 py-3.5">
                      <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                      <div className="min-w-0 flex-1">
                        <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{f.k}</dt>
                        <dd className="mt-0.5 text-[14px] font-semibold text-ink-800">{f.v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-ink-50 py-16 sm:py-20">
          <div className="container-x">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="section-title text-ink-900">{t("projects.moreProjects")}</h2>
              <Link href="/projects" className="btn-outline">{t("common.seeAll")}</Link>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.id} delay={i * 70}>
                  <Link href={`/projects/${r.slug}`} className="group block overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                    <Img src={r.image} alt={r.title} ratio="4/3" />
                    <div className="p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{r.city} · {r.year}</p>
                      <h3 className="mt-1.5 font-display text-[15px] font-bold text-ink-900 group-hover:text-brand-700">
                        {locale === "ar" ? r.title_ar || r.title : locale === "en" ? r.title_en || r.title : r.title}
                      </h3>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
