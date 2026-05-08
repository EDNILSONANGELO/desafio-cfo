"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Building2,
  PlayCircle,
  CheckCircle2,
  Trophy,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { KpiCard } from "@/components/ui/KpiCard";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { SubmissionTracker } from "@/components/dashboard/SubmissionTracker";
import { RankingBarChart } from "@/components/charts/RankingBarChart";
import { MarketSharePie } from "@/components/charts/MarketSharePie";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Group, Round, Submission, StoredResult, RankedResult } from "@/types";

export default function ProfessorDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [loading, setLoading] = useState(true);

  const latestRound = rounds[0];
  const latestProcessedRound = rounds.find((r) => r.status === "Processada");

  const load = useCallback(async () => {
    try {
      const [groupsRes, roundsRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/rounds"),
      ]);
      const groupsData = await groupsRes.json();
      const roundsData = await roundsRes.json();

      setGroups(groupsData.groups || []);
      const roundsList: Round[] = roundsData.rounds || [];
      setRounds(roundsList);

      // Load submissions for latest open round
      const openRound = roundsList.find((r) => r.status === "Aberta");
      if (openRound) {
        const subRes = await fetch(`/api/rounds/${openRound.id}/submissions`);
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);
      }

      // Load results for latest processed round
      const processed = roundsList.find((r) => r.status === "Processada");
      if (processed) {
        const resRes = await fetch(`/api/results?round_id=${processed.id}`);
        const resData = await resRes.json();
        setResults(
          (resData.results || []).map((r: StoredResult) => r.data) as RankedResult[]
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll every 15s for real-time updates
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const submittedCount = submissions.filter((s) => s.status === "Enviada").length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard do Professor</h1>
          <p className="text-sm text-slate-400">
            Visão geral do Desafio CFO em tempo real
          </p>
        </div>
        {!groups.length && (
          <Button
            onClick={async () => {
              await fetch("/api/seed", { method: "POST" });
              load();
            }}
          >
            <Zap className="h-4 w-4" />
            Inicializar dados demo
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          title="Alunos"
          value={groups.reduce(() => 0, 0) || "—"}
          subtitle="Cadastrados"
          accent="cyan"
        />
        <KpiCard
          icon={Building2}
          title="Grupos / Empresas"
          value={groups.length}
          subtitle="EcoBottle por região"
          accent="emerald"
        />
        <KpiCard
          icon={CheckCircle2}
          title="Envios"
          value={`${submittedCount} / ${groups.length}`}
          subtitle={latestRound ? `Rodada: ${latestRound.name}` : "Nenhuma rodada"}
          accent="amber"
        />
        <KpiCard
          icon={PlayCircle}
          title="Status"
          value={latestRound?.status || "Aguardando"}
          subtitle={latestRound?.event_type || ""}
          accent="violet"
        />
      </div>

      {/* Active round quick action */}
      {latestRound && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/20">
              <PlayCircle className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-bold text-white">{latestRound.name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <StatusBadge status={latestRound.status} />
                <span className="text-xs text-slate-400">{latestRound.event_type}</span>
              </div>
            </div>
          </div>
          <Link href={`/professor/rodadas/${latestRound.id}`}>
            <Button size="sm">
              Gerenciar <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Submission tracker */}
      {groups.length > 0 && (
        <Panel
          title="Acompanhamento de Envios"
          subtitle="Atualizado a cada 15 segundos"
          icon={CheckCircle2}
          actions={
            latestRound && (
              <Link href={`/professor/rodadas/${latestRound.id}`}>
                <Button size="sm" variant="secondary">
                  Ver rodada <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )
          }
        >
          <SubmissionTracker groups={groups} submissions={submissions} />
        </Panel>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Ranking — Score por Empresa"
              icon={Trophy}
              subtitle={`Baseado em ${latestProcessedRound?.name}`}
            >
              <div className="h-72">
                <RankingBarChart results={results} />
              </div>
            </Panel>
            <Panel title="Market Share" icon={BarChart3}>
              <div className="h-72">
                <MarketSharePie results={results} />
              </div>
            </Panel>
          </div>
          <Panel title="Ranking Geral" icon={Trophy}>
            <RankingTable results={results} />
          </Panel>
        </>
      )}

      {/* Empty state */}
      {!groups.length && (
        <Panel title="Começando do zero?" icon={Building2}>
          <div className="space-y-3 text-sm text-slate-300">
            <p>Para iniciar o Desafio CFO:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Clique em <strong>Inicializar dados demo</strong> acima para criar grupos e alunos de teste</li>
              <li>Acesse <strong>Grupos</strong> para configurar as empresas</li>
              <li>Acesse <strong>Alunos</strong> para cadastrar sua turma</li>
              <li>Acesse <strong>Rodadas</strong> para criar e abrir uma rodada</li>
            </ol>
          </div>
        </Panel>
      )}
    </div>
  );
}
