import type { SimulationResult, RankedResult } from "@/types";

// Scoring weights as defined in the spec
const WEIGHTS = {
  currentRatio: 0.20,
  quickRatio: 0.15,
  immediateRatio: 0.15,
  roa: 0.25,
  netMargin: 0.15,
  cashCycle: 0.10,
};

export function scoreResult(result: SimulationResult, maxRevenue: number): number {
  const normalizedCycle = Math.max(0, 100 - Math.max(0, result.cashCycle));
  const marketShare = maxRevenue ? (result.netRevenue / maxRevenue) * 100 : 0;

  return (
    Math.min(result.currentRatio * 20, 100) * WEIGHTS.currentRatio +
    Math.min(result.quickRatio * 22, 100) * WEIGHTS.quickRatio +
    Math.min(Math.max(result.immediateRatio, 0) * 30, 100) * WEIGHTS.immediateRatio +
    Math.min(Math.max(result.roa, 0) * 5, 100) * WEIGHTS.roa +
    Math.min(Math.max(result.netMargin, 0) * 3, 100) * WEIGHTS.netMargin +
    normalizedCycle * WEIGHTS.cashCycle +
    marketShare * 0.05 // bonus de market share
  );
}

export function rankResults(
  results: SimulationResult[]
): RankedResult[] {
  if (!results.length) return [];

  const maxRevenue = Math.max(...results.map((r) => r.netRevenue), 1);

  return results
    .map((r) => ({
      ...r,
      marketShare: (r.netRevenue / maxRevenue) * 100,
      score: scoreResult(r, maxRevenue),
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, position: i + 1 }));
}

// Company score classification (AAA–C)
export function getScoreGrade(score: number): {
  grade: string;
  label: string;
  color: string;
} {
  if (score >= 75) return { grade: "AAA", label: "Excelente", color: "text-emerald-400" };
  if (score >= 60) return { grade: "AA", label: "Muito Bom", color: "text-cyan-400" };
  if (score >= 45) return { grade: "A", label: "Bom", color: "text-sky-400" };
  if (score >= 30) return { grade: "B", label: "Regular", color: "text-amber-400" };
  if (score >= 15) return { grade: "C", label: "Fraco", color: "text-orange-400" };
  return { grade: "D", label: "Crítico", color: "text-rose-400" };
}
