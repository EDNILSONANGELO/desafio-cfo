"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { currency } from "@/lib/utils/format";

interface EvolutionPoint {
  round: string;
  [company: string]: number | string;
}

interface Props {
  data: EvolutionPoint[];
  companies: { name: string; color: string }[];
}

const COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f87171", "#60a5fa"];

export function ProfitEvolution({ data, companies }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Nenhum dado de evolução disponível
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="round" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [currency(Number(value ?? 0)), ""]}
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
          }}
          labelStyle={{ color: "#fff" }}
        />
        <Legend formatter={(v) => <span className="text-xs text-slate-300">{v}</span>} />
        {companies.map((c, i) => (
          <Line
            key={c.name}
            type="monotone"
            dataKey={c.name}
            stroke={c.color || COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: c.color || COLORS[i % COLORS.length] }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
