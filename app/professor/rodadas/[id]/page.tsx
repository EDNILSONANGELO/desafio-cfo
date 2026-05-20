"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  PlayCircle,
  Lock,
  Unlock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  BarChart3,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/KpiCard";
import { SubmissionTracker } from "@/components/dashboard/SubmissionTracker";
import { InconsistencyPanel } from "@/components/dashboard/InconsistencyPanel";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { MedalsPanel } from "@/components/dashboard/MedalsPanel";
import { RankingBarChart } from "@/components/charts/RankingBarChart";
import { MarketSharePie } from "@/components/charts/MarketSharePie";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils/format";
import { getScoreGrade, DEFAULT_GRADE_SCALE, buildGradeScale } from "@/lib/simulation/scoring";
import type { GradeLevel } from "@/lib/simulation/scoring";
import type { Round, Group, Submission, RankedResult, Medal, StoredResult } from "@/types";

// ── Professor Comments Panel ──────────────────────────────────────────────────
function ProfessorCommentsPanel({ roundId, results }: { roundId: number; results: RankedResult[] }) {
  const [comments, setComments] = React.useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    results.forEach((r) => {
      const comment = (r as unknown as { professor_comment?: string }).professor_comment;
      if (comment) init[r.companyId] = comment;
    });
    return init;
  });
  const [saving, setSaving] = React.useState<number | null>(null);
  const [saved, setSaved] = React.useState<number | null>(null);
  const [bulkComment, setBulkComment] = React.useState("");
  const [bulkSaving, setBulkSaving] = React.useState(false);
  const [bulkSaved, setBulkSaved] = React.useState(false);

  async function saveComment(groupId: number) {
    setSaving(groupId);
    try {
      await fetch("/api/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round_id: roundId, group_id: groupId, professor_comment: comments[groupId] ?? "" }),
      });
      setSaved(groupId);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  }

  async function saveBulkComment() {
    setBulkSaving(true);
    try {
      await Promise.all(
        results.map((r) =>
          fetch("/api/results", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ round_id: roundId, group_id: r.companyId, professor_comment: bulkComment }),
          })
        )
      );
      setComments((prev) => {
        const next = { ...prev };
        results.forEach((r) => { next[r.companyId] = bulkComment; });
        return next;
      });
      setBulkSaved(true);
      setTimeout(() => setBulkSaved(false), 3000);
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <Panel title="Comentários do Professor por Grupo" icon={BarChart3} subtitle="Visíveis para os alunos na tela de resultados">
      <div className="mb-6 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-violet-300 font-bold text-sm">📢 Comentário Geral para Todos os Grupos</span>
          <span className="text-xs text-slate-500">— aparece para todos os alunos</span>
        </div>
        <textarea
          value={bulkComment}
          onChange={(e) => setBulkComment(e.target.value)}
          placeholder="Escreva uma mensagem geral para todos os grupos desta rodada..."
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-violet-400/40"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={saveBulkComment}
            disabled={bulkSaving || !bulkComment.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 px-4 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-500/30 disabled:opacity-40"
          >
            {bulkSaving ? <LoadingSpinner size="sm" /> : <span>📤</span>}
            Enviar para todos os grupos ({results.length})
          </button>
          {bulkSaved && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Enviado para todos!</span>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((r) => (
          <div key={r.companyId} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{r.company}</p>
                <p className="text-[10px] text-slate-500">{r.group} · {r.position}º lugar · Score {r.score.toFixed(1)}</p>
              </div>
              {saved === r.companyId && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Salvo
                </span>
              )}
            </div>
            <textarea
              value={comments[r.companyId] ?? ""}
              onChange={(e) => setComments((prev) => ({ ...prev, [r.companyId]: e.target.value }))}
              placeholder="Escreva um comentário para este grupo (feedback, parabéns, pontos de melhoria...)"
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-cyan-400/40"
            />
            <button
              onClick={() => saveComment(r.companyId)}
              disabled={saving === r.companyId}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-40"
            >
              {saving === r.companyId ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Salvar comentário
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Academic Classification Panel ─────────────────────────────────────────────
function AcademicClassificationPanel({ results, gradeScale }: { results: RankedResult[]; gradeScale: GradeLevel[] }) {
  return (
    <Panel title="Classificação Acadêmica" icon={Trophy} subtitle="Score convertido em grau e nota para cada empresa">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2.5 text-left">Pos.</th>
              <th className="py-2.5 text-left">Empresa</th>
              <th className="py-2.5 text-center">Score</th>
              <th className="py-2.5 text-center">Grau</th>
              <th className="py-2.5 text-left">Conceito</th>
              <th className="py-2.5 text-center">Nota</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const g = getScoreGrade(r.score, gradeScale);
              return (
                <tr key={r.companyId} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="py-3 pr-3 font-bold text-slate-400">{r.position}º</td>
                  <td className="py-3 pr-4">
                    <p className="font-bold text-white">{r.company}</p>
                    <p className="text-xs text-slate-500">{r.group}</p>
                  </td>
                  <td className="py-3 text-center">
                    <span className="font-bold text-white">{r.score.toFixed(1)}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-base font-black ${g.color}`}>{g.grade}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-sm font-semibold ${g.color}`}>{g.label}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-lg font-black ${g.color}`}>{g.nota.toFixed(1)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Legenda da escala</p>
        <div className="flex flex-wrap gap-2">
          {gradeScale.map((level, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
              <p className={`text-sm font-black ${level.color}`}>{level.grade}</p>
              <p className="text-[10px] text-slate-400">{level.label}</p>
              <p className={`text-xs font-bold ${level.color}`}>{level.nota.toFixed(1)}</p>
              <p className="text-[9px] text-slate-600">≥ {level.minScore}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export default function RoundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [gradeScale, setGradeScale] = useState<GradeLevel[]>(DEFAULT_GRADE_SCALE);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rRes, gRes, subRes] = await Promise.all([
        fetch(`/api/rounds/${id}`),
        fetch("/api/groups"),
        fetch(`/api/rounds/${id}/submissions`),
      ]);
      const rData = await rRes.json();
      const gData = await gRes.json();
      const subData = await subRes.json();

      setRound(rData.round);
      setGroups(gData.groups || []);
      setSubmissions(subData.submissions || []);

      if (rData.round?.status === "Processada") {
        const resRes = await fetch(`/api/results?round_id=${id}`);
        const resData = await resRes.json();
        setResults((resData.results || []).map((r: StoredResult) => r.data) as RankedResult[]);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Carrega escala de classificação da turma (apenas uma vez)
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
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateStatus(status: string) {
    setUpdating(true);
    await fetch(`/api/rounds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    setUpdating(false);
  }

  async function processRound() {
    if (!confirm("Processar informações desta rodada? Isso calculará todos os resultados.")) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/rounds/${id}/process`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);
        setMedals(data.medals || []);
        load();
      } else {
        alert(data.error);
      }
    } finally {
      setProcessing(false);
    }
  }

  async function cancelSubmission(groupId: number) {
    if (!confirm("Cancelar o envio deste grupo? O grupo poderá editar e reenviar.")) return;
    const res = await fetch(
      `/api/submissions?round_id=${id}&group_id=${groupId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao cancelar envio.");
      return;
    }
    load();
  }

  if (loading || !round) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const submittedCount = submissions.filter((s) => s.status === "Enviada").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">{round.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={round.status} />
            <span className="text-sm text-slate-400">{round.event_type}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Criada em {formatDate(round.created_at)}
            {round.opened_at && ` · Aberta em ${formatDate(round.opened_at)}`}
            {round.processed_at && ` · Processada em ${formatDate(round.processed_at)}`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {round.status === "Não iniciada" && (
            <Button variant="success" onClick={() => updateStatus("Aberta")} loading={updating}>
              <Unlock className="h-4 w-4" /> Abrir rodada
            </Button>
          )}
          {round.status === "Aberta" && (
            <>
              <Button variant="danger" onClick={() => updateStatus("Encerrada")} loading={updating}>
                <Lock className="h-4 w-4" /> Encerrar
              </Button>
              <Button variant="success" onClick={processRound} loading={processing} className="pulse-glow">
                <Zap className="h-4 w-4" /> Processar informações
              </Button>
            </>
          )}
          {round.status === "Encerrada" && (
            <>
              <Button variant="secondary" onClick={() => updateStatus("Aberta")} loading={updating}>
                <Unlock className="h-4 w-4" /> Reabrir
              </Button>
              <Button variant="success" onClick={processRound} loading={processing} className="pulse-glow">
                <Zap className="h-4 w-4" /> Processar informações
              </Button>
            </>
          )}
          {round.status === "Processada" && (
            <Button variant="secondary" onClick={() => updateStatus("Encerrada")} loading={updating}>
              Reabrir como Encerrada
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={CheckCircle2} title="Enviaram" value={`${submittedCount}/${groups.length}`} accent="emerald" />
        <KpiCard icon={AlertTriangle} title="Pendentes" value={groups.length - submittedCount} accent="amber" />
        <KpiCard icon={PlayCircle} title="Status" value={round.status} accent="cyan" />
        <KpiCard icon={Trophy} title="Processados" value={results.length ? `${results.length} grupos` : "Aguardando"} accent="violet" />
      </div>

      {/* Atalho para Configurações */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <Settings2 className="h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-sm text-slate-400">
          Evento econômico, despesas travadas, preços de materiais e faixa de preço de venda
          estão em{" "}
          <Link href="/professor/configuracoes" className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            Configurações → Configurações por Rodada
          </Link>.
        </p>
      </div>

      {/* Submission tracker */}
      <Panel title="Status de Envio por Grupo" icon={CheckCircle2} subtitle="Atualizado a cada 10 segundos">
        <SubmissionTracker
          groups={groups}
          submissions={submissions}
          onCancelSubmission={cancelSubmission}
        />
      </Panel>

      {/* MAIN PROCESS BUTTON */}
      {(round.status === "Aberta" || round.status === "Encerrada") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 p-8 text-center"
        >
          <Zap className="mb-4 h-12 w-12 text-cyan-400" />
          <h2 className="text-xl font-black text-white">Processar Informações da Rodada</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            Calcula automaticamente: produção real, vendas, CMV, DRE, BP, Fluxo de Caixa,
            Indicadores Financeiros, Market Share e Ranking.
          </p>
          <Button
            size="lg"
            onClick={processRound}
            loading={processing}
            className="mt-6 pulse-glow"
          >
            <Zap className="h-5 w-5" />
            {processing ? "Processando..." : "PROCESSAR INFORMAÇÕES DA RODADA"}
          </Button>
        </motion.div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <InconsistencyPanel results={results} />

          {medals.length > 0 && (
            <Panel title="Medalhas e Conquistas" icon={Trophy}>
              <MedalsPanel medals={medals as Medal[]} />
            </Panel>
          )}

          <Panel title="Ranking Final" icon={Trophy}>
            <RankingTable results={results} gradeScale={gradeScale} />
          </Panel>

          {/* Classificação Acadêmica */}
          <AcademicClassificationPanel results={results} gradeScale={gradeScale} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Score por Empresa" icon={BarChart3}>
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

          {/* Painel de Colaboradores & Marketing (se rodada usou novos campos) */}
          {results.some((r) => r.netEmployees !== undefined || r.marketingInsertionCost !== undefined) && (
            <Panel title="Colaboradores & Marketing por Empresa" icon={BarChart3} subtitle="Resumo dos novos indicadores desta rodada">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                      <th className="px-3 py-2 text-left">Empresa</th>
                      <th className="px-3 py-2 text-right">Colab. Ativos</th>
                      <th className="px-3 py-2 text-right">Necessários</th>
                      <th className="px-3 py-2 text-right">Ociosos</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-right">Custo RH</th>
                      <th className="px-3 py-2 text-right">Marketing Inserções</th>
                      <th className="px-3 py-2 text-right">Frete Regional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...results].sort((a, b) => a.position - b.position).map((r) => (
                      <tr key={r.companyId} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-white">{r.company}</p>
                          <p className="text-[10px] text-slate-500">{r.group}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-white">
                          {r.netEmployees ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-300">
                          {r.minEmployeesNeeded ?? "—"}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${(r.idleEmployees ?? 0) > 0 ? "text-amber-400" : "text-slate-500"}`}>
                          {r.idleEmployees ?? 0}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {r.employeeStatus ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.employeeStatus === "good"  ? "bg-emerald-500/20 text-emerald-300" :
                              r.employeeStatus === "alert" ? "bg-amber-500/20 text-amber-300"    :
                                                             "bg-rose-500/20 text-rose-300"
                            }`}>
                              {r.employeeStatusLabel ?? r.employeeStatus}
                            </span>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${((r.hiringCost ?? 0) + (r.firingCost ?? 0)) > 0 ? "text-rose-400" : "text-slate-500"}`}>
                          {((r.hiringCost ?? 0) + (r.firingCost ?? 0)) > 0
                            ? `(${((r.hiringCost ?? 0) + (r.firingCost ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`
                            : "—"}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${(r.marketingInsertionCost ?? 0) > 0 ? "text-cyan-400" : "text-slate-500"}`}>
                          {(r.marketingInsertionCost ?? 0) > 0
                            ? (r.marketingInsertionCost ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${(r.regionalTransportCost ?? 0) > 0 ? "text-violet-400" : "text-slate-500"}`}>
                          {(r.regionalTransportCost ?? 0) > 0
                            ? (r.regionalTransportCost ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* Comentários do professor por grupo */}
          <ProfessorCommentsPanel roundId={Number(id)} results={results} />
        </>
      )}
    </div>
  );
}
