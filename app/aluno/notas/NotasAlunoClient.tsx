"use client";

import { GraduationCap, BarChart3, Trophy, TrendingUp } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { currency, number, percent } from "@/lib/utils/format";
import {
  getScoreGrade,
  buildGradeScale,
  DEFAULT_GRADE_SCALE,
} from "@/lib/simulation/scoring";
import type { GradeLevel } from "@/lib/simulation/scoring";
import type { StoredResult, RankedResult, SessionPayload, GradeAdjustment } from "@/types";

interface Props {
  session: SessionPayload;
  groupResults: (StoredResult & { round?: { id: number; name: string; event_type: string; processed_at: string } })[];
  adjustments: GradeAdjustment[];
  gradeScaleRaw?: unknown[];
}

const BG_MAP: Record<string, string> = {
  "text-emerald-400": "bg-emerald-500/10 border-emerald-500/30",
  "text-cyan-400":    "bg-cyan-500/10 border-cyan-500/30",
  "text-sky-400":     "bg-sky-500/10 border-sky-500/30",
  "text-amber-400":   "bg-amber-500/10 border-amber-500/30",
  "text-orange-400":  "bg-orange-500/10 border-orange-500/30",
  "text-rose-400":    "bg-rose-500/10 border-rose-500/30",
};

const SCORE_ROWS = [
  { key: "currentRatio",   label: "Liquidez Corrente",  formula: "min(LC × 20, 100) × peso" },
  { key: "quickRatio",     label: "Liquidez Seca",      formula: "min(LS × 22, 100) × peso" },
  { key: "immediateRatio", label: "Liquidez Imediata",  formula: "min(LI × 30, 100) × peso" },
  { key: "roa",            label: "ROA",                formula: "min(ROA × 5, 100) × peso"  },
  { key: "netMargin",      label: "Margem Líquida",     formula: "min(ML × 3, 100) × peso"  },
  { key: "cashCycle",      label: "Ciclo Financeiro",   formula: "max(0, 100 − Ciclo) × peso" },
] as const;

export default function NotasAlunoClient({ session, groupResults, adjustments, gradeScaleRaw }: Props) {
  const gradeScale: GradeLevel[] =
    Array.isArray(gradeScaleRaw) && gradeScaleRaw.length > 0
      ? buildGradeScale(gradeScaleRaw as Omit<GradeLevel, "color">[])
      : DEFAULT_GRADE_SCALE;

  if (!groupResults.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-black text-white sm:text-2xl">Minhas Notas</h1>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <GraduationCap className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-semibold">Nenhuma nota disponível</p>
          <p className="mt-1 text-sm">
            As notas serão exibidas após o professor processar uma rodada.
          </p>
        </div>
      </div>
    );
  }

  // Última rodada processada
  const lastRound = groupResults[groupResults.length - 1];
  const lastResult = lastRound?.data as RankedResult | undefined;
  const lastGrade = lastResult ? getScoreGrade(lastResult.score, gradeScale) : null;
  const lastAdjustment = adjustments.find((a) => a.round_id === lastRound?.round_id);

  // Média acumulada
  const avgScore = groupResults.length > 0
    ? groupResults.reduce((s, r) => s + ((r.data as RankedResult).score || 0), 0) / groupResults.length
    : 0;
  const avgGrade = getScoreGrade(avgScore, gradeScale);

  // Melhor score
  const bestScore = Math.max(...groupResults.map((r) => (r.data as RankedResult).score || 0));
  const bestGrade = getScoreGrade(bestScore, gradeScale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">Minhas Notas</h1>
        <p className="text-sm text-slate-400">{session.name} · RA {session.identifier}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={GraduationCap}
          title="Nota Atual"
          value={lastGrade ? lastGrade.nota.toFixed(1) : "—"}
          subtitle={lastGrade?.label}
          accent="violet"
        />
        <KpiCard
          icon={Trophy}
          title="Posição Atual"
          value={lastResult ? `${lastResult.position}º lugar` : "—"}
          subtitle={`Score: ${number(lastResult?.score ?? 0, 1)}`}
          accent="amber"
        />
        <KpiCard
          icon={TrendingUp}
          title="Score Médio"
          value={number(avgScore, 1)}
          subtitle={`Grau: ${avgGrade.grade}`}
          accent="cyan"
        />
        <KpiCard
          icon={BarChart3}
          title="Melhor Score"
          value={number(bestScore, 1)}
          subtitle={`Grau: ${bestGrade.grade}`}
          accent="emerald"
        />
      </div>

      {/* Nota atual (última rodada) */}
      {lastGrade && lastResult && (
        <Panel title="Nota do Grupo — Última Rodada" icon={GraduationCap}>
          <div className={`rounded-2xl border p-5 ${BG_MAP[lastGrade.color] ?? "bg-white/5 border-white/10"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* Nota do grupo */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-white/10 px-5 py-4 min-w-[80px]">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Nota</span>
                  <span className={`text-4xl font-black leading-none mt-1 ${lastGrade.color}`}>
                    {lastGrade.nota.toFixed(1)}
                  </span>
                  <span className={`text-xs font-bold mt-1 ${lastGrade.color}`}>{lastGrade.grade}</span>
                </div>

                {/* Nota ajustada individualmente */}
                {lastAdjustment && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 px-5 py-4 min-w-[80px]">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">Ajustada</span>
                    <span className="text-4xl font-black leading-none mt-1 text-violet-300">
                      {lastAdjustment.adjusted_nota.toFixed(1)}
                    </span>
                    <span className="mt-1 text-[9px] font-bold text-violet-400">pelo professor</span>
                  </div>
                )}
              </div>

              {/* Detalhes */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black ${lastGrade.color}`}>{lastGrade.grade}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs font-semibold text-white">
                    {lastGrade.label}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Rodada: <strong className="text-white">{lastRound.round?.name ?? `Rodada ${lastRound.round_id}`}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Score: <span className="font-semibold text-white">{number(lastResult.score, 1)} pts</span> ·
                  Posição: <span className="font-semibold text-white">{lastResult.position}º lugar</span>
                </p>
                {lastAdjustment && (
                  <div className="mt-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2.5 text-xs">
                    <p className="font-bold text-violet-300 mb-0.5">Justificativa do ajuste:</p>
                    <p className="text-slate-300 italic leading-relaxed">"{lastAdjustment.justification}"</p>
                    <p className="mt-1.5 text-[10px] text-slate-500">
                      Sua nota final é <strong className="text-violet-300">{lastAdjustment.adjusted_nota.toFixed(1)}</strong>
                      {" "}(ajustada individualmente pelo professor)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Formação da Nota — como é calculado o score */}
      <Panel title="Como sua Nota é Formada" icon={BarChart3} subtitle="Composição do score que gera sua nota acadêmica">
        <div className="space-y-4">
          {lastResult && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SCORE_ROWS.map(({ key, label, formula }) => {
                const value = (lastResult as unknown as Record<string, number>)[key] ?? 0;
                return (
                  <div key={key} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {key === "cashCycle"
                        ? `${number(value, 0)} dias`
                        : key === "roa" || key === "netMargin"
                        ? percent(value)
                        : number(value, 2)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-600 italic">{formula}</p>
                  </div>
                );
              })}
            </div>
          )}
          <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4 text-xs text-slate-400 leading-relaxed">
            <p className="font-bold text-cyan-300 mb-1">Como o score é calculado:</p>
            <p>
              Cada indicador recebe uma pontuação de 0 a 100, multiplicada por seu peso na turma.
              O score final é a soma ponderada de todos os indicadores.
              O professor pode configurar pesos diferentes para cada turma.
            </p>
          </div>
        </div>
      </Panel>

      {/* Histórico de Notas por Rodada */}
      <Panel title="Histórico de Notas por Rodada" icon={Trophy} subtitle="Evolução do desempenho ao longo das rodadas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-3 py-2.5 text-left">Rodada</th>
                <th className="px-3 py-2.5 text-center">Posição</th>
                <th className="px-3 py-2.5 text-center">Score</th>
                <th className="px-3 py-2.5 text-center">Grau</th>
                <th className="px-3 py-2.5 text-center">Nota do Grupo</th>
                <th className="px-3 py-2.5 text-center">Nota Individual</th>
                <th className="px-3 py-2.5 text-right">Lucro Líquido</th>
                <th className="px-3 py-2.5 text-right">Market Share</th>
              </tr>
            </thead>
            <tbody>
              {groupResults.map((sr) => {
                const r = sr.data as RankedResult;
                const roundName = sr.round?.name ?? `Rodada ${sr.round_id}`;
                const grade = getScoreGrade(r.score, gradeScale);
                const adj = adjustments.find((a) => a.round_id === sr.round_id);
                return (
                  <tr key={sr.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-3 font-medium text-white whitespace-nowrap">{roundName}</td>
                    <td className="px-3 py-3 text-center font-bold text-white">{r.position}º</td>
                    <td className="px-3 py-3 text-center font-semibold text-cyan-400">{number(r.score, 1)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-black ${grade.color}`}>{grade.grade}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-lg font-black ${grade.color}`}>{grade.nota.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {adj ? (
                        <span className="text-lg font-black text-violet-300">{adj.adjusted_nota.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className={`px-3 py-3 text-right font-semibold ${r.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {currency(r.netProfit)}
                    </td>
                    <td className="px-3 py-3 text-right text-white">{number(r.marketShare, 1)}%</td>
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
                  <td className="px-3 py-2.5" colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Legenda da escala */}
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Escala de Notas</p>
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
      </Panel>
    </div>
  );
}
