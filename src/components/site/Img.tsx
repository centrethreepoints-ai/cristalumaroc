"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Image with a branded fallback. Keeps the site presentable even when an
 * asset is missing, which matters for a catalogue driven by the database.
 */
export function Img({
  src,
  alt,
  className,
  ratio,
  label,
  priority,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  ratio?: string;
  label?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  return (
    <div
      className={cn("relative overflow-hidden bg-ink-850", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <Fallback alt={alt} label={label} />
      )}
    </div>
  );
}

function Fallback({ alt, label }: { alt: string; label?: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[radial-gradient(120%_120%_at_20%_0%,#232329_0%,#0B0B0E_60%)]">
      <div
        className="absolute inset-0 opacity-[0.35] bg-grid"
        style={{ backgroundSize: "34px 34px" }}
        aria-hidden
      />
      <div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/25 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 px-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 font-display text-lg font-bold text-white">
          C
        </div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/80">
          {label ?? "Cristalu Maroc"}
        </p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/40">{alt}</p>
      </div>
    </div>
  );
}
