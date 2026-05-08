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
} from "recharts";
import type { RankedResult } from "@/types";
import { number } from "@/lib/utils/format";

interface Props {
  results: RankedResult[];
}

const COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f87171", "#60a5fa", "#f472b6", "#4ade80"];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: RankedResult & { score: number } }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 text-sm shadow-xl">
        <p className="font-bold text-white">{d.company}</p>
        <p className="text-slate-400">{d.group}</p>
        <p className="mt-1 text-cyan-300">Score: {number(d.score, 1)}</p>
      </div>
    );
  }
  return null;
};

export function RankingBarChart({ results }: Props) {
  const data = results.map((r) => ({
    ...r,
    name: r.group.replace("Grupo ", "G"),
    scoreVal: Number(r.score.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="scoreVal" radius={[10, 10, 0, 0]} maxBarSize={60}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
