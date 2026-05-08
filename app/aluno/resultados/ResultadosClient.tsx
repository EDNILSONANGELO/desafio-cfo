"use client";

import { useState } from "react";
import { Trophy, BarChart3, TrendingUp } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { MedalsPanel } from "@/components/dashboard/MedalsPanel";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { BalancoPatrimonialPanel } from "@/components/charts/BalancoPatrimonialPanel";
import { MarketSharePie } from "@/components/charts/MarketSharePie";
import { currency, percent, number } from "@/lib/utils/format";
import { getScoreGrade } from "@/lib/simulation/scoring";
import type { StoredResult, Medal, SessionPayload, RankedResult } from "@/types";

interface Props {
  groupResults: (StoredResult & { round?: { id: number; name: string; event_type: string; processed_at: string } })[];
  fullRanking: StoredResult[];
  medals: Medal[];
  session: SessionPayload;
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function ResultadosClient({ groupResults, fullRanking, medals, session }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const currentResult = groupResults[selectedIdx];
  const result = currentResult?.data as RankedResult | undefined;
  const grade = result ? getScoreGrade(result.score) : null;

  const rankedFullRanking = fullRanking.map((r) => r.data as RankedResult);

  if (!groupResults.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-white">Resultados</h1>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Trophy className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-semibold">Nenhum resultado disponível</p>
          <p className="mt-1 text-sm">
            Os resultados serão exibidos após o professor processar uma rodada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Meus Resultados</h1>
        <p className="text-sm text-slate-400">{session.name} · RA {session.identifier}</p>
      </div>

      {/* Round selector */}
      {groupResults.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groupResults.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setSelectedIdx(i)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                i === selectedIdx
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              {r.round?.name || `Rodada ${r.round_id}`}
            </button>
          ))}
        </div>
      )}

      {result && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={Trophy} title="Posição" value={`${result.position}º lugar`} subtitle={grade?.label} accent="amber" />
            <KpiCard icon={TrendingUp} title="Score" value={number(result.score, 1)} subtitle={`Grade: ${grade?.grade}`} accent="cyan" />
            <KpiCard icon={BarChart3} title="Lucro Líquido" value={currency(result.netProfit)} accent="emerald" />
            <KpiCard icon={BarChart3} title="Market Share" value={`${number(result.marketShare, 1)}%`} accent="violet" />
          </div>

          {/* Detailed metrics */}
          <Panel title="Indicadores Financeiros" icon={BarChart3}>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <MetricBox label="Receita Líquida" value={currency(result.netRevenue)} />
              <MetricBox label="CMV" value={currency(result.cmv)} />
              <MetricBox label="Lucro Bruto" value={currency(result.grossProfit)} />
              <MetricBox label="EBIT" value={currency(result.ebit)} />
              <MetricBox label="Margem Bruta" value={percent(result.grossMargin)} />
              <MetricBox label="Margem Op." value={percent(result.operatingMargin)} />
              <MetricBox label="Margem Líquida" value={percent(result.netMargin)} />
              <MetricBox label="Liquidez Corrente" value={number(result.currentRatio)} />
              <MetricBox label="Liquidez Seca" value={number(result.quickRatio)} />
              <MetricBox label="Liquidez Imediata" value={number(result.immediateRatio)} />
              <MetricBox label="ROA" value={percent(result.roa)} />
              <MetricBox label="ROE" value={percent(result.roe)} />
              <MetricBox label="PME" value={`${number(result.pme, 0)} dias`} />
              <MetricBox label="PMR" value={`${number(result.pmr, 0)} dias`} />
              <MetricBox label="PMP" value={`${number(result.pmp, 0)} dias`} />
              <MetricBox label="Ciclo Financeiro" value={`${number(result.cashCycle, 0)} dias`} />
            </div>
          </Panel>

          {/* Produção e Estoque */}
          <Panel title="Produção e Estoque" icon={BarChart3}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricBox
                label="Produção Efetiva"
                value={`${(result.productionEffective ?? 0).toLocaleString("pt-BR")} un.`}
                sub="unidades fabricadas"
              />
              <MetricBox
                label="Qtd. Vendida"
                value={`${result.realSalesQty.toLocaleString("pt-BR")} un.`}
                sub={`de ${(result.productionEffective ?? 0).toLocaleString("pt-BR")} produzidas`}
              />
              <MetricBox
                label="Unidades em Estoque"
                value={`${(result.unsoldUnits ?? 0).toLocaleString("pt-BR")} un.`}
                sub={(result.unsoldUnits ?? 0) === 0 ? "estoque zerado" : "ficaram sem vender"}
              />
              <MetricBox
                label="Valor do Estoque Final"
                value={currency(result.endingInventory)}
                sub={`custo unit. ${currency(result.unitProductionCost ?? 0)}`}
              />
            </div>

            {/* Barra visual de aproveitamento */}
            {(result.productionEffective ?? 0) > 0 && (() => {
              const taxa = (result.realSalesQty / (result.productionEffective ?? 1)) * 100;
              const cor = taxa >= 90 ? "bg-emerald-400" : taxa >= 70 ? "bg-amber-400" : "bg-rose-400";
              const label = taxa >= 90 ? "Excelente aproveitamento da produção" : taxa >= 70 ? "Aproveitamento razoável — considere ajustar a produção" : "Baixo aproveitamento — produção acima da demanda";
              return (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-slate-400">Taxa de venda sobre produção</span>
                    <span className={`font-bold ${taxa >= 90 ? "text-emerald-400" : taxa >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                      {taxa.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${Math.min(taxa, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 italic">{label}</p>
                </div>
              );
            })()}
          </Panel>

          {/* BP and DRE */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* ── BALANÇO PATRIMONIAL ── */}
            <Panel title="Balanço Patrimonial" icon={BarChart3}>
              <BalancoPatrimonialPanel result={result} />
            </Panel>

            {/* ── DRE ── */}
            <Panel title="DRE – Demonstração do Resultado do Exercício" icon={BarChart3}>
              <div className="space-y-1.5 text-sm">
                {/* Receita */}
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Receita Líquida de Vendas</span>
                  <span className="font-semibold text-emerald-400">{currency(result.netRevenue)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Custo das Mercadorias Vendidas (CMV)</span>
                  <span className="font-semibold text-rose-400">({currency(result.cmv)})</span>
                </div>
                <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                  <span className="font-semibold text-white">= Lucro Bruto</span>
                  <span className={`font-bold ${result.grossProfit >= 0 ? "text-white" : "text-rose-400"}`}>
                    {currency(result.grossProfit)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Despesas Operacionais</span>
                  <span className="font-semibold text-rose-400">({currency(result.operationalExpenses)})</span>
                </div>
                <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                  <span className="font-semibold text-white">= EBIT (Lucro Operacional)</span>
                  <span className={`font-bold ${result.ebit >= 0 ? "text-white" : "text-rose-400"}`}>
                    {currency(result.ebit)}
                  </span>
                </div>

                {(result.ebt !== undefined ? result.ebit !== result.ebt : false) && (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-slate-400">(-) Despesa Financeira (juros)</span>
                      <span className="font-semibold text-rose-400">
                        ({currency(result.ebit - (result.ebt ?? result.ebit))})
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                      <span className="font-semibold text-white">= LAIR (Lucro Antes do IR)</span>
                      <span className={`font-bold ${(result.ebt ?? result.ebit) >= 0 ? "text-white" : "text-rose-400"}`}>
                        {currency(result.ebt ?? result.ebit)}
                      </span>
                    </div>
                  </>
                )}

                {(result.ebt !== undefined && result.ebt === result.ebit) && (
                  <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                    <span className="font-semibold text-white">= LAIR (Lucro Antes do IR)</span>
                    <span className={`font-bold ${result.ebit >= 0 ? "text-white" : "text-rose-400"}`}>
                      {currency(result.ebit)}
                    </span>
                  </div>
                )}

                {(result.ir ?? (result.incomeTax ?? 0)) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">(-) IR — 15% s/ LAIR</span>
                    <span className="font-semibold text-rose-400">
                      ({currency(result.ir ?? (result.incomeTax ?? 0) * (15 / 24))})
                    </span>
                  </div>
                )}
                {(result.csll ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">(-) CSLL — 9% s/ LAIR</span>
                    <span className="font-semibold text-rose-400">({currency(result.csll)})</span>
                  </div>
                )}
                {(result.incomeTax ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-2 mt-0.5">
                    <span className="text-slate-500 text-xs italic pl-3">Total tributos (IR + CSLL = 24%)</span>
                    <span className="text-rose-400 text-xs font-semibold">({currency(result.incomeTax ?? 0)})</span>
                  </div>
                )}

                {/* Resultado Final */}
                <div className={`flex justify-between rounded-xl px-3 py-3 mt-2 ${
                  result.netProfit >= 0
                    ? "bg-emerald-500/15 border border-emerald-500/30"
                    : "bg-rose-500/15 border border-rose-500/30"
                }`}>
                  <span className="text-base font-black text-white">
                    {result.netProfit >= 0 ? "= LUCRO LÍQUIDO" : "= PREJUÍZO LÍQUIDO"}
                  </span>
                  <span className={`text-base font-black ${result.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {result.netProfit >= 0 ? currency(result.netProfit) : `(${currency(Math.abs(result.netProfit))})`}
                  </span>
                </div>

                {/* Nota: resultado compõe o PL */}
                <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-400 leading-relaxed">
                  {result.netProfit >= 0
                    ? `✅ O Lucro Líquido de ${currency(result.netProfit)} é transferido para o Patrimônio Líquido como Reserva de Lucros.`
                    : `⚠ O Prejuízo de ${currency(Math.abs(result.netProfit))} é lançado no Patrimônio Líquido como Prejuízo Acumulado, reduzindo o Capital Social.`
                  }
                </p>
              </div>
            </Panel>
          </div>

          {/* Cash Flow + Market Share */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Fluxo de Caixa" icon={BarChart3}>
              <CashFlowPanel result={result} />
            </Panel>

            {rankedFullRanking.length > 0 && (
              <Panel title="Market Share da Rodada" icon={BarChart3}>
                <div className="h-72">
                  <MarketSharePie results={rankedFullRanking} />
                </div>
              </Panel>
            )}
          </div>

          {/* Full ranking */}
          {rankedFullRanking.length > 0 && (
            <Panel title="Ranking Geral da Rodada" icon={Trophy}>
              <RankingTable results={rankedFullRanking} />
            </Panel>
          )}
        </>
      )}

      {/* Medals */}
      {medals.length > 0 && (
        <Panel title="Suas Conquistas" icon={Trophy}>
          <MedalsPanel medals={medals} />
        </Panel>
      )}
    </div>
  );
}
