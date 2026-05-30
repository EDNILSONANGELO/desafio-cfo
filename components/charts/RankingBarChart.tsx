"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { RankedResult } from "@/types";
import { number } from "@/lib/utils/format";

interface Props {
  results: RankedResult[];
}

const COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f87171", "#60a5fa", "#f472b6", "#4ade80"];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RankedResult & { score: number; scoreVal: number } }>;
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 text-sm shadow-xl">
        <p className="font-bold text-white">{d.company}</p>
        <p className="text-slate-400">{d.group}</p>
        <p className="mt-1 text-cyan-300">Score: {number(d.scoreVal ?? d.score, 1)} pts</p>
      </div>
    );
  }
  return null;
};

/** Abrevia nomes muito longos para caber no eixo X */
function abbrev(name: string, max = 14): string {
  if (!name) return "";
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}

/** Tick customizado com texto rotacionado — garante que o primeiro não seja cortado */
function CustomTick({
  x, y, payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const text = payload?.value ?? "";
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#94a3b8"
        fontSize={11}
        transform="rotate(-35)"
      >
        {text}
      </text>
    </g>
  );
}

export function RankingBarChart({ results }: Props) {
  const data = results.map((r, i) => ({
    ...r,
    name: abbrev(r.company || r.group, 14),
    scoreVal: Number(r.score.toFixed(1)),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 18, right: 16, left: 0, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="name"
          tick={<CustomTick />}
          axisLine={false}
          tickLine={false}
          interval={0}              /* mostra todos os ticks, sem pular */
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="scoreVal" radius={[8, 8, 0, 0]} maxBarSize={56}>
          <LabelList
            dataKey="scoreVal"
            position="top"
            style={{ fill: "#cbd5e1", fontSize: 10, fontWeight: 700 }}
          />
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
