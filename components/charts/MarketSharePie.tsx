"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RankedResult } from "@/types";
import { currency } from "@/lib/utils/format";

interface Props {
  results: RankedResult[];
}

const COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f87171", "#60a5fa", "#f472b6", "#4ade80"];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; revenue: number } }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 text-sm shadow-xl">
        <p className="font-bold text-white">{d.name}</p>
        <p className="text-cyan-300">{d.value.toFixed(1)}% do mercado</p>
        <p className="text-slate-400">{currency(d.revenue)}</p>
      </div>
    );
  }
  return null;
};

export function MarketSharePie({ results }: Props) {
  const data = results.map((r) => ({
    name: r.group,
    value: Number(r.marketShare.toFixed(1)),
    revenue: r.netRevenue,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius="50%"
          outerRadius="75%"
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-slate-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
