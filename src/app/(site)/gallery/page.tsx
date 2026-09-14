import { getI18n } from "@/i18n/server";
import { getGallery, getGalleryCategories } from "@/lib/queries";
import { PageHero } from "@/components/site/PageHero";
import { Img } from "@/components/site/Img";
import { Reveal } from "@/components/site/Reveal";

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { t } = await getI18n();
  const { cat } = await searchParams;
  const categories = getGalleryCategories();
  const images = getGallery(cat);

  return (
    <>
      <PageHero
        eyebrow={t("nav.gallery")}
        title={t("gallery.title")}
        subtitle={t("gallery.subtitle")}
        image="/images/ranges/glass.jpg"
        breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("nav.gallery") }]}
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x">
          <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <Chip href="/gallery" active={!cat || cat === "all"} label={t("common.all")} />
            {categories.map((c) => (
              <Chip key={c.category} href={`/gallery?cat=${encodeURIComponent(c.category)}`} active={cat === c.category} label={c.category} />
            ))}
          </div>

          <div className="mt-10 columns-2 gap-4 md:columns-3 lg:columns-4">
            {images.map((img, i) => (
              <Reveal key={img.id} delay={(i % 8) * 45} className="mb-4 break-inside-avoid">
                <figure className="group relative overflow-hidden rounded-xl border border-ink-900/8">
                  <Img src={img.src} alt={img.alt ?? ""} ratio={i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/3"} />
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink-950 to-transparent p-4 text-[12px] font-semibold text-white transition-transform duration-300 group-hover:translate-y-0">
                    {img.alt}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>

          {images.length === 0 && <p className="py-20 text-center text-ink-400">{t("common.noResults")}</p>}
        </div>
      </section>
    </>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={
        "inline-flex shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition " +
        (active ? "bg-ink-900 text-white" : "border border-ink-900/12 text-ink-600 hover:border-ink-900/30 hover:text-ink-900")
      }
    >
      {label}
    </a>
  );
}
