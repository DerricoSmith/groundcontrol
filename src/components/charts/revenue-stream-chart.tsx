"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { RevenueStreamPoint } from "@/lib/types";
import { streamMeta } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: keyof typeof streamMeta }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-xl border border-border bg-popover px-4 py-3 shadow-lg">
      <p className="mb-1.5 text-[12px] font-medium text-text-muted">{label}</p>
      <p className="mb-1.5 text-[13px] font-semibold text-text-primary">{formatCurrency(total)} total</p>
      <div className="space-y-0.5">
        {payload
          .slice()
          .reverse()
          .map((p) => (
            <p key={p.dataKey} className="flex items-center gap-1.5 text-[12px] text-text-secondary">
              <span className="h-2 w-2 rounded-full" style={{ background: streamMeta[p.dataKey].color }} />
              {streamMeta[p.dataKey].label}
              <span className="ml-auto pl-3 font-medium tabular-nums text-text-primary">{formatCurrency(p.value)}</span>
            </p>
          ))}
      </div>
    </div>
  );
}

export function RevenueStreamChart({ data, height = 300 }: { data: RevenueStreamPoint[]; height?: number }) {
  const keys = Object.keys(streamMeta) as (keyof typeof streamMeta)[];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={streamMeta[k].color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={streamMeta[k].color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          width={52}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-[12.5px] text-text-secondary">{streamMeta[value as keyof typeof streamMeta].label}</span>
          )}
          wrapperStyle={{ paddingTop: 12 }}
        />
        {keys.map((k) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stackId="1"
            stroke={streamMeta[k].color}
            strokeWidth={1.5}
            fill={`url(#fill-${k})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
