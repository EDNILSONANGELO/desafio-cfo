import type { RankedResult } from "@/types";

export interface MedalData {
  group_id: number;
  type: string;
  description: string;
  icon: string;
}

export function assignMedals(results: RankedResult[]): MedalData[] {
  if (!results.length) return [];

  const medals: MedalData[] = [];

  // 1st place – Melhor CFO
  const first = results.find((r) => r.position === 1);
  if (first) {
    medals.push({
      group_id: first.companyId,
      type: "melhor_cfo",
      description: `🏆 Melhor CFO – ${first.company} venceu a rodada com score ${first.score.toFixed(1)}`,
      icon: "🏆",
    });
  }

  // Best liquidity (currentRatio)
  const bestLiquidity = [...results].sort(
    (a, b) => b.currentRatio - a.currentRatio
  )[0];
  if (bestLiquidity) {
    medals.push({
      group_id: bestLiquidity.companyId,
      type: "melhor_liquidez",
      description: `💧 Melhor Liquidez – ${bestLiquidity.company} (LC ${bestLiquidity.currentRatio.toFixed(2)})`,
      icon: "💧",
    });
  }

  // Best ROA
  const bestRoa = [...results].sort((a, b) => b.roa - a.roa)[0];
  if (bestRoa) {
    medals.push({
      group_id: bestRoa.companyId,
      type: "melhor_roa",
      description: `📈 Melhor Rentabilidade (ROA) – ${bestRoa.company} (${bestRoa.roa.toFixed(2)}%)`,
      icon: "📈",
    });
  }

  // Best net margin
  const bestMargin = [...results].sort((a, b) => b.netMargin - a.netMargin)[0];
  if (bestMargin) {
    medals.push({
      group_id: bestMargin.companyId,
      type: "melhor_margem",
      description: `💰 Melhor Margem Líquida – ${bestMargin.company} (${bestMargin.netMargin.toFixed(2)}%)`,
      icon: "💰",
    });
  }

  // Best cash cycle (shortest)
  const bestCycle = [...results].sort(
    (a, b) => a.cashCycle - b.cashCycle
  )[0];
  if (bestCycle) {
    medals.push({
      group_id: bestCycle.companyId,
      type: "melhor_ciclo",
      description: `⚡ Melhor Eficiência Operacional – ${bestCycle.company} (Ciclo ${bestCycle.cashCycle.toFixed(0)} dias)`,
      icon: "⚡",
    });
  }

  // Most revenue (market share leader)
  const bestRevenue = [...results].sort((a, b) => b.netRevenue - a.netRevenue)[0];
  if (bestRevenue) {
    medals.push({
      group_id: bestRevenue.companyId,
      type: "lider_vendas",
      description: `🎯 Líder de Mercado – ${bestRevenue.company} maior receita líquida`,
      icon: "🎯",
    });
  }

  return medals;
}
