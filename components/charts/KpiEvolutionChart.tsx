"use client";

/**
 * KpiEvolutionChart
 * Exibe a evolução de um indicador financeiro ao longo das rodadas
 * para cada empresa (multi-line recharts).
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KpiSeriesPoint = Record<string, any>;

interface Props {
  data: KpiSeriesPoint[];
  companies: Array<{ name: string; color: string }>;
  formatter?: (v: number) => string;
  yLabel?: string;
}

const CHART_COLORS = [
  "#22d3ee", // cyan
  "#34d399", // emerald
  "#a78bfa", // violet
  "#fb923c", // orange
  "#f472b6", // pink
  "#60a5fa", // blue
  "#facc15", // amber
  "#4ade80", // green
];

export function KpiEvolutionChart({ data, companies, formatter, yLabel }: Props) {
  if (!data.length || !companies.length) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500 text-sm">
        Dados insuficientes para o gráfico
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="round_name"
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatter ?? ((v) => String(v))}
          label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10 } : undefined}
        />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: 12 }}
          labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
          itemStyle={{ color: "#e2e8f0" }}
          formatter={(value, name) => [
            formatter ? formatter(Number(value)) : String(value),
            String(name),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "#cbd5e1" }}>{value}</span>}
        />
        {companies.map((c, idx) => (
          <Line
            key={c.name}
            type="monotone"
            dataKey={c.name}
            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
