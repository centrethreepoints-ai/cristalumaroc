"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * Recharts is client-only and adds ~150 kB, so the chart bundle is loaded
 * lazily with a skeleton placeholder instead of blocking the dashboard.
 */
const ChartBox = dynamic(() => import("./ChartBox").then((m) => m.ChartBox), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-lg bg-ink-50">
      <Loader2 className="h-5 w-5 animate-spin text-ink-300" />
    </div>
  ),
});

type Props = Record<string, any>;

export function Charts(props: Props) {
  return <ChartBox {...props} />;
}
