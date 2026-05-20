"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Plus,
  KeyRound,
  Trash2,
  UserCog,
  Mail,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  X,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface ProfessorClass {
  id: string;
  name: string;
}

interface ProfessorRow {
  id: string;
  email: string;
  name: string;
  polo: string | null;
  is_master: boolean;
  created_at: string;
  classes: ProfessorClass[];
}

type ModalMode = "create" | "edit" | "reset" | "delete" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converte string "Polo A, Polo B" → ["Polo A", "Polo B"] */
function splitPolos(polo: string | null): string[] {
  if (!polo?.trim()) return [];
  return polo.split(",").map((p) => p.trim()).filter(Boolean);
}

/** Junta array de polos em string para salvar */
function joinPolos(polos: string[]): string | null {
  const joined = polos.filter(Boolean).join(", ");
  return joined || null;
}

// ─── Sub-componente: Input de tags para polos ─────────────────────────────────

interface PoloTagInputProps {
  value: string[];           // array de polos selecionados
  onChange: (v: string[]) => void;
  placeholder?: string;
}

function PoloTagInput({ value, onChange, placeholder = "Digite e pressione Enter ou vírgula" }: PoloTagInputProps) {
  const [text, setText] = useState("");

  function addPolo(raw: string) {
    // Suporta múltiplos separados por vírgula colados de uma vez
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) {
      if (!next.includes(p)) next.push(p);
    }
    onChange(next);
    setText("");
  }

  function removePolo(polo: string) {
    onChange(value.filter((p) => p !== polo));
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (text.trim()) addPolo(text);
    } else if (e.key === "Backspace" && !text && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    if (text.trim()) addPolo(text);
  }

  return (
    <div
      className="flex min-h-[42px] flex-wrap gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-cyan-400/50 transition-colors"
    >
      {value.map((polo) => (
        <span
          key={polo}
          className="flex items-center gap-1 rounded-lg bg-cyan-400/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300"
        >
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {polo}
          <button
            type="button"
            onClick={() => removePolo(polo)}
            className="ml-0.5 rounded-full text-cyan-400/70 hover:text-rose-400 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[140px] flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
      />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminPage() {
  const [professors, setProfessors] = useState<ProfessorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProf, setSelectedProf] = useState<ProfessorRow | null>(null);

  // Formulário criar
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPolos, setNewPolos] = useState<string[]>([]);
  const [showNewPw, setShowNewPw] = useState(false);

  // Formulário reset
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [confirmResetPw, setConfirmResetPw] = useState("");

  // Formulário editar professor
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPolos, setEditPolos] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Feedback
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Expandir turmas
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfessors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/master/professors");
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          setError("Acesso negado. Apenas o administrador master pode visualizar esta página.");
        } else {
          setError(data.error || "Erro ao carregar professores");
        }
        return;
      }
      const data = await res.json();
      setProfessors(data.professors || []);
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  // ── Criar professor ──────────────────────────────────────────────────────────

  function openCreate() {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewPolos([]);
    setShowNewPw(false);
    setModalMode("create");
  }

  async function handleCreate() {
    if (!newName.trim() || !newEmail.trim() || !newPassword) return;
    setSaving(true);
    try {
      const res = await fetch("/api/master/professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          polo: joinPolos(newPolos),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao criar professor", "error");
        return;
      }
      if (data.merged) {
        showToast(data.message || `Polo(s) adicionado(s) ao professor existente!`, "success");
      } else {
        showToast(`Professor "${newName.trim()}" criado com sucesso!`, "success");
      }
      setModalMode(null);
      fetchProfessors();
    } finally {
      setSaving(false);
    }
  }

  // ── Editar professor ─────────────────────────────────────────────────────────

  function openEdit(prof: ProfessorRow) {
    setSelectedProf(prof);
    setEditName(prof.name);
    setEditEmail(prof.email);
    setEditPolos(splitPolos(prof.polo));
    setModalMode("edit");
  }

  async function handleSaveEdit() {
    if (!selectedProf || !editName.trim() || !editEmail.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/master/professors/${selectedProf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          name: editName.trim(),
          email: editEmail.trim(),
          polo: joinPolos(editPolos),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao atualizar professor", "error");
        return;
      }
      showToast(`Professor "${editName.trim()}" atualizado com sucesso!`, "success");
      setModalMode(null);
      fetchProfessors();
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Reset de senha ───────────────────────────────────────────────────────────

  function openReset(prof: ProfessorRow) {
    setSelectedProf(prof);
    setResetPassword("");
    setConfirmResetPw("");
    setShowResetPw(false);
    setModalMode("reset");
  }

  async function handleReset() {
    if (!selectedProf || !resetPassword) return;
    if (resetPassword !== confirmResetPw) {
      showToast("As senhas não coincidem", "error");
      return;
    }
    if (resetPassword.length < 6) {
      showToast("Senha deve ter pelo menos 6 caracteres", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/master/professors/${selectedProf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", newPassword: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao redefinir senha", "error");
        return;
      }
      showToast(`Senha de "${selectedProf.name}" redefinida com sucesso!`, "success");
      setModalMode(null);
    } finally {
      setSaving(false);
    }
  }

  // ── Excluir professor ────────────────────────────────────────────────────────

  function openDelete(prof: ProfessorRow) {
    setSelectedProf(prof);
    setModalMode("delete");
  }

  async function handleDelete() {
    if (!selectedProf) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/master/professors/${selectedProf.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao excluir professor", "error");
        return;
      }
      showToast(`Professor "${selectedProf.name}" removido`, "success");
      setModalMode(null);
      fetchProfessors();
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const regularProfessors = professors.filter((p) => !p.is_master);
  const masterProfs = professors.filter((p) => p.is_master);

  // Agrupa por polo — professor com múltiplos polos aparece em todos eles
  const professorsByPolo: Record<string, ProfessorRow[]> = {};
  for (const prof of regularProfessors) {
    const polos = splitPolos(prof.polo);
    if (polos.length === 0) {
      const key = "— Sem Polo atribuído";
      if (!professorsByPolo[key]) professorsByPolo[key] = [];
      professorsByPolo[key].push(prof);
    } else {
      for (const p of polos) {
        if (!professorsByPolo[p]) professorsByPolo[p] = [];
        professorsByPolo[p].push(prof);
      }
    }
  }
  const poloKeys = Object.keys(professorsByPolo).sort((a, b) =>
    a.startsWith("—") ? 1 : b.startsWith("—") ? -1 : a.localeCompare(b, "pt-BR")
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed right-6 top-20 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl text-sm font-semibold ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          }`}
        >
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.msg}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20">
            <ShieldCheck className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Painel Master</h1>
            <p className="text-sm text-slate-400">Gerencie os professores da instituição</p>
          </div>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Professor
        </Button>
      </div>

      {/* Erro de acesso */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Conta Master */}
      {masterProfs.length > 0 && (
        <Panel title="Conta Administrador Master" className="border border-violet-500/20 bg-violet-500/5">
          <div className="space-y-2">
            {masterProfs.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                  <ShieldCheck className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 truncate">{p.email}</p>
                </div>
                <span className="rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-bold text-violet-300 shrink-0">
                  MASTER
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Lista de professores agrupada por polo */}
      <Panel
        title={`Professores Cadastrados (${regularProfessors.length})`}
        actions={
          <Button variant="ghost" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : regularProfessors.length === 0 ? (
          <div className="py-12 text-center">
            <UserCog className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-slate-400 text-sm">Nenhum professor cadastrado ainda</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Cadastrar professor
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {poloKeys.map((polo) => (
              <div key={polo}>
                {/* Cabeçalho do polo */}
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${polo.startsWith("—") ? "text-slate-600" : "text-cyan-400"}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${polo.startsWith("—") ? "text-slate-600" : "text-cyan-400"}`}>
                    {polo}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
                    {professorsByPolo[polo].length} {professorsByPolo[polo].length === 1 ? "professor" : "professores"}
                  </span>
                </div>

                <div className="space-y-2">
                  {professorsByPolo[polo].map((prof) => {
                    const expanded = expandedId === prof.id;
                    const profPolos = splitPolos(prof.polo);
                    return (
                      <motion.div
                        key={`${polo}-${prof.id}`}
                        layout
                        className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                      >
                        {/* Linha principal */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                            <UserCog className="h-5 w-5 text-cyan-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{prof.name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{prof.email}</span>
                            </div>
                            {/* Badges de todos os polos */}
                            {profPolos.length > 1 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {profPolos.map((p) => (
                                  <span key={p} className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${p === polo ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-slate-500"}`}>
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Turmas badge */}
                          <button
                            onClick={() => setExpandedId(expanded ? null : prof.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-white/10 transition-colors"
                          >
                            <Building2 className="h-3 w-3" />
                            {prof.classes.length}
                            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          {/* Ações */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(prof)}
                              title="Editar professor"
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openReset(prof)}
                              title="Redefinir senha"
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                            >
                              <KeyRound className="h-4 w-4" />
                              <span className="hidden sm:inline">Senha</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDelete(prof)}
                              title="Excluir professor"
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Turmas expandidas */}
                        {expanded && prof.classes.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-white/10 px-4 pb-3 pt-2"
                          >
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Turmas</p>
                            <div className="flex flex-wrap gap-1.5">
                              {prof.classes.map((c) => (
                                <span
                                  key={c.id}
                                  className="rounded-lg bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-400"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                        {expanded && prof.classes.length === 0 && (
                          <div className="border-t border-white/10 px-4 pb-3 pt-2">
                            <p className="text-xs text-slate-500 italic">Nenhuma turma criada ainda</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ── Modal: Criar professor ─────────────────────────────────────────────── */}
      <Modal
        open={modalMode === "create"}
        onClose={() => setModalMode(null)}
        title="Novo Professor"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalMode(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={saving || !newName.trim() || !newEmail.trim() || !newPassword}
            >
              {saving ? "Criando…" : "Criar Professor"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Nome completo</label>
            <Input
              placeholder="Prof. João da Silva"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Polo(s) / Campus <span className="text-slate-600 font-normal">(opcional)</span>
            </label>
            <PoloTagInput
              value={newPolos}
              onChange={setNewPolos}
              placeholder="Digite o polo e pressione Enter…"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Pode adicionar vários polos. Digite o nome e pressione <kbd className="rounded bg-white/10 px-1 text-[10px]">Enter</kbd> ou <kbd className="rounded bg-white/10 px-1 text-[10px]">,</kbd> para confirmar cada um.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">E-mail institucional</label>
            <Input
              type="email"
              placeholder="professor@instituicao.edu.br"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Senha inicial</label>
            <div className="relative">
              <Input
                type={showNewPw ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              O professor poderá alterar a senha nas configurações após o primeiro acesso.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Editar professor ───────────────────────────────────────────── */}
      <Modal
        open={modalMode === "edit"}
        onClose={() => setModalMode(null)}
        title="Editar Professor"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalMode(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={savingEdit || !editName.trim() || !editEmail.trim()}
            >
              <Pencil className="h-4 w-4" />
              {savingEdit ? "Salvando…" : "Salvar Alterações"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Identidade */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Nome completo</label>
            <Input
              placeholder="Prof. João da Silva"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">E-mail institucional</label>
            <Input
              type="email"
              placeholder="professor@instituicao.edu.br"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            {editEmail !== selectedProf?.email && editEmail.trim() && (
              <p className="mt-1 text-[11px] text-amber-400">
                ⚠ Alterar o e-mail vai mudar o login do professor.
              </p>
            )}
          </div>

          {/* Divisor */}
          <div className="border-t border-white/10 pt-1" />

          {/* Polos */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Polo(s) / Campus <span className="text-slate-600 font-normal">(opcional)</span>
            </label>
            <PoloTagInput
              value={editPolos}
              onChange={setEditPolos}
              placeholder="Digite o polo e pressione Enter…"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Vários polos podem ser atribuídos. O professor aparecerá em cada grupo no painel Master.
              Deixe vazio para remover todos os polos.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Redefinir senha ─────────────────────────────────────────────── */}
      <Modal
        open={modalMode === "reset"}
        onClose={() => setModalMode(null)}
        title="Redefinir Senha"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalMode(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleReset}
              disabled={saving || !resetPassword || resetPassword !== confirmResetPw}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              <KeyRound className="h-4 w-4" />
              {saving ? "Redefinindo…" : "Redefinir Senha"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
            <KeyRound className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-white">{selectedProf?.name}</p>
              <p className="text-xs text-slate-400">{selectedProf?.email}</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Nova senha</label>
            <div className="relative">
              <Input
                type={showResetPw ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowResetPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showResetPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Confirmar nova senha</label>
            <Input
              type="password"
              placeholder="Repita a senha"
              value={confirmResetPw}
              onChange={(e) => setConfirmResetPw(e.target.value)}
            />
            {confirmResetPw && resetPassword !== confirmResetPw && (
              <p className="mt-1 text-xs text-rose-400">As senhas não coincidem</p>
            )}
            {confirmResetPw && resetPassword === confirmResetPw && resetPassword.length >= 6 && (
              <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> Senhas conferem
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Modal: Confirmar exclusão ──────────────────────────────────────────── */}
      <Modal
        open={modalMode === "delete"}
        onClose={() => setModalMode(null)}
        title="Excluir Professor"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalMode(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4" />
              {saving ? "Excluindo…" : "Confirmar Exclusão"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-white">{selectedProf?.name}</p>
              <p className="text-xs text-slate-400">{selectedProf?.email}</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Ao excluir este professor, todas as turmas, rodadas e dados vinculados a ele serão{" "}
            <span className="font-bold text-rose-400">permanentemente removidos</span>. Esta ação não pode ser desfeita.
          </p>
          {selectedProf && selectedProf.classes.length > 0 && (
            <div className="rounded-xl bg-rose-500/10 px-4 py-3">
              <p className="text-xs font-semibold text-rose-400 mb-1">Turmas que serão excluídas:</p>
              <ul className="space-y-0.5">
                {selectedProf.classes.map((c) => (
                  <li key={c.id} className="text-xs text-slate-300">• {c.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
