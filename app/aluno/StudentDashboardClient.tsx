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
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { BalancoPatrimonialPanel } from "@/components/charts/BalancoPatrimonialPanel";
import { currency, percent, number, formatDate } from "@/lib/utils/format";
import { getScoreGrade } from "@/lib/simulation/scoring";
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
        <h1 className="text-2xl font-black text-white">Bem-vindo, {session.name.split(" ")[0]}!</h1>
        <p className="text-sm text-slate-400">
          RA: {session.identifier} · {className || "Ciências Contábeis"}
        </p>
      </div>

      {/* Company card */}
      {group ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${group.color || "from-cyan-500/20 to-blue-600/20"}`}
        >
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Sua empresa
            </p>
            <h2 className="mt-1 text-3xl font-black text-white">{group.company_name}</h2>
            <p className="mt-1 text-lg font-semibold text-white/80">
              {group.name} · Região {group.region_name}
            </p>
            <p className="mt-2 text-sm text-white/60">{group.region_trait}</p>
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
          className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/20">
              <PlayCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-white">{openRound.name} está ABERTA!</p>
              <p className="mt-0.5 text-sm text-slate-300">
                Preencha as decisões do seu grupo antes do prazo.
              </p>
            </div>
          </div>
          <Link href={`/aluno/formulario/${openRound.id}`}>
            <Button>
              Preencher agora <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <Clock className="h-6 w-6 text-slate-500" />
          <div>
            <p className="font-semibold text-slate-300">Nenhuma rodada aberta no momento</p>
            <p className="text-sm text-slate-500">
              Aguarde o professor abrir uma nova rodada.
            </p>
          </div>
        </div>
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Fluxo de Caixa" icon={BarChart3}>
              <CashFlowPanel result={result} />
            </Panel>
            <Panel title="Balanço Patrimonial" icon={BarChart3}>
              <BalancoPatrimonialPanel result={result} />
            </Panel>
          </div>
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
