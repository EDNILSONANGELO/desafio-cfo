"use client";

import { useState, useEffect } from "react";
import { Trophy, BarChart3, TrendingUp, Brain, Download, ChevronDown } from "lucide-react";
import { exportToExcel, exportMultiSheet } from "@/lib/utils/exportExcel";
import { Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { MedalsPanel } from "@/components/dashboard/MedalsPanel";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { BalancoPatrimonialPanel } from "@/components/charts/BalancoPatrimonialPanel";
import { MarketSharePie } from "@/components/charts/MarketSharePie";
import { currency, percent, number } from "@/lib/utils/format";
import { getScoreGrade, buildGradeScale, DEFAULT_GRADE_SCALE } from "@/lib/simulation/scoring";
import type { GradeLevel } from "@/lib/simulation/scoring";
import { generateFeedback } from "@/lib/simulation/feedback";
import { KpiEvolutionChart } from "@/components/charts/KpiEvolutionChart";
import type { StoredResult, Medal, SessionPayload, RankedResult, GradeAdjustment } from "@/types";

interface Props {
  groupResults: (StoredResult & { round?: { id: number; name: string; event_type: string; processed_at: string } })[];
  fullRanking: StoredResult[];
  medals: Medal[];
  session: SessionPayload;
  gradeScaleRaw?: unknown[];
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
    >
      <Download className="h-3.5 w-3.5" />
      Excel
    </button>
  );
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

export default function ResultadosClient({ groupResults, fullRanking, medals, session, gradeScaleRaw }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [roundFullRanking, setRoundFullRanking] = useState<RankedResult[]>(
    fullRanking.map((r) => r.data as RankedResult)
  );
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [adjustment, setAdjustment] = useState<GradeAdjustment | null>(null);

  const gradeScale: GradeLevel[] =
    Array.isArray(gradeScaleRaw) && gradeScaleRaw.length > 0
      ? buildGradeScale(gradeScaleRaw as Omit<GradeLevel, "color">[])
      : DEFAULT_GRADE_SCALE;

  const currentResult = groupResults[selectedIdx];
  const result = currentResult?.data as RankedResult | undefined;
  const grade = result ? getScoreGrade(result.score, gradeScale) : null;
  const roundName = currentResult?.round?.name ?? `Rodada ${currentResult?.round_id ?? ""}`;

  // Determine if this is the last processed round (= nota definitiva)
  const lastRoundId = groupResults.reduce((max, r) => Math.max(max, r.round_id), 0);
  const isLastRound = currentResult?.round_id === lastRoundId;

  // Busca o ranking completo + ajuste de nota sempre que a rodada selecionada mudar
  useEffect(() => {
    if (!currentResult?.round_id) return;
    setLoadingRanking(true);
    setAdjustment(null);
    Promise.all([
      fetch(`/api/results?round_id=${currentResult.round_id}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/grade-adjustments?round_id=${currentResult.round_id}&own=true`, { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([rankData, adjData]) => {
        const ranked = (rankData.results || []).map((r: StoredResult) => r.data as RankedResult);
        setRoundFullRanking(ranked);
        const adjs = (adjData.adjustments || []) as GradeAdjustment[];
        setAdjustment(adjs.length > 0 ? adjs[0] : null);
      })
      .catch(() => {})
      .finally(() => setLoadingRanking(false));
  }, [currentResult?.round_id]);

  // ── Export helpers ───────────────────────────────────────────
  async function exportIndicadores() {
    if (!result) return;
    const rows = [
      { "Indicador": "Receita Líquida",      "Valor": result.netRevenue,       "Unidade": "R$" },
      { "Indicador": "CMV",                   "Valor": result.cmv,              "Unidade": "R$" },
      { "Indicador": "Lucro Bruto",           "Valor": result.grossProfit,      "Unidade": "R$" },
      { "Indicador": "EBIT",                  "Valor": result.ebit,             "Unidade": "R$" },
      { "Indicador": "Lucro Líquido",         "Valor": result.netProfit,        "Unidade": "R$" },
      { "Indicador": "Margem Bruta",          "Valor": result.grossMargin,      "Unidade": "%" },
      { "Indicador": "Margem Operacional",    "Valor": result.operatingMargin,  "Unidade": "%" },
      { "Indicador": "Margem Líquida",        "Valor": result.netMargin,        "Unidade": "%" },
      { "Indicador": "Liquidez Corrente",     "Valor": result.currentRatio,     "Unidade": "índice" },
      { "Indicador": "Liquidez Seca",         "Valor": result.quickRatio,       "Unidade": "índice" },
      { "Indicador": "Liquidez Imediata",     "Valor": result.immediateRatio,   "Unidade": "índice" },
      { "Indicador": "ROA",                   "Valor": result.roa,              "Unidade": "%" },
      { "Indicador": "ROE",                   "Valor": result.roe,              "Unidade": "%" },
      { "Indicador": "PME",                   "Valor": result.pme,              "Unidade": "dias" },
      { "Indicador": "PMR",                   "Valor": result.pmr,              "Unidade": "dias" },
      { "Indicador": "PMP",                   "Valor": result.pmp,              "Unidade": "dias" },
      { "Indicador": "Ciclo Financeiro",      "Valor": result.cashCycle,        "Unidade": "dias" },
      { "Indicador": "Market Share",          "Valor": result.marketShare,      "Unidade": "%" },
      { "Indicador": "Score",                 "Valor": result.score,            "Unidade": "pts" },
    ];
    await exportToExcel(rows, `indicadores-contabeis-${roundName}`, "Indicadores Contábeis");
  }

  async function exportBP() {
    if (!result) return;
    const pnc = result.longTermLiabilities ?? result.loans * 0.65;
    const rows = [
      { "Conta": "ATIVO",                          "Valor (R$)": "" },
      { "Conta": "Caixa e Disponíveis",             "Valor (R$)": result.finalCash },
      { "Conta": "Duplicatas a Receber",            "Valor (R$)": result.clients },
      { "Conta": "Estoques",                        "Valor (R$)": result.endingInventory },
      { "Conta": "Total Ativo Circulante",          "Valor (R$)": result.currentAssets },
      { "Conta": "Imobilizado (líq. depreciação)",  "Valor (R$)": result.fixedAssets },
      { "Conta": "ATIVO TOTAL",                     "Valor (R$)": result.totalAssets },
      { "Conta": "",                                "Valor (R$)": "" },
      { "Conta": "PASSIVO",                         "Valor (R$)": "" },
      { "Conta": "Fornecedores",                    "Valor (R$)": result.suppliers },
      { "Conta": "Empréstimos — curto prazo (35%)", "Valor (R$)": result.loans * 0.35 },
      { "Conta": "Total Passivo Circulante",        "Valor (R$)": result.currentLiabilities },
      { "Conta": "Empréstimos — longo prazo (65%)", "Valor (R$)": pnc },
      { "Conta": "PASSIVO TOTAL",                   "Valor (R$)": result.totalLiabilities ?? (result.currentLiabilities + pnc) },
      { "Conta": "",                                "Valor (R$)": "" },
      { "Conta": "PATRIMÔNIO LÍQUIDO",              "Valor (R$)": "" },
      { "Conta": "Capital Social",                  "Valor (R$)": result.baseEquity ?? 220000 },
      { "Conta": result.netProfit >= 0 ? "Reserva de Lucros" : "Prejuízo Acumulado", "Valor (R$)": result.netProfit },
      { "Conta": "TOTAL PL",                        "Valor (R$)": result.equity },
    ];
    await exportToExcel(rows, `balanco-patrimonial-${roundName}`, "Balanço Patrimonial");
  }

  async function exportDRE() {
    if (!result) return;
    const lair = result.ebt ?? result.ebit;
    const rows = [
      { "Demonstração": "Receita Líquida de Vendas",             "Valor (R$)": result.netRevenue },
      { "Demonstração": "(-) CMV — Custo dos Materiais",        "Valor (R$)": -(result.cmv - (result.depreciationExpense ?? 0)) },
      { "Demonstração": "(-) CMV — Depreciação (10% a.a.)",     "Valor (R$)": -(result.depreciationExpense ?? 0) },
      { "Demonstração": "= Total CMV",                          "Valor (R$)": -result.cmv },
      { "Demonstração": "= Lucro Bruto",                        "Valor (R$)": result.grossProfit },
      { "Demonstração": "(-) Salários",                         "Valor (R$)": -(result.totalSalary ?? 0) },
      ...(result.payrollCharges ?? 0) > 0 ? [{ "Demonstração": "(-) Encargos sobre Folha", "Valor (R$)": -(result.payrollCharges ?? 0) }] : [],
      { "Demonstração": "(-) Demais Desp. Operacionais",        "Valor (R$)": -(result.operationalExpenses - (result.totalSalary ?? 0) - (result.payrollCharges ?? 0) - (result.storageExpense ?? 0)) },
      { "Demonstração": "= EBIT",                               "Valor (R$)": result.ebit },
      { "Demonstração": "(-) Despesa Financeira",           "Valor (R$)": -(result.ebit - lair) },
      { "Demonstração": "= LAIR",                           "Valor (R$)": lair },
      { "Demonstração": "(-) IR (15%)",                     "Valor (R$)": -(result.ir ?? (result.incomeTax ?? 0) * (15 / 24)) },
      { "Demonstração": "(-) CSLL (9%)",                    "Valor (R$)": -(result.csll ?? (result.incomeTax ?? 0) * (9 / 24)) },
      { "Demonstração": "= Lucro / Prejuízo Líquido",       "Valor (R$)": result.netProfit },
    ];
    await exportToExcel(rows, `dre-${roundName}`, "DRE");
  }

  async function exportFluxoCaixa() {
    if (!result || result.cfOperating === undefined) return;
    const r = result as Required<typeof result>;
    const rows = [
      { "Descrição": "Saldo Inicial de Caixa",                   "Valor (R$)": r.cfOpeningBalance },
      { "Descrição": "FCO — Atividades Operacionais",            "Valor (R$)": "" },
      { "Descrição": "(+) Recebimentos de Duplicatas a Receber", "Valor (R$)": r.cfReceipts },
      { "Descrição": "(-) Pagamentos a fornecedores",            "Valor (R$)": -r.cfSupplierPayments },
      { "Descrição": "(-) Mão de obra",                          "Valor (R$)": -r.cfLaborPayments },
      { "Descrição": "(-) Despesas operacionais",                "Valor (R$)": -r.cfOperationalPayments },
      { "Descrição": "(-) Despesa financeira",                   "Valor (R$)": -r.cfFinancialPayments },
      { "Descrição": "(-) IR / CSLL",                            "Valor (R$)": -r.cfTaxPaid },
      { "Descrição": "= FCO Líquido",                            "Valor (R$)": r.cfOperating },
      { "Descrição": "FCI — Atividades de Investimento",         "Valor (R$)": "" },
      { "Descrição": "(-) Aquisição de imobilizado",             "Valor (R$)": -r.cfMachinePayment },
      { "Descrição": "= FCI Líquido",                            "Valor (R$)": r.cfInvesting },
      { "Descrição": "FCF — Atividades de Financiamento",        "Valor (R$)": "" },
      { "Descrição": "(+) Empréstimos captados",                 "Valor (R$)": r.cfLoanReceived },
      { "Descrição": "= FCF Líquido",                            "Valor (R$)": r.cfFinancing },
      { "Descrição": "Variação Líquida de Caixa",                "Valor (R$)": r.cfNetChange },
      { "Descrição": "= Saldo Final de Caixa",                   "Valor (R$)": r.finalCash },
    ];
    await exportToExcel(rows, `fluxo-de-caixa-${roundName}`, "Fluxo de Caixa");
  }

  async function exportTudo() {
    if (!result) return;
    // Chama exportação completa numa só planilha com múltiplas abas
    await exportMultiSheet([
      { name: "Indicadores Contábeis", rows: [
        { "Indicador": "Receita Líquida", "Valor": result.netRevenue, "Unidade": "R$" },
        { "Indicador": "Lucro Líquido",   "Valor": result.netProfit,  "Unidade": "R$" },
        { "Indicador": "Margem Bruta",    "Valor": result.grossMargin,"Unidade": "%" },
        { "Indicador": "Margem Líquida",  "Valor": result.netMargin,  "Unidade": "%" },
        { "Indicador": "Liquidez Corrente","Valor": result.currentRatio,"Unidade": "índice" },
        { "Indicador": "ROA",             "Valor": result.roa,        "Unidade": "%" },
        { "Indicador": "ROE",             "Valor": result.roe,        "Unidade": "%" },
        { "Indicador": "Ciclo Financeiro","Valor": result.cashCycle,  "Unidade": "dias" },
        { "Indicador": "Score",           "Valor": result.score,      "Unidade": "pts" },
      ]},
    ], `resultados-completos-${roundName}`);
  }

  if (!groupResults.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-black text-white sm:text-2xl">Resultados</h1>
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
        <h1 className="text-xl font-black text-white sm:text-2xl">Meus Resultados</h1>
        <p className="text-sm text-slate-400">{session.name} · RA {session.identifier}</p>
      </div>

      {/* ── Filtro de rodada ── */}
      <Panel title="Selecionar Rodada" icon={ChevronDown}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Select nativo estilizado */}
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm font-semibold text-white focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            >
              {groupResults.map((r, i) => (
                <option key={r.id} value={i} className="bg-slate-900 text-white">
                  {r.round?.name || `Rodada ${r.round_id}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Info da rodada selecionada */}
          {currentResult?.round && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
              <span className="font-semibold text-white">{currentResult.round.name}</span>
              {currentResult.round.event_type && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{currentResult.round.event_type}</span>
                </>
              )}
              {currentResult.round.processed_at && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">
                    processada em {new Date(currentResult.round.processed_at).toLocaleDateString("pt-BR")}
                  </span>
                </>
              )}
            </div>
          )}

          {loadingRanking && (
            <span className="text-xs text-slate-500 animate-pulse">Carregando ranking...</span>
          )}
        </div>

        {/* Chips de rodada para navegação rápida (quando há mais de 1) */}
        {groupResults.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {groupResults.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setSelectedIdx(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  i === selectedIdx
                    ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {r.round?.name || `Rodada ${r.round_id}`}
              </button>
            ))}
          </div>
        )}
      </Panel>

      {result && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={Trophy} title="Posição" value={`${result.position}º lugar`} subtitle={grade?.label} accent="amber" />
            <KpiCard icon={TrendingUp} title="Score" value={number(result.score, 1)} subtitle={`Grade: ${grade?.grade}`} accent="cyan" />
            <KpiCard icon={BarChart3} title="Lucro Líquido" value={currency(result.netProfit)} accent="emerald" />
            <KpiCard icon={BarChart3} title="Market Share" value={`${number(result.marketShare, 1)}%`} accent="violet" />
          </div>

          {/* Nota Acadêmica do Aluno */}
          {grade && (
            <div className="space-y-3">
              {/* Banner nota definitiva */}
              {isLastRound && (
                <div className="flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5">
                  <span className="text-violet-300 font-bold text-sm">★ Nota Definitiva da Universidade</span>
                  <span className="text-xs text-slate-400">— esta é a última rodada processada</span>
                </div>
              )}

              <div className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start ${
                grade.color === "text-emerald-400" ? "border-emerald-500/30 bg-emerald-500/10" :
                grade.color === "text-cyan-400"    ? "border-cyan-500/30 bg-cyan-500/10" :
                grade.color === "text-sky-400"     ? "border-sky-500/30 bg-sky-500/10" :
                grade.color === "text-amber-400"   ? "border-amber-500/30 bg-amber-500/10" :
                grade.color === "text-orange-400"  ? "border-orange-500/30 bg-orange-500/10" :
                                                     "border-rose-500/30 bg-rose-500/10"
              }`}>
                {/* Nota do grupo */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white/10 px-5 py-4 min-w-[80px]">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Grupo</span>
                    <span className={`text-4xl font-black leading-none mt-1 ${grade.color}`}>
                      {grade.nota.toFixed(1)}
                    </span>
                  </div>

                  {/* Nota ajustada (se houver) */}
                  {adjustment && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 px-5 py-4 min-w-[80px]">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">Ajustada</span>
                      <span className="text-4xl font-black leading-none mt-1 text-violet-300">
                        {adjustment.adjusted_nota.toFixed(1)}
                      </span>
                      <span className="mt-1 text-[9px] font-bold text-violet-400">pelo professor</span>
                    </div>
                  )}
                </div>

                {/* Grau e descrição */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${grade.color}`}>{grade.grade}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs font-semibold text-white">
                      {grade.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Nota acadêmica do seu grupo nesta rodada
                  </p>
                  <p className="text-xs text-slate-500">
                    Baseada no score de <span className="font-semibold text-white">{number(result.score, 1)} pts</span> · escala configurada pelo professor
                  </p>
                  {adjustment && (
                    <div className="mt-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2.5 text-xs">
                      <p className="font-bold text-violet-300 mb-0.5">Justificativa do ajuste:</p>
                      <p className="text-slate-300 italic leading-relaxed">"{adjustment.justification}"</p>
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        Sua nota final para esta rodada é <strong className="text-violet-300">{adjustment.adjusted_nota.toFixed(1)}</strong>
                        {" "}(ajustada individualmente pelo professor)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Detailed metrics */}
          <Panel title="Indicadores Contábeis" icon={BarChart3} actions={<ExportBtn onClick={exportIndicadores} />}>
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

          {/* Relatório de Produção e Estoque */}
          {(() => {
            const r = result; // captura para narrowing dentro de closures
            const taxaVenda = (r.productionEffective ?? 0) > 0
              ? (r.realSalesQty / (r.productionEffective ?? 1)) * 100
              : 0;
            const temEstoque = (r.unsoldUnits ?? 0) > 0;

            async function exportProducao() {
              const rows = [
                { "Empresa": r.company, "Grupo": r.group, "Região": r.region,
                  "Produção Efetiva (un.)": r.productionEffective ?? 0,
                  "Qtd. Vendida (un.)": r.realSalesQty,
                  "Não Vendidas (un.)": r.unsoldUnits ?? 0,
                  "Estoque Final (R$)": r.endingInventory,
                  "Custo Unit. (R$)": r.unitProductionCost ?? 0,
                  "Taxa de Venda (%)": taxaVenda.toFixed(1),
                },
              ];
              await exportToExcel(rows, `producao-estoque-${roundName}`, "Produção e Estoque");
            }

            return (
              <Panel
                title="Relatório de Produção e Estoque"
                icon={BarChart3}
                actions={<ExportBtn onClick={exportProducao} />}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-3 py-2.5 text-left">Empresa</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades efetivamente produzidas no período">Produção Efetiva</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades vendidas de fato">Qtd. Vendida</th>
                        <th className="px-3 py-2.5 text-right" title="Unidades produzidas mas não vendidas">Não Vendidas</th>
                        <th className="px-3 py-2.5 text-right" title="Valor do estoque ao final da rodada">Estoque Final (R$)</th>
                        <th className="px-3 py-2.5 text-right" title="Custo unitário de produção">Custo Unit.</th>
                        <th className="px-3 py-2.5 text-right" title="% das unidades produzidas que foram vendidas">Taxa Venda</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 hover:bg-white/5">
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
                          {temEstoque && <p className="text-[10px] font-normal text-amber-500/80">em estoque</p>}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="font-semibold text-white">{currency(r.endingInventory)}</p>
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
                            <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${taxaVenda >= 90 ? "bg-emerald-400" : taxaVenda >= 70 ? "bg-amber-400" : "bg-rose-400"}`}
                                style={{ width: `${Math.min(taxaVenda, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* ── Análise contextual ── */}
                {(() => {
                  const prod  = r.productionEffective ?? 0;
                  const vend  = r.realSalesQty;
                  const naovend = r.unsoldUnits ?? 0;
                  const custoEstoque = r.endingInventory;

                  // Faixa de desempenho
                  type Faixa = "excelente" | "alerta" | "critica";
                  const faixa: Faixa =
                    taxaVenda >= 90 ? "excelente" :
                    taxaVenda >= 70 ? "alerta"    : "critica";

                  // Construção da mensagem principal
                  const pct = taxaVenda.toFixed(1);

                  const titulo: Record<Faixa, string> = {
                    excelente: "✅ Excelente absorção de mercado",
                    alerta:    "⚠️ Atenção: estoque parado",
                    critica:   "🔴 Produção muito acima da demanda",
                  };

                  const corpo: Record<Faixa, string> = {
                    excelente:
                      `Sua empresa vendeu ${pct}% de tudo que produziu — a demanda absorveu bem a oferta. ` +
                      (naovend === 0
                        ? "Não sobrou nenhuma unidade em estoque nesta rodada."
                        : `Apenas ${naovend.toLocaleString("pt-BR")} unidade(s) ficaram em estoque (${currency(custoEstoque)}), o que é aceitável.`),
                    alerta:
                      `Sua empresa produziu ${prod.toLocaleString("pt-BR")} unidades mas conseguiu vender apenas ` +
                      `${vend.toLocaleString("pt-BR")} — ${pct}% da produção. ` +
                      `As ${naovend.toLocaleString("pt-BR")} unidades restantes estão paradas em estoque, ` +
                      `representando ${currency(custoEstoque)} de capital imobilizado sem retorno nesta rodada.`,
                    critica:
                      `Sua empresa produziu ${prod.toLocaleString("pt-BR")} unidades mas vendeu somente ` +
                      `${vend.toLocaleString("pt-BR")} — apenas ${pct}% da produção foi absorvida pelo mercado. ` +
                      `Isso indica uma desproporção grave: ${naovend.toLocaleString("pt-BR")} unidades ` +
                      `(${currency(custoEstoque)}) permanecem em estoque, ` +
                      `consumindo caixa sem gerar receita.`,
                  };

                  const dica: Record<Faixa, string> = {
                    excelente:
                      "Dica: avalie se a demanda suportaria uma produção maior na próxima rodada para ampliar a receita.",
                    alerta:
                      "Dica: reduza a produção para se aproximar da demanda real, reveja o preço de venda ou invista mais em marketing para estimular a demanda.",
                    critica:
                      "Dica: planeje a produção com base na demanda estimada (considere preço, marketing e evento de mercado). Produzir em excesso imobiliza caixa e reduz a liquidez da empresa.",
                  };

                  const bgCls: Record<Faixa, string> = {
                    excelente: "bg-emerald-500/10 border-emerald-500/30",
                    alerta:    "bg-amber-500/10 border-amber-500/30",
                    critica:   "bg-rose-500/10 border-rose-500/30",
                  };
                  const titleCls: Record<Faixa, string> = {
                    excelente: "text-emerald-300",
                    alerta:    "text-amber-300",
                    critica:   "text-rose-300",
                  };

                  return (
                    <div className={`mt-4 rounded-xl border p-4 ${bgCls[faixa]}`}>
                      <p className={`mb-1.5 font-bold text-sm ${titleCls[faixa]}`}>
                        {titulo[faixa]}
                      </p>
                      <p className="text-[13px] leading-relaxed text-slate-300">
                        {corpo[faixa]}
                      </p>
                      <p className="mt-2 text-[12px] leading-relaxed text-slate-400 italic">
                        {dica[faixa]}
                      </p>
                    </div>
                  );
                })()}

                {/* Legenda resumida */}
                <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
                  <span><span className="text-emerald-400 font-semibold">Verde (≥ 90%)</span> — demanda bem alinhada com a produção</span>
                  <span><span className="text-amber-400 font-semibold">Âmbar (70–89%)</span> — estoque parado, atenção ao planejamento</span>
                  <span><span className="text-rose-400 font-semibold">Vermelho (&lt; 70%)</span> — superprodução crítica, capital imobilizado</span>
                </div>
              </Panel>
            );
          })()}

          {/* ── COLABORADORES & MARKETING ── */}
          {((result.netEmployees !== undefined) || (result.marketingInsertionCost !== undefined)) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Bloco Colaboradores */}
              {result.netEmployees !== undefined && (
                <Panel title="Gestão de Colaboradores" icon={BarChart3}>
                  <div className="space-y-3">
                    {/* Status Badge */}
                    {result.employeeStatus && (
                      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                        result.employeeStatus === "good"   ? "border-emerald-500/30 bg-emerald-500/10" :
                        result.employeeStatus === "alert"  ? "border-amber-500/30 bg-amber-500/10"    :
                                                             "border-rose-500/30 bg-rose-500/10"
                      }`}>
                        <span className="text-2xl">
                          {result.employeeStatus === "good" ? "✅" : result.employeeStatus === "alert" ? "⚠️" : "🚨"}
                        </span>
                        <div>
                          <p className={`font-black text-sm ${
                            result.employeeStatus === "good"  ? "text-emerald-300" :
                            result.employeeStatus === "alert" ? "text-amber-300"   : "text-rose-300"
                          }`}>{result.employeeStatusLabel}</p>
                          <p className="text-[11px] text-slate-400">
                            {result.employeeStatus === "good"  ? "Equipe suficiente — produtividade 100%"  :
                             result.employeeStatus === "alert" ? "Equipe abaixo do ideal — produtividade 90%" :
                                                                 "Equipe crítica — produtividade 70% (greve)"}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Métricas em grid */}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ativos</p>
                        <p className="text-xl font-black text-white mt-0.5">{result.netEmployees}</p>
                        <p className="text-[10px] text-slate-500">colaboradores</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Necessários</p>
                        <p className="text-xl font-black text-slate-300 mt-0.5">{result.minEmployeesNeeded ?? "—"}</p>
                        <p className="text-[10px] text-slate-500">para a produção</p>
                      </div>
                      <div className={`rounded-xl border p-3 text-center ${(result.idleEmployees ?? 0) > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/10"}`}>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ociosos</p>
                        <p className={`text-xl font-black mt-0.5 ${(result.idleEmployees ?? 0) > 0 ? "text-amber-400" : "text-slate-500"}`}>
                          {result.idleEmployees ?? 0}
                        </p>
                        <p className="text-[10px] text-slate-500">disponíveis</p>
                      </div>
                    </div>
                    {/* Custos de RH */}
                    {((result.hiringCost ?? 0) > 0 || (result.firingCost ?? 0) > 0) && (
                      <div className="space-y-1.5 text-sm">
                        {(result.hiringCost ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Custo de Contratação</span>
                            <span className="font-semibold text-rose-400">({currency(result.hiringCost ?? 0)})</span>
                          </div>
                        )}
                        {(result.firingCost ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Custo de Demissão</span>
                            <span className="font-semibold text-rose-400">({currency(result.firingCost ?? 0)})</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Fator de produtividade */}
                    {result.employeeProductionFactor !== undefined && result.employeeProductionFactor < 1 && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300 leading-relaxed">
                        ⚡ Fator de produtividade aplicado: <strong>{(result.employeeProductionFactor * 100).toFixed(0)}%</strong>
                        {" "}— a produção efetiva foi reduzida por insuficiência de pessoal.
                      </div>
                    )}
                  </div>
                </Panel>
              )}

              {/* Bloco Marketing & Transporte */}
              {(result.marketingInsertionCost !== undefined || result.regionalTransportCost !== undefined) && (
                <Panel title="Marketing & Vendas Regionais" icon={BarChart3}>
                  <div className="space-y-3">
                    {(result.marketingInsertionCost ?? 0) > 0 && (
                      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                        <p className="text-xs text-slate-400 mb-1">Inserções de Marketing</p>
                        <p className="text-xl font-black text-cyan-300">{currency(result.marketingInsertionCost ?? 0)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Custo total das inserções — cada inserção impulsiona +6% na demanda regional
                        </p>
                      </div>
                    )}
                    {(result.regionalTransportCost ?? 0) > 0 && (
                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                        <p className="text-xs text-slate-400 mb-1">Frete Inter-Regional</p>
                        <p className="text-xl font-black text-violet-300">{currency(result.regionalTransportCost ?? 0)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Custo de transporte para vendas fora da sua região de origem (R$3/unidade)
                        </p>
                      </div>
                    )}
                    {(result.marketingInsertionCost ?? 0) === 0 && (result.regionalTransportCost ?? 0) === 0 && (
                      <p className="text-sm text-slate-500 italic py-4 text-center">
                        Nenhum custo de marketing por inserção ou transporte regional nesta rodada.
                      </p>
                    )}
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* BP · DRE · Fluxo — grade lado a lado */}
          <div className="grid gap-4 lg:grid-cols-3">

            {/* ── BALANÇO PATRIMONIAL ── */}
            <Panel title="Balanço Patrimonial" icon={BarChart3} actions={<ExportBtn onClick={exportBP} />}>
              <BalancoPatrimonialPanel result={result} />
            </Panel>

            {/* ── DRE ── */}
            <Panel title="DRE – Demonstração do Resultado do Exercício" icon={BarChart3} actions={<ExportBtn onClick={exportDRE} />}>
              <div className="space-y-1.5 text-sm">
                {/* Receita */}
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Receita Líquida de Vendas</span>
                  <span className="font-semibold text-emerald-400">{currency(result.netRevenue)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) CMV</span>
                  <span className="font-semibold text-rose-400">({currency(result.cmv)})</span>
                </div>
                <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                  <span className="font-semibold text-white">= Lucro Bruto</span>
                  <span className={`font-bold ${result.grossProfit >= 0 ? "text-white" : "text-rose-400"}`}>
                    {currency(result.grossProfit)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Salários (Colaboradores)</span>
                  <span className="font-semibold text-rose-400">({currency(result.totalSalary ?? 0)})</span>
                </div>
                {(result.payrollCharges ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">(-) Encargos sobre Folha <span className="text-[10px] text-rose-400 bg-rose-400/10 rounded px-1">FGTS/INSS</span></span>
                    <span className="font-semibold text-rose-400">({currency(result.payrollCharges ?? 0)})</span>
                  </div>
                )}
                {(result.storageExpense ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">(-) Custo de Armazenagem (5%) <span className="text-[10px] text-amber-400 bg-amber-400/10 rounded px-1">estoque parado</span></span>
                    <span className="font-semibold text-rose-400">({currency(result.storageExpense ?? 0)})</span>
                  </div>
                )}
                {/* Custo de inserções de marketing (novo) */}
                {(result.marketingInsertionCost ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">(-) Inserções de Marketing <span className="text-[10px] text-cyan-400 bg-cyan-400/10 rounded px-1">+demanda</span></span>
                    <span className="font-semibold text-rose-400">({currency(result.marketingInsertionCost ?? 0)})</span>
                  </div>
                )}
                {/* Custos de RH — contratações/demissões (novo) */}
                {(result.hiringCost ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">(-) Custo de Contratação (RH)</span>
                    <span className="font-semibold text-rose-400">({currency(result.hiringCost ?? 0)})</span>
                  </div>
                )}
                {(result.firingCost ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">(-) Custo de Demissão (RH)</span>
                    <span className="font-semibold text-rose-400">({currency(result.firingCost ?? 0)})</span>
                  </div>
                )}
                {/* Frete inter-regional (novo) */}
                {(result.regionalTransportCost ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-slate-400">(-) Frete Inter-Regional</span>
                    <span className="font-semibold text-rose-400">({currency(result.regionalTransportCost ?? 0)})</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Demais Despesas Operacionais</span>
                  <span className="font-semibold text-rose-400">({currency(
                    result.operationalExpenses
                    - (result.totalSalary ?? 0)
                    - (result.payrollCharges ?? 0)
                    - (result.storageExpense ?? 0)
                    - (result.marketingInsertionCost ?? 0)
                    - (result.hiringCost ?? 0)
                    - (result.firingCost ?? 0)
                    - (result.regionalTransportCost ?? 0)
                  )})</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-500 text-xs italic pl-2">Total Desp. Operacionais</span>
                  <span className="font-semibold text-rose-400/70 text-xs">({currency(result.operationalExpenses)})</span>
                </div>
                <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                  <span className="font-semibold text-white">= EBIT (Lucro Operacional)</span>
                  <span className={`font-bold ${result.ebit >= 0 ? "text-white" : "text-rose-400"}`}>
                    {currency(result.ebit)}
                  </span>
                </div>

                {(() => {
                  const lair = result.ebt ?? result.ebit;
                  const despFin = result.ebit - lair;
                  return (
                    <>
                      {despFin > 0.01 && (
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400">(-) Despesa Financeira (juros)</span>
                          <span className="font-semibold text-rose-400">({currency(despFin)})</span>
                        </div>
                      )}
                      <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                        <span className="font-semibold text-white">= LAIR (Lucro Antes do IR)</span>
                        <span className={`font-bold ${lair >= 0 ? "text-white" : "text-rose-400"}`}>
                          {currency(lair)}
                        </span>
                      </div>
                    </>
                  );
                })()}

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
                {/* Nota: empréstimo emergencial */}
                {(result.emergencyLoan ?? 0) > 0 && (
                  <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300 leading-relaxed">
                    🚨 <strong>Empréstimo Emergencial Acionado:</strong> O caixa ficou negativo e um crédito automático de {currency(result.emergencyLoan ?? 0)} foi ativado para cobrir o déficit. Esse valor foi adicionado ao Passivo (Empréstimos) do Balanço e reduz a pontuação da empresa.
                  </div>
                )}
                {/* Nota: carryover contábil */}
                {result.isCarryover && (
                  <div className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-[11px] text-cyan-300 leading-relaxed">
                    🔗 <strong>Continuidade Contábil:</strong> O saldo patrimonial desta rodada foi calculado a partir do Balanço de encerramento da rodada anterior — princípio contábil da continuidade aplicado.
                  </div>
                )}
              </div>
            </Panel>

            {/* ── FLUXO DE CAIXA ── */}
            <Panel title="Fluxo de Caixa" icon={BarChart3} actions={<ExportBtn onClick={exportFluxoCaixa} />}>
              <CashFlowPanel result={result} />
            </Panel>

          </div>{/* fim grade BP · DRE · Fluxo */}

          {/* Market Share */}
          {roundFullRanking.length > 0 && (
            <Panel title="Market Share da Rodada" icon={BarChart3}>
              <div className="h-72">
                <MarketSharePie results={roundFullRanking} />
              </div>
            </Panel>
          )}

          {/* Full ranking */}
          {roundFullRanking.length > 0 && (
            <Panel
              title="Ranking Geral da Rodada"
              icon={Trophy}
              actions={
                <ExportBtn onClick={async () => {
                  const rows = roundFullRanking
                    .sort((a, b) => a.position - b.position)
                    .map(r => ({
                      "Posição":              r.position,
                      "Empresa":              r.company,
                      "Grupo":               r.group,
                      "Região":              r.region,
                      "Score":               r.score,
                      "Lucro Líquido (R$)":  r.netProfit,
                      "Receita (R$)":        r.netRevenue,
                      "Liquidez Corrente":   r.currentRatio,
                      "ROA (%)":             r.roa,
                      "Market Share (%)":    r.marketShare,
                    }));
                  await exportToExcel(rows, `ranking-geral-${roundName}`, "Ranking");
                }} />
              }
            >
              <RankingTable results={roundFullRanking} hideGrade />
            </Panel>
          )}

          {/* ── FEEDBACK PEDAGÓGICO AUTOMÁTICO ── */}
          {(() => {
            const feedbacks = generateFeedback(result);
            if (!feedbacks.length) return null;
            const levelColors: Record<string, string> = {
              success: "border-emerald-500/30 bg-emerald-500/5",
              warning: "border-amber-500/30 bg-amber-500/5",
              danger:  "border-rose-500/30 bg-rose-500/5",
              info:    "border-cyan-500/30 bg-cyan-500/5",
            };
            const tipColors: Record<string, string> = {
              success: "text-emerald-300",
              warning: "text-amber-300",
              danger:  "text-rose-300",
              info:    "text-cyan-300",
            };
            return (
              <Panel title="Análise e Feedback da Rodada" icon={Brain} subtitle="Gerado automaticamente com base nos seus indicadores">
                <div className="grid gap-3 sm:grid-cols-2">
                  {feedbacks.map((fb, i) => (
                    <div key={i} className={`rounded-xl border p-4 ${levelColors[fb.level]}`}>
                      <p className="mb-1.5 font-bold text-white text-sm">{fb.title}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{fb.text}</p>
                      {fb.tip && (
                        <p className={`mt-2 text-[11px] font-semibold leading-relaxed italic ${tipColors[fb.level]}`}>
                          💡 {fb.tip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })()}
        </>
      )}

      {/* Comentário do professor */}
      {result?.professor_comment && (
        <Panel title="Comentário do Professor" icon={Brain}>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{result.professor_comment}</p>
          </div>
        </Panel>
      )}

      {/* Medals */}
      {medals.length > 0 && (
        <Panel title="Suas Conquistas" icon={Trophy}>
          <MedalsPanel medals={medals} />
        </Panel>
      )}

      {/* ── EVOLUÇÃO HISTÓRICA (multi-rodada) ── */}
      {groupResults.length >= 2 && (() => {
        // Ordena cronologicamente (ascending por round_id)
        const sorted = [...groupResults].sort((a, b) => a.round_id - b.round_id);

        const KPI_DEFS = [
          { key: "score",           label: "Score",             fmt: (v: number) => number(v, 1) },
          { key: "netProfit",       label: "Lucro Líquido",     fmt: (v: number) => currency(v) },
          { key: "netRevenue",      label: "Receita",           fmt: (v: number) => currency(v) },
          { key: "currentRatio",    label: "Liquidez Corrente", fmt: (v: number) => number(v, 2) },
          { key: "netMargin",       label: "Margem Líquida %",  fmt: (v: number) => percent(v) },
          { key: "cashCycle",       label: "Ciclo Financeiro",  fmt: (v: number) => `${number(v, 0)} dias` },
        ] as const;

        const [histKpi, setHistKpi] = useState<string>("score");
        const selectedKpi = KPI_DEFS.find((k) => k.key === histKpi) ?? KPI_DEFS[0];

        const chartData = sorted.map((sr) => {
          const r = sr.data as RankedResult;
          const roundName = (sr.round as { name?: string } | undefined)?.name ?? `R${sr.round_id}`;
          return {
            round_name: roundName,
            [result?.company ?? "Empresa"]: (r as unknown as Record<string, number>)[histKpi] ?? 0,
          };
        });

        const companies = [{ name: result?.company ?? "Empresa", color: "from-cyan-500 to-blue-600" }];

        return (
          <Panel title="Evolução Histórica dos Indicadores" icon={BarChart3} subtitle="Seu desempenho ao longo das rodadas">
            <div className="mb-4 flex flex-wrap gap-2">
              {KPI_DEFS.map((kpi) => (
                <button
                  key={kpi.key}
                  onClick={() => setHistKpi(kpi.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    histKpi === kpi.key
                      ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                      : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {kpi.label}
                </button>
              ))}
            </div>
            <KpiEvolutionChart
              data={chartData}
              companies={companies}
              formatter={selectedKpi.fmt as (v: number) => string}
            />
          </Panel>
        );
      })()}
    </div>
  );
}
