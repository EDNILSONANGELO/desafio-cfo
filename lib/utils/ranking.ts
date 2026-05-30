/**
 * Ajuste 9 — Fonte centralizada de dados de ranking.
 *
 * Fornece uma função única `buildRanking` que normaliza StoredResult[]
 * em um formato consistente para exibição em qualquer parte da aplicação.
 */

import type { StoredResult, RankedResult } from "@/types";

export interface RankingEntry {
  position: number;
  score: number;
  groupId: number;
  group: string;
  company: string;
  region: string;
  netRevenue: number;
  netProfit: number;
  netMargin: number;
  currentRatio: number;
  marketShare: number;
  roa: number;
  roe: number;
  cashCycle: number;
  result: RankedResult;
}

/**
 * Normaliza uma lista de StoredResult em RankingEntry[] ordenado por posição.
 * Fonte de verdade única para todos os componentes de ranking.
 */
export function buildRanking(results: StoredResult[]): RankingEntry[] {
  return results
    .map((sr) => {
      const r = sr.data as RankedResult;
      return {
        position:     r.position     ?? sr.position,
        score:        r.score        ?? sr.score,
        groupId:      r.companyId    ?? sr.group_id,
        group:        r.group        ?? "",
        company:      r.company      ?? "",
        region:       r.region       ?? "",
        netRevenue:   r.netRevenue   ?? 0,
        netProfit:    r.netProfit    ?? 0,
        netMargin:    r.netMargin    ?? 0,
        currentRatio: r.currentRatio ?? 0,
        marketShare:  r.marketShare  ?? 0,
        roa:          r.roa          ?? 0,
        roe:          r.roe          ?? 0,
        cashCycle:    r.cashCycle    ?? 0,
        result:       r,
      };
    })
    .sort((a, b) => a.position - b.position);
}

/**
 * Retorna a posição de um grupo específico no ranking.
 */
export function getGroupPosition(
  results: StoredResult[],
  groupId: number
): number | null {
  const ranking = buildRanking(results);
  const entry = ranking.find((e) => e.groupId === groupId);
  return entry?.position ?? null;
}
