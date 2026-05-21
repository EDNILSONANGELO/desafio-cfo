"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import type { RankedResult } from "@/types";
import { currency, percent, number } from "@/lib/utils/format";
import { getScoreGrade, DEFAULT_GRADE_SCALE } from "@/lib/simulation/scoring";
import type { GradeLevel } from "@/lib/simulation/scoring";

interface Props {
  results: RankedResult[];
  gradeScale?: GradeLevel[];
  hideGrade?: boolean;
}

const positionColors = [
  "text-amber-400",  // 1st
  "text-slate-300",  // 2nd
  "text-amber-600",  // 3rd
];

const medals = ["🥇", "🥈", "🥉"];

/** Normaliza o nome de empresa — substitui "Grupo N" genérico por "Equipe sem nome" */
function displayCompany(name: string | undefined | null): string {
  const n = name?.trim();
  if (!n || /^Grupo\s+\d+$/i.test(n)) return "Equipe sem nome";
  return n;
}

export function RankingTable({ results, gradeScale = DEFAULT_GRADE_SCALE, hideGrade = false }: Props) {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Trophy className="mb-3 h-10 w-10 opacity-40" />
        <p className="text-sm">Nenhum resultado disponível ainda</p>
        <p className="text-xs text-slate-500">Processe uma rodada para ver o ranking</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Empresa</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Score</th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-slate-400 md:table-cell">Lucro Líquido</th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-slate-400 lg:table-cell">Liquidez</th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-slate-400 lg:table-cell">ROA</th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-slate-400 xl:table-cell">Market Share</th>
            {!hideGrade && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Grau</th>}
            {!hideGrade && <th className="hidden px-4 py-3 text-center text-xs font-semibold text-slate-400 sm:table-cell">Nota</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => {
            const grade = getScoreGrade(r.score, gradeScale);
            return (
              <motion.tr
                key={r.companyId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-white/5 transition-colors hover:bg-white/5"
              >
                <td className="px-4 py-3">
                  <span className={`text-xl ${positionColors[idx] || "text-slate-500"}`}>
                    {medals[idx] || `${r.position}º`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-white">{displayCompany(r.company)}</p>
                  <p className="text-xs text-slate-400">{displayCompany(r.group)} • {r.region}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all"
                        style={{ width: `${Math.min(r.score, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-white">{number(r.score, 1)}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  <span className={r.netProfit >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                    {currency(r.netProfit)}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right text-white lg:table-cell">
                  {number(r.currentRatio)}
                </td>
                <td className="hidden px-4 py-3 text-right text-white lg:table-cell">
                  {percent(r.roa)}
                </td>
                <td className="hidden px-4 py-3 text-right xl:table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-3 w-3 text-cyan-400" />
                    <span className="text-white">{number(r.marketShare, 1)}%</span>
                  </div>
                </td>
                {!hideGrade && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center leading-tight">
                      <span className={`font-black ${grade.color}`}>{grade.grade}</span>
                      <span className="text-[10px] text-slate-500">{grade.label}</span>
                    </div>
                  </td>
                )}
                {!hideGrade && (
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <span className={`text-sm font-black ${grade.color}`}>{grade.nota.toFixed(1)}</span>
                  </td>
                )}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
