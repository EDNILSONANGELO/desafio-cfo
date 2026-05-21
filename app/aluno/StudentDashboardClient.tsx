"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  PlayCircle,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
  Download,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { BalancoPatrimonialPanel } from "@/components/charts/BalancoPatrimonialPanel";
import { currency, percent, number, formatDate } from "@/lib/utils/format";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { getScoreGrade } from "@/lib/simulation/scoring";
import { INITIAL_BALANCE } from "@/lib/simulation/engine";
import type { Round, StoredResult, SessionPayload } from "@/types";

interface StudentData {
  ra: string;
  name: string;
  group?: {
    id: number;
    name: string;
    company_name: string;
    region_name: string;
    region_trait: string;
    color: string;
  };
  class?: { name: string };
}

interface Props {
  student: StudentData | null;
  session: SessionPayload;
  rounds: Round[];
  latestResult: StoredResult | null;
}

export default function StudentDashboardClient({ student, session, rounds, latestResult }: Props) {
  const group = student?.group;
  const className = student?.class?.name;
  const openRound = rounds.find((r) => r.status === "Aberta");
  const result = latestResult?.data;
  const grade = result ? getScoreGrade(result.score) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">Bem-vindo, {session.name.split(" ")[0]}!</h1>
        <p className="text-sm text-slate-400">
          RA: {session.identifier} · {className || "Ciências Contábeis"}
        </p>
      </div>

      {/* Company card */}
      {group ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${group.color || "from-cyan-500/20 to-blue-600/20"}`}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                Sua empresa
              </p>
              <h2 className="text-lg font-black text-white leading-tight truncate">{group.company_name}</h2>
              <p className="text-xs text-white/70">
                {group.name} · Região {group.region_name}
                {group.region_trait && <span className="ml-2 text-white/50">· {group.region_trait}</span>}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-amber-400" />
          <p className="font-semibold text-amber-300">Você ainda não está vinculado a um grupo</p>
          <p className="mt-1 text-sm text-slate-400">
            Entre em contato com o professor para ser adicionado a um grupo.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={GraduationCap} title="RA" value={session.identifier} subtitle={session.name} accent="cyan" />
        <KpiCard icon={Building2} title="Grupo" value={group?.name || "—"} subtitle={group?.company_name || "Sem grupo"} accent="emerald" />
        <KpiCard icon={PlayCircle} title="Rodadas" value={rounds.length} subtitle={`${rounds.filter((r) => r.status === "Processada").length} processadas`} accent="amber" />
        <KpiCard icon={Trophy} title="Classificação" value={result ? `${result.position}º lugar` : "Aguardando"} subtitle={grade ? grade.label : "Após processamento"} accent="violet" />
      </div>

      {/* Active round */}
      {openRound && group ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20">
              <PlayCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-white">{openRound.name} está ABERTA!</p>
              <p className="mt-0.5 text-sm text-slate-300">
                Preencha as decisões do seu grupo antes do prazo.
              </p>
            </div>
          </div>
          <Link href={`/aluno/formulario/${openRound.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              Preencher agora <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <Clock className="h-6 w-6 text-slate-500" />
          <div>
            <p className="font-semibold text-slate-300">Nenhuma rodada aberta no momento</p>
            <p className="text-sm text-slate-500">
              Aguarde o professor abrir uma nova rodada.
            </p>
          </div>
        </div>
      )}

      {/* ── RODADA ZERO: Balanço Inicial ── mostrado quando não há resultado ainda */}
      {!result && group && (
        <Panel title="📋 Balanço Inicial da Empresa — Rodada 0" icon={BarChart3}
          subtitle="Todos os grupos iniciam o jogo com exatamente estes valores">
          <div className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 text-xs text-slate-400">
            ✅ A Rodada Zero é o ponto de partida padronizado — todos os grupos começam em igualdade de condições.
            Estes valores serão o saldo de abertura da Rodada 1.
          </div>

          {/* ATIVO */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">ATIVO</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Caixa</span><span className="font-semibold text-white">{currency(INITIAL_BALANCE.cash)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Bancos</span><span className="font-semibold text-white">{currency(INITIAL_BALANCE.banks)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Aplicações Financeiras</span><span className="font-semibold text-white">{currency(INITIAL_BALANCE.applications)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Clientes (Duplicatas a Receber)</span><span className="font-semibold text-white">{currency(INITIAL_BALANCE.clients)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Estoques</span><span className="font-semibold text-white">{currency(INITIAL_BALANCE.inventory)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Imobilizado (Máquinas/Equipamentos)</span><span className="font-semibold text-white">{currency(INITIAL_BALANCE.fixedAssets)}</span></div>
                <div className="flex justify-between rounded-lg bg-emerald-500/10 px-2 py-1.5">
                  <span className="font-bold text-white">ATIVO TOTAL</span>
                  <span className="font-black text-emerald-400">{currency(INITIAL_BALANCE.cash + INITIAL_BALANCE.banks + INITIAL_BALANCE.applications + INITIAL_BALANCE.clients + INITIAL_BALANCE.inventory + INITIAL_BALANCE.fixedAssets)}</span>
                </div>
              </div>
            </div>

            {/* PASSIVO + PL */}
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-rose-400">PASSIVO + PL</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Fornecedores</span><span className="font-semibold text-rose-400">{currency(INITIAL_BALANCE.suppliers)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Empréstimos</span><span className="font-semibold text-rose-400">{currency(INITIAL_BALANCE.loans)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1 text-xs text-slate-500"><span className="pl-2 italic">Passivo Total</span><span>{currency(INITIAL_BALANCE.suppliers + INITIAL_BALANCE.loans)}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-400">Capital Social (PL)</span><span className="font-semibold text-violet-400">{currency(INITIAL_BALANCE.equity)}</span></div>
                <div className="flex justify-between rounded-lg bg-violet-500/10 px-2 py-1.5">
                  <span className="font-bold text-white">PASSIVO + PL</span>
                  <span className="font-black text-violet-400">{currency(INITIAL_BALANCE.suppliers + INITIAL_BALANCE.loans + INITIAL_BALANCE.equity)}</span>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-3 py-2.5 text-xs">
                <p className="font-bold text-cyan-300 mb-1">🏭 Capacidade Produtiva Inicial</p>
                <p className="text-slate-400">Produção: <span className="font-semibold text-white">5.000 unidades/rodada</span></p>
                <p className="text-slate-400 mt-0.5">Colaboradores: <span className="font-semibold text-white">6 colaboradores</span></p>
                <p className="text-slate-400 mt-0.5">Capital Social: <span className="font-semibold text-white">{currency(INITIAL_BALANCE.equity)}</span></p>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Latest result */}
      {result && (
        <>
          <Panel title="Seu último resultado" icon={Trophy}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Receita Líquida", value: currency(result.netRevenue), color: "text-emerald-400" },
                { label: "Lucro Líquido", value: currency(result.netProfit), color: result.netProfit >= 0 ? "text-emerald-400" : "text-rose-400" },
                { label: "Posição", value: `${result.position}º lugar`, color: "text-amber-400" },
                { label: "Liquidez Corrente", value: number(result.currentRatio), color: "text-white" },
                { label: "ROA", value: percent(result.roa), color: "text-cyan-400" },
                { label: "Margem Líquida", value: percent(result.netMargin), color: "text-violet-400" },
                { label: "Market Share", value: `${number(result.marketShare, 1)}%`, color: "text-white" },
                { label: "Score", value: number(result.score, 1), color: grade?.color || "text-white" },
                { label: "Grade", value: grade?.grade || "—", color: grade?.color || "text-white" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 leading-relaxed">
              <p className="mb-1 font-bold text-white">Análise automática:</p>
              A empresa {result.company} ficou em {result.position}º lugar com score {number(result.score, 1)} (Grade {grade?.grade}).
              Liquidez corrente de {number(result.currentRatio)}{result.currentRatio >= 1.5 ? " – capacidade adequada de pagamento" : result.currentRatio >= 1 ? " – situação aceitável" : " – atenção: abaixo de 1"}.
              ROA de {percent(result.roa)} e margem líquida de {percent(result.netMargin)}.
              Ciclo financeiro de {number(result.cashCycle, 0)} dias.
            </div>
          </Panel>

          {/* BP · DRE · Fluxo — grade lado a lado */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Balanço Patrimonial */}
          <Panel
            title="Balanço Patrimonial"
            icon={BarChart3}
            actions={
              <button
                onClick={async () => {
                  const pnc = result.longTermLiabilities ?? result.loans * 0.65;
                  await exportToExcel([
                    { "Conta": "ATIVO",                           "Valor (R$)": "" },
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
                  ], `balanco-patrimonial-${result.group}`, "Balanço Patrimonial");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Excel
              </button>
            }
          >
            <BalancoPatrimonialPanel result={result} />
          </Panel>

          {/* DRE */}
          <Panel
            title="DRE – Demonstração do Resultado do Exercício"
            icon={BarChart3}
            actions={
              <button
                onClick={async () => {
                  const lair = result.ebt ?? result.ebit;
                  await exportToExcel([
                    { "Demonstração": "Receita Líquida de Vendas",               "Valor (R$)": result.netRevenue },
                    { "Demonstração": "(-) CMV — Custo dos Materiais",          "Valor (R$)": -(result.cmv - (result.depreciationExpense ?? 0)) },
                    { "Demonstração": "(-) CMV — Depreciação (10% a.a.)",       "Valor (R$)": -(result.depreciationExpense ?? 0) },
                    { "Demonstração": "= Total CMV",                            "Valor (R$)": -result.cmv },
                    { "Demonstração": "= Lucro Bruto",                          "Valor (R$)": result.grossProfit },
                    { "Demonstração": "(-) Salários",                           "Valor (R$)": -(result.totalSalary ?? 0) },
                    { "Demonstração": "(-) Demais Desp. Operacionais",          "Valor (R$)": -(result.operationalExpenses - (result.totalSalary ?? 0) - (result.storageExpense ?? 0)) },
                    { "Demonstração": "= EBIT",                                 "Valor (R$)": result.ebit },
                    { "Demonstração": "(-) Despesa Financeira",           "Valor (R$)": -(result.ebit - lair) },
                    { "Demonstração": "= LAIR",                           "Valor (R$)": lair },
                    { "Demonstração": "(-) IR (15%)",                     "Valor (R$)": -(result.ir ?? (result.incomeTax ?? 0) * (15 / 24)) },
                    { "Demonstração": "(-) CSLL (9%)",                    "Valor (R$)": -(result.csll ?? (result.incomeTax ?? 0) * (9 / 24)) },
                    { "Demonstração": "= Lucro / Prejuízo Líquido",       "Valor (R$)": result.netProfit },
                  ], `dre-${result.group}`, "DRE");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                Excel
              </button>
            }
          >
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Receita Líquida de Vendas</span>
                <span className="font-semibold text-emerald-400">{currency(result.netRevenue)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">(-) CMV</span>
                <span className="font-semibold text-rose-400">({currency(result.cmv)})</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5">
                <span className="font-semibold text-white">= Lucro Bruto</span>
                <span className={`font-bold ${result.grossProfit >= 0 ? "text-white" : "text-rose-400"}`}>{currency(result.grossProfit)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">(-) Salários</span>
                <span className="font-semibold text-rose-400">({currency(result.totalSalary ?? 0)})</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">(-) Demais Desp. Operacionais</span>
                <span className="font-semibold text-rose-400">({currency(result.operationalExpenses - (result.totalSalary ?? 0) - (result.storageExpense ?? 0))})</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5">
                <span className="font-semibold text-white">= EBIT</span>
                <span className={`font-bold ${result.ebit >= 0 ? "text-white" : "text-rose-400"}`}>{currency(result.ebit)}</span>
              </div>
              {(() => {
                const lair = result.ebt ?? result.ebit;
                const despFinanceira = result.ebit - lair;
                if (despFinanceira <= 0) return null;
                return (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-slate-400">(-) Despesa Financeira (juros)</span>
                      <span className="font-semibold text-rose-400">({currency(despFinanceira)})</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5">
                      <span className="font-semibold text-white">= LAIR (Lucro Antes do IR)</span>
                      <span className={`font-bold ${lair >= 0 ? "text-white" : "text-rose-400"}`}>{currency(lair)}</span>
                    </div>
                  </>
                );
              })()}
              {(result.incomeTax ?? 0) > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) IR + CSLL (24%)</span>
                  <span className="font-semibold text-rose-400">({currency(result.incomeTax ?? 0)})</span>
                </div>
              )}
              <div className={`flex justify-between rounded-xl px-3 py-2.5 mt-1 ${result.netProfit >= 0 ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-rose-500/15 border border-rose-500/30"}`}>
                <span className="font-black text-white">{result.netProfit >= 0 ? "= LUCRO LÍQUIDO" : "= PREJUÍZO LÍQUIDO"}</span>
                <span className={`font-black ${result.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {result.netProfit >= 0 ? currency(result.netProfit) : `(${currency(Math.abs(result.netProfit))})`}
                </span>
              </div>
            </div>
          </Panel>

          {/* Fluxo de Caixa */}
          <Panel
            title="Fluxo de Caixa"
            icon={BarChart3}
            actions={
              result.cfOperating !== undefined ? (
                <button
                  onClick={async () => {
                    const r = result as Required<typeof result>;
                    await exportToExcel([
                      { "Descrição": "Saldo Inicial de Caixa",                   "Valor (R$)": r.cfOpeningBalance },
                      { "Descrição": "(+) Recebimentos de Duplicatas a Receber", "Valor (R$)": r.cfReceipts },
                      { "Descrição": "(-) Pagamentos a fornecedores",            "Valor (R$)": -r.cfSupplierPayments },
                      { "Descrição": "(-) Mão de obra",                          "Valor (R$)": -r.cfLaborPayments },
                      { "Descrição": "(-) Despesas operacionais",                "Valor (R$)": -r.cfOperationalPayments },
                      { "Descrição": "(-) Despesa financeira",                   "Valor (R$)": -r.cfFinancialPayments },
                      { "Descrição": "(-) IR / CSLL",                            "Valor (R$)": -r.cfTaxPaid },
                      { "Descrição": "= FCO Líquido",                            "Valor (R$)": r.cfOperating },
                      { "Descrição": "(-) Aquisição de imobilizado",             "Valor (R$)": -r.cfMachinePayment },
                      { "Descrição": "= FCI Líquido",                            "Valor (R$)": r.cfInvesting },
                      { "Descrição": "(+) Empréstimos captados",                 "Valor (R$)": r.cfLoanReceived },
                      { "Descrição": "= FCF Líquido",                            "Valor (R$)": r.cfFinancing },
                      { "Descrição": "Variação Líquida de Caixa",                "Valor (R$)": r.cfNetChange },
                      { "Descrição": "= Saldo Final de Caixa",                   "Valor (R$)": r.finalCash },
                    ], `fluxo-caixa-${result.group}`, "Fluxo de Caixa");
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </button>
              ) : undefined
            }
          >
            <CashFlowPanel result={result} />
          </Panel>

          </div>{/* fim da grade BP · DRE · Fluxo */}
        </>
      )}

      {/* Rounds history */}
      {rounds.length > 0 && (
        <Panel title="Histórico de Rodadas" icon={PlayCircle}>
          <div className="space-y-2">
            {rounds.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  {r.status === "Processada" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status === "Aberta" && group && (
                    <Link href={`/aluno/formulario/${r.id}`}>
                      <Button size="sm">Preencher</Button>
                    </Link>
                  )}
                  {r.status === "Processada" && (
                    <Link href="/aluno/resultados">
                      <Button size="sm" variant="secondary">Ver resultado</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

    </div>
  );
}
