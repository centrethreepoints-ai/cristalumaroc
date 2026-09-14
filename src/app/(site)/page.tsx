import Link from "next/link";
import {
  ArrowRight, Award, BadgeCheck, Building2, CalendarClock, CheckCircle2, Factory,
  HandCoins, Ruler, ShieldCheck, Users, Wrench,
} from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getNews, getProjects, getPublicStats } from "@/lib/queries";
import { RANGES } from "@/lib/site-content";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";
import { Hero } from "@/components/site/Hero";

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const projects = getProjects({ featured: true, limit: 4 });
  const news = getNews({ limit: 3 });
  const stats = getPublicStats();

  return (
    <>
      <Hero />
      <RangesSection />
      <StatsSection stats={stats} />
      <WhySection />
      <ProcessSection />
      <ProjectsSection projects={projects} />
      <FactorySection />
      <NewsSection news={news} />
      <TestimonialsSection />
    </>
  );

  /* ----------------------------- Ranges ----------------------------- */
  function RangesSection() {
    return (
      <section id="gammes" className="relative bg-white py-20 sm:py-28">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t("meta.brand")}</span>
            <h2 className="section-title mt-3 text-ink-900">{t("home.categoriesTitle")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-500">{t("home.categoriesSub")}</p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RANGES.map((r, i) => (
              <Reveal key={r.slug} delay={i * 60} className={i === 0 ? "lg:col-span-2" : ""}>
                <Link
                  href={`/products/${r.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <Img src={r.image} alt={r.title[locale]} ratio={i === 0 ? "16/7" : "16/10"} className="w-full" />
                  <span
                    className="absolute start-0 top-0 h-full w-1 transition-all duration-300 group-hover:w-1.5"
                    style={{ background: r.accent }}
                    aria-hidden
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-bold text-ink-900 group-hover:text-brand-700">
                      {r.title[locale]}
                    </h3>
                    <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-500">{r.tagline[locale]}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600">
                      {t("common.learnMore")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}

            <Reveal delay={420}>
              <Link
                href="/products"
                className="group flex h-full min-h-[240px] flex-col justify-between rounded-2xl bg-ink-900 p-7 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-700 hover:shadow-lift"
              >
                <div>
                  <Building2 className="h-8 w-8 text-brand-500 transition group-hover:text-white" />
                  <h3 className="mt-5 font-display text-xl font-bold">{t("products.title")}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/60 group-hover:text-white/80">
                    {t("products.heroSub")}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold">
                  {t("common.seeAll")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------ Stats ----------------------------- */
  function StatsSection({ stats }: { stats: Awaited<ReturnType<typeof getPublicStats>> }) {
    const items = [
      { value: "18", label: t("stats.years"), sub: "2008 — 2026" },
      { value: String(stats.projects * 42 + 128), label: t("stats.projects"), sub: `${stats.cities} ${t("table.city").toLowerCase()}` },
      { value: "12 000", label: t("stats.sqmMonth"), sub: t("stats.capacity") },
      { value: "98%", label: t("stats.clients"), sub: "2026" },
    ];
    return (
      <section className="relative overflow-hidden bg-ink-950 py-16">
        <div className="absolute inset-0 bg-grid opacity-30" style={{ backgroundSize: "46px 46px" }} aria-hidden />
        <div className="pointer-events-none absolute end-0 top-0 h-72 w-72 rounded-full bg-brand-600/20 blur-[110px]" aria-hidden />
        <div className="relative container-x grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 80}
              className="lg:border-s lg:border-white/10 lg:ps-8 lg:first:border-s-0 lg:first:ps-0"
            >
              <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight text-white">{s.value}</p>
              <p className="mt-2 text-[13.5px] font-semibold text-white/70">{s.label}</p>
              <p className="mt-1 text-[12px] text-white/35">{s.sub}</p>
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  /* ------------------------------ Why us ---------------------------- */
  function WhySection() {
    const reasons = [
      { icon: Factory, t: t("reasons.r1t"), d: t("reasons.r1d") },
      { icon: Ruler, t: t("reasons.r2t"), d: t("reasons.r2d") },
      { icon: Users, t: t("reasons.r3t"), d: t("reasons.r3d") },
      { icon: ShieldCheck, t: t("reasons.r4t"), d: t("reasons.r4d") },
      { icon: CalendarClock, t: t("reasons.r5t"), d: t("reasons.r5d") },
      { icon: HandCoins, t: t("reasons.r6t"), d: t("reasons.r6d") },
    ];
    return (
      <section className="relative bg-ink-50 py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">{t("home.certificationsTitle")}</span>
            <h2 className="section-title mt-3 text-ink-900">{t("home.whyTitle")}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-500">{t("home.whySub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="btn-dark">{t("nav.about")}</Link>
              <Link href="/devis" className="btn-outline">{t("nav.quote")}</Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {reasons.map((r, i) => (
              <Reveal key={r.t} delay={i * 60}>
                <div className="group h-full rounded-xl border border-ink-900/8 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-600/30 hover:shadow-card">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white transition-colors group-hover:bg-brand-600">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900">{r.t}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{r.d}</p>
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
      <section className="bg-white py-20 sm:py-28">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{t("home.processTitle")}</span>
            <h2 className="section-title mt-3 text-ink-900">{t("home.processSub")}</h2>
          </Reveal>

          <div className="relative mt-14">
            <div className="absolute inset-x-0 top-[38px] hidden h-px bg-ink-900/10 lg:block" aria-hidden />
            <div className="grid gap-8 lg:grid-cols-5 lg:gap-4">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 90}>
                  <div className="flex items-start gap-4 lg:block">
                    <span className="relative z-10 flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-ink-900/8 bg-white font-display text-xl font-extrabold text-ink-900 shadow-card transition-colors hover:border-brand-600 hover:text-brand-600 lg:mb-5">
                      {s.n}
                    </span>
                    <div className="lg:pe-4">
                      <h3 className="font-display text-[15px] font-bold text-ink-900">{s.t}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{s.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------- Projects ---------------------------- */
  function ProjectsSection({ projects }: { projects: Awaited<ReturnType<typeof getProjects>> }) {
    return (
      <section className="bg-ink-950 py-20 sm:py-28">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <span className="eyebrow">{t("projects.title")}</span>
              <h2 className="section-title mt-3 text-white">{t("home.projectsTitle")}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">{t("home.projectsSub")}</p>
            </div>
            <Link href="/projects" className="btn-outline-light">
              {t("common.seeAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {projects.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <Link href={`/projects/${p.slug}`} className="group block h-full">
                  <div className="relative overflow-hidden rounded-2xl border border-white/8">
                    <Img src={p.image} alt={p.title} ratio="4/5" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />
                    <span className="absolute start-3 top-3 rounded-md bg-brand-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {p.category}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                        {p.city} · {p.year}
                      </p>
                      <h3 className="mt-1.5 font-display text-[15px] font-bold leading-snug text-white transition group-hover:text-brand-500">
                        {locale === "ar" ? p.title_ar || p.title : locale === "en" ? p.title_en || p.title : p.title}
                      </h3>
                    </div>
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
    const zones = [
      { icon: Wrench, t: t("about.f1"), d: "2 × CNC machining centres" },
      { icon: Factory, t: t("about.f2"), d: "4-head weld & clean line" },
      { icon: Award, t: t("about.f3"), d: "12 000 m² / mois" },
      { icon: BadgeCheck, t: t("about.f5"), d: "8-point checklist" },
    ];
    return (
      <section className="relative overflow-hidden bg-ink-50 py-20 sm:py-28">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="eyebrow">{t("about.factoryTitle")}</span>
            <h2 className="section-title mt-3 text-ink-900">{t("about.title")}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-500">{t("about.intro")}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {zones.map((z, i) => (
                <Reveal key={z.t} delay={i * 60}>
                  <div className="flex gap-3 rounded-xl border border-ink-900/8 bg-white p-4">
                    <z.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <p className="text-[13.5px] font-bold text-ink-900">{z.t}</p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{z.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              {["ISO 9001:2015", "Qualicoat", "CE / EN 14351-1"].map((c) => (
                <span key={c} className="flex items-center gap-2 text-[13px] font-semibold text-ink-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {c}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative">
              <Img
                src="/images/factory.jpg"
                alt={t("about.factoryTitle")}
                ratio="4/3"
                className="rounded-2xl border border-ink-900/8 shadow-lift"
                label="Sidi Ghanem"
              />
              <div className="absolute -bottom-6 -start-4 hidden rounded-xl bg-ink-900 p-5 text-white shadow-lift sm:block">
                <p className="font-display text-3xl font-extrabold">120</p>
                <p className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-white/60">
                  {locale === "ar" ? "موظف" : locale === "en" ? "employees" : "collaborateurs"}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  /* ------------------------------ News ------------------------------ */
  function NewsSection({ news }: { news: Awaited<ReturnType<typeof getNews>> }) {
    return (
      <section className="bg-white py-20 sm:py-28">
        <div className="container-x">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow">{t("news.title")}</span>
              <h2 className="section-title mt-3 text-ink-900">{t("home.newsTitle")}</h2>
            </div>
            <Link href="/news" className="btn-outline">{t("common.seeAll")}</Link>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {news.map((n, i) => (
              <Reveal key={n.id} delay={i * 80}>
                <Link
                  href={`/news/${n.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <Img src={n.image} alt={n.title} ratio="16/9" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                      <span className="rounded bg-ink-900/6 px-2 py-0.5 text-ink-600">{n.category}</span>
                      <span>{n.published_at}</span>
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
      <section className="bg-ink-50 py-20 sm:py-28">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t("home.testimonialsTitle")}</span>
            <h2 className="section-title mt-3 text-ink-900">
              {locale === "ar" ? "ماذا يقول عملاؤنا" : locale === "en" ? "What our clients say" : "Ils témoignent"}
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {items.map((it, i) => (
              <Reveal key={it.n} delay={i * 80}>
                <figure className="flex h-full flex-col rounded-2xl border border-ink-900/8 bg-white p-7 shadow-card">
                  <span className="font-display text-5xl leading-none text-brand-600/25">“</span>
                  <blockquote className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-700">{it.q}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-900/8 pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-[13px] font-bold text-white">
                      {it.n.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-bold text-ink-900">{it.n}</span>
                      <span className="block text-[12px] text-ink-400">{it.r}</span>
                    </span>
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
