"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  GraduationCap,
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
import {
  DEFAULT_GRADE_SCALE,
  buildGradeScale,
} from "@/lib/simulation/scoring";
import type { GradeLevel } from "@/lib/simulation/scoring";
import type { Group, Round, Submission, StoredResult, RankedResult } from "@/types";
import { usePoloContext } from "@/contexts/PoloContext";

// ── Dashboard Principal ────────────────────────────────────────────────────────
export default function ProfessorDashboard() {
  const { poloParam, selectedPolo } = usePoloContext();

  const [groups, setGroups] = useState<Group[]>([]);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [gradeScale, setGradeScale] = useState<GradeLevel[]>(DEFAULT_GRADE_SCALE);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false); // evita mostrar spinner nos polls seguintes

  const latestRound = rounds[0];
  const latestProcessedRound = rounds.find((r) => r.status === "Processada");

  const load = useCallback(async () => {
    // Só exibe spinner na primeira carga; polls silenciosos não alteram o estado de loading
    if (!initialLoadDone.current) setLoading(true);
    try {
      // Todos os fetches usam poloParam diretamente (polo filtra pelo campo polo do aluno)
      const [groupsRes, roundsRes, studentsRes] = await Promise.all([
        fetch(`/api/groups?v=1${poloParam}`),
        fetch(`/api/rounds?v=1${poloParam}`),
        fetch(`/api/students?v=1${poloParam}`),
      ]);
      const groupsData  = await groupsRes.json();
      const roundsData  = await roundsRes.json();
      const studentsData = await studentsRes.json();

      const groupsList: Group[] = groupsData.groups || [];
      // IDs dos grupos do polo selecionado (usado para filtrar subs/resultados)
      const poloGroupIdSet = new Set(groupsList.map((g) => g.id));

      setGroups(groupsList);
      setStudentCount((studentsData.students || []).length);
      const roundsList: Round[] = roundsData.rounds || [];
      setRounds(roundsList);

      // Submissões da rodada mais recente — filtra pelo polo quando ativo
      const latestRound = roundsList[0];
      if (latestRound) {
        const subRes = await fetch(`/api/rounds/${latestRound.id}/submissions`);
        const subData = await subRes.json();
        const allSubs: Submission[] = subData.submissions || [];
        setSubmissions(
          poloParam
            ? allSubs.filter((s) => poloGroupIdSet.has(s.group_id))
            : allSubs
        );
      } else {
        setSubmissions([]);
      }

      // Resultados da última rodada processada — filtra pelo polo quando ativo
      const processed = roundsList.find((r) => r.status === "Processada");
      if (processed) {
        const resRes = await fetch(`/api/results?round_id=${processed.id}`);
        const resData = await resRes.json();
        const allResults = (resData.results || []).map((r: StoredResult) => r.data) as RankedResult[];
        setResults(
          poloParam
            ? allResults.filter((r) => poloGroupIdSet.has(r.companyId))
            : allResults
        );
      } else {
        setResults([]);
      }
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [poloParam]);

  // Carrega escala de classificação acadêmica da turma
  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const gs = d.class?.grade_scale;
        if (Array.isArray(gs) && gs.length) {
          setGradeScale(buildGradeScale(gs));
        }
      })
      .catch(() => {/* usa padrão */});
  }, []);

  useEffect(() => {
    // Ao trocar de polo, mostra o spinner novamente
    initialLoadDone.current = false;
    load();
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

  const processedRounds = rounds.filter((r) => r.status === "Processada");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">Dashboard do Professor</h1>
          <p className="text-sm text-slate-400">
            {selectedPolo
              ? <>Filtrando por <strong className="text-cyan-400">{selectedPolo}</strong> — {groups.length} grupo{groups.length !== 1 ? "s" : ""} · {studentCount} aluno{studentCount !== 1 ? "s" : ""}</>
              : "Visão geral do Arena Contábil em tempo real"}
          </p>
        </div>
        {!groups.length && (
          <Button
            onClick={async () => {
              await fetch("/api/seed", { method: "POST" });
              load();
            }}
            className="self-start"
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
          value={studentCount || "—"}
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

      {/* Rodada ativa — acesso rápido */}
      {latestRound && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/20">
              <PlayCircle className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-bold text-white">{latestRound.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={latestRound.status} />
                <span className="text-xs text-slate-400">{latestRound.event_type}</span>
              </div>
            </div>
          </div>
          <Link href={`/professor/rodadas/${latestRound.id}`}>
            <Button size="sm" className="w-full sm:w-auto">
              Gerenciar <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Acompanhamento de envios */}
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

      {/* Gráficos + ranking (última rodada processada) */}
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
            <RankingTable results={results} gradeScale={gradeScale} />
          </Panel>
        </>
      )}

      {/* ── Atalho para Notas ── */}
      <Link href="/professor/notas">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5 transition-colors hover:bg-violet-400/10 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/20">
              <GraduationCap className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-bold text-white">Notas & Classificação Acadêmica</p>
              <p className="text-xs text-slate-400">
                Escala de notas, classificação por rodada e notas individuais dos alunos
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-violet-400" />
        </motion.div>
      </Link>


      {/* Empty state */}
      {!groups.length && (
        <Panel title="Começando do zero?" icon={Building2}>
          <div className="space-y-3 text-sm text-slate-300">
            <p>Para iniciar o Arena Contábil:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Clique em <strong>Inicializar dados demo</strong> acima para criar grupos e
                alunos de teste
              </li>
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
