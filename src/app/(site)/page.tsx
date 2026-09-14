import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getNews, getProjects } from "@/lib/queries";
import { RANGES } from "@/lib/site-content";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";
import { Hero } from "@/components/site/Hero";

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const projects = getProjects({ featured: true, limit: 4 });
  const news = getNews({ limit: 3 });

  return (
    <>
      <Hero />
      <ManifesteSection />
      <RangesSection />
      <WhySection />
      <ProcessSection />
      <ProjectsSection projects={projects} />
      <FactorySection />
      <NewsSection news={news} />
      <TestimonialsSection />
    </>
  );

  /* ---------------------------- Manifeste --------------------------- */
  function ManifesteSection() {
    const big = locale === "ar"
      ? "نحن نبني أكثر من مجرد فتحات."
      : locale === "en"
        ? "We build more than openings."
        : "Nous construisons plus que des ouvertures.";
    const body = locale === "ar"
      ? "تحوّل كريستالو المغرب الألمنيوم والـ PVC والزجاج إلى حلول معمارية مصممة لتدوم."
      : locale === "en"
        ? "Cristalu Maroc turns aluminium, PVC and glass into architectural solutions built to last."
        : "Cristalu Maroc transforme l'aluminium, le PVC et le verre en solutions architecturales conçues pour durer.";

    return (
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        {/* technical grid accent */}
        <div className="pointer-events-none absolute inset-y-0 start-0 hidden w-px bg-ink-900/8 lg:block" style={{ insetInlineStart: "8%" }} aria-hidden />
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:gap-20">
            <div>
              <p className="m-eyebrow">01 — {locale === "ar" ? "الرؤية" : locale === "en" ? "Vision" : "Manifeste"}</p>
              <h2 className="m-display mt-6 max-w-4xl text-[clamp(2.2rem,7vw,5.5rem)] text-ink-950">
                <span className="m-line"><span className="m-line-in">{big}</span></span>
              </h2>
            </div>

            {/* red vertical rule */}
            <div className="hidden w-px bg-brand-600 lg:block" aria-hidden />

            <Reveal delay={120} className="lg:max-w-sm lg:pt-24">
              <p className="text-[16px] leading-relaxed text-ink-600">{body}</p>
              <div className="mt-8 flex items-center gap-4">
                <span className="h-px w-12 bg-brand-600" aria-hidden />
                <Link href="/about" className="m-link text-[12px] font-bold uppercase tracking-[0.2em] text-ink-950">
                  {t("nav.about")}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    );
  }

  /* ----------------------------- Ranges ----------------------------- */
  function RangesSection() {
    return (
      <section className="bg-white py-24 sm:py-32">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="m-eyebrow">{t("meta.brand")}</p>
              <h2 className="m-display mt-4 max-w-2xl text-[clamp(1.9rem,4.5vw,3.4rem)] text-ink-950">
                {t("home.categoriesTitle")}
              </h2>
            </div>
            <Link href="/products" className="m-link mb-1 text-[13px] font-bold uppercase tracking-[0.16em] text-ink-950">
              {t("common.seeAll")}
            </Link>
          </Reveal>

          <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {RANGES.map((r, i) => (
              <Reveal key={r.slug} delay={(i % 3) * 90}>
                <Link href={`/products/${r.slug}`} className="group block">
                  <div className="relative overflow-hidden">
                    <Img src={r.image} alt={r.title[locale]} ratio={i === 0 ? "4/3" : "4/3"} className="w-full" />
                    <span className="absolute start-4 top-4 m-display text-[13px] text-white/90">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4 border-t border-ink-900/10 pt-4">
                    <div>
                      <h3 className="font-display text-[17px] font-bold text-ink-950 transition-colors group-hover:text-brand-600">
                        {r.title[locale]}
                      </h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">{r.tagline[locale]}</p>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600 rtl:rotate-90" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------ Why us ---------------------------- */
  function WhySection() {
    const reasons = [
      { t: t("reasons.r1t"), d: t("reasons.r1d") },
      { t: t("reasons.r2t"), d: t("reasons.r2d") },
      { t: t("reasons.r3t"), d: t("reasons.r3d") },
      { t: t("reasons.r4t"), d: t("reasons.r4d") },
      { t: t("reasons.r5t"), d: t("reasons.r5d") },
      { t: t("reasons.r6t"), d: t("reasons.r6d") },
    ];
    return (
      <section className="border-y border-ink-900/10 bg-ink-50/50 py-24 sm:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal>
            <p className="m-eyebrow">{t("home.certificationsTitle")}</p>
            <h2 className="m-display mt-4 text-[clamp(1.9rem,4.5vw,3.2rem)] text-ink-950">{t("home.whyTitle")}</h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-500">{t("home.whySub")}</p>
            <div className="mt-9 flex flex-wrap gap-5">
              <Link href="/about" className="bg-ink-950 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-brand-600">
                {t("nav.about")}
              </Link>
              <Link href="/devis" className="m-link self-center text-[12px] font-bold uppercase tracking-[0.16em] text-ink-950">
                {t("nav.quote")}
              </Link>
            </div>
          </Reveal>

          <div>
            {reasons.map((r, i) => (
              <Reveal key={r.t} delay={i * 50}>
                <div className="group grid grid-cols-[auto_1fr] gap-6 border-t border-ink-900/10 py-6 last:border-b">
                  <span className="m-display text-[15px] text-ink-300 transition-colors group-hover:text-brand-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-[16px] font-bold text-ink-950">{r.t}</h3>
                    <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-500">{r.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ----------------------------- Process ---------------------------- */
  function ProcessSection() {
    const steps = [
      { n: "01", t: t("process.p1t"), d: t("process.p1d") },
      { n: "02", t: t("process.p2t"), d: t("process.p2d") },
      { n: "03", t: t("process.p3t"), d: t("process.p3d") },
      { n: "04", t: t("process.p4t"), d: t("process.p4d") },
      { n: "05", t: t("process.p5t"), d: t("process.p5d") },
    ];
    return (
      <section className="bg-white py-24 sm:py-32">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="m-eyebrow">{t("home.processTitle")}</p>
            <h2 className="m-display mt-4 text-[clamp(1.9rem,4.5vw,3.2rem)] text-ink-950">{t("home.processSub")}</h2>
          </Reveal>

          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="group border-t border-ink-900/10 pt-5">
                  <span className="m-display block text-[2.6rem] leading-none text-ink-900/12 transition-colors duration-300 group-hover:text-brand-600">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-display text-[15px] font-bold text-ink-950">{s.t}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------- Projects ---------------------------- */
  function ProjectsSection({ projects }: { projects: Awaited<ReturnType<typeof getProjects>> }) {
    return (
      <section className="border-y border-ink-900/10 bg-ink-50/50 py-24 sm:py-32">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="m-eyebrow">{t("projects.title")}</p>
              <h2 className="m-display mt-4 text-[clamp(1.9rem,4.5vw,3.2rem)] text-ink-950">{t("home.projectsTitle")}</h2>
            </div>
            <Link href="/projects" className="m-link mb-1 text-[13px] font-bold uppercase tracking-[0.16em] text-ink-950">
              {t("common.seeAll")}
            </Link>
          </Reveal>

          <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2">
            {projects.map((p, i) => (
              <Reveal key={p.id} delay={(i % 2) * 90}>
                <Link href={`/projects/${p.slug}`} className="group block">
                  <div className="overflow-hidden">
                    <Img src={p.image} alt={p.title} ratio="16/10" className="w-full" />
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4 border-t border-ink-900/10 pt-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">
                        {p.category} · {p.city} · {p.year}
                      </p>
                      <h3 className="mt-2 font-display text-[18px] font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-600">
                        {locale === "ar" ? p.title_ar || p.title : locale === "en" ? p.title_en || p.title : p.title}
                      </h3>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600 rtl:rotate-90" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ----------------------------- Factory ---------------------------- */
  function FactorySection() {
    const zones = [t("about.f1"), t("about.f2"), t("about.f3"), t("about.f5")];
    return (
      <section className="bg-white py-24 sm:py-32">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="m-eyebrow">{t("about.factoryTitle")}</p>
            <h2 className="m-display mt-4 text-[clamp(1.9rem,4.5vw,3.2rem)] text-ink-950">{t("about.title")}</h2>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink-500">{t("about.intro")}</p>

            <ul className="mt-9 max-w-lg">
              {zones.map((z, i) => (
                <Reveal key={z} delay={i * 50}>
                  <li className="flex items-center gap-5 border-t border-ink-900/10 py-4 last:border-b">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
                    <span className="text-[14px] font-semibold text-ink-800">{z}</span>
                  </li>
                </Reveal>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-[12px] font-bold uppercase tracking-[0.18em] text-ink-400">
              {["ISO 9001:2015", "Qualicoat", "CE / EN 14351-1"].map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </Reveal>

          <Reveal variant="scale">
            <div className="m-kb">
              <Img src="/images/factory.jpg" alt={t("about.factoryTitle")} ratio="4/3" className="w-full" />
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  /* ------------------------------ News ------------------------------ */
  function NewsSection({ news }: { news: Awaited<ReturnType<typeof getNews>> }) {
    return (
      <section className="border-t border-ink-900/10 bg-ink-50/50 py-24 sm:py-32">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="m-eyebrow">{t("news.title")}</p>
              <h2 className="m-display mt-4 text-[clamp(1.9rem,4.5vw,3.2rem)] text-ink-950">{t("home.newsTitle")}</h2>
            </div>
            <Link href="/news" className="m-link mb-1 text-[13px] font-bold uppercase tracking-[0.16em] text-ink-950">
              {t("common.seeAll")}
            </Link>
          </Reveal>

          <div className="mt-14">
            {news.map((n, i) => (
              <Reveal key={n.id} delay={i * 60}>
                <Link href={`/news/${n.slug}`} className="group grid gap-4 border-t border-ink-900/10 py-7 last:border-b sm:grid-cols-[160px_1fr_auto] sm:items-center sm:gap-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">
                    {n.category} · {n.published_at}
                  </p>
                  <h3 className="font-display text-[17px] font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-600">
                    {locale === "ar" ? n.title_ar || n.title : n.title}
                  </h3>
                  <ArrowUpRight className="hidden h-4 w-4 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600 rtl:rotate-90 sm:block" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* --------------------------- Testimonials ------------------------- */
  function TestimonialsSection() {
    const items = [
      {
        q: locale === "ar"
          ? "سلّمت كريستالو 4800 م² من الواجهات في تسعة أشهر دون أي تأخير. جودة تصنيع أوروبية حقيقية."
          : locale === "en"
            ? "Cristalu delivered 4,800 m² of façade in nine months without a single delay. Genuine European manufacturing quality."
            : "Cristalu a livré 4 800 m² de façade en neuf mois, sans aucun retard. Une qualité de fabrication réellement européenne.",
        n: "Omar Benkirane", r: locale === "en" ? "CEO, Atlas Immobilier" : "DG, Atlas Immobilier SA",
      },
      {
        q: locale === "ar"
          ? "البرغولات البيومناخية غيّرت تجربة زبنائنا كلياً. التركيب كان نظيفاً واحترافياً."
          : locale === "en"
            ? "The bioclimatic pergolas completely changed our guests' experience. Installation was clean and professional."
            : "Les pergolas bioclimatiques ont transformé l'expérience de nos clients. La pose a été propre et professionnelle.",
        n: "Fatima Zahra Idrissi", r: locale === "en" ? "GM, Riad Zellige" : "Directrice, Riad Zellige",
      },
      {
        q: locale === "ar"
          ? "1900 م² من الفواصل في ثلاثة طوابق، كل شيء مُسلَّم ومضبوط. فريق هندسة متجاوب جداً."
          : locale === "en"
            ? "1,900 m² of partitions across three floors, all delivered and adjusted. A very responsive engineering team."
            : "1 900 m² de cloisons sur trois plateaux, tout livré et réglé. Une équipe technique très réactive.",
        n: "Hicham Laroussi", r: "Technopark Kénitra",
      },
    ];
    return (
      <section className="bg-white py-24 sm:py-32">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="m-eyebrow">{t("home.testimonialsTitle")}</p>
            <h2 className="m-display mt-4 text-[clamp(1.9rem,4.5vw,3.2rem)] text-ink-950">
              {locale === "ar" ? "ماذا يقول عملاؤنا" : locale === "en" ? "What our clients say" : "Ils témoignent"}
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
            {items.map((it, i) => (
              <Reveal key={it.n} delay={i * 80}>
                <figure className="border-t border-ink-900/10 pt-6">
                  <span className="m-display block text-[2.6rem] leading-none text-brand-600">“</span>
                  <blockquote className="mt-3 text-[14.5px] leading-relaxed text-ink-700">{it.q}</blockquote>
                  <figcaption className="mt-6">
                    <span className="block font-display text-[14px] font-bold text-ink-950">{it.n}</span>
                    <span className="mt-0.5 block text-[12px] uppercase tracking-[0.14em] text-ink-400">{it.r}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    );
  }
}
