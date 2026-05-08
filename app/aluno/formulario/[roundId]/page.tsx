"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Save, AlertTriangle, CheckCircle2, Calculator } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DecisionForm } from "@/components/forms/DecisionForm";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { currency, percent, number } from "@/lib/utils/format";
import { simulateCompany, DEFAULT_DECISION } from "@/lib/simulation/engine";
import type { Decision, Group, Round, Submission } from "@/types";

interface ClassSettings {
  fixed_expenses: number | null;
  transport: number | null;
  maintenance: number | null;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export default function FormularioPage() {
  const { roundId } = useParams<{ roundId: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [classSettings, setClassSettings] = useState<ClassSettings | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [decision, setDecision] = useState<Decision>(DEFAULT_DECISION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Load round + groups + class settings in parallel
    const [rRes, gRes, csRes] = await Promise.all([
      fetch(`/api/rounds/${roundId}`),
      fetch("/api/groups"),
      fetch("/api/classes"),
    ]);
    const rData = await rRes.json();
    const gData = await gRes.json();
    const csData = await csRes.json();

    const roundData: Round = rData.round;
    setRound(roundData);

    const groups: Group[] = gData.groups || [];
    setAllGroups(groups);
    setClassSettings(csData.class ?? null);

    // Get my group from session
    const sessionRes = await fetch("/api/auth/me").catch(() => null);
    let groupId: number | null = null;
    if (sessionRes?.ok) {
      const sessionData = await sessionRes.json();
      groupId = sessionData.groupId;
    }

    let myGroup = groups[0] || null;
    if (groupId) {
      myGroup = groups.find((g: Group) => g.id === groupId) || myGroup;
    }
    setGroup(myGroup);

    if (myGroup) {
      const subRes = await fetch(
        `/api/submissions?round_id=${roundId}&group_id=${myGroup.id}`
      );
      const subData = await subRes.json();
      const base = subData.submission
        ? { ...DEFAULT_DECISION, ...subData.submission.decision }
        : { ...DEFAULT_DECISION };

      // Prioridade: valores travados na RODADA (round-level) sobrescrevem os da turma
      const cs = csData.class as ClassSettings | null;

      // 1) turma (Configurações do professor)
      if (cs?.fixed_expenses != null) base.fixedExpenses = cs.fixed_expenses;
      if (cs?.transport != null)       base.transport     = cs.transport;
      if (cs?.maintenance != null)     base.maintenance   = cs.maintenance;

      // 2) rodada sobrescreve turma quando definido
      if (roundData?.fixed_expenses != null) base.fixedExpenses = roundData.fixed_expenses;
      if (roundData?.transport      != null) base.transport     = roundData.transport;
      if (roundData?.maintenance    != null) base.maintenance   = roundData.maintenance;

      if (subData.submission) setSubmission(subData.submission);
      setDecision(base);
    }

    setLoading(false);
  }, [roundId]);

  useEffect(() => { load(); }, [load]);

  const preview = useMemo(
    () => (group ? simulateCompany(group, decision) : null),
    [group, decision]
  );

  async function saveDraft() {
    if (!group) return;
    setSaving(true);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round_id: roundId, group_id: group.id, decision }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmission(data.submission);
      setSavedAt(new Date().toLocaleString("pt-BR"));
    } else {
      alert(data.error);
    }
    setSaving(false);
  }

  async function sendRound() {
    if (!group) return;
    if (!confirm("Após enviar, nenhum integrante do grupo poderá alterar esta rodada. Deseja continuar?")) return;
    setSending(true);
    const res = await fetch("/api/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round_id: roundId, group_id: group.id, decision }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmission(data.submission);
      load();
    } else {
      alert(data.error);
    }
    setSending(false);
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const isSubmitted = submission?.status === "Enviada";
  const isOpen = round?.status === "Aberta";
  const canEdit = isOpen && !isSubmitted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          {round?.name || "Formulário da Rodada"}
        </h1>
        <p className="text-sm text-slate-400">
          {group?.company_name || "Sua empresa"} · {group?.region_name}
        </p>
      </div>

      {/* Submitted banner */}
      {isSubmitted && submission && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-bold text-emerald-300">Rodada enviada com sucesso!</p>
            <p className="mt-1 text-sm text-slate-300">
              Enviada por <strong>{submission.sent_by_name}</strong> – RA {submission.sent_by_ra}{" "}
              – em {submission.sent_at ? new Date(submission.sent_at).toLocaleString("pt-BR") : "—"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              O formulário está bloqueado para todos os integrantes do grupo. Aguarde o professor processar os resultados.
            </p>
          </div>
        </motion.div>
      )}

      {/* Not open banner */}
      {!isOpen && !isSubmitted && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Rodada não está aberta</p>
            <p className="text-sm text-slate-400">Status atual: {round?.status}. Aguarde o professor abrir a rodada.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Decision form */}
        <Panel
          title="Decisões da Rodada"
          icon={Calculator}
          className="lg:col-span-2"
          actions={
            canEdit ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={saveDraft} loading={saving}>
                  <Save className="h-4 w-4" />
                  Rascunho
                </Button>
                <Button variant="success" size="sm" onClick={sendRound} loading={sending}>
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              </div>
            ) : undefined
          }
        >
          {savedAt && !isSubmitted && (
            <p className="mb-4 text-xs text-emerald-400">✓ Rascunho salvo em {savedAt}</p>
          )}
          <DecisionForm
            decision={decision}
            onChange={setDecision}
            disabled={!canEdit}
            groups={allGroups}
            priceMin={round?.price_min}
            priceMax={round?.price_max}
            // Rodada sobrescreve turma: se o professor travou na rodada, usa rodada; senão usa turma
            lockedFixedExpenses={round?.fixed_expenses ?? classSettings?.fixed_expenses ?? null}
            lockedTransport={round?.transport ?? classSettings?.transport ?? null}
            lockedMaintenance={round?.maintenance ?? classSettings?.maintenance ?? null}
          />

          {canEdit && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">
              <Button variant="secondary" onClick={saveDraft} loading={saving}>
                <Save className="h-4 w-4" /> Salvar rascunho
              </Button>
              <Button variant="success" onClick={sendRound} loading={sending} size="lg">
                <Send className="h-4 w-4" /> ENVIAR RODADA
              </Button>
            </div>
          )}
        </Panel>

        {/* Preview sidebar */}
        {preview && (
          <div className="space-y-4">
            {/* KPIs */}
            <Panel title="Prévia dos Indicadores" icon={Calculator}>
              <div className="space-y-2">
                <MetricRow label="Receita Líquida" value={currency(preview.netRevenue)} />
                <MetricRow label="Lucro Bruto" value={currency(preview.grossProfit)} />
                <MetricRow label="EBIT" value={currency(preview.ebit)} />
                <MetricRow label="LAIR" value={currency(preview.ebt)} />
                <MetricRow label="IR (15%)" value={`(${currency(preview.ir)})`} />
                <MetricRow label="CSLL (9%)" value={`(${currency(preview.csll)})`} />
                <MetricRow label="Lucro Líquido" value={currency(preview.netProfit)} />
                <MetricRow label="Liquidez Corrente" value={number(preview.currentRatio)} />
                <MetricRow label="Liquidez Seca" value={number(preview.quickRatio)} />
                <MetricRow label="Liquidez Imediata" value={number(preview.immediateRatio)} />
                <MetricRow label="ROA" value={percent(preview.roa)} />
                <MetricRow label="ROE" value={percent(preview.roe)} />
                <MetricRow label="Margem Bruta" value={percent(preview.grossMargin)} />
                <MetricRow label="Margem Líquida" value={percent(preview.netMargin)} />
                <MetricRow label="Ciclo Financeiro" value={`${number(preview.cashCycle, 0)} dias`} />
                <MetricRow label="Qtd. vendida est." value={number(preview.realSalesQty, 0)} />
                <MetricRow label="Caixa projetado" value={currency(preview.finalCash)} />
              </div>
            </Panel>

            {/* Cash Flow preview */}
            <Panel title="Fluxo de Caixa Projetado" icon={Calculator}>
              <CashFlowPanel result={preview} />
            </Panel>

            {/* Inconsistencies */}
            {preview.inconsistencies.length > 0 && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <h4 className="font-bold text-rose-300">Inconsistências</h4>
                </div>
                <ul className="space-y-1">
                  {preview.inconsistencies.map((i) => (
                    <li key={i} className="text-xs text-rose-200">• {i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
