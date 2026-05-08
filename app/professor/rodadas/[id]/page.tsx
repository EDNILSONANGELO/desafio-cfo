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
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
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
import type { Round, Group, Submission, RankedResult, Medal, StoredResult } from "@/types";

// ── Fixed Expenses Panel ──────────────────────────────────────────────────────
function FixedExpensesPanel({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (u: Partial<Round>) => void;
}) {
  const [feVal, setFeVal] = React.useState(round.fixed_expenses?.toString() ?? "");
  const [trVal, setTrVal] = React.useState(round.transport?.toString() ?? "");
  const [maVal, setMaVal] = React.useState(round.maintenance?.toString() ?? "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const hasAnyLock = feVal !== "" || trVal !== "" || maVal !== "";

  async function save() {
    setSaving(true);
    const body = {
      fixed_expenses: feVal !== "" ? Number(feVal) : null,
      transport:      trVal !== "" ? Number(trVal) : null,
      maintenance:    maVal !== "" ? Number(maVal) : null,
    };
    await fetch(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onUpdate(body);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  function clearAll() {
    setFeVal(""); setTrVal(""); setMaVal("");
    setSaved(false);
  }

  const fields = [
    { label: "Despesas Fixas R$",  placeholder: "Ex.: 26000", val: feVal, setVal: setFeVal, savedVal: round.fixed_expenses },
    { label: "Transporte R$",      placeholder: "Ex.: 6000",  val: trVal, setVal: setTrVal, savedVal: round.transport },
    { label: "Manutenção R$",      placeholder: "Ex.: 3000",  val: maVal, setVal: setMaVal, savedVal: round.maintenance },
  ];

  return (
    <Panel title="Despesas Operacionais Travadas" icon={Lock}>
      {/* Instruções */}
      <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm">
        <p className="mb-1 font-bold text-amber-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Preencha um valor para <strong className="text-white">travar</strong> aquela despesa nesta rodada — o aluno verá o número mas não poderá alterar.</li>
          <li>• Deixe em <strong className="text-white">branco</strong> para o aluno definir livremente.</li>
          <li>• Clique em <strong className="text-white">Salvar</strong> para aplicar.</li>
        </ul>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.label}>
            <Input
              label={f.label}
              type="number"
              min={0}
              step={100}
              value={f.val}
              placeholder={`Livre — ${f.placeholder}`}
              onChange={(e) => { f.setVal(e.target.value); setSaved(false); }}
              disabled={saving}
            />
            <p className="mt-1 text-[11px]">
              {f.val !== "" ? (
                <span className="text-amber-400">
                  🔒 Travado em R$&nbsp;
                  {Number(f.val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              ) : (
                <span className="italic text-slate-600">Aluno define livremente</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Saved feedback */}
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Configurações salvas! Os alunos verão os campos travados ao abrir o formulário.
        </div>
      )}

      {/* Buttons */}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={save} loading={saving} size="sm">
          <Lock className="h-4 w-4" />
          Salvar travas
        </Button>
        {hasAnyLock && (
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={saving}>
            Limpar travas (liberar tudo)
          </Button>
        )}
      </div>

      {/* Status salvo no banco */}
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Status atual desta rodada
        </p>
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
              <span className="text-slate-400">{f.label.replace(" R$", "")}</span>
              {f.savedVal != null ? (
                <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Lock className="h-3 w-3" />
                  R$&nbsp;{f.savedVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}&nbsp;
                  <span className="rounded bg-amber-700/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">fixo</span>
                </span>
              ) : (
                <span className="italic text-slate-500">Livre — aluno define</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ── Price Limits Panel ────────────────────────────────────────────────────────
function PriceLimitsPanel({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (u: { price_min?: number | null; price_max?: number | null }) => void;
}) {
  const [min, setMin] = React.useState(round.price_min?.toString() ?? "");
  const [max, setMax] = React.useState(round.price_max?.toString() ?? "");
  const [saved, setSaved] = React.useState(false);

  const save = () => {
    onUpdate({
      price_min: min !== "" ? Number(min) : null,
      price_max: max !== "" ? Number(max) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Panel title="Faixa de preço de venda" icon={Zap}>
      <p className="mb-4 text-sm text-slate-400">
        Defina o preço mínimo e/ou máximo que os alunos podem praticar na rodada.
        Deixe em branco para não restringir.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-40">
          <Input
            label="Preço mínimo R$"
            type="number"
            min={0}
            step={0.5}
            value={min}
            onChange={(e) => { setMin(e.target.value); setSaved(false); }}
            placeholder="sem limite"
          />
        </div>
        <div className="w-40">
          <Input
            label="Preço máximo R$"
            type="number"
            min={0}
            step={0.5}
            value={max}
            onChange={(e) => { setMax(e.target.value); setSaved(false); }}
            placeholder="sem limite"
          />
        </div>
        <Button variant="secondary" onClick={save} size="sm">
          {saved ? "✓ Salvo" : "Salvar limites"}
        </Button>
      </div>
      {(round.price_min != null || round.price_max != null) && (
        <p className="mt-3 text-xs text-amber-400">
          ⚠ Limites ativos:{" "}
          {round.price_min != null && `mín. R$ ${round.price_min.toFixed(2)}`}
          {round.price_min != null && round.price_max != null && " · "}
          {round.price_max != null && `máx. R$ ${round.price_max.toFixed(2)}`}
          {" — visíveis no formulário do aluno."}
        </p>
      )}
    </Panel>
  );
}

const EVENT_OPTIONS = [
  { value: "Mercado normal", label: "📊 Mercado normal" },
  { value: "Inflação alta", label: "📈 Inflação alta" },
  { value: "Incentivo fiscal", label: "💰 Incentivo fiscal" },
  { value: "Crise econômica", label: "📉 Crise econômica" },
  { value: "Crescimento econômico", label: "🚀 Crescimento econômico" },
  { value: "Escassez de matéria-prima", label: "⚠️ Escassez de matéria-prima" },
  { value: "Alta do dólar", label: "💵 Alta do dólar" },
];

export default function RoundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
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

  async function updateEvent(event_type: string) {
    await fetch(`/api/rounds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type }),
    });
    setRound((r) => r ? { ...r, event_type } : r);
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
          <h1 className="text-2xl font-black text-white">{round.name}</h1>
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

      {/* Event selector */}
      <Panel title="Configurar evento econômico" icon={Zap}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Evento desta rodada"
              value={round.event_type}
              onChange={(e) => updateEvent(e.target.value)}
              options={EVENT_OPTIONS}
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
            {round.event_type === "Inflação alta" && "Demanda -6%, Custos +10%"}
            {round.event_type === "Incentivo fiscal" && "Demanda +6%, Custos -4%"}
            {round.event_type === "Crise econômica" && "Demanda -15%, Custos +5%"}
            {round.event_type === "Crescimento econômico" && "Demanda +10%, Custos +2%"}
            {round.event_type === "Escassez de matéria-prima" && "Custos +20%"}
            {round.event_type === "Alta do dólar" && "Custos +8%"}
            {round.event_type === "Mercado normal" && "Sem impactos adicionais"}
          </div>
        </div>
      </Panel>

      {/* Fixed Expenses panel */}
      <FixedExpensesPanel
        round={round}
        onUpdate={(updates) => setRound((r) => r ? { ...r, ...updates } : r)}
      />

      {/* Price limits */}
      <PriceLimitsPanel round={round} onUpdate={(updates) => {
        setRound((r) => r ? { ...r, ...updates } : r);
        fetch(`/api/rounds/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      }} />

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
            <RankingTable results={results} />
          </Panel>

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
        </>
      )}
    </div>
  );
}
