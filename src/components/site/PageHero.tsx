import { Img } from "./Img";
import { Reveal } from "./Reveal";

/** Dark editorial header shared by every inner page of the public site. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  breadcrumb,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image?: string;
  breadcrumb?: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 pb-16 pt-14 sm:pb-20 sm:pt-20">
      {image && <Img src={image} alt={title} className="absolute inset-0 h-full w-full opacity-25" priority />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,.72)_0%,rgba(8,8,10,.92)_70%,#08080A_100%)]" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-25" style={{ backgroundSize: "48px 48px" }} aria-hidden />
      <div className="pointer-events-none absolute -end-32 top-0 h-80 w-80 rounded-full bg-brand-600/20 blur-[120px]" aria-hidden />

      <div className="relative container-x">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-[12px] text-white/45" aria-label="Breadcrumb">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {b.href ? (
                  <a href={b.href} className="transition hover:text-white">{b.label}</a>
                ) : (
                  <span className="text-white/70">{b.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span className="text-white/25">/</span>}
              </span>
            ))}
          </nav>
        )}

        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight text-white text-balance">
            {title}
          </h1>
          {subtitle && <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/60 sm:text-[16.5px]">{subtitle}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
