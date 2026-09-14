import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { PageHero } from "@/components/site/PageHero";
import { Configurator } from "@/components/site/Configurator";

export const metadata: Metadata = { title: "Configurateur" };

export default async function ConfigurateurPage() {
  const { locale } = await getI18n();
  return (
    <>
      <PageHero
        eyebrow={locale === "ar" ? "أداة" : locale === "en" ? "Tool" : "Outil"}
        title={locale === "ar" ? "المُهيّئ" : locale === "en" ? "Configurator" : "Configurateur"}
        subtitle={
          locale === "ar"
            ? "صمّم نافذتك أو بابك أو pergola أو Momo Box واحصل على عرض سعر."
            : locale === "en"
              ? "Design your window, door, pergola or Momo Box and request a quote."
              : "Composez votre fenêtre, porte, pergola ou Momo Box et demandez un devis."
        }
        breadcrumb={[
          { label: locale === "ar" ? "الرئيسية" : locale === "en" ? "Home" : "Accueil", href: "/" },
          { label: locale === "ar" ? "المُهيّئ" : locale === "en" ? "Configurator" : "Configurateur" },
        ]}
      />
      <Configurator locale={locale} />
    </>
  );
}
