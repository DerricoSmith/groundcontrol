"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { RevenueStreamPoint } from "@/lib/types";
import { streamMeta } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export function StreamBreakdownDonut({ data, height = 200 }: { data: RevenueStreamPoint[]; height?: number }) {
  const keys = Object.keys(streamMeta) as (keyof typeof streamMeta)[];
  const totals = keys.map((k) => ({
    key: k,
    label: streamMeta[k].label,
    color: streamMeta[k].color,
    value: data.reduce((s, d) => s + d[k], 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={totals} dataKey="value" nameKey="label" innerRadius="60%" outerRadius="92%" paddingAngle={3} stroke="none">
          {totals.map((entry) => (
            <Cell key={entry.key} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const d = payload[0].payload as (typeof totals)[number];
            return (
              <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 shadow-lg">
                <p className="text-[12px] font-medium text-text-muted">{d.label}</p>
                <p className="text-[14px] font-semibold text-text-primary tabular-nums">{formatCurrency(d.value)}</p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
