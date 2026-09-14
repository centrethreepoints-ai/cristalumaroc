import { Reveal } from "./Reveal";

/** Minimal light header shared by every inner page of the public site. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
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
    <section className="relative bg-white pb-14 pt-32 sm:pb-20 sm:pt-40">
      <div className="container-x">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400" aria-label="Breadcrumb">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {b.href ? (
                  <a href={b.href} className="m-link transition hover:text-ink-950">{b.label}</a>
                ) : (
                  <span className="text-ink-950">{b.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span className="text-ink-900/20">/</span>}
              </span>
            ))}
          </nav>
        )}

        <p className="m-eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="m-display mt-4 max-w-5xl text-[clamp(2.4rem,6vw,4.6rem)] text-ink-950">
          <span className="m-line">
            <span className="m-line-in">{title}</span>
          </span>
        </h1>
        {subtitle && (
          <Reveal delay={150}>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-500 sm:text-[16.5px]">{subtitle}</p>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
