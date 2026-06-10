import type { SimulationResult, RankedResult } from "@/types";

// ─── Pesos padrão do score ────────────────────────────────────────────────────
export const DEFAULT_WEIGHTS = {
  currentRatio:    0.20,   // Liquidez Corrente  20%
  quickRatio:      0.15,   // Liquidez Seca      15%
  immediateRatio:  0.15,   // Liquidez Imediata  15%
  roa:             0.25,   // ROA                25%
  netMargin:       0.15,   // Margem Líquida     15%
  cashCycle:       0.10,   // Ciclo Financeiro   10%
};

export type ScoreWeights = typeof DEFAULT_WEIGHTS;

// ─── Metas configuráveis dos indicadores ─────────────────────────────────────
// Cada meta define o valor mínimo para atingir 100 pontos naquele indicador.
// O multiplicador é calculado automaticamente: multiplicador = 100 ÷ meta.
export interface ScoreTargets {
  currentRatio:   number;  // LC   ≥ meta → 100 pts  (padrão: 1,5)
  quickRatio:     number;  // LS   ≥ meta → 100 pts  (padrão: 1,5)
  immediateRatio: number;  // LI   ≥ meta → 100 pts  (padrão: 1,5)
  roa:            number;  // ROA  ≥ meta → 100 pts  (padrão: 20%)
  netMargin:      number;  // ML   ≥ meta → 100 pts  (padrão: 33,33%)
  cashCycle:      number;  // Ciclo ≤ meta → 100 pts (padrão: 0 dias)
}

export const DEFAULT_SCORE_TARGETS: ScoreTargets = {
  currentRatio:   1.5,
  quickRatio:     1.5,
  immediateRatio: 1.5,
  roa:            20,
  netMargin:      33.33,
  cashCycle:      0,
};

/**
 * Converte uma meta em multiplicador linear.
 * Fórmula: multiplicador = 100 ÷ meta
 * Exemplo: meta 1,5 → multiplicador 66,67
 */
export function targetToMultiplier(target: number): number {
  return target > 0 ? 100 / target : 100;
}

/**
 * Retorna os multiplicadores para todos os indicadores lineares
 * a partir das metas configuradas.
 */
export function buildMultipliers(targets: ScoreTargets) {
  return {
    currentRatio:   targetToMultiplier(targets.currentRatio),
    quickRatio:     targetToMultiplier(targets.quickRatio),
    immediateRatio: targetToMultiplier(targets.immediateRatio),
    roa:            targetToMultiplier(targets.roa),
    netMargin:      targetToMultiplier(targets.netMargin),
  };
}

// ─── Multiplicadores estáticos derivados dos DEFAULT_SCORE_TARGETS ───────────
// Mantidos para compatibilidade com componentes que não recebem targets.
// LC / LS / LI: 100 ÷ 1,5 = 66,67
// ROA:          100 ÷ 20  = 5
// ML:           100 ÷ 33,33 = 3
export const SCORE_MULTIPLIERS = {
  currentRatio:   parseFloat((100 / DEFAULT_SCORE_TARGETS.currentRatio).toFixed(4)),
  quickRatio:     parseFloat((100 / DEFAULT_SCORE_TARGETS.quickRatio).toFixed(4)),
  immediateRatio: parseFloat((100 / DEFAULT_SCORE_TARGETS.immediateRatio).toFixed(4)),
  roa:            parseFloat((100 / DEFAULT_SCORE_TARGETS.roa).toFixed(4)),
  netMargin:      parseFloat((100 / DEFAULT_SCORE_TARGETS.netMargin).toFixed(4)),
} as const;

// ─── Cálculo do score de uma empresa ─────────────────────────────────────────
export function scoreResult(
  result: SimulationResult,
  maxRevenue: number,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  targets?: Partial<ScoreTargets>
): number {
  const t: ScoreTargets = { ...DEFAULT_SCORE_TARGETS, ...(targets ?? {}) };
  const m = buildMultipliers(t);

  // Ciclo Financeiro: ≤ meta = 100 pts; cada dia acima da meta reduz 1 pt (mín 0)
  const normalizedCycle = Math.max(0, 100 - Math.max(0, result.cashCycle - t.cashCycle));
  const marketShare = maxRevenue ? (result.netRevenue / maxRevenue) * 100 : 0;

  return (
    Math.min(result.currentRatio                * m.currentRatio,   100) * weights.currentRatio +
    Math.min(result.quickRatio                  * m.quickRatio,     100) * weights.quickRatio +
    Math.min(Math.max(result.immediateRatio, 0) * m.immediateRatio, 100) * weights.immediateRatio +
    Math.min(Math.max(result.roa, 0)            * m.roa,            100) * weights.roa +
    Math.min(Math.max(result.netMargin, 0)      * m.netMargin,      100) * weights.netMargin +
    normalizedCycle                                                       * weights.cashCycle +
    marketShare * 0.05   // bônus de market share (fixo, não entra nos 100%)
  );
}

// ─── Ranking de empresas ──────────────────────────────────────────────────────
export function rankResults(
  results: SimulationResult[],
  weights?: Partial<ScoreWeights>,
  targets?: Partial<ScoreTargets>
): RankedResult[] {
  if (!results.length) return [];

  const w: ScoreWeights = { ...DEFAULT_WEIGHTS, ...(weights ?? {}) };
  const maxRevenue = Math.max(...results.map((r) => r.netRevenue), 1);

  return results
    .map((r) => ({
      ...r,
      marketShare: (r.netRevenue / maxRevenue) * 100,
      score: scoreResult(r, maxRevenue, w, targets),
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, position: i + 1 }));
}

// ─── Classificação acadêmica ──────────────────────────────────────────────────

/** Representa um nível de classificação acadêmica configurável pelo professor */
export interface GradeLevel {
  minScore: number; // score mínimo para atingir este nível
  grade: string;    // símbolo do grau: "AAA", "AA", "A", "B", "C", "D"
  label: string;    // conceito textual: "Excelente", "Muito Bom", ...
  nota: number;     // nota em escala 0–10
  color: string;    // classe Tailwind (atribuída por posição, não armazenada no BD)
}

/** Escala padrão — 6 níveis, do melhor ao pior */
export const DEFAULT_GRADE_SCALE: GradeLevel[] = [
  { minScore: 75, grade: "AAA", label: "Excelente", nota: 10.0, color: "text-emerald-400" },
  { minScore: 60, grade: "AA",  label: "Muito Bom",  nota:  8.5, color: "text-cyan-400"    },
  { minScore: 45, grade: "A",   label: "Bom",        nota:  7.0, color: "text-sky-400"     },
  { minScore: 30, grade: "B",   label: "Regular",    nota:  5.5, color: "text-amber-400"   },
  { minScore: 15, grade: "C",   label: "Fraco",      nota:  4.0, color: "text-orange-400"  },
  { minScore:  0, grade: "D",   label: "Crítico",    nota:  2.0, color: "text-rose-400"    },
];

/** Cores padrão por posição (nível 0 = melhor, nível 5 = pior) */
export const GRADE_COLORS = DEFAULT_GRADE_SCALE.map((g) => g.color);

/**
 * Monta uma GradeLevel[] a partir de dados armazenados no BD (sem color).
 * As cores são atribuídas por posição (ordem decrescente de minScore).
 */
export function buildGradeScale(
  stored: Omit<GradeLevel, "color">[]
): GradeLevel[] {
  return [...stored]
    .sort((a, b) => b.minScore - a.minScore)
    .map((g, i) => ({ ...g, color: GRADE_COLORS[i] ?? "text-slate-400" }));
}

/**
 * Retorna o nível de classificação acadêmica para um score dado.
 * Aceita escala customizada (padrão: DEFAULT_GRADE_SCALE).
 */
export function getScoreGrade(
  score: number,
  scale: GradeLevel[] = DEFAULT_GRADE_SCALE
): GradeLevel {
  const sorted = [...scale].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((g) => score >= g.minScore) ?? sorted[sorted.length - 1];
}
