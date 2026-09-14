import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getProjectCategories, getProjects } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { t, locale, num } = await getI18n();
  const { cat } = await searchParams;
  const categories = getProjectCategories();
  const projects = getProjects(cat && cat !== "all" ? { category: cat } : {});

  const title = (p: any) => (locale === "ar" ? p.title_ar || p.title : locale === "en" ? p.title_en || p.title : p.title);

  return (
    <>
      <PageHero
        eyebrow={t("projects.title")}
        title={t("projects.title")}
        subtitle={t("projects.subtitle")}
        image="/images/projects/marina-bay-residences.jpg"
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("nav.projects") }]}
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x">
          {/* Filters */}
          <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <FilterChip href="/projects" active={!cat || cat === "all"} label={t("projects.filterAll")} count={categories.reduce((a, c) => a + c.n, 0)} />
            {categories.map((c) => (
              <FilterChip key={c.category} href={`/projects?cat=${encodeURIComponent(c.category)}`} active={cat === c.category} label={c.category} count={c.n} />
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <Reveal key={p.id} delay={(i % 6) * 60}>
                <Link href={`/projects/${p.slug}`} className="group block h-full">
                  <div className="relative overflow-hidden rounded-2xl border border-ink-900/8">
                    <Img src={p.image} alt={p.title} ratio="4/3" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent opacity-90" />
                    <span className="absolute start-4 top-4 rounded-md bg-brand-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {p.category}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 text-[12px] font-semibold text-ink-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.city}</span>
                      <span>·</span>
                      <span>{p.year}</span>
                      {p.surface > 0 && (
                        <>
                          <span>·</span>
                          <span>{num(p.surface)} m²</span>
                        </>
                      )}
                    </div>
                    <h2 className="mt-1.5 font-display text-[17px] font-bold leading-snug text-ink-900 transition group-hover:text-brand-700">
                      {title(p)}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-ink-500">
                      {locale === "ar" ? p.description_ar || p.description : locale === "en" ? p.description_en || p.description : p.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600">
                      {t("common.viewProject")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {projects.length === 0 && (
            <p className="py-20 text-center text-ink-400">{t("common.noResults")}</p>
          )}
        </div>
      </section>
    </>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <a
      href={href}
      className={
        "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition " +
        (active ? "bg-ink-900 text-white" : "border border-ink-900/12 text-ink-600 hover:border-ink-900/30 hover:text-ink-900")
      }
    >
      {label}
      <span className={"text-[11px] " + (active ? "text-white/60" : "text-ink-400")}>{count}</span>
    </a>
  );
}
