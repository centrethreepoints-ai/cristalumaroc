import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { I18nProvider } from "@/i18n";
import { LOCALES, LOCALE_META, getDict, type Locale } from "@/i18n/core";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const loc = (LOCALES.includes(store.get("cm_locale")?.value as Locale) ? store.get("cm_locale")?.value : "fr") as Locale;
  const d = getDict(loc);
  return {
    title: { default: `${d.meta.brand} — ${d.meta.tagline}`, template: `%s · ${d.meta.brand}` },
    description: d.meta.description,
    keywords: ["aluminium maroc", "pvc maroc", "pergola bioclimatique", "momo box", "mur rideau", "menuiserie casablanca", "cristalu"],
    openGraph: { title: `${d.meta.brand} — ${d.meta.tagline}`, description: d.meta.description, type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#0B0B0E", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const raw = store.get("cm_locale")?.value as Locale;
  const locale: Locale = LOCALES.includes(raw) ? raw : "fr";
  const dir = LOCALE_META[locale].dir;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Poppins:wght@500;600;700;800&family=Cairo:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
