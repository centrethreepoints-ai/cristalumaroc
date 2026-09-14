import Link from "next/link";
import { ArrowRight, Building2, Flag, Heart, Sparkles, Target } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getPublicStats } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export default async function AboutPage() {
  const { t, locale } = await getI18n();
  const stats = getPublicStats();

  const timeline = [
    { y: "2008", fr: "Création de Cristalu Maroc à Casablanca, atelier de 400 m².", ar: "تأسيس كريستالو المغرب بالدار البيضاء، ورشة بمساحة 400 م².", en: "Cristalu Maroc founded in Casablanca with a 400 m² workshop." },
    { y: "2012", fr: "Premier chantier tertiaire : 1 200 m² de menuiseries aluminium.", ar: "أول ورش للمكاتب: 1200 م² من نجاجير الألمنيوم.", en: "First commercial project: 1,200 m² of aluminium joinery." },
    { y: "2016", fr: "Déménagement en zone industrielle Sidi Ghanem, atelier de 3 500 m².", ar: "الانتقال إلى المنطقة الصناعية سيدي غانم، ورشة 3500 م².", en: "Move to Sidi Ghanem industrial zone, 3,500 m² workshop." },
    { y: "2019", fr: "Lancement de la gamme Momo Box et des pergolas bioclimatiques.", ar: "إطلاق مجموعة مومو بوكس والبرغولات البيومناخية.", en: "Launch of the Momo Box range and bioclimatic pergolas." },
    { y: "2023", fr: "Extension à 6 000 m² et nouvelle ligne de vitrage isolant.", ar: "التوسعة إلى 6000 م² وخط تزجيج عازل جديد.", en: "Expansion to 6,000 m² and new insulating glazing line." },
    { y: "2026", fr: "Certification ISO 9001:2015 et ERP de production intégré.", ar: "الحصول على شهادة ISO 9001:2015 ونظام ERP متكامل.", en: "ISO 9001:2015 certification and integrated production ERP." },
  ];

  const values = [
    { icon: Heart, t: t("about.v1"), d: t("about.v1d") },
    { icon: Target, t: t("about.v2"), d: t("about.v2d") },
    { icon: Building2, t: t("about.v3"), d: t("about.v3d") },
    { icon: Sparkles, t: t("about.v4"), d: t("about.v4d") },
  ];

  const factory = [t("about.f1"), t("about.f2"), t("about.f3"), t("about.f4"), t("about.f5"), t("about.f6")];

  const team = [
    { n: "Youssef El Amrani", r: locale === "ar" ? "المدير العام" : locale === "en" ? "Managing Director" : "Directeur général" },
    { n: "Nadia Berrada", r: locale === "ar" ? "مديرة الاستغلال" : locale === "en" ? "Operations Director" : "Directrice d'exploitation" },
    { n: "Karim Idrissi", r: locale === "ar" ? "المسؤول التجاري" : locale === "en" ? "Sales Director" : "Responsable commercial" },
    { n: "Rachid Tazi", r: locale === "ar" ? "مسؤول الإنتاج" : locale === "en" ? "Production Manager" : "Responsable production" },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        subtitle={t("about.intro")}
        image="/images/factory.jpg"
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("nav.about") }]}
      />

      {/* Mission / vision */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-ink-900/8 bg-ink-50 p-8">
              <Flag className="h-7 w-7 text-brand-600" />
              <h2 className="mt-5 font-display text-2xl font-bold text-ink-900">{t("about.missionTitle")}</h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-600">{t("about.missionText")}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full rounded-2xl bg-ink-900 p-8 text-white">
              <Target className="h-7 w-7 text-brand-500" />
              <h2 className="mt-5 font-display text-2xl font-bold">{t("about.visionTitle")}</h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/65">{t("about.visionText")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-ink-50 py-20 sm:py-24">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">2008 — 2026</span>
            <h2 className="section-title mt-3 text-ink-900">{t("about.timelineTitle")}</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timeline.map((e, i) => (
              <Reveal key={e.y} delay={i * 60}>
                <div className="group h-full rounded-xl border border-ink-900/8 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-card">
                  <p className="font-display text-3xl font-extrabold text-brand-600/85 transition group-hover:text-brand-600">{e.y}</p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-600">
                    {locale === "ar" ? e.ar : locale === "en" ? e.en : e.fr}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{t("about.valuesTitle")}</span>
            <h2 className="section-title mt-3 text-ink-900">{t("home.whySub")}</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.t} delay={i * 70}>
                <div className="h-full rounded-2xl border border-ink-900/8 p-6 text-center transition hover:border-brand-600/30 hover:shadow-card">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900 text-white">
                    <v.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900">{v.t}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Factory */}
      <section className="relative overflow-hidden bg-ink-950 py-20 sm:py-24">
        <div className="absolute inset-0 bg-grid opacity-25" style={{ backgroundSize: "48px 48px" }} aria-hidden />
        <div className="relative container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{t("about.factoryTitle")}</span>
            <h2 className="section-title mt-3 text-white">{t("stats.capacity")}: 6 000 m²</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {factory.map((f, i) => (
              <Reveal key={f} delay={i * 60}>
                <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.04] p-5 transition hover:border-brand-500/40 hover:bg-white/[.07]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 font-display text-[13px] font-bold text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14px] font-semibold text-white/85">{f}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{t("about.teamTitle")}</span>
            <h2 className="section-title mt-3 text-ink-900">120 {locale === "ar" ? "موظف" : locale === "en" ? "employees" : "collaborateurs"}</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <Reveal key={m.n} delay={i * 70}>
                <div className="rounded-2xl border border-ink-900/8 p-6 text-center transition hover:shadow-card">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-900 font-display text-lg font-bold text-white">
                    {m.n.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900">{m.n}</h3>
                  <p className="mt-1 text-[12.5px] text-ink-500">{m.r}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16">
            <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink-900 p-8 text-white sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-2xl font-bold">{t("home.ctaTitle")}</h3>
                <p className="mt-2 text-[14.5px] text-white/60">{t("home.ctaText")}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/devis" className="btn-primary btn-lg">
                  {t("nav.quote")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link href="/projects" className="btn-outline-light btn-lg">{t("hero.cta3")}</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
