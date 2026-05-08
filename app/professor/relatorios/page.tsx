"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Download, BarChart3, Trophy, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { RankingBarChart } from "@/components/charts/RankingBarChart";
import { MarketSharePie } from "@/components/charts/MarketSharePie";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { BalancoPatrimonialPanel } from "@/components/charts/BalancoPatrimonialPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { currency, percent, number } from "@/lib/utils/format";
import type { Round, RankedResult, StoredResult } from "@/types";

/* ─── Sorting types ─── */
type SortDir = "asc" | "desc";

interface ColDef {
  key: keyof RankedResult | "posicao";
  label: string;
  title: string;
  numeric: boolean;
  lowerIsBetter?: boolean;
}

const COLUMNS: ColDef[] = [
  { key: "position",       label: "#",          title: "Posição no ranking",               numeric: true,  lowerIsBetter: true  },
  { key: "company",        label: "Empresa",     title: "Nome da empresa",                  numeric: false },
  { key: "netRevenue",     label: "Receita",     title: "Receita Líquida",                  numeric: true  },
  { key: "netProfit",      label: "Lucro",       title: "Lucro Líquido",                    numeric: true  },
  { key: "currentRatio",   label: "Liq. C.",     title: "Liquidez Corrente",                numeric: true  },
  { key: "quickRatio",     label: "Liq. S.",     title: "Liquidez Seca",                    numeric: true  },
  { key: "immediateRatio", label: "Liq. I.",     title: "Liquidez Imediata",                numeric: true  },
  { key: "roa",            label: "ROA %",       title: "Retorno sobre Ativos",             numeric: true  },
  { key: "roe",            label: "ROE %",       title: "Retorno sobre Patrimônio Líquido", numeric: true  },
  { key: "netMargin",      label: "Mg.Líq %",    title: "Margem Líquida",                   numeric: true  },
  { key: "grossMargin",    label: "Mg.Bruta %",  title: "Margem Bruta",                     numeric: true  },
  { key: "cashCycle",      label: "Ciclo",       title: "Ciclo Financeiro (dias)",          numeric: true,  lowerIsBetter: true  },
  { key: "marketShare",    label: "Mkt Share",   title: "Market Share (%)",                 numeric: true  },
  { key: "score",          label: "Score",       title: "Pontuação final",                  numeric: true  },
];

/* ─── Sortable header ─── */
function SortTh({ col, sortKey, sortDir, onSort }: {
  col: ColDef; sortKey: string; sortDir: SortDir; onSort: (k: string) => void;
}) {
  const active = sortKey === col.key;
  return (
    <th
      title={col.title}
      onClick={() => onSort(col.key as string)}
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold transition-colors hover:text-white ${active ? "text-cyan-400" : "text-slate-400"}`}
    >
      <span className="inline-flex items-center gap-1">
        {col.label}
        {active ? (
          sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

/* ─── Sort helper ─── */
function sortResults(results: RankedResult[], key: string, dir: SortDir): RankedResult[] {
  return [...results].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[key];
    const bv = (b as unknown as Record<string, unknown>)[key];
    const cmp = typeof av === "string" && typeof bv === "string"
      ? av.localeCompare(bv, "pt-BR")
      : (Number(av) ?? 0) - (Number(bv) ?? 0);
    return dir === "asc" ? cmp : -cmp;
  });
}

/* ─── DRE por empresa ─── */
function DREPanel({ r }: { r: RankedResult }) {
  const lair = r.ebt ?? r.ebit;
  const ir   = r.ir   ?? (r.incomeTax ?? 0) * (15 / 24);
  const csll = r.csll ?? (r.incomeTax ?? 0) * (9  / 24);
  const totalTributos = r.incomeTax ?? (ir + csll);
  const financialExpense = r.ebit - lair;

  const Row = ({ label, value, color = "text-slate-300", bold = false, highlight = false }: {
    label: string; value: string; color?: string; bold?: boolean; highlight?: boolean;
  }) => (
    <div className={`flex justify-between py-1 text-xs border-b border-white/5 last:border-0 ${highlight ? "rounded px-2 bg-white/5 my-0.5" : "px-1"}`}>
      <span className={`${bold ? "font-bold text-white" : "text-slate-400"}`}>{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-0.5">
      <Row label="Receita Líquida"          value={currency(r.netRevenue)}           color="text-emerald-400" />
      <Row label="(-) CMV"                  value={`(${currency(r.cmv)})`}           color="text-rose-400" />
      <Row label="= Lucro Bruto"            value={currency(r.grossProfit)}          color={r.grossProfit >= 0 ? "text-white" : "text-rose-400"} bold highlight />
      <Row label="(-) Desp. Operacionais"   value={`(${currency(r.operationalExpenses)})`} color="text-rose-400" />
      <Row label="= EBIT (Luc. Operacional)" value={currency(r.ebit)}               color={r.ebit >= 0 ? "text-white" : "text-rose-400"} bold highlight />
      {financialExpense > 0 && (
        <Row label="(-) Despesa Financeira" value={`(${currency(financialExpense)})`} color="text-rose-400" />
      )}
      <Row label="= LAIR"                   value={currency(lair)}                   color={lair >= 0 ? "text-white" : "text-rose-400"} bold highlight />
      {ir > 0   && <Row label="(-) IR — 15% s/ LAIR"   value={`(${currency(ir)})`}   color="text-rose-400" />}
      {csll > 0 && <Row label="(-) CSLL — 9% s/ LAIR"  value={`(${currency(csll)})`} color="text-rose-400" />}
      {totalTributos > 0 && (
        <Row label="   Total tributos (24%)" value={`(${currency(totalTributos)})`}  color="text-rose-400/70" />
      )}
      <div className={`mt-1 flex justify-between rounded-xl px-3 py-2.5 text-sm font-black ${r.netProfit >= 0 ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-rose-500/15 border border-rose-500/30"}`}>
        <span className="text-white">{r.netProfit >= 0 ? "= LUCRO LÍQUIDO" : "= PREJUÍZO LÍQUIDO"}</span>
        <span className={r.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
          {r.netProfit >= 0 ? currency(r.netProfit) : `(${currency(Math.abs(r.netProfit))})`}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function RelatoriosPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [results, setResults] = useState<RankedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<string>("position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Keep track of user's selection so auto-refresh doesn't reset it
  const userSelectedRef = useRef(false);

  const loadRounds = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // cache: no-store garante dados frescos toda vez
      const res = await fetch("/api/rounds", { cache: "no-store" });
      const data = await res.json();
      const processedRounds: Round[] = (data.rounds || [])
        .filter((r: Round) => r.status === "Processada")
        // Ordena crescente para mostrar Rodada 1, 2, 3... no dropdown
        .sort((a: Round, b: Round) => a.id - b.id);

      setRounds(processedRounds);
      setLastUpdated(new Date());

      // Só troca o selectedRoundId se:
      //   - nenhuma rodada foi selecionada ainda (primeiro load)
      //   - a rodada selecionada sumiu da lista
      if (processedRounds.length > 0) {
        setSelectedRoundId((prev) => {
          const stillExists = processedRounds.some((r) => r.id.toString() === prev);
          if (!prev || !stillExists) {
            // Seleciona a mais recente (última na lista ordenada crescente)
            return processedRounds[processedRounds.length - 1].id.toString();
          }
          return prev; // mantém a seleção do usuário
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => { loadRounds(); }, [loadRounds]);

  // Auto-refresh a cada 30s (captura novas rodadas processadas sem precisar recarregar a página)
  useEffect(() => {
    const interval = setInterval(() => loadRounds(true), 30_000);
    return () => clearInterval(interval);
  }, [loadRounds]);

  // Carrega resultados sempre que a rodada selecionada mudar
  useEffect(() => {
    if (!selectedRoundId) return;
    setLoadingResults(true);
    setSortKey("position");
    setSortDir("asc");
    fetch(`/api/results?round_id=${selectedRoundId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setResults((data.results || []).map((r: StoredResult) => r.data) as RankedResult[]);
      })
      .finally(() => setLoadingResults(false));
  }, [selectedRoundId]);

  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleRoundChange(id: string) {
    userSelectedRef.current = true;
    setSelectedRoundId(id);
  }

  function exportCSV() {
    if (!results.length) return;
    const headers = [
      "Posição","Empresa","Grupo","Região","Score","Receita","Lucro",
      "Liq.Corrente","Liq.Seca","Liq.Imediata",
      "ROA%","ROE%","Mg.Líq%","Mg.Bruta%","Ciclo(dias)","MarketShare%",
    ];
    const rows = sorted.map((r) => [
      r.position, r.company, r.group, r.region,
      r.score.toFixed(1), r.netRevenue.toFixed(2), r.netProfit.toFixed(2),
      r.currentRatio.toFixed(2), r.quickRatio.toFixed(2), r.immediateRatio.toFixed(2),
      r.roa.toFixed(2), r.roe.toFixed(2), r.netMargin.toFixed(2), r.grossMargin.toFixed(2),
      r.cashCycle.toFixed(0), r.marketShare.toFixed(1),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `desafio-cfo-rodada-${selectedRoundId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sorted = sortResults(results, sortKey, sortDir);
  const roundOptions = rounds.map((r) => ({ value: r.id.toString(), label: r.name }));
  const selectedRound = rounds.find((r) => r.id.toString() === selectedRoundId);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Relatórios e Exportações</h1>
          <p className="text-sm text-slate-400">
            Análises consolidadas por rodada
            {lastUpdated && (
              <span className="ml-2 text-slate-600">
                · atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadRounds(true)}
            loading={refreshing}
            title="Verificar novas rodadas processadas"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="secondary" onClick={exportCSV} disabled={!results.length}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {rounds.length === 0 ? (
        <Panel title="Sem dados" icon={FileText}>
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BarChart3 className="mb-3 h-10 w-10 opacity-30" />
            <p className="font-semibold">Nenhuma rodada processada ainda</p>
            <p className="mt-1 text-sm">Processe uma rodada para ver os relatórios</p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => loadRounds(true)} loading={refreshing}>
              <RefreshCw className="h-4 w-4" /> Verificar novamente
            </Button>
          </div>
        </Panel>
      ) : (
        <>
          {/* Seletor de rodada */}
          <Panel title="Selecionar Rodada" icon={FileText}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Select
                  label="Rodada para análise"
                  value={selectedRoundId}
                  onChange={(e) => handleRoundChange(e.target.value)}
                  options={roundOptions}
                />
              </div>
              {selectedRound && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
                  <span className="font-semibold text-white">{selectedRound.name}</span>
                  {" · "}
                  <span className="text-slate-400">{selectedRound.event_type}</span>
                  {selectedRound.processed_at && (
                    <span className="ml-2 text-slate-500 text-xs">
                      · processada em {new Date(selectedRound.processed_at).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              )}
            </div>
            {rounds.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {rounds.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRoundChange(r.id.toString())}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      r.id.toString() === selectedRoundId
                        ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                        : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </Panel>

          {loadingResults ? (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner text="Carregando resultados..." />
            </div>
          ) : results.length === 0 ? (
            <Panel title="Sem resultados" icon={BarChart3}>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <BarChart3 className="mb-3 h-8 w-8 opacity-30" />
                <p>Nenhum resultado encontrado para esta rodada</p>
              </div>
            </Panel>
          ) : (
            <>
              {/* Ranking */}
              <Panel title={`Ranking — ${selectedRound?.name ?? ""}`} icon={Trophy}>
                <RankingTable results={results} />
              </Panel>

              {/* Gráficos */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Score por Empresa" icon={BarChart3}>
                  <div className="h-72"><RankingBarChart results={results} /></div>
                </Panel>
                <Panel title="Market Share" icon={BarChart3}>
                  <div className="h-72"><MarketSharePie results={results} /></div>
                </Panel>
              </div>

              {/* Tabela detalhada */}
              <Panel
                title="Indicadores Detalhados"
                icon={BarChart3}
                subtitle="Clique nos cabeçalhos para ordenar ↑↓"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        {COLUMNS.map((col) => (
                          <SortTh key={col.key as string} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((r, i) => (
                        <tr key={r.companyId} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                          <td className="px-3 py-2.5 font-bold text-white">{r.position}º</td>
                          <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">{r.company}</td>
                          <td className="px-3 py-2.5 text-emerald-400 whitespace-nowrap">{currency(r.netRevenue)}</td>
                          <td className={`px-3 py-2.5 whitespace-nowrap font-semibold ${r.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{currency(r.netProfit)}</td>
                          <td className="px-3 py-2.5 text-white">{number(r.currentRatio, 2)}</td>
                          <td className="px-3 py-2.5 text-white">{number(r.quickRatio, 2)}</td>
                          <td className="px-3 py-2.5 text-white">{number(r.immediateRatio, 2)}</td>
                          <td className="px-3 py-2.5 text-cyan-400">{percent(r.roa)}</td>
                          <td className="px-3 py-2.5 text-cyan-400">{percent(r.roe)}</td>
                          <td className="px-3 py-2.5 text-violet-400">{percent(r.netMargin)}</td>
                          <td className="px-3 py-2.5 text-violet-400">{percent(r.grossMargin)}</td>
                          <td className="px-3 py-2.5 text-amber-400 whitespace-nowrap">{number(r.cashCycle, 0)} dias</td>
                          <td className="px-3 py-2.5 text-white">{number(r.marketShare, 1)}%</td>
                          <td className="px-3 py-2.5 font-bold text-cyan-400">{number(r.score, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-right text-xs text-slate-500">
                  Ordenado por <span className="font-semibold text-cyan-400">
                    {COLUMNS.find((c) => c.key === sortKey)?.title ?? sortKey}
                  </span>{" "}
                  {sortDir === "asc" ? "↑ crescente" : "↓ decrescente"}
                </p>
              </Panel>

              {/* Relatório de Produção e Estoque */}
              <Panel title="Relatório de Produção e Estoque" icon={BarChart3}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-3 py-2.5 text-left">Empresa</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades efetivamente produzidas no período">Produção Efetiva</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades vendidas de fato (mín. entre demanda e produção)">Qtd. Vendida</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades produzidas mas não vendidas neste período">Não Vendidas</th>
                        <th className="px-3 py-2.5 text-right" title="Valor do estoque ao final da rodada (inclui estoque inicial + produção não vendida)">Estoque Final (R$)</th>
                        <th className="px-3 py-2.5 text-right" title="Custo unitário de produção (materiais + mão de obra)">Custo Unit.</th>
                        <th className="px-3 py-2.5 text-right" title="% das unidades produzidas que foram vendidas">Taxa Venda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const taxaVenda = r.productionEffective > 0
                          ? (r.realSalesQty / r.productionEffective) * 100
                          : 0;
                        const temEstoque = r.unsoldUnits > 0;
                        return (
                          <tr key={r.companyId} className={`border-b border-white/5 hover:bg-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                            <td className="px-3 py-3">
                              <p className="font-semibold text-white">{r.company}</p>
                              <p className="text-[10px] text-slate-500">{r.group} · {r.region}</p>
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-white">
                              {(r.productionEffective ?? 0).toLocaleString("pt-BR")} un.
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-emerald-400">
                              {r.realSalesQty.toLocaleString("pt-BR")} un.
                            </td>
                            <td className={`px-3 py-3 text-right font-semibold ${temEstoque ? "text-amber-400" : "text-slate-500"}`}>
                              {(r.unsoldUnits ?? 0).toLocaleString("pt-BR")} un.
                              {temEstoque && (
                                <p className="text-[10px] font-normal text-amber-500/80">em estoque</p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <p className="font-semibold text-white">{currency(r.endingInventory)}</p>
                              {(r.unsoldUnits ?? 0) > 0 && (
                                <p className="text-[10px] text-slate-500">
                                  {(r.unsoldUnits ?? 0).toLocaleString("pt-BR")} un. × {currency(r.unitProductionCost ?? 0)}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right text-slate-300">
                              {currency(r.unitProductionCost ?? 0)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="inline-flex flex-col items-end gap-1">
                                <span className={`font-semibold ${taxaVenda >= 90 ? "text-emerald-400" : taxaVenda >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                                  {taxaVenda.toFixed(1)}%
                                </span>
                                <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${taxaVenda >= 90 ? "bg-emerald-400" : taxaVenda >= 70 ? "bg-amber-400" : "bg-rose-400"}`}
                                    style={{ width: `${Math.min(taxaVenda, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Totais */}
                    <tfoot>
                      <tr className="border-t border-white/10 bg-white/5 text-xs font-bold text-white">
                        <td className="px-3 py-2.5">TOTAL</td>
                        <td className="px-3 py-2.5 text-right">
                          {results.reduce((s, r) => s + (r.productionEffective ?? 0), 0).toLocaleString("pt-BR")} un.
                        </td>
                        <td className="px-3 py-2.5 text-right text-emerald-400">
                          {results.reduce((s, r) => s + r.realSalesQty, 0).toLocaleString("pt-BR")} un.
                        </td>
                        <td className="px-3 py-2.5 text-right text-amber-400">
                          {results.reduce((s, r) => s + (r.unsoldUnits ?? 0), 0).toLocaleString("pt-BR")} un.
                        </td>
                        <td className="px-3 py-2.5 text-right text-cyan-400">
                          {currency(results.reduce((s, r) => s + r.endingInventory, 0))}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-400">—</td>
                        <td className="px-3 py-2.5 text-right text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Legenda */}
                <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
                  <span><span className="text-emerald-400 font-semibold">Verde</span> = taxa de venda ≥ 90%</span>
                  <span><span className="text-amber-400 font-semibold">Âmbar</span> = taxa de venda 70–89%</span>
                  <span><span className="text-rose-400 font-semibold">Vermelho</span> = taxa de venda &lt; 70%</span>
                </div>
              </Panel>

              {/* DRE por empresa */}
              <Panel title="DRE por Empresa" icon={FileText}>
                <div className="grid gap-6 sm:grid-cols-2">
                  {results.map((r) => (
                    <div key={r.companyId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-cyan-400">{r.company}</p>
                      <p className="mb-3 text-[10px] text-slate-500">{r.group} · {r.region}</p>
                      <DREPanel r={r} />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Fluxo de Caixa */}
              <Panel title="Fluxo de Caixa por Empresa" icon={BarChart3}>
                <div className="grid gap-6 sm:grid-cols-2">
                  {results.map((r) => (
                    <div key={r.companyId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-cyan-400">{r.company}</p>
                      <p className="mb-3 text-[10px] text-slate-500">{r.group} · {r.region}</p>
                      <CashFlowPanel result={r} />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Balanço Patrimonial */}
              <Panel title="Balanço Patrimonial por Empresa" icon={BarChart3}>
                <div className="grid gap-6 sm:grid-cols-2">
                  {results.map((r) => (
                    <div key={r.companyId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-cyan-400">{r.company}</p>
                      <p className="mb-3 text-[10px] text-slate-500">{r.group} · {r.region}</p>
                      <BalancoPatrimonialPanel result={r} />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Análise automática */}
              <Panel title="Análise Automática" icon={FileText}>
                <div className="space-y-3">
                  {results.map((r) => (
                    <div key={r.companyId} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1 font-bold text-white">{r.company} ({r.group})</p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        A empresa {r.company} ficou em {r.position}º lugar com score de {number(r.score, 1)}.
                        Apresentou liquidez corrente de {number(r.currentRatio)}{r.currentRatio >= 1.5 ? ", indicando boa capacidade de pagamento" : r.currentRatio >= 1 ? ", indicando capacidade de pagamento adequada" : ", indicando dificuldade de pagamento no curto prazo"}.
                        O ROA de {percent(r.roa)} demonstra {r.roa > 5 ? "excelente" : r.roa > 2 ? "adequada" : "baixa"} eficiência no uso dos ativos.
                        A margem líquida de {percent(r.netMargin)} resultou em {r.netProfit >= 0 ? "lucro líquido" : "prejuízo líquido"} de {currency(Math.abs(r.netProfit))}.
                        O ciclo financeiro de {number(r.cashCycle, 0)} dias indica {r.cashCycle < 30 ? "ótima eficiência operacional" : r.cashCycle < 60 ? "eficiência operacional razoável" : "necessidade de melhoria no giro dos recursos"}.
                        Market share de {number(r.marketShare, 1)}% na rodada.
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}
