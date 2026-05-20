"use client";

import { useEffect, useState, useCallback } from "react";
import { PlayCircle, PlusCircle, ArrowRight, Trash2, AlertTriangle, Users } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils/format";
import type { Round } from "@/types";
import { usePoloContext } from "@/contexts/PoloContext";

const EVENT_OPTIONS = [
  { value: "Mercado normal", label: "📊 Mercado normal" },
  { value: "Inflação alta", label: "📈 Inflação alta" },
  { value: "Incentivo fiscal", label: "💰 Incentivo fiscal" },
  { value: "Crise econômica", label: "📉 Crise econômica" },
  { value: "Crescimento econômico", label: "🚀 Crescimento econômico" },
  { value: "Escassez de matéria-prima", label: "⚠️ Escassez de matéria-prima" },
  { value: "Alta do dólar", label: "💵 Alta do dólar" },
];

interface EventDetail {
  emoji: string;
  description: string;
  demand: string;
  cost: string;
  demandFactor: number;
  costFactor: number;
  tips: string[];
}

const EVENT_DETAILS: Record<string, EventDetail> = {
  "Mercado normal": {
    emoji: "📊",
    description: "Condições econômicas estáveis. Sem grandes variações na demanda ou custos.",
    demand: "Neutro (×1,0)",
    cost: "Neutro (×1,0)",
    demandFactor: 1.0,
    costFactor: 1.0,
    tips: ["Foco em eficiência operacional", "Bom momento para investir em máquinas", "Explore todas as regiões"],
  },
  "Inflação alta": {
    emoji: "📈",
    description: "Inflação elevada pressiona os custos de produção e reduz o poder de compra dos consumidores.",
    demand: "–6% (×0,94)",
    cost: "+10% (×1,10)",
    demandFactor: 0.94,
    costFactor: 1.10,
    tips: ["Reduza estoques para evitar perdas", "Considere repassar custos ao preço", "Cuidado com margens apertadas"],
  },
  "Incentivo fiscal": {
    emoji: "💰",
    description: "Governo concede incentivos tributários que reduzem custos e estimulam o consumo.",
    demand: "+6% (×1,06)",
    cost: "–4% (×0,96)",
    demandFactor: 1.06,
    costFactor: 0.96,
    tips: ["Aumente a produção para capturar mais demanda", "Momento favorável para expandir mercado", "Invista em marketing"],
  },
  "Crise econômica": {
    emoji: "📉",
    description: "Retração econômica severa. Queda expressiva na demanda de mercado.",
    demand: "–15% (×0,85)",
    cost: "Neutro (×1,0)",
    demandFactor: 0.85,
    costFactor: 1.0,
    tips: ["Produza menos para evitar estoque parado", "Priorize liquidez no caixa", "Corte custos desnecessários"],
  },
  "Crescimento econômico": {
    emoji: "🚀",
    description: "Expansão econômica robusta. Alta demanda de mercado favorece todas as empresas.",
    demand: "+10% (×1,10)",
    cost: "Neutro (×1,0)",
    demandFactor: 1.10,
    costFactor: 1.0,
    tips: ["Aumente a produção para aproveitar a demanda", "Invista em capacidade produtiva", "Bom momento para contratações"],
  },
  "Escassez de matéria-prima": {
    emoji: "⚠️",
    description: "Ruptura na cadeia de suprimentos. Materiais escassos encarecem a produção.",
    demand: "Neutro (×1,0)",
    cost: "+20% (×1,20)",
    demandFactor: 1.0,
    costFactor: 1.20,
    tips: ["Compre materiais com antecedência", "Revise o preço de venda para cobrir custos", "Avalie reduzir a produção"],
  },
  "Alta do dólar": {
    emoji: "💵",
    description: "Desvalorização cambial encarece insumos importados e eleva os custos de produção.",
    demand: "Neutro (×1,0)",
    cost: "+8% (×1,08)",
    demandFactor: 1.0,
    costFactor: 1.08,
    tips: ["Ajuste o preço de venda", "Negocie prazos maiores com fornecedores", "Monitore o fluxo de caixa"],
  },
};

export default function RodadasPage() {
  const { poloParam, selectedPolo } = usePoloContext();

  const [rounds, setRounds] = useState<(Round & { polo_groups_total?: number; polo_groups_submitted?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRound, setNewRound] = useState({ name: "Rodada 1", event_type: "Mercado normal" });

  // Exclusão
  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rounds?v=1${poloParam}`);
      const data = await res.json();
      setRounds(data.rounds || []);
    } finally {
      setLoading(false);
    }
  }, [poloParam]);

  useEffect(() => { load(); }, [load]);

  async function createRound() {
    setCreating(true);
    // Need class_id – get from first group
    const gRes = await fetch("/api/groups");
    const gData = await gRes.json();
    const classId = gData.groups?.[0]?.class_id;

    if (!classId) {
      alert("Primeiro inicialize os grupos no painel de Grupos.");
      setCreating(false);
      return;
    }

    const res = await fetch("/api/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newRound, class_id: classId }),
    });
    if (res.ok) {
      setShowNew(false);
      load();
    }
    setCreating(false);
  }

  async function deleteRound() {
    if (!roundToDelete) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/rounds/${roundToDelete.id}`, { method: "DELETE" });
    if (res.ok) {
      setRoundToDelete(null);
      load();
    } else {
      const data = await res.json();
      setDeleteError(data.error || "Erro ao excluir.");
    }
    setDeleting(false);
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">Rodadas</h1>
          <p className="text-sm text-slate-400">{rounds.length} rodada(s) criada(s)</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="self-start">
          <PlusCircle className="h-4 w-4" /> Nova rodada
        </Button>
      </div>

      <Panel title="Histórico de Rodadas" icon={PlayCircle}>
        {/* Indicador de polo selecionado */}
        {selectedPolo && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-3 py-2">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <p className="text-xs text-slate-300">
              Exibindo submissões de{" "}
              <strong className="text-cyan-300">{selectedPolo}</strong> em cada rodada
            </p>
          </div>
        )}

        {rounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <PlayCircle className="mb-3 h-10 w-10 opacity-30" />
            <p>Nenhuma rodada criada ainda</p>
            <Button className="mt-4" onClick={() => setShowNew(true)}>
              <PlusCircle className="h-4 w-4" /> Criar primeira rodada
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rounds.map((r) => {
              const poloTotal = r.polo_groups_total ?? 0;
              const poloSubmitted = r.polo_groups_submitted ?? 0;
              const allSubmitted = poloTotal > 0 && poloSubmitted === poloTotal;
              const noneSubmitted = poloSubmitted === 0;

              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                      <PlayCircle className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white">{r.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge status={r.status} />
                        <span className="text-xs text-slate-400">{r.event_type}</span>
                        {/* Badge de submissão do polo */}
                        {selectedPolo && poloTotal > 0 && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            allSubmitted
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
                              : noneSubmitted
                              ? "border-slate-600/50 bg-white/5 text-slate-500"
                              : "border-amber-400/30 bg-amber-500/10 text-amber-400"
                          }`}>
                            <Users className="h-2.5 w-2.5" />
                            {poloSubmitted}/{poloTotal} enviaram
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden text-right md:block">
                      <p className="text-xs text-slate-400">Criada em</p>
                      <p className="text-xs text-slate-300">{formatDate(r.created_at)}</p>
                      {r.processed_at && (
                        <p className="text-xs text-emerald-400">
                          Processada {formatDate(r.processed_at)}
                        </p>
                      )}
                    </div>
                    <Link href={`/professor/rodadas/${r.id}`} className="flex-1 sm:flex-none">
                      <Button size="sm" className="w-full sm:w-auto">
                        Gerenciar <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <button
                      onClick={() => { setRoundToDelete(r); setDeleteError(""); }}
                      title="Excluir rodada"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Modal de confirmação de exclusão */}
      <Modal
        open={!!roundToDelete}
        onClose={() => { setRoundToDelete(null); setDeleteError(""); }}
        title="Excluir Rodada"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRoundToDelete(null); setDeleteError(""); }} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              onClick={deleteRound}
              loading={deleting}
              className="bg-rose-600 hover:bg-rose-500 border-rose-500"
            >
              <Trash2 className="h-4 w-4" />
              Sim, excluir
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm text-slate-300">
              <p className="mb-2 font-bold text-white">Esta ação não pode ser desfeita.</p>
              <p>Ao excluir <strong className="text-amber-300">{roundToDelete?.name}</strong>, serão removidos permanentemente:</p>
              <ul className="mt-2 space-y-1 text-slate-400">
                <li>• Todas as submissões dos grupos</li>
                <li>• Todos os resultados processados</li>
                <li>• Todas as medalhas da rodada</li>
              </ul>
            </div>
          </div>
          {deleteError && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              <strong>Erro:</strong> {deleteError}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de criação */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Nova Rodada"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={createRound} loading={creating}>Criar rodada</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome da rodada"
            value={newRound.name}
            onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
            placeholder="Ex: Rodada 1 – Semestre 2026/1"
          />
          <Select
            label="Evento econômico"
            value={newRound.event_type}
            onChange={(e) => setNewRound({ ...newRound, event_type: e.target.value })}
            options={EVENT_OPTIONS}
          />

          {/* Detalhes do evento selecionado */}
          {(() => {
            const ev = EVENT_DETAILS[newRound.event_type];
            if (!ev) return null;
            const demandColor = ev.demandFactor > 1 ? "text-emerald-400" : ev.demandFactor < 1 ? "text-rose-400" : "text-slate-400";
            const costColor   = ev.costFactor   > 1 ? "text-rose-400"    : ev.costFactor   < 1 ? "text-emerald-400" : "text-slate-400";
            return (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none">{ev.emoji}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{newRound.event_type}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{ev.description}</p>
                  </div>
                </div>

                {/* Parâmetros numéricos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Impacto na Demanda</p>
                    <p className={`text-lg font-black ${demandColor}`}>{ev.demand}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Fator: <span className="font-mono font-bold text-slate-300">×{ev.demandFactor.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Impacto nos Custos</p>
                    <p className={`text-lg font-black ${costColor}`}>{ev.cost}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Fator: <span className="font-mono font-bold text-slate-300">×{ev.costFactor.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                {/* Dicas para os grupos */}
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1.5">💡 Efeitos para os grupos</p>
                  <ul className="space-y-0.5">
                    {ev.tips.map((t, i) => (
                      <li key={i} className="text-[11px] text-slate-400">• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
