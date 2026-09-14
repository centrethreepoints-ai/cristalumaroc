"use client";

import {
  DonutChart, GroupedBarChart, HorizontalBarChart, RevenueChart,
} from "@/components/dash/Charts";
import { useI18n } from "@/i18n";

/** Formatters must be a serializable token — functions cannot cross into a client component. */
export type Fmt = "money" | "compact" | "int";

export type ChartBoxProps = {
  revenue?: { data: { label: string; value: number }[]; fmt?: Fmt };
  quotes?: {
    data: { label: string; issued: number; accepted: number }[];
    issuedLabel: string;
    acceptedLabel: string;
  };
  donut?: { data: { name: string; value: number }[] };
  bars?: { data: { label: string; value: number }[]; fmt?: Fmt };
  payments?: {
    data: { label: string; paid: number; outstanding: number }[];
    paidLabel: string;
    outstandingLabel: string;
    fmt?: Fmt;
  };
};

/** Single chart surface — renders whichever series was supplied. */
export function ChartBox(props: ChartBoxProps) {
  const { compact, num } = useI18n();
  const fmt = (kind: Fmt = "int") => (n: number) =>
    kind === "money" ? `${compact(n)} MAD` : kind === "compact" ? compact(n) : num(n);

  if (props.revenue)
    return <RevenueChart data={props.revenue.data} label="CA" format={fmt(props.revenue.fmt)} />;

  if (props.quotes)
    return (
      <GroupedBarChart
        data={props.quotes.data}
        series={[
          { key: "issued", name: props.quotes.issuedLabel, color: "#A6A6B0" },
          { key: "accepted", name: props.quotes.acceptedLabel, color: "#E30613" },
        ]}
      />
    );

  if (props.donut) return <DonutChart data={props.donut.data} />;

  if (props.payments)
    return (
      <GroupedBarChart
        data={props.payments.data}
        format={fmt(props.payments.fmt)}
        series={[
          { key: "paid", name: props.payments.paidLabel, color: "#10B981" },
          { key: "outstanding", name: props.payments.outstandingLabel, color: "#E30613" },
        ]}
      />
    );

  if (props.bars) return <HorizontalBarChart data={props.bars.data} format={fmt(props.bars.fmt)} />;

  return null;
}
