"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, PlusCircle, Trash2, RefreshCw, Users, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { KpiCard } from "@/components/ui/KpiCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Group } from "@/types";

export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data.groups || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!groupName.trim()) {
      setError("Digite o nome do grupo.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar grupo.");
        return;
      }
      setGroupName("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: number) {
    if (!confirm("Excluir este grupo? Todos os alunos vinculados ficarão sem grupo.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/groups?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir grupo.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Grupos e Empresas</h1>
          <p className="text-sm text-slate-400">
            Cadastre os grupos — a região é criada automaticamente em sequência
          </p>
        </div>
        <Button variant="secondary" onClick={load} title="Recarregar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard icon={Building2} title="Total de grupos" value={groups.length} subtitle="Grupos cadastrados" />
        <KpiCard icon={MapPin} title="Regiões geradas" value={groups.length} subtitle="Sequencial automático" />
        <KpiCard icon={Users} title="Próxima região" value={groups.length ? `Região ${groups.length + 1}` : "Região 1"} subtitle="Ao criar novo grupo" />
      </div>

      {/* Formulário de criação */}
      <Panel title="Novo Grupo" icon={PlusCircle}>
        <form onSubmit={createGroup} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Nome do grupo"
              placeholder="Ex: Grupo Alpha, Equipe 1, Turma A..."
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setError(""); }}
              disabled={saving}
            />
            {error && (
              <p className="mt-1.5 text-sm text-rose-400">{error}</p>
            )}
          </div>
          <div className="shrink-0">
            <div className="mb-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-400">
              Região atribuída:{" "}
              <span className="font-bold text-cyan-400">
                Região {groups.length + 1}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Button type="submit" loading={saving} disabled={saving || !groupName.trim()}>
              <PlusCircle className="h-4 w-4" />
              Criar grupo
            </Button>
          </div>
        </form>
      </Panel>

      {/* Lista de grupos */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-slate-400">
          <Building2 className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-semibold">Nenhum grupo cadastrado</p>
          <p className="mt-1 text-sm">Use o formulário acima para criar o primeiro grupo</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {groups.map((g, idx) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Panel className="!p-0 overflow-hidden">
                  {/* Color bar */}
                  <div className={`h-2 bg-gradient-to-r ${g.color || "from-cyan-500 to-blue-600"}`} />
                  <div className="p-5">
                    {/* Region badge + number */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
                        {g.region_name}
                      </span>
                      <span className="text-2xl font-black text-white/20">#{idx + 1}</span>
                    </div>

                    {/* Group name */}
                    <h3 className="text-base font-black text-white leading-tight">{g.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{g.company_name}</p>

                    {/* Region info */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/5 p-2 text-center">
                        <p className="text-xs text-slate-400">Demanda</p>
                        <p className="font-bold text-white">
                          {((g.region_demand || 1) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-2 text-center">
                        <p className="text-xs text-slate-400">Custo</p>
                        <p className="font-bold text-white">
                          {((g.region_cost || 1) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Delete button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => deleteGroup(g.id)}
                        disabled={deletingId === g.id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                      >
                        {deletingId === g.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Excluir
                      </button>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
