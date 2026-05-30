"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Download, BarChart3, Trophy, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw, Medal, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { RankingBarChart } from "@/components/charts/RankingBarChart";
import { MarketSharePie } from "@/components/charts/MarketSharePie";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { BalancoPatrimonialPanel } from "@/components/charts/BalancoPatrimonialPanel";
import { KpiEvolutionChart } from "@/components/charts/KpiEvolutionChart";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { currency, percent, number } from "@/lib/utils/format";
import { exportMultiSheet } from "@/lib/utils/exportExcel";
import { generateReportPDF } from "@/lib/utils/reportPdf";
import { usePoloContext } from "@/contexts/PoloContext";
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
      {(r.totalSalary ?? 0) > 0 && (
        <Row label="(-) Salários (Colaboradores)" value={`(${currency(r.totalSalary ?? 0)})`} color="text-rose-400" />
      )}
      {(r.payrollCharges ?? 0) > 0 && (
        <Row label="(-) Encargos sobre Folha" value={`(${currency(r.payrollCharges ?? 0)})`} color="text-rose-400" />
      )}
      {(r.storageExpense ?? 0) > 0 && (
        <Row label="(-) Custo de Armazenagem (5%)" value={`(${currency(r.storageExpense ?? 0)})`} color="text-amber-400" />
      )}
      {(r.marketingInsertionCost ?? 0) > 0 && (
        <Row label="(-) Inserções de Marketing" value={`(${currency(r.marketingInsertionCost ?? 0)})`} color="text-cyan-400" />
      )}
      {(r.hiringCost ?? 0) > 0 && (
        <Row label="(-) Custo de Contratação (RH)" value={`(${currency(r.hiringCost ?? 0)})`} color="text-rose-400" />
      )}
      {(r.firingCost ?? 0) > 0 && (
        <Row label="(-) Custo de Demissão (RH)" value={`(${currency(r.firingCost ?? 0)})`} color="text-rose-400" />
      )}
      {(r.regionalTransportCost ?? 0) > 0 && (
        <Row label="(-) Frete Inter-Regional" value={`(${currency(r.regionalTransportCost ?? 0)})`} color="text-violet-400" />
      )}
      <Row label="(-) Demais Desp. Operacionais" value={`(${currency(r.operationalExpenses - (r.totalSalary ?? 0) - (r.payrollCharges ?? 0) - (r.storageExpense ?? 0) - (r.marketingInsertionCost ?? 0) - (r.hiringCost ?? 0) - (r.firingCost ?? 0) - (r.regionalTransportCost ?? 0))})`} color="text-rose-400" />
      <Row label="   Total Desp. Operacionais"   value={`(${currency(r.operationalExpenses)})`} color="text-rose-400/70" />
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

/* ─── Accumulated ranking types ─── */
interface AccumEntry {
  group_id: number;
  group_name: string;
  company_name: string;
  region_name: string;
  color: string;
  totalScore: number;
  roundCount: number;
  bestPosition: number;
  avgScore: number;
  accumulatedPosition: number;
  rounds: Array<{ round_id: number; round_name: string; score: number; position: number; netProfit: number; netRevenue: number }>;
}

/* ─── Main Page ─── */
export default function RelatoriosPage() {
  const { poloParam, selectedPolo } = usePoloContext();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [results, setResults] = useState<RankedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [accumRanking, setAccumRanking] = useState<AccumEntry[]>([]);
  const [accumRounds, setAccumRounds] = useState<Array<{ id: number; name: string }>>([]);
  const [kpiMetric, setKpiMetric] = useState<"score" | "netProfit" | "netRevenue">("score");
  const [exportingPDF, setExportingPDF] = useState(false);
  // Sorting
  const [sortKey, setSortKey] = useState<string>("position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Keep track of user's selection so auto-refresh doesn't reset it
  const userSelectedRef = useRef(false);

  const loadRounds = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const url = `/api/rounds?v=1${poloParam}`;
      const res = await fetch(url, { cache: "no-store" });
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
      } else {
        // Polo selecionado pode não ter rodadas — limpa seleção
        setSelectedRoundId("");
        setResults([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [poloParam]);

  // Carga inicial + recarrega quando polo muda
  useEffect(() => { loadRounds(); }, [loadRounds]);

  // Carrega ranking acumulado sempre que os rounds ou polo mudam
  useEffect(() => {
    const accumUrl = `/api/results/accumulated?v=1${poloParam}`;
    fetch(accumUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setAccumRanking(data.ranking || []);
        setAccumRounds(data.rounds || []);
      })
      .catch(() => {});
  }, [rounds, poloParam]);

  // Auto-refresh a cada 30s (captura novas rodadas processadas sem precisar recarregar a página)
  useEffect(() => {
    const interval = setInterval(() => loadRounds(true), 30_000);
    return () => clearInterval(interval);
  }, [loadRounds]);

  // Carrega resultados sempre que a rodada selecionada ou polo mudar
  useEffect(() => {
    if (!selectedRoundId) return;
    setLoadingResults(true);
    setSortKey("position");
    setSortDir("asc");
    fetch(`/api/results?round_id=${selectedRoundId}${poloParam}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setResults((data.results || []).map((r: StoredResult) => r.data) as RankedResult[]);
      })
      .finally(() => setLoadingResults(false));
  }, [selectedRoundId, poloParam]);

  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleRoundChange(id: string) {
    userSelectedRef.current = true;
    setSelectedRoundId(id);
  }

  const sorted = sortResults(results, sortKey, sortDir);
  const roundOptions = rounds.map((r) => ({ value: r.id.toString(), label: r.name }));
  const selectedRound = rounds.find((r) => r.id.toString() === selectedRoundId);
  const roundName = selectedRound?.name ?? `R${selectedRoundId}`;

  /** Exporta o relatório completo em PDF */
  async function handleExportPDF() {
    if (!results.length) return;
    setExportingPDF(true);
    try {
      await generateReportPDF(results, roundName, selectedRound?.event_type);
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setExportingPDF(false);
    }
  }

  /** Botão Excel padrão — reutilizado em todos os cards */
  function ExcelBtn({ onClick }: { onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
      >
        <Download className="h-3.5 w-3.5" /> Excel
      </button>
    );
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">Relatórios e Exportações</h1>
          <p className="text-sm text-slate-400">
            {selectedPolo
              ? <><span className="text-cyan-400 font-semibold">{selectedPolo}</span> · {results.length} grupo{results.length !== 1 ? "s" : ""}</>
              : "Análises consolidadas por rodada"}
            {lastUpdated && (
              <span className="ml-2 text-slate-600">
                · atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              title="Exportar relatório completo em PDF"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exportingPDF ? "Gerando…" : "PDF"}
            </button>
          )}
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
              <Panel
                title={`Ranking — ${selectedRound?.name ?? ""}`}
                icon={Trophy}
                actions={
                  <ExcelBtn onClick={async () => {
                    const rows = results.map((r) => ({
                      "Posição":    r.position,
                      "Empresa":    r.company,
                      "Grupo":      r.group,
                      "Região":     r.region,
                      "Score":      r.score,
                      "Receita (R$)":   r.netRevenue,
                      "Lucro (R$)":     r.netProfit,
                      "Market Share %": r.marketShare,
                    }));
                    const { exportToExcel } = await import("@/lib/utils/exportExcel");
                    await exportToExcel(rows, `ranking-${roundName}`, "Ranking");
                  }} />
                }
              >
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
                actions={
                  <ExcelBtn onClick={async () => {
                    const rows = sorted.map((r) => ({
                      "Posição":          r.position,
                      "Empresa":          r.company,
                      "Grupo":            r.group,
                      "Região":           r.region,
                      "Score":            r.score,
                      "Receita (R$)":     r.netRevenue,
                      "Lucro (R$)":       r.netProfit,
                      "Liq. Corrente":    r.currentRatio,
                      "Liq. Seca":        r.quickRatio,
                      "Liq. Imediata":    r.immediateRatio,
                      "ROA %":            r.roa,
                      "ROE %":            r.roe,
                      "Mg. Líquida %":    r.netMargin,
                      "Mg. Bruta %":      r.grossMargin,
                      "Ciclo Fin. (dias)":r.cashCycle,
                      "Market Share %":   r.marketShare,
                    }));
                    const { exportToExcel } = await import("@/lib/utils/exportExcel");
                    await exportToExcel(rows, `indicadores-${roundName}`, "Indicadores");
                  }} />
                }
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
              <Panel
                title="Relatório de Produção e Estoque"
                icon={BarChart3}
                actions={
                  <ExcelBtn onClick={async () => {
                    const rows = results.map((r) => {
                      const taxaVenda = r.productionEffective > 0
                        ? (r.realSalesQty / r.productionEffective) * 100 : 0;
                      // Estoque Final correto: unidades físicas × custo unitário
                      const displayEnding = (r.unsoldUnits ?? 0) * (r.unitProductionCost ?? 0);
                      return {
                        "Empresa":              r.company,
                        "Grupo":                r.group,
                        "Região":               r.region,
                        "Produção Efetiva (un.)": r.productionEffective ?? 0,
                        "Qtd. Vendida (un.)":   r.realSalesQty,
                        "Não Vendidas (un.)":   r.unsoldUnits ?? 0,
                        "Estoque Final (R$)":   displayEnding,
                        "Custo Unit. (R$)":     r.unitProductionCost ?? 0,
                        "Taxa de Venda (%)":    taxaVenda,
                      };
                    });
                    const { exportToExcel } = await import("@/lib/utils/exportExcel");
                    await exportToExcel(rows, `producao-estoque-${roundName}`, "Produção e Estoque");
                  }} />
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-3 py-2.5 text-left">Empresa</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades efetivamente produzidas no período">Produção Efetiva</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades vendidas de fato (mín. entre demanda e produção)">Qtd. Vendida</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades produzidas mas não vendidas neste período">Não Vendidas</th>
                        <th className="px-3 py-2.5 text-right" title="Valor do estoque ao final da rodada (unidades não vendidas × custo unitário)">Estoque Final (R$)</th>
                        <th className="px-3 py-2.5 text-right" title="Custo unitário de produção (materiais + mão de obra)">Custo Unit.</th>
                        <th className="px-3 py-2.5 text-right" title="% das unidades produzidas que foram vendidas">Taxa Venda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const taxaVenda = r.productionEffective > 0
                          ? (r.realSalesQty / r.productionEffective) * 100
                          : 0;
                        const temEstoque = (r.unsoldUnits ?? 0) > 0;
                        // Estoque Final correto: unidades físicas × custo unitário
                        const displayEnding = (r.unsoldUnits ?? 0) * (r.unitProductionCost ?? 0);
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
                              <p className={`font-semibold ${temEstoque ? "text-white" : "text-slate-500"}`}>
                                {currency(displayEnding)}
                              </p>
                              {temEstoque && (
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

              {/* Balanço Patrimonial — todas as empresas */}
              <Panel
                title="Balanço Patrimonial por Empresa"
                icon={BarChart3}
                actions={
                  <ExcelBtn onClick={async () => {
                    const rows = results.flatMap((r) => [
                      { "Empresa": r.company, "Conta": "Caixa e Disponíveis",             "Valor (R$)": r.finalCash },
                      { "Empresa": r.company, "Conta": "Duplicatas a Receber",            "Valor (R$)": r.clients },
                      { "Empresa": r.company, "Conta": "Estoques",                        "Valor (R$)": r.endingInventory },
                      { "Empresa": r.company, "Conta": "Total Ativo Circulante",          "Valor (R$)": r.currentAssets },
                      { "Empresa": r.company, "Conta": "Imobilizado (líq. depreciação)", "Valor (R$)": r.fixedAssets },
                      { "Empresa": r.company, "Conta": "ATIVO TOTAL",                    "Valor (R$)": r.totalAssets },
                      { "Empresa": r.company, "Conta": "Fornecedores",                   "Valor (R$)": r.suppliers },
                      { "Empresa": r.company, "Conta": "Empréstimos CP (35%)",           "Valor (R$)": r.loans * 0.35 },
                      { "Empresa": r.company, "Conta": "Total Passivo Circulante",       "Valor (R$)": r.currentLiabilities },
                      { "Empresa": r.company, "Conta": "Empréstimos LP (65%)",           "Valor (R$)": r.loans * 0.65 },
                      { "Empresa": r.company, "Conta": "PASSIVO TOTAL",                  "Valor (R$)": r.totalLiabilities ?? r.currentLiabilities + r.loans * 0.65 },
                      { "Empresa": r.company, "Conta": "Capital Social",                 "Valor (R$)": r.baseEquity ?? 220000 },
                      { "Empresa": r.company, "Conta": r.netProfit >= 0 ? "Reserva de Lucros" : "Prejuízo Acumulado", "Valor (R$)": r.netProfit },
                      { "Empresa": r.company, "Conta": "TOTAL PL",                       "Valor (R$)": r.equity },
                      { "Empresa": "",        "Conta": "",                                "Valor (R$)": "" },
                    ]);
                    const { exportToExcel } = await import("@/lib/utils/exportExcel");
                    await exportToExcel(rows, `balanco-patrimonial-${roundName}`, "Balanço Patrimonial");
                  }} />
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.map((r) => (
                    <div key={r.companyId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-cyan-400">{r.company}</p>
                      <p className="mb-3 text-[10px] text-slate-500">{r.group} · {r.region}</p>
                      <BalancoPatrimonialPanel result={r} />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* DRE — todas as empresas */}
              <Panel
                title="DRE por Empresa"
                icon={FileText}
                actions={
                  <ExcelBtn onClick={async () => {
                    const rows = results.flatMap((r) => {
                      const lair = r.ebt ?? r.ebit;
                      return [
                        { "Empresa": r.company, "Demonstração": "Receita Líquida de Vendas",    "Valor (R$)": r.netRevenue },
                        { "Empresa": r.company, "Demonstração": "(-) CMV",                      "Valor (R$)": -r.cmv },
                        { "Empresa": r.company, "Demonstração": "= Lucro Bruto",                "Valor (R$)": r.grossProfit },
                        { "Empresa": r.company, "Demonstração": "(-) Salários",                 "Valor (R$)": -(r.totalSalary ?? 0) },
                        ...((r.payrollCharges ?? 0) > 0 ? [{ "Empresa": r.company, "Demonstração": "(-) Encargos sobre Folha", "Valor (R$)": -(r.payrollCharges ?? 0) }] : []),
                        { "Empresa": r.company, "Demonstração": "(-) Demais Desp. Operacionais","Valor (R$)": -(r.operationalExpenses - (r.totalSalary ?? 0) - (r.payrollCharges ?? 0) - (r.storageExpense ?? 0)) },
                        { "Empresa": r.company, "Demonstração": "= EBIT",                       "Valor (R$)": r.ebit },
                        { "Empresa": r.company, "Demonstração": "(-) Despesa Financeira",       "Valor (R$)": -(r.ebit - lair) },
                        { "Empresa": r.company, "Demonstração": "= LAIR",                       "Valor (R$)": lair },
                        { "Empresa": r.company, "Demonstração": "(-) IR (15%)",                 "Valor (R$)": -(r.ir ?? (r.incomeTax ?? 0) * (15 / 24)) },
                        { "Empresa": r.company, "Demonstração": "(-) CSLL (9%)",                "Valor (R$)": -(r.csll ?? (r.incomeTax ?? 0) * (9 / 24)) },
                        { "Empresa": r.company, "Demonstração": "= Lucro / Prejuízo Líquido",   "Valor (R$)": r.netProfit },
                        { "Empresa": "",        "Demonstração": "",                              "Valor (R$)": "" },
                      ];
                    });
                    const { exportToExcel } = await import("@/lib/utils/exportExcel");
                    await exportToExcel(rows, `dre-${roundName}`, "DRE");
                  }} />
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.map((r) => (
                    <div key={r.companyId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-cyan-400">{r.company}</p>
                      <p className="mb-3 text-[10px] text-slate-500">{r.group} · {r.region}</p>
                      <DREPanel r={r} />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Fluxo de Caixa — todas as empresas */}
              <Panel
                title="Fluxo de Caixa por Empresa"
                icon={BarChart3}
                actions={
                  <ExcelBtn onClick={async () => {
                    const rows = results.flatMap((r) => [
                      { "Empresa": r.company, "Descrição": "Saldo Inicial de Caixa",          "Valor (R$)": r.cfOpeningBalance ?? 0 },
                      { "Empresa": r.company, "Descrição": "(+) Recebimentos de clientes",    "Valor (R$)": r.cfReceipts ?? 0 },
                      { "Empresa": r.company, "Descrição": "(-) Pagamentos a fornecedores",   "Valor (R$)": -(r.cfSupplierPayments ?? 0) },
                      { "Empresa": r.company, "Descrição": "(-) Mão de obra",                 "Valor (R$)": -(r.cfLaborPayments ?? 0) },
                      { "Empresa": r.company, "Descrição": "(-) Despesas operacionais",       "Valor (R$)": -(r.cfOperationalPayments ?? 0) },
                      { "Empresa": r.company, "Descrição": "(-) Despesa financeira",          "Valor (R$)": -(r.cfFinancialPayments ?? 0) },
                      { "Empresa": r.company, "Descrição": "(-) IR / CSLL",                   "Valor (R$)": -(r.cfTaxPaid ?? 0) },
                      { "Empresa": r.company, "Descrição": "= FCO Líquido",                   "Valor (R$)": r.cfOperating ?? 0 },
                      { "Empresa": r.company, "Descrição": "(-) Aquisição de imobilizado",    "Valor (R$)": -(r.cfMachinePayment ?? 0) },
                      { "Empresa": r.company, "Descrição": "= FCI Líquido",                   "Valor (R$)": r.cfInvesting ?? 0 },
                      { "Empresa": r.company, "Descrição": "(+) Empréstimos captados",        "Valor (R$)": r.cfLoanReceived ?? 0 },
                      { "Empresa": r.company, "Descrição": "= FCF Líquido",                   "Valor (R$)": r.cfFinancing ?? 0 },
                      { "Empresa": r.company, "Descrição": "= Saldo Final de Caixa",          "Valor (R$)": r.finalCash },
                      { "Empresa": "",        "Descrição": "",                                 "Valor (R$)": "" },
                    ]);
                    const { exportToExcel } = await import("@/lib/utils/exportExcel");
                    await exportToExcel(rows, `fluxo-caixa-${roundName}`, "Fluxo de Caixa");
                  }} />
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.map((r) => (
                    <div key={r.companyId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-cyan-400">{r.company}</p>
                      <p className="mb-3 text-[10px] text-slate-500">{r.group} · {r.region}</p>
                      <CashFlowPanel result={r} />
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Análise automática */}
              <Panel
                title="Análise Automática"
                icon={FileText}
                actions={
                  <ExcelBtn onClick={async () => {
                    const rows = results.map((r) => ({
                      "Empresa":           r.company,
                      "Grupo":             r.group,
                      "Posição":           r.position,
                      "Score":             r.score,
                      "Liquidez Corrente": r.currentRatio,
                      "ROA %":             r.roa,
                      "Margem Líquida %":  r.netMargin,
                      "Lucro (R$)":        r.netProfit,
                      "Ciclo Fin. (dias)": r.cashCycle,
                      "Market Share %":    r.marketShare,
                    }));
                    const { exportToExcel } = await import("@/lib/utils/exportExcel");
                    await exportToExcel(rows, `analise-automatica-${roundName}`, "Análise");
                  }} />
                }
              >
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

              {/* ── NOTAS DOS ALUNOS → menu Notas ── */}
              <Link href="/professor/notas">
                <div className="flex items-center justify-between rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5 transition-colors hover:bg-violet-400/10 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/20">
                      <GraduationCap className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Notas dos Alunos</p>
                      <p className="text-xs text-slate-400">
                        Classificação, escala de notas e lista individual de alunos — acesse o menu Notas
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-violet-400 shrink-0" />
                </div>
              </Link>
            </>
          )}

          {/* ── RANKING ACUMULADO (todas as rodadas) ── */}
          {accumRanking.length > 0 && (
            <Panel
              title={`Ranking Acumulado — ${accumRounds.length} rodada${accumRounds.length !== 1 ? "s" : ""} processada${accumRounds.length !== 1 ? "s" : ""}`}
              icon={Medal}
              subtitle="Soma de scores de todas as rodadas · Princípio da continuidade contábil"
              actions={
                <ExcelBtn onClick={async () => {
                  const rows = accumRanking.map((entry) => {
                    const base: Record<string, string | number> = {
                      "Posição":  entry.accumulatedPosition,
                      "Empresa":  entry.company_name,
                      "Grupo":    entry.group_name,
                      "Região":   entry.region_name,
                    };
                    accumRounds.forEach((rnd) => {
                      const rd = entry.rounds.find((x) => x.round_id === rnd.id);
                      base[rnd.name] = rd ? rd.score : "";
                    });
                    base["Média"]  = entry.avgScore;
                    base["Total"]  = entry.totalScore;
                    return base;
                  });
                  const { exportToExcel } = await import("@/lib/utils/exportExcel");
                  await exportToExcel(rows, "ranking-acumulado", "Ranking Acumulado");
                }} />
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-3 py-2.5 text-left">#</th>
                      <th className="px-3 py-2.5 text-left">Empresa</th>
                      <th className="px-3 py-2.5 text-left">Região</th>
                      {accumRounds.map((r) => (
                        <th key={r.id} className="px-3 py-2.5 text-right whitespace-nowrap">{r.name}</th>
                      ))}
                      <th className="px-3 py-2.5 text-right">Média</th>
                      <th className="px-3 py-2.5 text-right font-black text-cyan-400">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accumRanking.map((entry, i) => {
                      const medals = ["🥇","🥈","🥉"];
                      return (
                        <tr key={entry.group_id} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                          <td className="px-3 py-3 font-black text-xl">
                            {medals[i] ?? <span className="text-base font-bold text-slate-400">{i + 1}º</span>}
                          </td>
                          <td className="px-3 py-3">
                            <div className={`mb-0.5 h-1.5 w-full rounded-full bg-gradient-to-r ${entry.color}`} />
                            <p className="font-bold text-white">{entry.company_name}</p>
                            <p className="text-[10px] text-slate-500">{entry.group_name}</p>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">{entry.region_name}</td>
                          {accumRounds.map((r) => {
                            const rd = entry.rounds.find((x) => x.round_id === r.id);
                            return (
                              <td key={r.id} className="px-3 py-3 text-right">
                                {rd ? (
                                  <div>
                                    <span className={`font-semibold ${rd.position === 1 ? "text-amber-400" : "text-white"}`}>
                                      {number(rd.score, 1)}
                                    </span>
                                    <p className="text-[10px] text-slate-500">{rd.position}º</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-right font-semibold text-slate-300">
                            {number(entry.avgScore, 1)}
                          </td>
                          <td className="px-3 py-3 text-right font-black text-cyan-400 text-base">
                            {number(entry.totalScore, 1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Score de cada rodada somado ao total acumulado — reflete consistência ao longo do jogo, não apenas o desempenho pontual.
              </p>
            </Panel>
          )}

          {/* ── EVOLUÇÃO HISTÓRICA DE KPIs ── */}
          {accumRanking.length > 0 && accumRounds.length >= 2 && (() => {
            const KPI_OPTIONS = [
              { value: "score",      label: "Score",         fmt: (v: number) => number(v, 1) },
              { value: "netProfit",  label: "Lucro Líquido", fmt: (v: number) => currency(v) },
              { value: "netRevenue", label: "Receita",       fmt: (v: number) => currency(v) },
            ] as const;

            const selected = KPI_OPTIONS.find((k) => k.value === kpiMetric) ?? KPI_OPTIONS[0];

            // Monta séries de dados para o gráfico
            const chartData = accumRounds.map((round) => {
              const point: Record<string, string | number> = { round_name: round.name };
              for (const entry of accumRanking) {
                const rd = entry.rounds.find((x) => x.round_id === round.id);
                if (rd) point[entry.company_name] = rd[kpiMetric];
              }
              return point;
            });

            const companies = accumRanking.map((e) => ({ name: e.company_name, color: e.color }));

            return (
              <Panel title="Evolução Histórica de Indicadores" icon={BarChart3} subtitle="Selecione o KPI para visualizar a evolução multi-rodada">
                <div className="mb-4 flex flex-wrap gap-2">
                  {KPI_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setKpiMetric(opt.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        kpiMetric === opt.value
                          ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                          : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <KpiEvolutionChart
                  data={chartData}
                  companies={companies}
                  formatter={selected.fmt}
                />
              </Panel>
            );
          })()}
        </>
      )}
    </div>
  );
}
