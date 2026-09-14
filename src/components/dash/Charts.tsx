"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const RED = "#E30613";
const INK = "#0B0B0E";
const GREY = "#A6A6B0";

const PIE_COLORS = ["#E30613", "#0B0B0E", "#55555F", "#A6A6B0", "#D4D4DB", "#F5252F", "#BF0410", "#7A7A86"];

const axis = { fontSize: 11, fill: "#7A7A86" } as const;

function Tip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 shadow-lift">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-800">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          {p.name}: <span className="tnum">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, label, format }: { data: any[]; label: string; format: (n: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={RED} stopOpacity={0.32} />
            <stop offset="100%" stopColor={RED} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#0B0B0E" strokeOpacity={0.06} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "#0B0B0E", strokeOpacity: 0.08 }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => format(v)} width={54} />
        <Tooltip content={<Tip formatter={format} />} />
        <Area type="monotone" dataKey="value" name={label} stroke={RED} strokeWidth={2.5} fill="url(#revGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GroupedBarChart({
  data,
  series,
  format,
}: {
  data: any[];
  series: { key: string; name: string; color: string }[];
  format?: (n: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0B0B0E" strokeOpacity={0.06} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "#0B0B0E", strokeOpacity: 0.08 }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={46} allowDecimals={false} />
        <Tooltip content={<Tip formatter={format} />} cursor={{ fill: "#0B0B0E", fillOpacity: 0.035 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={26} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, format }: { data: { name: string; value: number }[]; format?: (n: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<Tip formatter={format} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({ data, format }: { data: any[]; format?: (n: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0B0B0E" strokeOpacity={0.06} horizontal={false} />
        <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" tick={{ ...axis, fontSize: 11 }} tickLine={false} axisLine={false} width={118} />
        <Tooltip content={<Tip formatter={format} />} cursor={{ fill: "#0B0B0E", fillOpacity: 0.035 }} />
        <Bar dataKey="value" name="Total" fill={INK} radius={[0, 3, 3, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data, series }: { data: any[]; series: { key: string; name: string; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0B0B0E" strokeOpacity={0.06} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "#0B0B0E", strokeOpacity: 0.08 }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={46} allowDecimals={false} />
        <Tooltip content={<Tip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export const CHART_GREY = GREY;
