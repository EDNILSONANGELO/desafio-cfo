"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, PlusCircle, Trash2, RefreshCw, Users, MapPin, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { KpiCard } from "@/components/ui/KpiCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Group } from "@/types";
import { usePoloContext } from "@/contexts/PoloContext";

export default function GruposPage() {
  const { poloParam, selectedPolo } = usePoloContext();

  const [groups, setGroups] = useState<(Group & { student_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  // Edição inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editRegionName, setEditRegionName] = useState("");
  const [editRegionDemand, setEditRegionDemand] = useState("1.0");
  const [editRegionCost, setEditRegionCost] = useState("1.0");
  const [editRegionTrait, setEditRegionTrait] = useState("");
  const [savingEditId, setSavingEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Filtra grupos pelos alunos do polo selecionado
      const url = `/api/groups?v=1${poloParam}`;
      const res = await fetch(url);
      const data = await res.json();
      setGroups(data.groups || []);
    } finally {
      setLoading(false);
    }
  }, [poloParam]);

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
        body: JSON.stringify({ name: groupName.trim(), polo: selectedPolo ?? undefined }),
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

  function startEdit(g: Group) {
    setEditingId(g.id);
    setEditName(g.name);
    setEditCompany(g.company_name);
    setEditRegionName(g.region_name);
    setEditRegionDemand(String(g.region_demand ?? 1.0));
    setEditRegionCost(String(g.region_cost ?? 1.0));
    setEditRegionTrait(g.region_trait ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditCompany("");
    setEditRegionName("");
    setEditRegionDemand("1.0");
    setEditRegionCost("1.0");
    setEditRegionTrait("");
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    setSavingEditId(id);
    try {
      const res = await fetch(`/api/groups?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          company_name: editCompany.trim() || editName.trim(),
          region_name: editRegionName.trim(),
          region_demand: parseFloat(editRegionDemand) || 1.0,
          region_cost: parseFloat(editRegionCost) || 1.0,
          region_trait: editRegionTrait.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGroups((prev) => prev.map((g) => g.id === id ? { ...g, ...data.group } : g));
        cancelEdit();
      } else {
        alert(data.error || "Erro ao salvar.");
      }
    } finally {
      setSavingEditId(null);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">Grupos e Empresas</h1>
          <p className="text-sm text-slate-400">
            Cadastre os grupos — a região é criada automaticamente em sequência
          </p>
        </div>
        <Button variant="secondary" onClick={load} title="Recarregar" className="self-start">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard icon={Building2} title="Total de grupos" value={groups.length} subtitle="Grupos cadastrados" />
        <KpiCard icon={Users} title="Total de alunos" value={groups.reduce((s, g) => s + g.student_count, 0)} subtitle="Vinculados a grupos" accent="emerald" />
        <KpiCard icon={MapPin} title="Próxima região" value={groups.length ? `Região ${groups.length + 1}` : "Região 1"} subtitle="Ao criar novo grupo" />
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

                    {/* Group name — modo visualização ou edição */}
                    {editingId === g.id ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome do grupo</label>
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(g.id); if (e.key === "Escape") cancelEdit(); }}
                            className="mt-1 w-full rounded-lg border border-cyan-400/40 bg-white/10 px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome da empresa</label>
                          <input
                            value={editCompany}
                            onChange={(e) => setEditCompany(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(g.id); if (e.key === "Escape") cancelEdit(); }}
                            placeholder={editName}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/40"
                          />
                        </div>
                        <div className="mt-1 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">📍 Configurações de Região</p>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nome da região</label>
                            <input
                              value={editRegionName}
                              onChange={(e) => setEditRegionName(e.target.value)}
                              placeholder="Ex: Região Norte"
                              className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-400/40"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Demanda %</label>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                step="5"
                                value={Math.round((parseFloat(editRegionDemand) || 1.0) * 100)}
                                onChange={(e) => setEditRegionDemand(String(Number(e.target.value) / 100))}
                                className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400/40"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Custo %</label>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                step="5"
                                value={Math.round((parseFloat(editRegionCost) || 1.0) * 100)}
                                onChange={(e) => setEditRegionCost(String(Number(e.target.value) / 100))}
                                className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400/40"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trait da região</label>
                            <input
                              value={editRegionTrait}
                              onChange={(e) => setEditRegionTrait(e.target.value)}
                              placeholder="Ex: Alta demanda, custo elevado de transporte..."
                              className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-400/40"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveEdit(g.id)}
                            disabled={!!savingEditId || !editName.trim()}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-40"
                          >
                            {savingEditId === g.id ? <LoadingSpinner size="sm" /> : <Check className="h-3.5 w-3.5" />}
                            Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-white leading-tight">{g.name}</h3>
                            <p className="mt-0.5 truncate text-xs text-slate-400">{g.company_name}</p>
                          </div>
                          <button
                            onClick={() => startEdit(g)}
                            title="Editar nome"
                            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-400/30"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Region info + student count */}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-white/5 p-2 text-center">
                            <p className="text-xs text-slate-400">Demanda</p>
                            <p className="font-bold text-white">{((g.region_demand || 1) * 100).toFixed(0)}%</p>
                          </div>
                          <div className="rounded-xl bg-white/5 p-2 text-center">
                            <p className="text-xs text-slate-400">Custo</p>
                            <p className="font-bold text-white">{((g.region_cost || 1) * 100).toFixed(0)}%</p>
                          </div>
                          <div className={`rounded-xl p-2 text-center ${g.student_count > 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5"}`}>
                            <p className="text-xs text-slate-400">Alunos</p>
                            <p className={`font-bold ${g.student_count > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                              {g.student_count}
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
                            {deletingId === g.id ? <LoadingSpinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
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
