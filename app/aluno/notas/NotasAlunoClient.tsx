"use client";

import { GraduationCap, BarChart3, Trophy, TrendingUp, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { number, percent, currency } from "@/lib/utils/format";
import {
  getScoreGrade,
  buildGradeScale,
  DEFAULT_GRADE_SCALE,
  DEFAULT_WEIGHTS,
  DEFAULT_SCORE_TARGETS,
  buildMultipliers,
  type GradeLevel,
  type ScoreWeights,
  type ScoreTargets,
} from "@/lib/simulation/scoring";
import type { StoredResult, RankedResult, SessionPayload, GradeAdjustment } from "@/types";

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  session: SessionPayload;
  groupResults: (StoredResult & { round?: { id: number; name: string; event_type: string; processed_at: string } })[];
  adjustments: GradeAdjustment[];
  gradeScaleRaw?: unknown[];
  scoreWeightsRaw?: unknown;
  scoreTargetsRaw?: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const BG_MAP: Record<string, string> = {
  "text-emerald-400": "bg-emerald-500/10 border-emerald-500/30",
  "text-cyan-400":    "bg-cyan-500/10 border-cyan-500/30",
  "text-sky-400":     "bg-sky-500/10 border-sky-500/30",
  "text-amber-400":   "bg-amber-500/10 border-amber-500/30",
  "text-orange-400":  "bg-orange-500/10 border-orange-500/30",
  "text-rose-400":    "bg-rose-500/10 border-rose-500/30",
};

// ── Builders dinâmicos (dependem das metas configuradas pelo professor) ────────

type ScoreCriterion = {
  key:       keyof ScoreWeights;
  label:     string;
  desc:      string;
  unit:      string;
  toPoints:  (v: number) => number;
  formatVal: (v: number) => string;
};

/** Gera os limiares de pontuação máxima por indicador com base nas metas ativas */
function buildScoreThresholds(m: ReturnType<typeof buildMultipliers>, t: ScoreTargets) {
  const fmt = (n: number, dec = 1) => n.toFixed(dec).replace(".", ",");
  return [
    {
      label:     "Liquidez Corrente",
      formula:   `LC × ${fmt(m.currentRatio, 2)}`,
      threshold: `≥ ${fmt(t.currentRatio)}`,
      example:   `LC = ${fmt(t.currentRatio)} → ${fmt(t.currentRatio)} × ${fmt(m.currentRatio, 2)} = 100 pts`,
      tip:       `LC = ${fmt(t.currentRatio / 2)} = 50 pts · LC < 0 = 0 pts`,
    },
    {
      label:     "Liquidez Seca",
      formula:   `LS × ${fmt(m.quickRatio, 2)}`,
      threshold: `≥ ${fmt(t.quickRatio)}`,
      example:   `LS = ${fmt(t.quickRatio)} → ${fmt(t.quickRatio)} × ${fmt(m.quickRatio, 2)} = 100 pts`,
      tip:       `LS = ${fmt(t.quickRatio / 2)} = 50 pts`,
    },
    {
      label:     "Liquidez Imediata",
      formula:   `LI × ${fmt(m.immediateRatio, 2)}`,
      threshold: `≥ ${fmt(t.immediateRatio)}`,
      example:   `LI = ${fmt(t.immediateRatio)} → ${fmt(t.immediateRatio)} × ${fmt(m.immediateRatio, 2)} = 100 pts`,
      tip:       `LI negativa = 0 pts`,
    },
    {
      label:     "ROA",
      formula:   `ROA × ${fmt(m.roa, 2)}`,
      threshold: `≥ ${fmt(t.roa, 0)}%`,
      example:   `ROA = ${fmt(t.roa, 0)}% → ${fmt(t.roa, 0)} × ${fmt(m.roa, 2)} = 100 pts`,
      tip:       `ROA negativo = 0 pts. ROA ${fmt(t.roa / 2, 0)}% = 50 pts`,
    },
    {
      label:     "Margem Líquida",
      formula:   `ML × ${fmt(m.netMargin, 2)}`,
      threshold: `≥ ${fmt(t.netMargin)}%`,
      example:   `ML = ${fmt(t.netMargin)}% → ${fmt(t.netMargin)} × ${fmt(m.netMargin, 2)} = 100 pts`,
      tip:       `Margem negativa = 0 pts`,
    },
    {
      label:     "Ciclo Financeiro",
      formula:   t.cashCycle === 0 ? "100 − Ciclo (dias)" : `100 − (Ciclo − ${fmt(t.cashCycle, 0)}) dias`,
      threshold: t.cashCycle === 0 ? "≤ 0 dias" : `≤ ${fmt(t.cashCycle, 0)} dias`,
      example:   `Ciclo = ${fmt(t.cashCycle, 0)} d → 100 pts · Ciclo = ${fmt(t.cashCycle + 30, 0)} d = 70 pts`,
      tip:       `Cada dia acima de ${fmt(t.cashCycle, 0)} reduz 1 pt (mín 0)`,
    },
  ];
}

/** Gera os critérios de score com lambdas dinâmicas baseadas nos multiplicadores ativos */
function buildScoreCriteria(m: ReturnType<typeof buildMultipliers>, t: ScoreTargets): ScoreCriterion[] {
  return [
    {
      key:       "currentRatio",
      label:     "Liquidez Corrente",
      desc:      "Capacidade de pagar dívidas de curto prazo com ativos circulantes",
      unit:      "× (índice)",
      toPoints:  (v) => Math.min(v * m.currentRatio, 100),
      formatVal: (v) => number(v, 2),
    },
    {
      key:       "quickRatio",
      label:     "Liquidez Seca",
      desc:      "Liquidez excluindo estoques (ativos mais líquidos)",
      unit:      "× (índice)",
      toPoints:  (v) => Math.min(v * m.quickRatio, 100),
      formatVal: (v) => number(v, 2),
    },
    {
      key:       "immediateRatio",
      label:     "Liquidez Imediata",
      desc:      "Capacidade de pagamento imediato com caixa e equivalentes",
      unit:      "× (índice)",
      toPoints:  (v) => Math.min(Math.max(v, 0) * m.immediateRatio, 100),
      formatVal: (v) => number(v, 2),
    },
    {
      key:       "roa",
      label:     "ROA — Retorno sobre Ativos",
      desc:      "Eficiência da empresa em gerar lucro com seus ativos",
      unit:      "% ao período",
      toPoints:  (v) => Math.min(Math.max(v, 0) * m.roa, 100),
      formatVal: (v) => `${number(v, 1)}%`,
    },
    {
      key:       "netMargin",
      label:     "Margem Líquida",
      desc:      "Percentual de lucro sobre a receita líquida de vendas",
      unit:      "% sobre receita",
      toPoints:  (v) => Math.min(Math.max(v, 0) * m.netMargin, 100),
      formatVal: (v) => `${number(v, 1)}%`,
    },
    {
      key:       "cashCycle",
      label:     "Ciclo Financeiro",
      desc:      "Dias entre pagar fornecedores e receber de clientes (menor = melhor)",
      unit:      "dias",
      toPoints:  (v) => Math.max(0, 100 - Math.max(0, v - t.cashCycle)),
      formatVal: (v) => `${number(v, 0)} dias`,
    },
  ];
}

/** Calcula o detalhamento do score por critério */
function computeScoreBreakdown(
  result: RankedResult,
  weights: ScoreWeights,
  criteria: ScoreCriterion[]
): {
  criteria: Array<{
    label: string;
    desc: string;
    rawValue: number;
    unit: string;
    points: number;        // pontuação 0–100
    weight: number;        // peso decimal
    contribution: number;  // points × weight
    formattedVal: string;
  }>;
  subtotal: number;        // soma das contribuições (sem bônus)
  marketShareBonus: number;
  total: number;
} {
  const criteriaRows = criteria.map((c) => {
    const rawValue   = (result as unknown as Record<string, number>)[c.key] ?? 0;
    const points     = c.toPoints(rawValue);
    const weight     = weights[c.key];
    const contribution = points * weight;
    return {
      label:        c.label,
      desc:         c.desc,
      rawValue,
      unit:         c.unit,
      points,
      weight,
      contribution,
      formattedVal: c.formatVal(rawValue),
    };
  });

  const subtotal           = criteriaRows.reduce((s, c) => s + c.contribution, 0);
  const marketShareBonus   = (result.marketShare ?? 0) * 0.05;
  const total              = subtotal + marketShareBonus;

  return { criteria: criteriaRows, subtotal, marketShareBonus, total };
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function NotasAlunoClient({
  session,
  groupResults,
  adjustments,
  gradeScaleRaw,
  scoreWeightsRaw,
  scoreTargetsRaw,
}: Props) {
  // Escala de notas
  const gradeScale: GradeLevel[] =
    Array.isArray(gradeScaleRaw) && gradeScaleRaw.length > 0
      ? buildGradeScale(gradeScaleRaw as Omit<GradeLevel, "color">[])
      : DEFAULT_GRADE_SCALE;

  // Pesos do score (usa padrão se não configurado)
  const weights: ScoreWeights = {
    ...DEFAULT_WEIGHTS,
    ...((scoreWeightsRaw && typeof scoreWeightsRaw === "object") ? scoreWeightsRaw as Partial<ScoreWeights> : {}),
  };

  // Metas dos indicadores (usa padrão se não configurado)
  const targets: ScoreTargets = {
    ...DEFAULT_SCORE_TARGETS,
    ...((scoreTargetsRaw && typeof scoreTargetsRaw === "object") ? scoreTargetsRaw as Partial<ScoreTargets> : {}),
  };

  // Multiplicadores e critérios dinâmicos derivados das metas
  const multipliers  = buildMultipliers(targets);
  const scoreCriteria = buildScoreCriteria(multipliers, targets);
  const scoreThresholds = buildScoreThresholds(multipliers, targets);

  // ── Estado vazio ─────────────────────────────────────────────────────────
  if (!groupResults.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-black text-white sm:text-2xl">Minhas Notas</h1>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <GraduationCap className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-semibold">Nenhuma nota disponível</p>
          <p className="mt-1 text-sm text-center max-w-xs">
            As notas serão exibidas após o professor processar uma rodada.
          </p>
        </div>
      </div>
    );
  }

  // ── Dados da última rodada ───────────────────────────────────────────────
  const lastRound      = groupResults[groupResults.length - 1];
  const lastResult     = lastRound?.data as RankedResult | undefined;
  const lastGrade      = lastResult ? getScoreGrade(lastResult.score, gradeScale) : null;
  const lastAdjustment = adjustments.find((a) => a.round_id === lastRound?.round_id);

  // Breakdown do score
  const breakdown = lastResult ? computeScoreBreakdown(lastResult, weights, scoreCriteria) : null;

  // Nota final do aluno (ajustada individualmente se houver)
  const notaFinal = lastAdjustment?.adjusted_nota ?? lastGrade?.nota ?? null;

  // ── Médias acumuladas ────────────────────────────────────────────────────
  const avgScore = groupResults.length > 0
    ? groupResults.reduce((s, r) => s + ((r.data as RankedResult).score || 0), 0) / groupResults.length
    : 0;
  const avgGrade = getScoreGrade(avgScore, gradeScale);
  const bestScore = Math.max(...groupResults.map((r) => (r.data as RankedResult).score || 0));
  const bestGrade = getScoreGrade(bestScore, gradeScale);

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">Minhas Notas</h1>
        <p className="text-sm text-slate-400">{session.name} · RA {session.identifier}</p>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xl">
          Sua nota é calculada com base no desempenho financeiro do grupo, nos indicadores contábeis e nos pesos definidos pelo professor.
        </p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={GraduationCap} title="Minha Nota Atual"
          value={notaFinal != null ? notaFinal.toFixed(1) : "—"}
          subtitle={lastAdjustment ? "Ajustada pelo professor" : lastGrade?.label}
          accent="violet" />
        <KpiCard icon={Trophy} title="Posição no Ranking"
          value={lastResult ? `${lastResult.position}º lugar` : "—"}
          subtitle={`Score: ${number(lastResult?.score ?? 0, 1)} pts`}
          accent="amber" />
        <KpiCard icon={TrendingUp} title="Score Médio"
          value={number(avgScore, 1)}
          subtitle={`Grau: ${avgGrade.grade} — ${avgGrade.label}`}
          accent="cyan" />
        <KpiCard icon={BarChart3} title="Melhor Score"
          value={number(bestScore, 1)}
          subtitle={`Grau: ${bestGrade.grade} — ${bestGrade.label}`}
          accent="emerald" />
      </div>

      {/* ── CARD: MINHA NOTA ──────────────────────────────────────────────── */}
      {lastGrade && lastResult && (
        <Panel title="Minha Nota" icon={GraduationCap} subtitle="Última rodada processada">
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Nota do Grupo */}
            <div className={`rounded-2xl border p-5 ${BG_MAP[lastGrade.color] ?? "bg-white/5 border-white/10"}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Nota do Grupo
              </p>
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-black leading-none ${lastGrade.color}`}>
                  {lastGrade.nota.toFixed(1)}
                </span>
                <div className="pb-1">
                  <span className={`text-lg font-black ${lastGrade.color}`}>{lastGrade.grade}</span>
                  <p className="text-xs text-slate-400">{lastGrade.label}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <p>Score: <strong className="text-white">{number(lastResult.score, 2)} pts</strong></p>
                <p>Rodada: <strong className="text-white">{lastRound.round?.name ?? `Rodada ${lastRound.round_id}`}</strong></p>
                <p>Posição: <strong className="text-white">{lastResult.position}º lugar</strong></p>
              </div>
            </div>

            {/* Minha Nota Individual */}
            <div className={`rounded-2xl border p-5 ${lastAdjustment ? "bg-violet-500/10 border-violet-500/30" : `${BG_MAP[lastGrade.color] ?? "bg-white/5 border-white/10"}`}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Minha Nota Individual
              </p>
              {lastAdjustment ? (
                <>
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-black leading-none text-violet-300">
                      {lastAdjustment.adjusted_nota.toFixed(1)}
                    </span>
                    <div className="pb-1">
                      <span className="text-xs font-semibold text-violet-300 rounded-full bg-violet-500/20 px-2 py-0.5">
                        Ajustada
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">pelo professor</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2.5 text-xs">
                    <p className="font-bold text-violet-300 mb-0.5">Justificativa:</p>
                    <p className="text-slate-300 italic leading-relaxed">"{lastAdjustment.justification}"</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-3">
                    <span className={`text-5xl font-black leading-none ${lastGrade.color}`}>
                      {lastGrade.nota.toFixed(1)}
                    </span>
                    <div className="pb-1">
                      <span className={`text-lg font-black ${lastGrade.color}`}>{lastGrade.grade}</span>
                      <p className="text-xs text-slate-400">mesma do grupo</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 italic">
                    Sem ajuste individual — sua nota é igual à nota do grupo.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Aviso de nota parcial se rodada ainda pode mudar */}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-500/5 p-3 text-xs text-amber-200">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
            <p>
              <strong className="text-amber-300">Nota parcial</strong> — sujeita à atualização pelo professor a qualquer momento.
              O score é recalculado toda vez que a rodada é reprocessada.
            </p>
          </div>
        </Panel>
      )}

      {/* ── CARD: FORMAÇÃO DA NOTA DO GRUPO ──────────────────────────────── */}
      {breakdown && lastResult && lastGrade && (
        <Panel
          title="Formação da Nota do Grupo"
          icon={BarChart3}
          subtitle="Como cada indicador contribuiu para o score e a nota final"
        >
          {/* Linha de destaque: Score → Grau → Nota */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center min-w-[80px]">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Score</p>
              <p className="text-2xl font-black text-white mt-0.5">{number(lastResult.score, 2)}</p>
              <p className="text-[10px] text-slate-500">pontos</p>
            </div>
            <span className="text-2xl text-slate-600">→</span>
            <div className={`rounded-xl border px-4 py-2.5 text-center min-w-[80px] ${BG_MAP[lastGrade.color] ?? "bg-white/5 border-white/10"}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Grau</p>
              <p className={`text-2xl font-black mt-0.5 ${lastGrade.color}`}>{lastGrade.grade}</p>
              <p className="text-[10px] text-slate-400">{lastGrade.label}</p>
            </div>
            <span className="text-2xl text-slate-600">→</span>
            <div className={`rounded-xl border px-4 py-2.5 text-center min-w-[80px] ${BG_MAP[lastGrade.color] ?? "bg-white/5 border-white/10"}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Nota</p>
              <p className={`text-2xl font-black mt-0.5 ${lastGrade.color}`}>{lastGrade.nota.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500">/ 10,0</p>
            </div>
          </div>

          {/* Tabela de critérios */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-3 py-2.5 text-left">Indicador</th>
                  <th className="px-3 py-2.5 text-center">Valor obtido</th>
                  <th className="px-3 py-2.5 text-center">Pontuação (0–100)</th>
                  <th className="px-3 py-2.5 text-center">Peso</th>
                  <th className="px-3 py-2.5 text-right">Contribuição</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.criteria.map((c, i) => {
                  const pctFill = Math.min(c.points, 100);
                  const ptColor = c.points >= 70 ? "bg-emerald-400" : c.points >= 40 ? "bg-amber-400" : "bg-rose-400";
                  const ptText  = c.points >= 70 ? "text-emerald-400" : c.points >= 40 ? "text-amber-400" : "text-rose-400";
                  return (
                    <tr key={c.label} className={`border-b border-white/5 hover:bg-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-white text-xs">{c.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{c.desc}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-slate-200">{c.formattedVal}</span>
                        <p className="text-[10px] text-slate-600">{c.unit}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-black ${ptText}`}>{number(c.points, 1)}</span>
                          <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${ptColor} transition-all`} style={{ width: `${pctFill}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-slate-200">
                          {Math.round(c.weight * 100)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-black text-cyan-300">
                        {number(c.contribution, 2)}
                      </td>
                    </tr>
                  );
                })}

                {/* Bônus de Market Share */}
                <tr className="border-b border-white/5 bg-violet-500/5">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-300 text-xs">Market Share Bônus</p>
                    <p className="text-[10px] text-slate-500">Proporção da receita vs. maior receita da rodada</p>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-300 text-xs">
                    {number(lastResult.marketShare ?? 0, 1)}%
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-slate-500">—</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">+5% fixo</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-black text-violet-300">
                    +{number(breakdown.marketShareBonus, 2)}
                  </td>
                </tr>
              </tbody>

              {/* Linha de total */}
              <tfoot>
                <tr className="border-t-2 border-cyan-400/20 bg-cyan-500/5">
                  <td className="px-3 py-3 font-black text-white text-xs" colSpan={4}>
                    SCORE FINAL (soma de todas as contribuições)
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-xl font-black text-cyan-400">{number(breakdown.total, 2)}</span>
                    <span className="ml-1 text-xs text-slate-400">pts</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Fórmula em texto */}
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Cálculo detalhado
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-mono break-all">
              {breakdown.criteria.map((c, i) => (
                <span key={c.label}>
                  <span className="text-slate-500">{c.label.split(" ")[0]}</span>
                  {" "}({number(c.points, 1)}pts × {Math.round(c.weight * 100)}%)
                  {i < breakdown.criteria.length - 1 ? " + " : ""}
                </span>
              ))}
              {" + "}
              <span className="text-violet-400">Bônus MS</span>
              {" = "}
              <span className="text-cyan-400 font-black">{number(breakdown.total, 2)} pts</span>
            </p>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              {breakdown.criteria.map((c, i) => (
                <span key={c.label}>
                  <span className="text-cyan-300 font-semibold">{number(c.contribution, 2)}</span>
                  {i < breakdown.criteria.length - 1 ? " + " : ""}
                </span>
              ))}
              {" + "}
              <span className="text-violet-300 font-semibold">{number(breakdown.marketShareBonus, 2)}</span>
              {" = "}
              <span className="text-white font-black">{number(breakdown.total, 2)} pts</span>
              {" → Grau "}
              <span className={`font-black ${lastGrade.color}`}>{lastGrade.grade}</span>
              {" → Nota "}
              <span className={`font-black ${lastGrade.color}`}>{lastGrade.nota.toFixed(1)}</span>
            </p>
          </div>

          {/* Legenda dos pesos configurados */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Pesos configurados para sua turma
            </p>
            <div className="flex flex-wrap gap-2">
              {breakdown.criteria.map((c) => (
                <div key={c.label} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center">
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">{c.label.split(" ")[0]}</p>
                  <p className="text-sm font-black text-white">{Math.round(c.weight * 100)}%</p>
                </div>
              ))}
              <div className="rounded-lg border border-violet-400/20 bg-violet-500/5 px-2.5 py-1.5 text-center">
                <p className="text-[10px] text-violet-400">Mkt Share</p>
                <p className="text-sm font-black text-violet-300">+5%</p>
              </div>
            </div>
            {Object.values(weights).reduce((s, v) => s + v, 0) !== 1 && (
              <p className="mt-2 text-[10px] text-slate-600 italic">
                * Pesos padrão do sistema. O professor pode configurar pesos personalizados nas configurações da turma.
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* ── CARD: COMO SUA NOTA É CALCULADA (explicação didática) ─────────── */}
      <Panel title="Como sua Nota é Calculada" icon={Info} subtitle="Entenda o processo passo a passo">
        <div className="space-y-4">

          {/* Passo 1 */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-black text-cyan-400">1</div>
            <div>
              <p className="font-bold text-white text-sm">Indicadores financeiros são calculados</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Após o professor processar a rodada, o sistema calcula automaticamente 6 indicadores contábeis:
                Liquidez Corrente, Liquidez Seca, Liquidez Imediata, ROA, Margem Líquida e Ciclo Financeiro.
              </p>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-black text-cyan-400">2</div>
            <div>
              <p className="font-bold text-white text-sm">Cada indicador recebe uma pontuação (0–100)</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                O valor bruto de cada indicador é convertido em uma pontuação de 0 a 100 usando fórmulas específicas.
                Por exemplo: Liquidez Corrente de {targets.currentRatio.toFixed(1).replace(".", ",")} (meta) → pontuação = min({targets.currentRatio.toFixed(1).replace(".", ",")} × {multipliers.currentRatio.toFixed(2)}, 100) = 100 pts.
                A meta de cada indicador é configurada pelo professor e define quando se atinge 100 pts.
              </p>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-black text-cyan-400">3</div>
            <div>
              <p className="font-bold text-white text-sm">Pontuação × Peso = Contribuição</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Cada pontuação é multiplicada pelo peso configurado para a turma.
                Por exemplo: 30 pts × 20% = 6,0 pontos de contribuição para o score total.
              </p>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-black text-cyan-400">4</div>
            <div>
              <p className="font-bold text-white text-sm">Score = soma das contribuições + bônus market share</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                A soma de todas as contribuições forma o score base.
                Um bônus de market share proporcional à sua receita relativa é somado ao final.
              </p>
            </div>
          </div>

          {/* Passo 5 */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-black text-emerald-400">5</div>
            <div>
              <p className="font-bold text-white text-sm">Score → Grau → Nota</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                O score final é convertido na grade (AAA, AA, A, B, C, D) e na nota (0–10)
                usando a escala configurada pelo professor.
              </p>
            </div>
          </div>

          {/* Passo 6 — ajuste individual */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-black text-violet-400">6</div>
            <div>
              <p className="font-bold text-white text-sm">Ajuste individual (quando aplicável)</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                O professor pode ajustar sua nota individualmente por critérios como participação,
                pontualidade nos envios ou qualidade nas entregas.
                Esse ajuste é justificado e visível para você.
              </p>
            </div>
          </div>

          {/* ── Tabela de metas e desempenho atual ──────────────────────── */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Metas e desempenho atual por indicador
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <th className="px-3 py-2 text-left">Indicador</th>
                    <th className="px-3 py-2 text-center">Fórmula</th>
                    <th className="px-3 py-2 text-center">Meta (100 pts)</th>
                    {lastResult && <th className="px-3 py-2 text-center">Seu valor</th>}
                    {lastResult && <th className="px-3 py-2 text-center">Sua pontuação</th>}
                    {lastResult && <th className="px-3 py-2 text-center hidden sm:table-cell">Falta para 100</th>}
                    <th className="px-3 py-2 text-left hidden lg:table-cell">Dica</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreThresholds.map((th, i) => {
                    const criterion = scoreCriteria[i];
                    const rawVal = lastResult
                      ? (lastResult as unknown as Record<string, number>)[criterion.key] ?? 0
                      : null;
                    const pts   = rawVal != null ? criterion.toPoints(rawVal) : null;
                    const gap   = pts != null ? Math.max(0, 100 - pts) : null;
                    const ptColor = pts == null ? "" : pts >= 80 ? "text-emerald-400" : pts >= 50 ? "text-amber-400" : "text-rose-400";
                    return (
                      <tr key={th.label} className={`border-b border-white/5 hover:bg-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">{th.label}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-cyan-400 whitespace-nowrap">{th.formula}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-black text-emerald-400 whitespace-nowrap">
                            {th.threshold}
                          </span>
                        </td>
                        {lastResult && (
                          <td className="px-3 py-2.5 text-center font-bold text-slate-200 whitespace-nowrap">
                            {rawVal != null ? criterion.formatVal(rawVal) : "—"}
                          </td>
                        )}
                        {lastResult && (
                          <td className="px-3 py-2.5 text-center">
                            {pts != null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-black ${ptColor}`}>{number(pts, 1)}</span>
                                <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${pts >= 80 ? "bg-emerald-400" : pts >= 50 ? "bg-amber-400" : "bg-rose-400"}`}
                                    style={{ width: `${Math.min(pts, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : "—"}
                          </td>
                        )}
                        {lastResult && (
                          <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                            {gap != null && gap > 0 ? (
                              <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 font-bold text-rose-400 whitespace-nowrap">
                                −{number(gap, 1)} pts
                              </span>
                            ) : gap === 0 ? (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-bold text-emerald-400 whitespace-nowrap">
                                ✓ Meta atingida
                              </span>
                            ) : "—"}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-slate-500 hidden lg:table-cell leading-snug">{th.tip}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-b border-white/5 bg-violet-500/5">
                    <td className="px-3 py-2.5 font-semibold text-slate-300">Market Share Bônus</td>
                    <td className="px-3 py-2.5 text-center font-mono text-violet-400 whitespace-nowrap">MS% × 5%</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 font-black text-violet-400 whitespace-nowrap">
                        Sem teto
                      </span>
                    </td>
                    {lastResult && (
                      <td className="px-3 py-2.5 text-center font-bold text-slate-200">
                        {number(lastResult.marketShare ?? 0, 1)}%
                      </td>
                    )}
                    {lastResult && (
                      <td className="px-3 py-2.5 text-center font-bold text-violet-400">
                        +{number((lastResult.marketShare ?? 0) * 0.05, 2)}
                      </td>
                    )}
                    {lastResult && (
                      <td className="px-3 py-2.5 text-center text-slate-500 hidden sm:table-cell">—</td>
                    )}
                    <td className="px-3 py-2.5 text-slate-500 hidden lg:table-cell">
                      Único indicador sem limite máximo — por isso o score pode ultrapassar 100
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/5 bg-amber-500/5 px-4 py-2.5 text-[11px] text-amber-300">
              <strong>Atenção:</strong> indicadores abaixo da meta recebem pontuação proporcional.
              Valores negativos em ROA, Margem Líquida e Liquidez Imediata resultam em 0 pts naquele critério.
            </div>
          </div>

          {/* Privacidade */}
          <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
            <p>
              <strong className="text-emerald-300">Privacidade garantida</strong> — você visualiza apenas sua nota e a nota do seu grupo.
              As notas dos outros grupos e alunos não são exibidas neste painel.
            </p>
          </div>
        </div>
      </Panel>

      {/* ── HISTÓRICO DE NOTAS ───────────────────────────────────────────── */}
      <Panel title="Histórico por Rodada" icon={Trophy} subtitle="Evolução do desempenho ao longo das rodadas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-3 py-2.5 text-left">Rodada</th>
                <th className="px-3 py-2.5 text-center">Posição</th>
                <th className="px-3 py-2.5 text-center">Score</th>
                <th className="px-3 py-2.5 text-center">Grau</th>
                <th className="px-3 py-2.5 text-center">Nota Grupo</th>
                <th className="px-3 py-2.5 text-center">Nota Individual</th>
                <th className="px-3 py-2.5 text-right">Lucro Líquido</th>
                <th className="px-3 py-2.5 text-right">Market Share</th>
              </tr>
            </thead>
            <tbody>
              {groupResults.map((sr) => {
                const r         = sr.data as RankedResult;
                const roundName = sr.round?.name ?? `Rodada ${sr.round_id}`;
                const grade     = getScoreGrade(r.score, gradeScale);
                const adj       = adjustments.find((a) => a.round_id === sr.round_id);
                const isLast    = sr === lastRound;
                return (
                  <tr key={sr.id} className={`border-b border-white/5 hover:bg-white/5 ${isLast ? "bg-cyan-500/5" : ""}`}>
                    <td className="px-3 py-3 font-medium text-white whitespace-nowrap">
                      {roundName}
                      {isLast && <span className="ml-2 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400">ATUAL</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-white">{r.position}º</span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-cyan-400">
                      {number(r.score, 1)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-black ${grade.color}`}>{grade.grade}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-lg font-black ${grade.color}`}>{grade.nota.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {adj ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-lg font-black text-violet-300">{adj.adjusted_nota.toFixed(1)}</span>
                          <span className="text-[9px] text-violet-400">ajustada</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className={`px-3 py-3 text-right font-semibold ${r.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {currency(r.netProfit)}
                    </td>
                    <td className="px-3 py-3 text-right text-white">
                      {number(r.marketShare ?? 0, 1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {groupResults.length > 1 && (
              <tfoot>
                <tr className="border-t border-white/10 bg-white/5 text-xs font-bold text-slate-400">
                  <td className="px-3 py-2.5" colSpan={2}>MÉDIA</td>
                  <td className="px-3 py-2.5 text-center text-cyan-400">{number(avgScore, 1)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-black ${avgGrade.color}`}>{avgGrade.grade}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-black ${avgGrade.color}`}>{avgGrade.nota.toFixed(1)}</span>
                  </td>
                  <td className="px-3 py-2.5" colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Escala de notas */}
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Escala de Notas da Turma
          </p>
          <div className="flex flex-wrap gap-2">
            {gradeScale.map((level, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                <p className={`text-sm font-black ${level.color}`}>{level.grade}</p>
                <p className="text-[10px] text-slate-400">{level.label}</p>
                <p className={`text-xs font-bold ${level.color}`}>{level.nota.toFixed(1)}</p>
                <p className="text-[9px] text-slate-600">score ≥ {level.minScore}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Aviso */}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-500" />
          <p>
            Os scores históricos refletem o estado dos resultados <strong className="text-slate-300">no momento do último processamento</strong> de cada rodada.
            Se o professor reprocessar uma rodada, os valores podem mudar.
          </p>
        </div>
      </Panel>

    </div>
  );
}
