"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw, ShieldOff, TriangleAlert } from "lucide-react";

/**
 * Catches render errors inside the dashboard so staff see an actionable screen
 * instead of a raw 500. Permission denials are redirected upstream by
 * requirePerm and land on /app/no-access.
 */
export default function DashError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  const forbidden = /accès refusé|forbidden|no access/i.test(error.message ?? "");

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="card card-pad text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600">
          {forbidden ? <ShieldOff className="h-7 w-7" /> : <TriangleAlert className="h-7 w-7" />}
        </span>
        <h1 className="mt-4 font-display text-[20px] font-bold tracking-tight text-ink-900">
          {forbidden ? "Accès refusé" : "Une erreur est survenue"}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
          {error.message || "Erreur inattendue sur cette page."}
          {error.digest && (
            <span className="mt-1 block font-mono text-[11px] text-ink-400">ref {error.digest}</span>
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw className="h-4 w-4" />Réessayer
          </button>
          <Link href="/app/dashboard" className="btn-outline btn-sm">Tableau de bord</Link>
        </div>
      </div>
    </div>
  );
}
