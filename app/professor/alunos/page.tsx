"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, PlusCircle, Trash2, Edit3, RefreshCw, Upload, Building2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Student, Group } from "@/types";

interface FormState {
  ra: string;
  name: string;
  password: string;
  group_name: string;
  email: string;
}

export default function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState<FormState>({
    ra: "",
    name: "",
    password: "123456",
    group_name: "",
    email: "",
  });

  const load = useCallback(async () => {
    const [sRes, gRes] = await Promise.all([
      fetch("/api/students"),
      fetch("/api/groups"),
    ]);
    const sData = await sRes.json();
    const gData = await gRes.json();
    setStudents(sData.students || []);
    setGroups(gData.groups || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditStudent(null);
    setForm({ ra: "", name: "", password: "123456", group_name: "", email: "" });
    setShowModal(true);
  }

  function openEdit(s: Student) {
    setEditStudent(s);
    setForm({
      ra: s.ra,
      name: s.name,
      password: "",
      group_name: s.group?.name || "",
      email: s.email || "",
    });
    setShowModal(true);
  }

  async function save() {
    setSaving(true);
    try {
      const url = editStudent ? `/api/students/${editStudent.id}` : "/api/students";
      const method = editStudent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(s: Student) {
    if (!confirm(`Excluir ${s.name}?`)) return;
    await fetch(`/api/students/${s.id}`, { method: "DELETE" });
    load();
  }

  async function resetPassword(s: Student) {
    const newPass = prompt(`Nova senha para ${s.name} (RA: ${s.ra}):`, "123456");
    if (!newPass) return;
    await fetch(`/api/students/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, group_name: s.group?.name || "", password: newPass }),
    });
    alert("Senha redefinida com sucesso!");
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ra.includes(searchTerm)
  );

  // Autocomplete suggestions based on existing groups
  const suggestions = form.group_name
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(form.group_name.toLowerCase())
      )
    : groups;

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Gestão de Alunos</h1>
          <p className="text-sm text-slate-400">{students.length} alunos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={openNew}><PlusCircle className="h-4 w-4" />Cadastrar aluno</Button>
        </div>
      </div>

      <Panel title="Lista de Alunos" icon={Users}>
        <div className="mb-4">
          <Input
            placeholder="Buscar por nome ou RA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">RA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Nome</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-400 md:table-cell">Grupo / Região</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-400 lg:table-cell">E-mail</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado ainda"}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">{s.ra}</td>
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {s.group ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <div>
                            <p className="font-semibold text-white">{s.group.name}</p>
                            <p className="text-xs text-slate-400">{s.group.region_name}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Sem grupo</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                      {s.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)} title="Editar">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => resetPassword(s)} title="Redefinir senha">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteStudent(s)} title="Excluir">
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!students.length && (
          <div className="mt-4 rounded-2xl border border-dashed border-white/20 p-8 text-center">
            <Upload className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">
              Cadastre alunos individualmente usando o botão acima.
            </p>
          </div>
        )}
      </Panel>

      {/* Modal de cadastro/edição */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setShowSuggestions(false); }}
        title={editStudent ? "Editar Aluno" : "Cadastrar Novo Aluno"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); setShowSuggestions(false); }}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              {editStudent ? "Salvar alterações" : "Cadastrar aluno"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* RA + Nome */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="RA *"
              value={form.ra}
              onChange={(e) => setForm({ ...form, ra: e.target.value })}
              disabled={!!editStudent}
              placeholder="Ex: 2024001"
              helper="Número único de matrícula"
            />
            <Input
              label="Nome completo *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do aluno"
            />
          </div>

          {/* Senha + Email */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={editStudent ? "Nova senha (deixe em branco para manter)" : "Senha inicial *"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 caracteres"
            />
            <Input
              label="E-mail (opcional)"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="aluno@email.com"
            />
          </div>

          {/* Grupo — campo de texto com autocomplete */}
          <div className="relative">
            <Input
              label="Grupo"
              value={form.group_name}
              onChange={(e) => {
                setForm({ ...form, group_name: e.target.value });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Digite o nome do grupo (ex: Grupo A, Turma 1...)"
              helper={
                groups.find((g) => g.name.toLowerCase() === form.group_name.toLowerCase())
                  ? `✅ Grupo existente — aluno será vinculado a ${groups.find((g) => g.name.toLowerCase() === form.group_name.toLowerCase())?.region_name}`
                  : form.group_name.trim()
                  ? "✨ Novo grupo — será criado automaticamente com região sequencial"
                  : "Deixe em branco para não vincular a nenhum grupo"
              }
            />

            {/* Dropdown de sugestões */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/15 bg-slate-900 shadow-2xl">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Grupos existentes
                </p>
                {suggestions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onMouseDown={() => {
                      setForm({ ...form, group_name: g.name });
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/10"
                  >
                    <div className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${g.color}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{g.name}</p>
                      <p className="text-[10px] text-slate-400">{g.region_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-xs text-slate-400 leading-relaxed">
            <Building2 className="mr-1.5 inline h-3.5 w-3.5 text-cyan-400" />
            <strong className="text-slate-300">Como funciona:</strong> se o grupo digitado já existir, o aluno é vinculado a ele.
            Caso seja um nome novo, o grupo é criado automaticamente com uma região sequencial (Região 1, Região 2...).
          </div>
        </div>
      </Modal>
    </div>
  );
}
