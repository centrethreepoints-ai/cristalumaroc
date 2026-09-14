import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";

export default async function ContactPage() {
  const { t } = await getI18n();

  const info = [
    { icon: MapPin, k: t("contact.addressLabel"), v: "Zone Industrielle Sidi Ghanem, Lot 42\nCasablanca 20250, Maroc" },
    { icon: Phone, k: t("contact.phoneLabel"), v: "+212 522 98 45 12", href: "tel:+212522984512" },
    { icon: Mail, k: t("contact.emailLabel"), v: "contact@cristalu.ma", href: "mailto:contact@cristalu.ma" },
    { icon: Clock, k: t("contact.hoursLabel"), v: t("contact.hours") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("nav.contact")}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        image="/images/ranges/partitions.jpg"
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("nav.contact") }]}
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-8 lg:grid-cols-[340px_1fr] lg:gap-10">
          <aside className="space-y-4">
            {info.map((i) => (
              <Reveal key={i.k}>
                <div className="flex gap-4 rounded-2xl border border-ink-900/8 bg-white p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-white">
                    <i.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{i.k}</p>
                    {i.href ? (
                      <a
                        href={i.href}
                        dir="ltr"
                        className="mt-1 block text-[14px] font-semibold text-ink-900 hover:text-brand-600"
                      >
                        {i.v}
                      </a>
                    ) : (
                      <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-700">{i.v}</p>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={120}>
              <div className="overflow-hidden rounded-2xl border border-ink-900/8">
                <div className="relative h-52 bg-ink-850">
                  <div className="absolute inset-0 bg-grid opacity-40" style={{ backgroundSize: "28px 28px" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                    <MapPin className="h-7 w-7 text-brand-600" />
                    <p className="font-display text-[15px] font-bold text-white">{t("contact.factoryLabel")}</p>
                    <p className="px-6 text-[12px] leading-relaxed text-white/50">
                      Sidi Ghanem · Casablanca
                    </p>
                    <a
                      href="https://maps.google.com/?q=Sidi+Ghanem+Casablanca"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 rounded-md border border-white/20 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-brand-600 hover:border-brand-600"
                    >
                      Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </aside>

          <Reveal delay={80}>
            <div className="rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card sm:p-10">
              <h2 className="font-display text-2xl font-bold text-ink-900">{t("contact.formTitle")}</h2>
              <p className="mt-2 text-[14px] text-ink-500">{t("contact.subtitle")}</p>

              <form className="mt-8 grid gap-4 sm:grid-cols-2" action="mailto:contact@cristalu.ma" method="post" encType="text/plain">
                <div>
                  <label className="label">{t("quote.name")} *</label>
                  <input name="name" required className="input" />
                </div>
                <div>
                  <label className="label">{t("quote.company")}</label>
                  <input name="company" className="input" />
                </div>
                <div>
                  <label className="label">{t("quote.email")} *</label>
                  <input name="email" type="email" required className="input" dir="ltr" />
                </div>
                <div>
                  <label className="label">{t("quote.phone")}</label>
                  <input name="phone" type="tel" className="input" dir="ltr" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{t("contact.subject")} *</label>
                  <select name="subject" required className="select">
                    <option value="devis">{t("nav.quote")}</option>
                    <option value="chantier">{t("nav.projects")}</option>
                    <option value="sav">SAV</option>
                    <option value="partenariat">{t("purchasing.title")}</option>
                    <option value="autre">{t("finance.other")}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{t("contact.message")} *</label>
                  <textarea name="message" rows={6} required className="input resize-y" />
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 border-t border-ink-900/8 pt-6">
                  <button type="submit" className="btn-primary btn-lg">
                    <Send className="h-4 w-4" /> {t("contact.send")}
                  </button>
                  <p className="text-[12px] text-ink-400">{t("contact.hours")}</p>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
