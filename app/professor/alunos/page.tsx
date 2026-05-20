"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Users, PlusCircle, Trash2, Edit3, RefreshCw, Upload,
  Building2, FileDown, FileUp, CheckCircle2, AlertTriangle,
  XCircle, KeyRound, Eye, ShieldAlert,
} from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Student, Group } from "@/types";
import { usePoloContext } from "@/contexts/PoloContext";

const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// Gradiente colors para novos grupos, na ordem de criação
const NEW_GROUP_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-500",
  "from-indigo-500 to-violet-600",
  "from-green-500 to-emerald-600",
];

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface FormState {
  ra: string;
  name: string;
  password: string;
  group_name: string;
  email: string;
  semestre: string;
  polo: string;
}

interface ImportRow {
  ra: string;
  name: string;
  password: string;
  email: string;
  semestre: string;
  group_name: string;
  polo: string;
  errors: string[];
  warnings: string[];
}

type ImportStatus = "idle" | "parsing" | "previewing" | "checking" | "resolving" | "importing" | "done";

interface DuplicateConflict {
  rowIndex: number;              // índice em importRows
  ra: string;                    // RA do arquivo
  rowName: string;               // nome do arquivo
  rowPolo: string;               // polo do arquivo
  existingId: string;            // id do aluno já cadastrado
  existingName: string;          // nome do aluno já cadastrado
  existingPolo: string | null;   // polo do aluno já cadastrado
  existingClassName: string | null;      // turma onde o aluno está cadastrado
  existingProfessorName: string | null;  // professor dono da turma do aluno
  existingGroupName: string | null;      // grupo/empresa do aluno
  /** true = aluno visível para este professor; false = turma de outro professor ou órfão */
  isInScope: boolean;
  resolution: "skip" | "replace" | "edit" | null;
  newRa: string;                 // RA editado pelo professor (resolução "edit")
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: { ra: string; error: string }[];
}

interface GroupPreview {
  name: string;
  isNew: boolean;
  regionName: string;
  regionNumber: number;
  studentCount: number;
  color: string;
}

// ── Gerar template Excel ───────────────────────────────────────────────────────
async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const template = [
    {
      "RA *":             "2024001",
      "Nome *":           "Maria da Silva",
      "Polo/Unidade *":   "Polo Norte",
      "Senha":            "123456",
      "E-mail":           "maria@email.com",
      "Semestre":         "3",
      "Grupo":            "Grupo 1",
    },
    {
      "RA *":             "2024002",
      "Nome *":           "João Souza",
      "Polo/Unidade *":   "Polo Norte",
      "Senha":            "123456",
      "E-mail":           "",
      "Semestre":         "3",
      "Grupo":            "Grupo 1",
    },
    {
      "RA *":             "2024003",
      "Nome *":           "Ana Pereira",
      "Polo/Unidade *":   "Polo Sul",
      "Senha":            "123456",
      "E-mail":           "",
      "Semestre":         "5",
      "Grupo":            "Grupo 2",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);

  // Largura das colunas
  ws["!cols"] = [
    { wch: 12 }, // RA
    { wch: 30 }, // Nome
    { wch: 18 }, // Polo/Unidade
    { wch: 12 }, // Senha
    { wch: 28 }, // Email
    { wch: 10 }, // Semestre
    { wch: 20 }, // Grupo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alunos");

  // Aba de instruções
  const instrucoes = [
    { "Campo":             "RA *",            "Obrigatório": "Sim", "Descrição": "Número de matrícula único do aluno" },
    { "Campo":             "Nome *",          "Obrigatório": "Sim", "Descrição": "Nome completo do aluno" },
    { "Campo":             "Polo/Unidade *",  "Obrigatório": "Sim", "Descrição": "Polo ou unidade do aluno (ex: Polo Norte, EAD, Presencial)" },
    { "Campo":             "Senha",           "Obrigatório": "Não", "Descrição": "Senha inicial de acesso. Se vazio, usa 123456" },
    { "Campo":             "E-mail",          "Obrigatório": "Não", "Descrição": "E-mail do aluno (opcional)" },
    { "Campo":             "Semestre",        "Obrigatório": "Não", "Descrição": "Semestre atual: número de 1 a 8" },
    { "Campo":             "Grupo",           "Obrigatório": "Não", "Descrição": "Nome do grupo. Se não existir, será criado automaticamente" },
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instrucoes);
  wsInstr["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instruções");

  XLSX.writeFile(wb, "modelo-importacao-alunos.xlsx");
}

// ── Parsear arquivo Excel ──────────────────────────────────────────────────────
async function parseExcel(file: File): Promise<ImportRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  // Usa a primeira aba
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const seen = new Set<string>();

  return raw.map((r): ImportRow => {
    // Normaliza os nomes das colunas (remove *, espaços, case)
    function col(...candidates: string[]): string {
      for (const c of candidates) {
        if (r[c] !== undefined && r[c] !== "") return String(r[c]).trim();
        // Try case-insensitive
        const key = Object.keys(r).find(
          (k) => k.replace(/\s*\*\s*$/, "").trim().toLowerCase() === c.replace(/\s*\*\s*$/, "").trim().toLowerCase()
        );
        if (key && r[key] !== "" && r[key] !== undefined) return String(r[key]).trim();
      }
      return "";
    }

    const ra         = col("RA *", "RA", "ra", "Matricula", "Matrícula");
    const name       = col("Nome *", "Nome", "nome", "Name");
    const polo       = col("Polo/Unidade *", "Polo/Unidade", "polo", "Polo", "Unidade", "unidade");
    const password   = col("Senha", "senha", "Password", "password") || "123456";
    const email      = col("E-mail", "Email", "email", "E-Mail");
    const semestreRaw = col("Semestre", "semestre", "Semester");
    const group_name = col("Grupo", "grupo", "Group", "group");

    const errors: string[]   = [];
    const warnings: string[] = [];

    if (!ra)   errors.push("RA obrigatório");
    if (!name) errors.push("Nome obrigatório");
    if (!polo) errors.push("Polo/Unidade obrigatório");

    // Semestre validation
    const semNum = semestreRaw ? Number(semestreRaw) : NaN;
    const semestre = !semestreRaw
      ? ""
      : isNaN(semNum) || semNum < 1 || semNum > 8 || !Number.isInteger(semNum)
        ? (() => { warnings.push(`Semestre "${semestreRaw}" inválido — deve ser 1 a 8 (será ignorado)`); return ""; })()
        : String(semNum);

    // RA duplicado dentro do arquivo
    if (ra && seen.has(ra)) {
      errors.push(`RA ${ra} duplicado neste arquivo`);
    } else if (ra) {
      seen.add(ra);
    }

    return { ra, name, polo, password, email, semestre, group_name, errors, warnings };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function AlunosPage() {
  // ── Contexto global de polo ───────────────────────────────────────────────────
  const { selectedClassIdsKey, poloParam, professorPolos, selectedPolo } = usePoloContext();

  const [students, setStudents]         = useState<Student[]>([]);
  const [groups, setGroups]             = useState<Group[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editStudent, setEditStudent]   = useState<Student | null>(null);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [raUpdated, setRaUpdated]       = useState(false);
  const [searchTerm, setSearchTerm]     = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Seleção em lote ───────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting]       = useState(false);
  const [showBulkModal, setShowBulkModal]     = useState(false);

  // ── Gerar senha temporária ────────────────────────────────────────────────────
  const [tempPwStudent, setTempPwStudent] = useState<Student | null>(null);
  const [tempPwValue, setTempPwValue]     = useState<string | null>(null);
  const [tempPwCopied, setTempPwCopied]   = useState(false);
  const [tempPwLoading, setTempPwLoading] = useState(false);
  const [tempPwError, setTempPwError]     = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    ra: "", name: "", password: "123456", group_name: "", email: "", semestre: "", polo: "",
  });

  // ── Import state ─────────────────────────────────────────────────────────────
  const fileInputRef                          = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus]       = useState<ImportStatus>("idle");
  const [importRows, setImportRows]           = useState<ImportRow[]>([]);
  const [importResult, setImportResult]       = useState<ImportResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [conflicts, setConflicts]             = useState<DuplicateConflict[]>([]);

  // Recarrega dados sempre que o polo selecionado mudar (via contexto global)
  const load = useCallback(async () => {
    setLoading(true);
    // Filtra alunos pelo campo polo diretamente (poloParam = "&polo=Norte" ou "")
    const studentsUrl = `/api/students?v=1${poloParam}`;
    // Grupos são da turma inteira — não filtram por polo
    const groupsUrl = selectedClassIdsKey
      ? `/api/groups?class_id=${selectedClassIdsKey.split(",")[0]}`
      : "/api/groups";

    const [sRes, gRes] = await Promise.all([fetch(studentsUrl), fetch(groupsUrl)]);
    const sData = await sRes.json();
    const gData = await gRes.json();
    setStudents(sData.students || []);
    setGroups(gData.groups || []);
    setLoading(false);
  }, [poloParam, selectedClassIdsKey]);

  useEffect(() => { load(); }, [load]);
  // Limpa seleção ao trocar de polo
  useEffect(() => { setSelectedIds(new Set()); }, [poloParam]);

  // ── CRUD helpers ──────────────────────────────────────────────────────────────
  function openNew() {
    setEditStudent(null);
    setSaveError(null);
    setRaUpdated(false);
    // Pré-preenche polo com o polo global selecionado (ou vazio se "Todos")
    setForm({ ra: "", name: "", password: "123456", group_name: "", email: "", semestre: "", polo: selectedPolo ?? "" });
    setShowModal(true);
  }

  function openEdit(s: Student) {
    setEditStudent(s);
    setSaveError(null);
    setRaUpdated(false);
    setForm({
      ra: s.ra, name: s.name, password: "",
      group_name: s.group?.name || "", email: s.email || "",
      semestre: s.semestre ? String(s.semestre) : "",
      polo: (s as unknown as { polo?: string }).polo ?? "",
    });
    setShowModal(true);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    setRaUpdated(false);
    try {
      const url    = editStudent ? `/api/students/${editStudent.id}` : "/api/students";
      const method = editStudent ? "PUT" : "POST";
      const originalRa = editStudent?.ra;
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setSaveError("Este RA já está em uso por outro aluno.");
        } else {
          setSaveError(data.error || "Erro ao salvar.");
        }
        return;
      }
      const raChanged = editStudent && form.ra.trim() && form.ra.trim() !== originalRa;
      if (raChanged) {
        setRaUpdated(true);
        load();
        // Keep modal open to show the confirmation message; close on next open
      } else {
        setShowModal(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(s: Student) {
    if (!confirm(`Excluir ${s.name}?`)) return;
    await fetch(`/api/students/${s.id}`, { method: "DELETE" });
    load();
  }

  async function bulkDelete() {
    setBulkDeleting(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) => fetch(`/api/students/${id}`, { method: "DELETE" }))
      );
      setSelectedIds(new Set());
      setShowBulkModal(false);
      load();
    } finally {
      setBulkDeleting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  }

  function openTempPwModal(s: Student) {
    setTempPwStudent(s);
    setTempPwValue(null);
    setTempPwCopied(false);
    setTempPwError(null);
  }

  async function generateTempPassword() {
    if (!tempPwStudent) return;
    setTempPwLoading(true);
    setTempPwError(null);
    try {
      const res = await fetch(`/api/students/${tempPwStudent.id}/temp-password`, {
        method: "POST",
      });
      let data: { tempPassword?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setTempPwError("Resposta inválida do servidor. Tente novamente.");
        return;
      }
      if (!res.ok) {
        setTempPwError(data.error || `Erro ${res.status} ao gerar senha. Verifique se a migration 009 foi executada no Supabase.`);
        return;
      }
      if (!data.tempPassword) {
        setTempPwError("Servidor não retornou a senha. Tente novamente.");
        return;
      }
      setTempPwValue(data.tempPassword);
    } catch (e) {
      console.error("generateTempPassword error:", e);
      setTempPwError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setTempPwLoading(false);
    }
  }

  function closeTempPwModal() {
    setTempPwStudent(null);
    setTempPwValue(null);
    setTempPwCopied(false);
    setTempPwError(null);
  }

  // ── Import handlers ───────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    setImportStatus("parsing");
    setImportResult(null);
    setShowImportModal(true);

    try {
      const rows = await parseExcel(file);
      setImportRows(rows);
      setImportStatus("previewing");
    } catch {
      setImportRows([]);
      setImportStatus("idle");
      alert("Erro ao ler o arquivo. Verifique se é um arquivo Excel válido (.xlsx ou .xls).");
      setShowImportModal(false);
    }
  }

  async function confirmImport() {
    const validRows = importRows.filter((r) => r.errors.length === 0);
    if (!validRows.length) return;

    // Fase 1: pré-verificação de duplicatas no banco
    setImportStatus("checking");
    try {
      const checkRes = await fetch("/api/students/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ras: validRows.map((r) => r.ra) }),
      });
      type EnrichedDuplicate = {
        ra: string; id: string; name: string; polo: string | null;
        class_id: string | null; class_name: string | null;
        professor_name: string | null; group_name: string | null;
        is_in_scope: boolean;
      };
      const checkData: { duplicates?: EnrichedDuplicate[]; error?: string } = await checkRes.json();

      if (!checkRes.ok) {
        setImportStatus("previewing");
        alert(checkData.error || "Erro ao verificar duplicatas.");
        return;
      }

      const dups = checkData.duplicates ?? [];

      if (dups.length === 0) {
        // Nenhum conflito — importa direto
        await runImport(validRows.map((r) => ({
          ra: r.ra, name: r.name, polo: r.polo || null,
          password: r.password, email: r.email || null,
          semestre: r.semestre ? Number(r.semestre) : null,
          group_name: r.group_name || null,
          force_replace: false,
        })));
        return;
      }

      // Há conflitos — monta estrutura de resolução com contexto enriquecido
      const dupMap = new Map(dups.map((d) => [d.ra, d]));
      const newConflicts: DuplicateConflict[] = validRows
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => dupMap.has(r.ra))
        .map(({ r, idx }) => {
          const dup = dupMap.get(r.ra)!;
          return {
            rowIndex: idx,
            ra: r.ra,
            rowName: r.name,
            rowPolo: r.polo,
            existingId: dup.id,
            existingName: dup.name,
            existingPolo: dup.polo,
            existingClassName: dup.class_name,
            existingProfessorName: dup.professor_name,
            existingGroupName: dup.group_name,
            isInScope: dup.is_in_scope,
            resolution: null,
            newRa: "",
          };
        });

      setConflicts(newConflicts);
      setImportStatus("resolving");
    } catch {
      setImportStatus("previewing");
      alert("Erro de rede ao verificar duplicatas. Tente novamente.");
    }
  }

  async function proceedAfterResolution() {
    const validRows = importRows.filter((r) => r.errors.length === 0);
    const conflictMap = new Map(conflicts.map((c) => [c.rowIndex, c]));

    const finalRows: {
      ra: string; name: string; polo: string | null; password: string;
      email: string | null; semestre: number | null; group_name: string | null;
      force_replace: boolean;
    }[] = [];

    validRows.forEach((r, idx) => {
      const conflict = conflictMap.get(idx);
      if (!conflict) {
        // Linha sem conflito — importa normalmente
        finalRows.push({
          ra: r.ra, name: r.name, polo: r.polo || null,
          password: r.password, email: r.email || null,
          semestre: r.semestre ? Number(r.semestre) : null,
          group_name: r.group_name || null,
          force_replace: false,
        });
        return;
      }

      if (conflict.resolution === "skip") {
        // Pula esta linha
        return;
      }
      if (conflict.resolution === "replace") {
        finalRows.push({
          ra: r.ra, name: r.name, polo: r.polo || null,
          password: r.password, email: r.email || null,
          semestre: r.semestre ? Number(r.semestre) : null,
          group_name: r.group_name || null,
          force_replace: true,
        });
        return;
      }
      if (conflict.resolution === "edit" && conflict.newRa.trim()) {
        finalRows.push({
          ra: conflict.newRa.trim(), name: r.name, polo: r.polo || null,
          password: r.password, email: r.email || null,
          semestre: r.semestre ? Number(r.semestre) : null,
          group_name: r.group_name || null,
          force_replace: false,
        });
      }
    });

    await runImport(finalRows);
  }

  async function runImport(students: {
    ra: string; name: string; polo: string | null; password: string;
    email: string | null; semestre: number | null; group_name: string | null;
    force_replace: boolean;
  }[]) {
    if (!students.length) {
      setImportResult({ imported: 0, updated: 0, skipped: 0, errors: [] });
      setImportStatus("done");
      return;
    }
    setImportStatus("importing");
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });
      const data: ImportResult & { error?: string; migration_needed?: boolean } = await res.json();

      if (!res.ok && data.migration_needed) {
        setImportStatus("previewing");
        alert(
          "⚠️ MIGRATION NECESSÁRIA\n\n" +
          "Execute no Supabase → SQL Editor:\n\n" +
          "ALTER TABLE students ADD COLUMN IF NOT EXISTS polo VARCHAR(100);\n" +
          "CREATE INDEX IF NOT EXISTS idx_students_polo ON students(polo);\n" +
          "NOTIFY pgrst, 'reload schema';\n\n" +
          "Depois reimporte o arquivo."
        );
        return;
      }

      if (!res.ok) {
        setImportStatus("previewing");
        alert(data.error || "Erro ao importar.");
        return;
      }

      setImportResult(data);
      setImportStatus("done");
      load();
    } catch {
      setImportStatus("previewing");
      alert("Erro de rede ao importar. Tente novamente.");
    }
  }

  function updateConflictResolution(rowIndex: number, resolution: DuplicateConflict["resolution"], newRa?: string) {
    setConflicts((prev) =>
      prev.map((c) =>
        c.rowIndex === rowIndex
          ? { ...c, resolution, newRa: newRa ?? c.newRa }
          : c
      )
    );
  }

  function closeImportModal() {
    setShowImportModal(false);
    setImportStatus("idle");
    setImportRows([]);
    setImportResult(null);
    setConflicts([]);
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const filtered = students.filter(
    (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.ra.includes(searchTerm)
  );
  const suggestions = form.group_name
    ? groups.filter((g) => g.name.toLowerCase().includes(form.group_name.toLowerCase()))
    : groups;

  const validCount   = importRows.filter((r) => r.errors.length === 0).length;
  const invalidCount = importRows.filter((r) => r.errors.length > 0).length;
  const warnCount    = importRows.filter((r) => r.errors.length === 0 && r.warnings.length > 0).length;

  // ── Pré-visualização inteligente de grupos ────────────────────────────────
  // Percorre as linhas válidas na ordem do arquivo, detecta grupos únicos e
  // mostra quais serão criados (com região sequencial) e quais já existem.
  const groupPreviews: GroupPreview[] = (() => {
    const validRows = importRows.filter((r) => r.errors.length === 0 && r.group_name.trim());
    const seen      = new Map<string, GroupPreview>(); // key = lowercased name
    let newGroupIdx = 0;

    for (const row of validRows) {
      const key  = row.group_name.trim().toLowerCase();
      if (seen.has(key)) {
        seen.get(key)!.studentCount++;
        continue;
      }

      const existing = groups.find((g) => g.name.toLowerCase() === key);
      if (existing) {
        seen.set(key, {
          name: existing.name,
          isNew: false,
          regionName: existing.region_name,
          regionNumber: 0,
          studentCount: 1,
          color: existing.color,
        });
      } else {
        const regionNumber = groups.length + newGroupIdx + 1;
        seen.set(key, {
          name: row.group_name.trim(),
          isNew: true,
          regionName: `Região ${regionNumber}`,
          regionNumber,
          studentCount: 1,
          color: NEW_GROUP_COLORS[newGroupIdx % NEW_GROUP_COLORS.length],
        });
        newGroupIdx++;
      }
    }
    return Array.from(seen.values());
  })();

  const newGroupsCount = groupPreviews.filter((g) => g.isNew).length;

  // Mapa nome → preview para uso na tabela de linhas
  const groupPreviewMap = new Map(
    groupPreviews.map((g) => [g.name.toLowerCase(), g])
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">Gestão de Alunos</h1>
          <p className="text-sm text-slate-400">{students.length} alunos cadastrados</p>
        </div>
      </div>

      {/* Filtro polo: agora é global (PoloSelector no layout). Apenas mostra contador quando filtrado */}
      {selectedPolo && (
        <p className="text-xs text-slate-500">
          Exibindo <strong className="text-cyan-400">{students.length}</strong> aluno{students.length !== 1 ? "s" : ""} de <strong className="text-cyan-400">{selectedPolo}</strong>
        </p>
      )}

      {/* Header botões — movido para após o filtro */}
      <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={load} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* ── Botão baixar modelo ── */}
          <Button variant="secondary" onClick={downloadTemplate}>
            <FileDown className="h-4 w-4" />
            Baixar Modelo Excel
          </Button>

          {/* ── Botão importar Excel ── */}
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            Importar Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button onClick={openNew}>
            <PlusCircle className="h-4 w-4" />
            Cadastrar aluno
          </Button>
        </div>

      {/* Instruções de importação */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3 text-sm text-slate-300">
        <FileUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div>
          <span className="font-semibold text-emerald-300">Importação em lote:</span>
          {" "}Baixe o <button onClick={downloadTemplate} className="underline text-emerald-300 hover:text-emerald-200">modelo Excel</button>,
          {" "}preencha com os dados dos alunos e clique em <strong className="text-white">Importar Excel</strong>.
          A senha padrão é <code className="rounded bg-white/10 px-1 text-xs">123456</code> se não informada.
        </div>
      </div>

      {/* Tabela de alunos */}
      <Panel title="Lista de Alunos" icon={Users}>
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou RA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Barra de ação em lote */}
        {selectedIds.size > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-xs font-black text-rose-400">
                {selectedIds.size}
              </div>
              <span className="text-sm font-semibold text-rose-300">
                {selectedIds.size} aluno{selectedIds.size !== 1 ? "s" : ""} selecionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                Cancelar seleção
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir selecionados
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {/* Coluna checkbox */}
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 accent-cyan-400"
                    title={selectedIds.size === filtered.length ? "Desmarcar todos" : "Selecionar todos"}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">RA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Nome</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-400 md:table-cell">Polo/Unidade</th>
                <th className="hidden px-4 py-3 text-center text-xs font-semibold text-slate-400 lg:table-cell">Semestre</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-400 lg:table-cell">Grupo / Região</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-slate-400 xl:table-cell">E-mail</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado ainda"}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isSelected = selectedIds.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-white/5 transition-colors ${isSelected ? "bg-cyan-500/5" : "hover:bg-white/5"}`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(s.id)}
                          className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 accent-cyan-400"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{s.ra}</td>
                      <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {(s as unknown as { polo?: string }).polo ? (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                            <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {(s as unknown as { polo?: string }).polo}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 italic">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-center lg:table-cell">
                        {s.semestre ? (
                          <span className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                            {s.semestre}º
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 italic">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
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
                      <td className="hidden px-4 py-3 text-slate-400 xl:table-cell">{s.email || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(s)} title="Editar">
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openTempPwModal(s)} title="Gerar nova senha temporária" className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10">
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteStudent(s)} title="Excluir">
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!students.length && (
          <div className="mt-4 rounded-2xl border border-dashed border-white/20 p-8 text-center">
            <Upload className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">
              Cadastre alunos individualmente ou importe via Excel.
            </p>
          </div>
        )}
      </Panel>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL — Pré-visualização da importação
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showImportModal}
        onClose={importStatus === "importing" || importStatus === "checking" ? () => {} : closeImportModal}
        title="Importar Alunos via Excel"
        size="lg"
        footer={
          importStatus === "done" ? (
            <Button onClick={closeImportModal}>Fechar</Button>
          ) : importStatus === "previewing" ? (
            <>
              <Button variant="secondary" onClick={closeImportModal}>Cancelar</Button>
              <Button onClick={confirmImport} disabled={validCount === 0}>
                <CheckCircle2 className="h-4 w-4" />
                Importar {validCount} aluno{validCount !== 1 ? "s" : ""}
              </Button>
            </>
          ) : importStatus === "resolving" ? (
            <>
              <Button variant="secondary" onClick={() => setImportStatus("previewing")}>
                ← Voltar
              </Button>
              <Button
                onClick={proceedAfterResolution}
                disabled={conflicts.some((c) => c.resolution === null || (c.resolution === "edit" && !c.newRa.trim()))}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar e Importar
              </Button>
            </>
          ) : null
        }
      >
        {/* ── Parsing ── */}
        {importStatus === "parsing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-slate-400">Lendo arquivo Excel…</p>
          </div>
        )}

        {/* ── Checking duplicates ── */}
        {importStatus === "checking" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-slate-400">Verificando RAs duplicados…</p>
          </div>
        )}

        {/* ── Importing ── */}
        {importStatus === "importing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-slate-400">Importando alunos… aguarde.</p>
          </div>
        )}

        {/* ── Resolving conflicts ── */}
        {importStatus === "resolving" && (() => {
          const inScope  = conflicts.filter((c) => c.isInScope);
          const outScope = conflicts.filter((c) => !c.isInScope);
          const pending  = conflicts.filter((c) => c.resolution === null).length;
          return (
          <div className="space-y-4">
            {/* ── Cabeçalho geral ── */}
            <div className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-rose-300">
                  {conflicts.length} RA{conflicts.length !== 1 ? "s" : ""} já existente{conflicts.length !== 1 ? "s" : ""} no sistema
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Escolha uma ação para cada conflito antes de prosseguir.{" "}
                  {outScope.length > 0 && (
                    <span className="text-amber-300">
                      {outScope.length} registro{outScope.length !== 1 ? "s" : ""} encontrado{outScope.length !== 1 ? "s" : ""} fora da sua turma.
                    </span>
                  )}
                </p>
              </div>
              {pending > 0 && (
                <span className="ml-auto shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-sm font-black text-rose-400">
                  {pending}
                </span>
              )}
            </div>

            {/* ── Aviso de registros fora do scope ── */}
            {outScope.length > 0 && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Registros fora da sua turma detectados
                </p>
                <p className="text-slate-400">
                  Os RAs marcados com <span className="text-amber-300 font-semibold">⚠ Externo</span> existem no sistema,
                  mas estão vinculados a outra turma ou professor e por isso <strong className="text-white">não aparecem na sua lista de alunos</strong>.
                  Use <span className="text-emerald-300 font-semibold">Atribuir à minha turma</span> para mover o registro para sua turma atual,
                  ou <span className="text-amber-300 font-semibold">Editar RA</span> para cadastrar com um RA diferente.
                </p>
              </div>
            )}

            {/* ── Legenda de ações ── */}
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-slate-500" />Pular — não importa</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Editar RA — usa RA diferente</span>
              {inScope.length > 0 && <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />Substituir — sobrescreve cadastro</span>}
              {outScope.length > 0 && <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />Atribuir à minha turma — move o registro</span>}
            </div>

            {/* ── Tabela de conflitos ── */}
            <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-white/10 bg-slate-900">
                    <th className="px-2.5 py-2 text-left font-semibold text-slate-500">Linha</th>
                    <th className="px-2.5 py-2 text-left font-semibold text-slate-500">RA</th>
                    <th className="px-2.5 py-2 text-left font-semibold text-slate-500">No arquivo</th>
                    <th className="px-2.5 py-2 text-left font-semibold text-slate-500">Cadastro encontrado</th>
                    <th className="px-2.5 py-2 text-left font-semibold text-slate-500">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map((c) => (
                    <tr
                      key={c.rowIndex}
                      className={`border-b border-white/5 transition-colors ${
                        c.resolution === null
                          ? c.isInScope ? "bg-rose-500/5" : "bg-amber-500/5"
                          : c.resolution === "skip"
                          ? "opacity-40 bg-white/[0.02]"
                          : c.resolution === "replace"
                          ? c.isInScope ? "bg-cyan-500/5" : "bg-emerald-500/5"
                          : "bg-amber-500/5"
                      }`}
                    >
                      {/* Linha */}
                      <td className="px-2.5 py-3 text-slate-500 font-mono">{c.rowIndex + 1}</td>

                      {/* RA */}
                      <td className="px-2.5 py-3">
                        <span className={`font-mono font-bold ${c.isInScope ? "text-rose-400" : "text-amber-400"}`}>{c.ra}</span>
                        {!c.isInScope && (
                          <span className="ml-1.5 inline-flex items-center rounded bg-amber-400/15 px-1 py-0.5 text-[9px] font-bold text-amber-300 tracking-wide">
                            ⚠ EXTERNO
                          </span>
                        )}
                      </td>

                      {/* Dados do arquivo */}
                      <td className="px-2.5 py-3 max-w-[120px]">
                        <p className="font-semibold text-white truncate">{c.rowName}</p>
                        {c.rowPolo && (
                          <span className="inline-flex items-center rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-300 mt-0.5">
                            {c.rowPolo}
                          </span>
                        )}
                      </td>

                      {/* Cadastro existente — com contexto enriquecido */}
                      <td className="px-2.5 py-3 max-w-[160px]">
                        <p className="font-semibold text-slate-300 truncate">{c.existingName}</p>
                        <div className="mt-0.5 space-y-0.5">
                          {c.existingPolo && (
                            <span className="inline-flex items-center rounded bg-slate-400/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                              Polo: {c.existingPolo}
                            </span>
                          )}
                          {c.existingClassName && (
                            <p className="text-[10px] text-slate-500 truncate">
                              Turma: <span className={c.isInScope ? "text-slate-400" : "text-amber-400/80"}>{c.existingClassName}</span>
                            </p>
                          )}
                          {c.existingGroupName && (
                            <p className="text-[10px] text-slate-500 truncate">Grupo: {c.existingGroupName}</p>
                          )}
                          {!c.isInScope && c.existingProfessorName && (
                            <p className="text-[10px] text-amber-400/70 truncate">Prof.: {c.existingProfessorName}</p>
                          )}
                          {!c.isInScope && !c.existingClassName && (
                            <p className="text-[10px] text-rose-400/70">Sem turma vinculada (órfão)</p>
                          )}
                        </div>
                      </td>

                      {/* Ação */}
                      <td className="px-2.5 py-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap gap-1">
                            {/* Pular — sempre disponível */}
                            <button
                              onClick={() => updateConflictResolution(c.rowIndex, "skip")}
                              className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all ${
                                c.resolution === "skip"
                                  ? "border-slate-400/50 bg-slate-500/20 text-slate-300"
                                  : "border-white/10 bg-white/5 text-slate-500 hover:border-slate-400/30 hover:text-slate-300"
                              }`}
                            >
                              Pular
                            </button>

                            {/* Editar RA — sempre disponível */}
                            <button
                              onClick={() => updateConflictResolution(c.rowIndex, "edit", c.newRa || "")}
                              className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all ${
                                c.resolution === "edit"
                                  ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                                  : "border-white/10 bg-white/5 text-slate-500 hover:border-amber-400/30 hover:text-amber-300"
                              }`}
                            >
                              Editar RA
                            </button>

                            {/* Substituir (in-scope) ou Atribuir à minha turma (out-of-scope) */}
                            <button
                              onClick={() => updateConflictResolution(c.rowIndex, "replace")}
                              className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all ${
                                c.resolution === "replace"
                                  ? c.isInScope
                                    ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300"
                                    : "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                                  : c.isInScope
                                  ? "border-white/10 bg-white/5 text-slate-500 hover:border-cyan-400/30 hover:text-cyan-300"
                                  : "border-white/10 bg-white/5 text-slate-500 hover:border-emerald-400/30 hover:text-emerald-300"
                              }`}
                            >
                              {c.isInScope ? "Substituir" : "Atribuir à minha turma"}
                            </button>
                          </div>

                          {/* Input de RA quando editar */}
                          {c.resolution === "edit" && (
                            <input
                              type="text"
                              placeholder="Novo RA..."
                              value={c.newRa}
                              onChange={(e) => updateConflictResolution(c.rowIndex, "edit", e.target.value)}
                              className={`w-full rounded-lg border px-2 py-1 text-[11px] font-mono text-white bg-white/5 focus:outline-none placeholder:text-slate-600 ${
                                c.newRa.trim() ? "border-amber-400/40 focus:border-amber-400/70" : "border-rose-400/40 focus:border-rose-400/70"
                              }`}
                            />
                          )}
                          {c.resolution === "replace" && (
                            <p className={`text-[10px] ${c.isInScope ? "text-cyan-400/70" : "text-emerald-400/70"}`}>
                              {c.isInScope
                                ? "Sobrescreve: nome, polo, email, semestre, grupo"
                                : "Reatribui à sua turma ativa e atualiza todos os dados"}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Contador pendentes */}
            {pending > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {pending} conflito{pending !== 1 ? "s" : ""} aguardando resolução
              </div>
            )}
          </div>
          );
        })()}

        {/* ── Done ── */}
        {importStatus === "done" && importResult && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold text-emerald-300 text-base">Importação concluída!</p>
                <p className="text-sm text-slate-300">
                  {importResult.imported > 0 && (
                    <><strong className="text-white">{importResult.imported}</strong> aluno{importResult.imported !== 1 ? "s" : ""} cadastrado{importResult.imported !== 1 ? "s" : ""}. </>
                  )}
                  {(importResult.updated ?? 0) > 0 && (
                    <><strong className="text-cyan-300">{importResult.updated}</strong> polo{(importResult.updated ?? 0) !== 1 ? "s" : ""} atualizado{(importResult.updated ?? 0) !== 1 ? "s" : ""}. </>
                  )}
                  {importResult.skipped > 0 && (
                    <><strong className="text-amber-300">{importResult.skipped}</strong> ignorado{importResult.skipped !== 1 ? "s" : ""}.</>
                  )}
                </p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
                <p className="text-xs font-bold text-amber-300">Detalhes dos ignorados:</p>
                {importResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-slate-400">
                    <span className="font-mono text-amber-400">{e.ra}</span> — {e.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Preview ── */}
        {importStatus === "previewing" && (
          <div className="space-y-4">

            {/* Sumário de alunos */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-center">
                <p className="text-2xl font-black text-emerald-400">{validCount}</p>
                <p className="text-[11px] text-slate-400">válido{validCount !== 1 ? "s" : ""}</p>
              </div>
              <div className={`rounded-xl border p-3 text-center ${warnCount > 0 ? "border-amber-400/20 bg-amber-500/10" : "border-white/10 bg-white/5"}`}>
                <p className={`text-2xl font-black ${warnCount > 0 ? "text-amber-400" : "text-slate-600"}`}>{warnCount}</p>
                <p className="text-[11px] text-slate-400">com aviso{warnCount !== 1 ? "s" : ""}</p>
              </div>
              <div className={`rounded-xl border p-3 text-center ${invalidCount > 0 ? "border-rose-400/20 bg-rose-500/10" : "border-white/10 bg-white/5"}`}>
                <p className={`text-2xl font-black ${invalidCount > 0 ? "text-rose-400" : "text-slate-600"}`}>{invalidCount}</p>
                <p className="text-[11px] text-slate-400">com erro{invalidCount !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {invalidCount > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Linhas com erro <strong>não serão importadas</strong>. Corrija o arquivo e importe novamente.
              </div>
            )}

            {/* ── Painel de grupos inteligente ── */}
            {groupPreviews.length > 0 && (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                <div className="mb-2.5 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-cyan-400" />
                  <p className="text-xs font-bold text-cyan-300">
                    Grupos detectados no arquivo
                    {newGroupsCount > 0 && (
                      <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        {newGroupsCount} novo{newGroupsCount !== 1 ? "s" : ""} serão criados
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupPreviews.map((gp, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                        gp.isNew
                          ? "border-emerald-400/25 bg-emerald-500/8"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      {/* Bolinha de cor */}
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-r ${gp.color}`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{gp.name}</span>
                          {gp.isNew ? (
                            <span className="rounded border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
                              novo
                            </span>
                          ) : (
                            <span className="rounded border border-slate-600/50 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                              existente
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {gp.regionName}
                          <span className="ml-1.5 text-slate-600">·</span>
                          <span className="ml-1.5 text-slate-500">{gp.studentCount} aluno{gp.studentCount !== 1 ? "s" : ""}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {newGroupsCount > 0 && (
                  <p className="mt-2.5 text-[11px] text-slate-500">
                    Os grupos novos recebem regiões sequenciais (<span className="text-cyan-400">Região {groups.length + 1}</span>
                    {newGroupsCount > 1 && <> a <span className="text-cyan-400">Região {groups.length + newGroupsCount}</span></>})
                    {" "}na ordem em que aparecem no arquivo.
                  </p>
                )}
              </div>
            )}

            {/* Tabela de prévia */}
            <div className="max-h-[300px] overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-2.5 py-2 text-left text-slate-500 font-semibold">#</th>
                    <th className="px-2.5 py-2 text-left text-slate-500 font-semibold">Status</th>
                    <th className="px-2.5 py-2 text-left text-slate-500 font-semibold">RA</th>
                    <th className="px-2.5 py-2 text-left text-slate-500 font-semibold">Nome</th>
                    <th className="px-2.5 py-2 text-left text-slate-500 font-semibold">Polo</th>
                    <th className="px-2.5 py-2 text-center text-slate-500 font-semibold">Sem.</th>
                    <th className="px-2.5 py-2 text-left text-slate-500 font-semibold">Grupo → Região</th>
                    <th className="px-2.5 py-2 text-left text-slate-500 font-semibold">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row, i) => {
                    const hasError = row.errors.length > 0;
                    const hasWarn  = !hasError && row.warnings.length > 0;
                    const gp       = row.group_name ? groupPreviewMap.get(row.group_name.trim().toLowerCase()) : undefined;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-white/5 ${
                          hasError ? "bg-rose-500/5"
                          : hasWarn ? "bg-amber-500/5"
                          : i % 2 === 0 ? "" : "bg-white/[0.02]"
                        }`}
                      >
                        <td className="px-2.5 py-2 text-slate-600">{i + 1}</td>
                        <td className="px-2.5 py-2">
                          {hasError ? (
                            <XCircle className="h-3.5 w-3.5 text-rose-400" />
                          ) : hasWarn ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </td>
                        <td className="px-2.5 py-2 font-mono font-bold text-cyan-400">{row.ra || <span className="text-rose-400 italic">vazio</span>}</td>
                        <td className="px-2.5 py-2 text-white max-w-[120px] truncate">{row.name || <span className="text-rose-400 italic">vazio</span>}</td>
                        <td className="px-2.5 py-2 max-w-[100px]">
                          {row.polo ? (
                            <span className="inline-flex items-center rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 truncate max-w-full">{row.polo}</span>
                          ) : (
                            <span className="text-rose-400 italic text-[10px]">vazio</span>
                          )}
                        </td>
                        <td className="px-2.5 py-2 text-center text-slate-400">{row.semestre ? `${row.semestre}º` : "—"}</td>
                        <td className="px-2.5 py-2 max-w-[160px]">
                          {gp ? (
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${gp.color}`} />
                              <div>
                                <p className="text-white font-semibold truncate">{gp.name}</p>
                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                  {gp.regionName}
                                  {gp.isNew && <span className="text-emerald-400 font-bold">✦ novo</span>}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">sem grupo</span>
                          )}
                        </td>
                        <td className="px-2.5 py-2">
                          {[...row.errors, ...row.warnings].map((msg, j) => (
                            <p key={j} className={`leading-snug ${row.errors.includes(msg) ? "text-rose-400" : "text-amber-400"}`}>
                              {msg}
                            </p>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500">
              Senha padrão <code className="rounded bg-white/10 px-1">123456</code> usada para linhas sem senha.
              Regiões atribuídas automaticamente na ordem de aparecimento no arquivo.
            </p>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL — Cadastro / Edição individual
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setShowSuggestions(false); setSaveError(null); setRaUpdated(false); }}
        title={editStudent ? "Editar Aluno" : "Cadastrar Novo Aluno"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); setShowSuggestions(false); setSaveError(null); setRaUpdated(false); }}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              {editStudent ? "Salvar alterações" : "Cadastrar aluno"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* RA success / error messages */}
          {raUpdated && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-sm text-emerald-300">
                RA atualizado com sucesso! O aluno deve usar o novo RA para fazer login.
              </p>
            </div>
          )}
          {saveError && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <p className="text-sm text-rose-300">{saveError}</p>
            </div>
          )}

          {/* RA + Nome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                RA <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={form.ra}
                onChange={(e) => { setForm({ ...form, ra: e.target.value }); setSaveError(null); setRaUpdated(false); }}
                placeholder="Ex: 2024001"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none bg-white/5 focus:border-amber-400/50 ${editStudent ? "border-amber-400/40" : "border-white/10 focus:border-cyan-400/50"}`}
              />
              {editStudent ? (
                <p className="text-[11px] text-amber-400">Alterar o RA afeta o login do aluno</p>
              ) : (
                <p className="text-[11px] text-slate-500">Número único de matrícula</p>
              )}
            </div>
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

          {/* Semestre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Semestre atual</label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {SEMESTRES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, semestre: form.semestre === String(s) ? "" : String(s) })}
                  className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-sm font-bold transition-all ${
                    form.semestre === String(s)
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/10"
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base font-black">{s}º</span>
                  <span className="text-[9px] font-medium opacity-70">sem.</span>
                </button>
              ))}
            </div>
            {!form.semestre ? (
              <p className="text-[11px] text-slate-500">Nenhum semestre selecionado — clique em um para selecionar</p>
            ) : (
              <p className="text-[11px] text-cyan-400">
                {form.semestre}º Semestre selecionado
                <button type="button" onClick={() => setForm({ ...form, semestre: "" })} className="ml-2 text-slate-500 underline hover:text-slate-300">
                  limpar
                </button>
              </p>
            )}
          </div>

          {/* Polo / Unidade — obrigatório */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Polo / Unidade <span className="text-rose-400">*</span>
            </label>
            {professorPolos.length > 0 ? (
              <select
                value={form.polo}
                onChange={(e) => setForm({ ...form, polo: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="">— Selecione o polo —</option>
                {professorPolos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.polo}
                onChange={(e) => setForm({ ...form, polo: e.target.value })}
                placeholder="Ex: Polo Norte, EAD, Presencial..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            )}
            {!form.polo && (
              <p className="mt-1 text-[11px] text-rose-400">Campo obrigatório</p>
            )}
          </div>

          {/* Grupo */}
          <div className="relative">
            <Input
              label="Grupo"
              value={form.group_name}
              onChange={(e) => { setForm({ ...form, group_name: e.target.value }); setShowSuggestions(true); }}
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
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/15 bg-slate-900 shadow-2xl">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Grupos existentes</p>
                {suggestions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onMouseDown={() => { setForm({ ...form, group_name: g.name }); setShowSuggestions(false); }}
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
            Caso seja um nome novo, o grupo é criado automaticamente com uma região sequencial.
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL — Exclusão em lote
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showBulkModal}
        onClose={bulkDeleting ? () => {} : () => setShowBulkModal(false)}
        title="Excluir Alunos Selecionados"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowBulkModal(false)} disabled={bulkDeleting}>
              Cancelar
            </Button>
            <Button
              onClick={bulkDelete}
              disabled={bulkDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold border-rose-500"
            >
              {bulkDeleting ? (
                <><LoadingSpinner size="sm" /> Excluindo…</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Excluir {selectedIds.size} aluno{selectedIds.size !== 1 ? "s" : ""}</>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-rose-400" />
            <div>
              <p className="font-bold text-white">Esta ação não pode ser desfeita!</p>
              <p className="mt-1 text-sm text-slate-300">
                Você está prestes a excluir permanentemente{" "}
                <strong className="text-rose-300">{selectedIds.size} aluno{selectedIds.size !== 1 ? "s" : ""}</strong>.
                Os alunos excluídos perderão acesso ao sistema.
              </p>
            </div>
          </div>
          {/* Lista dos alunos que serão excluídos */}
          {selectedIds.size <= 10 && (
            <div className="max-h-48 overflow-auto rounded-xl border border-white/10 bg-white/5">
              {filtered
                .filter((s) => selectedIds.has(s.id))
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-3 border-b border-white/5 px-3 py-2 last:border-0">
                    <span className="font-mono text-xs font-bold text-cyan-400">{s.ra}</span>
                    <span className="text-sm text-white">{s.name}</span>
                    {(s as unknown as { polo?: string }).polo && (
                      <span className="ml-auto text-xs text-slate-500">{(s as unknown as { polo?: string }).polo}</span>
                    )}
                  </div>
                ))}
            </div>
          )}
          {selectedIds.size > 10 && (
            <p className="text-sm text-slate-400 text-center">
              {selectedIds.size} alunos selecionados para exclusão.
            </p>
          )}
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL — Gerar senha temporária
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!tempPwStudent}
        onClose={tempPwLoading ? () => {} : closeTempPwModal}
        title="Gerar Senha Temporária"
        size="sm"
        footer={
          tempPwValue ? (
            <Button onClick={closeTempPwModal}>Fechar</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeTempPwModal} disabled={tempPwLoading}>
                Cancelar
              </Button>
              <Button
                onClick={generateTempPassword}
                loading={tempPwLoading}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                <KeyRound className="h-4 w-4" />
                Gerar nova senha
              </Button>
            </>
          )
        }
      >
        <div className="space-y-4">
          {/* Info do aluno */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
            <KeyRound className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-white">{tempPwStudent?.name}</p>
              <p className="text-xs text-slate-400 font-mono">RA {tempPwStudent?.ra}</p>
            </div>
          </div>

          {/* Erro */}
          {tempPwError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {tempPwError}
            </div>
          )}

          {/* Senha gerada */}
          {tempPwValue ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <p className="text-sm text-emerald-300 font-semibold">Senha gerada com sucesso!</p>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/30 p-4">
                <p className="mb-1.5 text-xs font-semibold text-slate-400">Senha temporária:</p>
                <p className="font-mono text-2xl font-black tracking-[0.25em] text-amber-300">
                  {tempPwValue}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(tempPwValue);
                  setTempPwCopied(true);
                  setTimeout(() => setTempPwCopied(false), 2000);
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  tempPwCopied
                    ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                    : "border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                }`}
              >
                {tempPwCopied ? (
                  <><CheckCircle2 className="h-4 w-4" /> Copiado!</>
                ) : (
                  <><Eye className="h-4 w-4" /> Copiar senha</>
                )}
              </button>

              <div className="rounded-xl border border-rose-400/15 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Atenção
                </p>
                <p className="text-slate-400">
                  Esta senha é exibida <strong className="text-white">apenas uma vez</strong>.
                  Copie e envie ao aluno antes de fechar esta janela.
                  No primeiro acesso, o aluno será obrigado a criar uma senha pessoal.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Como funciona:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Uma senha temporária aleatória será gerada</li>
                <li>O aluno deverá usá-la no próximo login</li>
                <li>No primeiro acesso, será obrigado a criar uma senha pessoal</li>
                <li>A senha temporária não será exibida novamente após fechar</li>
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
