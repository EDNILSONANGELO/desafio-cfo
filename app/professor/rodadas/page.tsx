"use client";

import { useEffect, useState, useCallback } from "react";
import { PlayCircle, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils/format";
import type { Round } from "@/types";

const EVENT_OPTIONS = [
  { value: "Mercado normal", label: "📊 Mercado normal" },
  { value: "Inflação alta", label: "📈 Inflação alta (+10% custos, -6% demanda)" },
  { value: "Incentivo fiscal", label: "💰 Incentivo fiscal (+6% demanda, -4% custos)" },
  { value: "Crise econômica", label: "📉 Crise econômica (-15% demanda)" },
  { value: "Crescimento econômico", label: "🚀 Crescimento econômico (+10% demanda)" },
  { value: "Escassez de matéria-prima", label: "⚠️ Escassez de matéria-prima (+20% custos)" },
  { value: "Alta do dólar", label: "💵 Alta do dólar (+8% custos)" },
];

export default function RodadasPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRound, setNewRound] = useState({ name: "Rodada 1", event_type: "Mercado normal" });

  const load = useCallback(async () => {
    const res = await fetch("/api/rounds");
    const data = await res.json();
    setRounds(data.rounds || []);
    setLoading(false);
  }, []);

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

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Rodadas</h1>
          <p className="text-sm text-slate-400">{rounds.length} rodada(s) criada(s)</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <PlusCircle className="h-4 w-4" /> Nova rodada
        </Button>
      </div>

      <Panel title="Histórico de Rodadas" icon={PlayCircle}>
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
            {rounds.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <PlayCircle className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{r.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-slate-400">{r.event_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden text-right md:block">
                    <p className="text-xs text-slate-400">Criada em</p>
                    <p className="text-xs text-slate-300">{formatDate(r.created_at)}</p>
                    {r.processed_at && (
                      <p className="text-xs text-emerald-400">
                        Processada {formatDate(r.processed_at)}
                      </p>
                    )}
                  </div>
                  <Link href={`/professor/rodadas/${r.id}`}>
                    <Button size="sm">
                      Gerenciar <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

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
        </div>
      </Modal>
    </div>
  );
}
