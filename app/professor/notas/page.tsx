"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  GraduationCap, BarChart3, FileText, Download, Printer,
  AlertTriangle, CheckCircle2, RefreshCw, ChevronDown, ChevronUp,
  ChevronsUpDown, Info, Sliders, Save, X, Edit3,
} from "lucide-react";
import type { GradeAdjustment } from "@/types";
import { usePoloContext } from "@/contexts/PoloContext";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  DEFAULT_GRADE_SCALE,
  DEFAULT_WEIGHTS,
  buildGradeScale,
  getScoreGrade,
} from "@/lib/simulation/scoring";
import type { GradeLevel } from "@/lib/simulation/scoring";
import type { Round, StoredResult, RankedResult, Student } from "@/types";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type EditableGradeRow = Omit<GradeLevel, "color">;

// ── Constantes ────────────────────────────────────────────────────────────────
const GRADE_COLORS = DEFAULT_GRADE_SCALE.map((g) => g.color);

const BG_MAP: Record<string, string> = {
  "text-emerald-400": "bg-emerald-500/10 border-emerald-500/30",
  "text-cyan-400":    "bg-cyan-500/10 border-cyan-500/30",
  "text-sky-400":     "bg-sky-500/10 border-sky-500/30",
  "text-amber-400":   "bg-amber-500/10 border-amber-500/30",
  "text-orange-400":  "bg-orange-500/10 border-orange-500/30",
  "text-rose-400":    "bg-rose-500/10 border-rose-500/30",
};

// Definição dos indicadores de pontuação
const SCORE_ROWS = [
  { key: "currentRatio",   label: "Liquidez Corrente",  color: "text-cyan-400",    formula: "min(LC × 20, 100) × peso"    },
  { key: "quickRatio",     label: "Liquidez Seca",      color: "text-cyan-400",    formula: "min(LS × 22, 100) × peso"    },
  { key: "immediateRatio", label: "Liquidez Imediata",  color: "text-cyan-400",    formula: "min(LI × 30, 100) × peso"    },
  { key: "roa",            label: "ROA",                color: "text-emerald-400", formula: "min(ROA × 5, 100) × peso"    },
  { key: "netMargin",      label: "Margem Líquida",     color: "text-emerald-400", formula: "min(ML × 3, 100) × peso"     },
  { key: "cashCycle",      label: "Ciclo Financeiro",   color: "text-amber-400",   formula: "max(0, 100 − Ciclo) × peso"  },
] as const;

// ── Botões de exportação reutilizáveis ────────────────────────────────────────
function ExportBtn({ onClick, color, icon: Icon, label }: {
  onClick: () => void;
  color: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${color}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 1 — Editor da Escala de Notas
// ═══════════════════════════════════════════════════════════════════════════════
function GradeScaleEditor({
  initialRows,
  onSaved,
}: {
  initialRows: EditableGradeRow[];
  onSaved: () => void;
}) {
  const defaultRows: EditableGradeRow[] = DEFAULT_GRADE_SCALE.map(({ color: _c, ...g }) => g);
  const [rows, setRows] = useState<EditableGradeRow[]>(initialRows.length ? initialRows : defaultRows);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  useEffect(() => {
    if (initialRows.length) setRows(initialRows);
  }, [initialRows]);

  function setRow(idx: number, patch: Partial<EditableGradeRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setSavedMsg(""); setErrorMsg("");
  }

  function restore() {
    setRows(defaultRows);
    setSavedMsg(""); setErrorMsg("");
  }

  const scores       = rows.map((r) => Number(r.minScore));
  const isDescending = scores.every((s, i) => i === 0 || s < scores[i - 1]);
  const notas        = rows.map((r) => Number(r.nota));
  const notasOk      = notas.every((n) => n >= 0 && n <= 10);
  const lastIsZero   = scores[scores.length - 1] === 0;
  const namesOk      = rows.every((r) => r.grade.trim() && r.label.trim());
  const isValid      = isDescending && notasOk && lastIsZero && namesOk;

  async function save() {
    if (!isValid) { setErrorMsg("Verifique os erros antes de salvar."); return; }
    setSaving(true); setErrorMsg(""); setSavedMsg("");
    const res = await fetch("/api/classes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade_scale: rows }),
    });
    const json = await res.json();
    if (!res.ok) {
      const msg = json.error || "Erro ao salvar.";
      if (msg.includes("grade_scale")) setMigrationNeeded(true);
      setErrorMsg(msg);
    } else {
      setSavedMsg("Escala salva! As notas dos alunos serão atualizadas.");
      onSaved();
    }
    setSaving(false);
  }

  return (
    <Panel
      title="Escala de Notas"
      icon={GraduationCap}
      subtitle="Defina os limiares de score e as notas correspondentes a cada grau"
    >
      <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4 text-sm">
        <p className="mb-1.5 font-bold text-cyan-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Cada nível define o <strong className="text-white">score mínimo</strong> para obter aquele grau e nota.</li>
          <li>• Os scores devem ser <strong className="text-white">decrescentes</strong> e o último nível deve iniciar em <strong className="text-white">0</strong>.</li>
          <li>• As notas (0–10) aparecem nos relatórios e no painel do aluno.</li>
        </ul>
      </div>

      {migrationNeeded && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <p className="font-bold text-rose-300">Migração necessária</p>
          </div>
          <p className="mb-2 text-slate-300">Execute no Supabase:</p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">
{`ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade_scale JSONB;`}
          </pre>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2.5 text-left">Nível</th>
              <th className="py-2.5 px-2 text-center">Score ≥</th>
              <th className="py-2.5 px-2 text-center">Grau</th>
              <th className="py-2.5 px-2 text-left">Conceito</th>
              <th className="py-2.5 px-2 text-center">Nota (0–10)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const color    = GRADE_COLORS[i] ?? "text-slate-400";
              const scoreErr = i < rows.length - 1 && Number(row.minScore) <= Number(rows[i + 1]?.minScore);
              const lastErr  = i === rows.length - 1 && Number(row.minScore) !== 0;
              const notaErr  = Number(row.nota) < 0 || Number(row.nota) > 10;
              return (
                <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                  <td className="py-2.5 pr-2">
                    <span className={`text-base font-black ${color}`}>{i + 1}º</span>
                  </td>
                  <td className="py-2 px-2">
                    {i === rows.length - 1 ? (
                      <div className="flex items-center justify-center">
                        <span className="rounded bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-400 select-none">0</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="number" min={1} max={100} value={row.minScore}
                          onChange={(e) => setRow(i, { minScore: Number(e.target.value) })}
                          className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold text-white focus:outline-none ${
                            scoreErr ? "border-rose-400/60 bg-rose-900/20" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
                          }`}
                        />
                        {scoreErr && <span className="text-[9px] text-rose-400">Deve ser &gt; {rows[i + 1]?.minScore}</span>}
                      </div>
                    )}
                    {lastErr && <span className="text-[9px] text-rose-400">Deve ser 0</span>}
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text" maxLength={6} value={row.grade}
                      onChange={(e) => setRow(i, { grade: e.target.value.toUpperCase() })}
                      className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-black focus:outline-none ${color} ${
                        !row.grade.trim() ? "border-rose-400/60 bg-rose-900/20" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
                      }`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text" maxLength={20} value={row.label}
                      onChange={(e) => setRow(i, { label: e.target.value })}
                      className={`w-full min-w-[100px] rounded-lg border px-2 py-1.5 text-sm text-white focus:outline-none ${
                        !row.label.trim() ? "border-rose-400/60 bg-rose-900/20" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
                      }`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <input
                        type="number" min={0} max={10} step={0.1} value={row.nota}
                        onChange={(e) => setRow(i, { nota: Number(e.target.value) })}
                        className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold text-white focus:outline-none ${
                          notaErr ? "border-rose-400/60 bg-rose-900/20" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
                        }`}
                      />
                      {notaErr && <span className="text-[9px] text-rose-400">0 – 10</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pré-visualização */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Pré-visualização</p>
        <div className="flex flex-wrap gap-2">
          {rows.map((row, i) => {
            const color = GRADE_COLORS[i] ?? "text-slate-400";
            return (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                <p className={`text-sm font-black ${color}`}>{row.grade || "—"}</p>
                <p className="text-[10px] text-slate-400">{row.label || "—"}</p>
                <p className="text-xs font-bold text-white">{Number(row.nota).toFixed(1)}</p>
                <p className="text-[9px] text-slate-600">≥ {row.minScore}</p>
              </div>
            );
          })}
        </div>
      </div>

      {!isValid && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            {!isDescending && <p>• Os scores mínimos devem ser decrescentes.</p>}
            {!lastIsZero  && <p>• O último nível deve ter score mínimo = 0.</p>}
            {!notasOk     && <p>• Notas devem estar entre 0 e 10.</p>}
            {!namesOk     && <p>• Grau e Conceito não podem estar vazios.</p>}
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <strong>Erro:</strong> {errorMsg}
        </div>
      )}
      {savedMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedMsg}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={save} loading={saving} disabled={!isValid || migrationNeeded}>
          <CheckCircle2 className="h-4 w-4" />
          Salvar Escala
        </Button>
        <Button variant="ghost" size="sm" onClick={restore} disabled={saving}>
          <RefreshCw className="h-4 w-4" />
          Restaurar Padrão
        </Button>
      </div>
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 2 — Metodologia de Pontuação (editável)
// ═══════════════════════════════════════════════════════════════════════════════
type WeightKey = (typeof SCORE_ROWS)[number]["key"];
type WeightVals = Record<WeightKey, string>;

function toStrVals(w: Record<string, number>): WeightVals {
  const r = {} as WeightVals;
  for (const row of SCORE_ROWS) {
    r[row.key] = String(Math.round((w[row.key] ?? DEFAULT_WEIGHTS[row.key]) * 100));
  }
  return r;
}

function MetodologiaPontuacao({
  scoreWeights,
  turmaName,
  onWeightsSaved,
}: {
  scoreWeights: Record<string, number>;
  turmaName: string;
  onWeightsSaved: () => void;
}) {
  const initialVals = toStrVals({ ...DEFAULT_WEIGHTS, ...scoreWeights });
  const [vals, setVals]       = useState<WeightVals>(initialVals);
  const [saving, setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sincroniza quando scoreWeights mudam (ex.: após reload)
  useEffect(() => {
    setVals(toStrVals({ ...DEFAULT_WEIGHTS, ...scoreWeights }));
  }, [scoreWeights]); // eslint-disable-line react-hooks/exhaustive-deps

  function setVal(key: WeightKey, v: string) {
    setVals((prev) => ({ ...prev, [key]: v }));
    setSavedMsg(""); setErrorMsg("");
  }

  function restore() {
    setVals(toStrVals(DEFAULT_WEIGHTS));
    setSavedMsg(""); setErrorMsg("");
  }

  const totalPeso = SCORE_ROWS.reduce((acc, r) => acc + (Number(vals[r.key]) || 0), 0);
  const isValid   = totalPeso === 100;

  async function save() {
    if (!isValid) { setErrorMsg("A soma dos pesos deve totalizar 100%."); return; }
    setSaving(true); setErrorMsg(""); setSavedMsg("");
    const weights: Record<WeightKey, number> = {} as Record<WeightKey, number>;
    for (const r of SCORE_ROWS) weights[r.key] = Number(vals[r.key]) / 100;
    const res = await fetch("/api/classes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score_weights: weights }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(json.error || "Erro ao salvar.");
    } else {
      setSavedMsg("Pesos salvos! Reprocesse as rodadas para aplicar os novos valores.");
      onWeightsSaved();
    }
    setSaving(false);
  }

  // Monta rows com valor atual dos inputs para PDF/Excel/Print
  const rows = SCORE_ROWS.map((r) => ({
    ...r,
    peso: Number(vals[r.key]) || 0,
  }));

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFontSize(10); doc.setTextColor(8, 145, 178);
    doc.text(turmaName, 14, 12);
    doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text("Metodologia de Pontuação", 14, 19);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [["Indicador", "Peso (%)", "Fórmula"]],
      body: [
        ...rows.map((r) => [r.label, `${r.peso}%`, r.formula]),
        ["Bônus Market Share", "+5%", "(Receita ÷ Maior Receita) × 100 × 0,05"],
        ["TOTAL", "100% + 5%", "Score máximo teórico: 105 pts"],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: { 1: { halign: "center", fontStyle: "bold" } },
    });

    doc.setFontSize(8); doc.setTextColor(100);
    const noteY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    doc.text(
      "ROA e Margem Líquida negativos valem zero. Bônus proporcional à receita vs. maior receita da rodada.",
      14, noteY, { maxWidth: 182 }
    );

    doc.save(`metodologia-pontuacao.pdf`);
  }

  async function exportExcel() {
    const { exportToExcel } = await import("@/lib/utils/exportExcel");
    const excelRows = [
      ...rows.map((r) => ({
        "Indicador": r.label,
        "Peso (%)": r.peso,
        "Fórmula": r.formula,
      })),
      { "Indicador": "Bônus Market Share", "Peso (%)": 5, "Fórmula": "(Receita ÷ Maior Receita) × 100 × 0,05" },
      { "Indicador": "TOTAL", "Peso (%)": "100% + 5%", "Fórmula": "Score máximo teórico: 105 pts" },
    ];
    await exportToExcel(excelRows, "metodologia-pontuacao", "Metodologia");
  }

  function imprimir() {
    const win = window.open("", "_blank", "width=860,height=640");
    if (!win) return;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${turmaName} — Metodologia de Pontuação</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 20px; }
    h1 { font-size: 13px; color: #0891b2; margin: 0 0 2px 0; font-weight: 600; }
    h2 { font-size: 15px; margin: 0 0 4px 0; }
    p.sub { font-size: 10px; color: #64748b; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0891b2; color: #fff; }
    th, td { padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; }
    .center { text-align: center; font-weight: bold; }
    tbody tr:nth-child(even) { background: #f1f5f9; }
    tfoot tr { background: #e2e8f0; font-weight: bold; }
    p.obs { font-size: 10px; color: #64748b; margin-top: 10px; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>${turmaName}</h1>
  <h2>Metodologia de Pontuação</h2>
  <p class="sub">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
  <table>
    <thead><tr><th>Indicador</th><th class="center">Peso (%)</th><th>Fórmula</th></tr></thead>
    <tbody>
      ${rows.map((r) => `<tr><td>${r.label}</td><td class="center">${r.peso}%</td><td>${r.formula}</td></tr>`).join("")}
      <tr><td>Bônus Market Share</td><td class="center">+5%</td><td>(Receita ÷ Maior Receita) × 100 × 0,05</td></tr>
    </tbody>
    <tfoot><tr><td>TOTAL</td><td class="center">100% + 5%</td><td>Score máximo teórico: 105 pts</td></tr></tfoot>
  </table>
  <p class="obs">ROA e Margem Líquida negativos valem zero. O bônus de market share é proporcional à receita da empresa em relação à maior receita da rodada.</p>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  }

  return (
    <Panel
      title="Metodologia de Pontuação"
      icon={Sliders}
      subtitle="Ajuste os pesos dos indicadores — a soma deve totalizar exatamente 100%"
      actions={
        <div className="flex items-center gap-2">
          <ExportBtn onClick={exportPDF}   color="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"           icon={FileText} label="PDF"      />
          <ExportBtn onClick={exportExcel} color="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" icon={Download} label="Excel"    />
          <ExportBtn onClick={imprimir}    color="border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20"         icon={Printer}  label="Imprimir" />
        </div>
      }
    >
      {/* Instrução */}
      <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4 text-sm">
        <p className="mb-1.5 font-bold text-cyan-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Edite o <strong className="text-white">Peso (%)</strong> de cada indicador conforme a metodologia da sua disciplina.</li>
          <li>• A <strong className="text-white">soma obrigatória é 100%</strong>. O bônus de market share (+5%) é fixo e não entra nesta conta.</li>
          <li>• Após salvar, <strong className="text-white">reprocesse as rodadas</strong> para aplicar os novos pesos nos resultados.</li>
        </ul>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <th className="px-3 py-2.5 text-left">Indicador</th>
              <th className="px-3 py-2.5 text-center">Peso (%)</th>
              <th className="px-3 py-2.5 text-center">Padrão</th>
              <th className="px-3 py-2.5 text-left">Fórmula de Cálculo</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_ROWS.map((r, i) => (
              <tr key={r.key} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                <td className={`px-3 py-2.5 font-semibold ${r.color}`}>{r.label}</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min={0} max={100} step={1}
                      value={vals[r.key]}
                      onChange={(e) => setVal(r.key, e.target.value)}
                      className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm font-bold text-white focus:border-cyan-400/50 focus:outline-none"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-slate-500">
                  {Math.round(DEFAULT_WEIGHTS[r.key] * 100)}%
                </td>
                <td className="px-3 py-2.5 font-mono text-[12px] text-slate-300">{r.formula}</td>
              </tr>
            ))}
            {/* Bônus fixo (não editável) */}
            <tr className="border-b border-white/5 bg-violet-500/5">
              <td className="px-3 py-2.5 font-semibold text-violet-400">Bônus Market Share</td>
              <td className="px-3 py-2.5 text-center">
                <span className="rounded-lg border border-violet-500/30 bg-violet-500/20 px-3 py-1 text-xs font-black text-violet-300">+5% fixo</span>
              </td>
              <td className="px-3 py-2.5 text-center text-xs text-slate-500">+5%</td>
              <td className="px-3 py-2.5 font-mono text-[12px] text-slate-300">(Receita ÷ Maior Receita) × 100 × 0,05</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-white/5">
              <td className="px-3 py-2.5 font-black text-white">TOTAL</td>
              <td className="px-3 py-2.5 text-center">
                <span className={`text-base font-black ${isValid ? "text-emerald-400" : "text-rose-400"}`}>
                  {totalPeso}%
                </span>
                <span className="ml-1 text-xs text-violet-400">+ 5%</span>
              </td>
              <td className="px-3 py-2.5 text-center text-xs text-slate-500">100%</td>
              <td className="px-3 py-2.5 text-xs text-slate-500">
                Score máximo teórico:{" "}
                <span className="font-semibold text-cyan-300">105 pts</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Validação */}
      {!isValid && totalPeso > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          A soma dos pesos deve totalizar <strong className="ml-1">100%</strong>.
          Atualmente: <strong className="ml-1">{totalPeso}%</strong>
          {totalPeso < 100
            ? ` (faltam ${100 - totalPeso}%)`
            : ` (sobram ${totalPeso - 100}%)`}
        </div>
      )}
      {isValid && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Soma válida — 100%. Clique em <strong className="mx-1">Salvar Pesos</strong> para aplicar.
        </div>
      )}
      {errorMsg && (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <strong>Erro:</strong> {errorMsg}
        </div>
      )}
      {savedMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedMsg}
        </div>
      )}

      {/* Botões */}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={save} loading={saving} disabled={!isValid}>
          <CheckCircle2 className="h-4 w-4" />
          Salvar Pesos
        </Button>
        <Button variant="ghost" size="sm" onClick={restore} disabled={saving}>
          <RefreshCw className="h-4 w-4" />
          Restaurar Padrão
        </Button>
      </div>

      {/* Info */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-[12px] leading-relaxed text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <span>
          ROA e Margem Líquida <strong className="text-white">negativos valem zero</strong> — não penalizam, mas também não pontuam.
          O bônus de market share é proporcional à receita da empresa em relação à que mais vendeu na rodada.
        </span>
      </div>
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 3 — Classificação Acadêmica por Rodada
// ═══════════════════════════════════════════════════════════════════════════════
function ClassificacaoRodada({
  rounds,
  gradeScale,
  turmaName,
  poloParam = "",
}: {
  rounds: Round[];
  gradeScale: GradeLevel[];
  turmaName: string;
  poloParam?: string;
}) {
  const processedRounds = rounds.filter((r) => r.status === "Processada");
  const [selectedId, setSelectedId]         = useState<string>(processedRounds[0] ? String(processedRounds[0].id) : "");
  const [results, setResults]               = useState<RankedResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (!selectedId && processedRounds.length) setSelectedId(String(processedRounds[0].id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedRounds.length]);

  useEffect(() => {
    if (!selectedId) { setResults([]); return; }
    setLoadingResults(true);
    fetch(`/api/results?round_id=${selectedId}${poloParam}`)
      .then((r) => r.json())
      .then((d) => setResults(
        ((d.results || []).map((r: StoredResult) => r.data) as RankedResult[]).sort((a, b) => b.score - a.score)
      ))
      .finally(() => setLoadingResults(false));
  }, [selectedId, poloParam]);

  if (!processedRounds.length) {
    return (
      <Panel title="Classificação por Rodada" icon={BarChart3}>
        <p className="py-10 text-center text-sm text-slate-500">Nenhuma rodada processada ainda.</p>
      </Panel>
    );
  }

  const roundOptions  = processedRounds.map((r) => ({ value: String(r.id), label: r.name }));
  const selectedRound = processedRounds.find((r) => String(r.id) === selectedId);
  const roundName     = selectedRound?.name ?? `R${selectedId}`;

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFontSize(10); doc.setTextColor(8, 145, 178);
    doc.text(turmaName, 14, 12);
    doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text(`Classificação Acadêmica — ${roundName}`, 14, 19);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [["#", "Empresa", "Grupo", "Região", "Score", "Grau", "Conceito", "Nota"]],
      body: results.map((r, i) => {
        const g = getScoreGrade(r.score, gradeScale);
        return [i + 1, r.company, r.group, r.region, r.score.toFixed(1), g.grade, g.label, g.nota.toFixed(1)];
      }),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center", fontStyle: "bold" },
        6: { halign: "center" },
        7: { halign: "center", fontStyle: "bold" },
      },
    });

    doc.save(`classificacao-${roundName}.pdf`);
  }

  async function exportExcel() {
    const { exportToExcel } = await import("@/lib/utils/exportExcel");
    const excelRows = results.map((r, i) => {
      const g = getScoreGrade(r.score, gradeScale);
      return {
        "#": i + 1,
        "Empresa":  r.company,
        "Grupo":    r.group,
        "Região":   r.region,
        "Score":    r.score,
        "Grau":     g.grade,
        "Conceito": g.label,
        "Nota":     g.nota,
      };
    });
    await exportToExcel(excelRows, `classificacao-${roundName}`, "Classificação");
  }

  function imprimir() {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${turmaName} — Classificação — ${roundName}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 20px; }
    h1 { font-size: 13px; color: #0891b2; margin: 0 0 2px 0; font-weight: 600; }
    h2 { font-size: 15px; margin: 0 0 4px 0; }
    p.sub { font-size: 10px; color: #64748b; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0891b2; color: #fff; }
    th, td { padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    tbody tr:nth-child(even) { background: #f1f5f9; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>${turmaName}</h1>
  <h2>Classificação Acadêmica — ${roundName}</h2>
  <p class="sub">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
  <table>
    <thead>
      <tr>
        <th class="center">#</th><th>Empresa</th><th>Grupo</th><th>Região</th>
        <th class="center">Score</th><th class="center">Grau</th><th class="center">Conceito</th><th class="center">Nota</th>
      </tr>
    </thead>
    <tbody>
      ${results.map((r, i) => {
        const g = getScoreGrade(r.score, gradeScale);
        return `<tr>
          <td class="center bold">${i + 1}º</td>
          <td>${r.company}</td><td>${r.group}</td><td>${r.region}</td>
          <td class="center">${r.score.toFixed(1)}</td>
          <td class="center bold">${g.grade}</td>
          <td class="center">${g.label}</td>
          <td class="center bold">${g.nota.toFixed(1)}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  }

  return (
    <Panel
      title="Classificação por Rodada"
      icon={BarChart3}
      subtitle="Score convertido em grau e nota para cada empresa"
      actions={
        <div className="flex items-center gap-2">
          <ExportBtn onClick={exportPDF}   color="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"           icon={FileText} label="PDF"      />
          <ExportBtn onClick={exportExcel} color="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" icon={Download} label="Excel"    />
          <ExportBtn onClick={imprimir}    color="border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20"         icon={Printer}  label="Imprimir" />
        </div>
      }
    >
      {/* Seletor + chips */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative max-w-xs">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm font-semibold text-white focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
          >
            {roundOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        {selectedRound && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-white">{selectedRound.name}</span>
            <span className="text-slate-600">·</span>
            <span className="italic text-slate-400">{selectedRound.event_type}</span>
          </div>
        )}
        {loadingResults && <span className="text-xs text-slate-500 animate-pulse">Carregando...</span>}
      </div>

      {processedRounds.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {processedRounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(String(r.id))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                String(r.id) === selectedId
                  ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {loadingResults ? (
        <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>
      ) : results.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Nenhum resultado encontrado para esta rodada.</p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-3 py-2.5 text-left">#</th>
                  <th className="px-3 py-2.5 text-left">Empresa</th>
                  <th className="px-3 py-2.5 text-right">Score</th>
                  <th className="px-3 py-2.5 text-center">Grau</th>
                  <th className="px-3 py-2.5 text-center">Conceito</th>
                  <th className="px-3 py-2.5 text-center">Nota</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const g  = getScoreGrade(r.score, gradeScale);
                  const bg = BG_MAP[g.color] ?? "bg-white/5 border-white/10";
                  return (
                    <tr key={r.companyId} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-3 py-3 font-bold text-slate-400">{i + 1}º</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-white">{r.company}</p>
                        <p className="text-[10px] text-slate-500">{r.group} · {r.region}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(r.score, 100)}%` }} />
                          </div>
                          <span className="font-bold text-white">{r.score.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-black ${bg} ${g.color}`}>
                          {g.grade}
                        </span>
                      </td>
                      <td className={`px-3 py-3 text-center text-sm font-semibold ${g.color}`}>{g.label}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-lg font-black ${g.color}`}>{g.nota.toFixed(1)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {gradeScale.map((level, i) => {
              const bg = BG_MAP[level.color] ?? "bg-white/5 border-white/10";
              return (
                <div key={i} className={`rounded-xl border p-3 text-center ${bg}`}>
                  <p className={`text-base font-black ${level.color}`}>{level.grade}</p>
                  <p className="text-[10px] text-slate-400">{level.label}</p>
                  <p className={`mt-1 text-lg font-black ${level.color}`}>{level.nota.toFixed(1)}</p>
                  <p className="text-[10px] text-slate-500">Score ≥ {level.minScore}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 4 — Notas dos Alunos (tabela + ajuste individual + exports)
// ═══════════════════════════════════════════════════════════════════════════════
interface NotaRow {
  studentId: string;
  empresa: string;
  grupo: string;
  regiao: string;
  nome: string;
  ra: string;
  score: number;
  notaGrupo: number;
  grau: string;
  color: string;
}

interface EditState {
  nota: string;
  justification: string;
  saving: boolean;
  error: string;
  expanded: boolean; // whether justification input is visible
}

function NotasAlunos({
  rounds,
  students,
  gradeScale,
  turmaName,
  poloParam = "",
}: {
  rounds: Round[];
  students: Student[];
  gradeScale: GradeLevel[];
  turmaName: string;
  poloParam?: string;
}) {
  const processedRounds = rounds.filter((r) => r.status === "Processada");
  const lastRound = processedRounds[processedRounds.length - 1];
  const [selectedId, setSelectedId]         = useState<string>(lastRound ? String(lastRound.id) : "");
  const [results, setResults]               = useState<RankedResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  // adjustments keyed by student_id
  const [adjustments, setAdjustments]       = useState<Record<string, GradeAdjustment>>({});
  // local edit state keyed by student_id
  const [editMap, setEditMap]               = useState<Record<string, EditState>>({});
  // classification filter: "" = Todos, "ajustadas" = only adjusted, or grade string e.g. "A+"
  const [filterGrau, setFilterGrau]         = useState<string>("");
  // column sort
  type SortCol = "nome" | "grupo" | "notaGrupo" | "notaFinal";
  type SortDir = "asc" | "desc";
  const [sortCol, setSortCol] = useState<SortCol>("notaGrupo");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  useEffect(() => {
    if (!selectedId && processedRounds.length)
      setSelectedId(String(processedRounds[processedRounds.length - 1].id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedRounds.length]);

  useEffect(() => {
    if (!selectedId) { setResults([]); setAdjustments({}); setEditMap({}); return; }
    setLoadingResults(true);
    Promise.all([
      fetch(`/api/results?round_id=${selectedId}${poloParam}`).then((r) => r.json()),
      fetch(`/api/grade-adjustments?round_id=${selectedId}`).then((r) => r.json()),
    ])
      .then(([resultsData, adjustData]) => {
        setResults((resultsData.results || []).map((r: StoredResult) => r.data) as RankedResult[]);
        const adjMap: Record<string, GradeAdjustment> = {};
        for (const adj of (adjustData.adjustments || []) as GradeAdjustment[]) {
          adjMap[adj.student_id] = adj;
        }
        setAdjustments(adjMap);
        setEditMap({});
      })
      .finally(() => setLoadingResults(false));
  }, [selectedId, poloParam]);

  if (!processedRounds.length) {
    return (
      <Panel title="Notas dos Alunos" icon={GraduationCap}>
        <p className="py-10 text-center text-sm text-slate-500">Nenhuma rodada processada ainda.</p>
      </Panel>
    );
  }

  const selectedRound = processedRounds.find((r) => String(r.id) === selectedId);
  const roundName     = selectedRound?.name ?? `R${selectedId}`;
  const roundOptions  = processedRounds.map((r) => ({ value: String(r.id), label: r.name }));
  const isLastRound   = lastRound && String(lastRound.id) === selectedId;

  // Build rows
  const rows: NotaRow[] = students
    .filter((s) => s.group_id !== null)
    .map((s) => {
      const result = results.find((r) => r.companyId === s.group_id);
      if (!result) return null;
      const grade = getScoreGrade(result.score, gradeScale);
      return {
        studentId: s.id,
        empresa: result.company,
        grupo: result.group,
        regiao: result.region,
        nome: s.name,
        ra: s.ra,
        score: result.score,
        notaGrupo: grade.nota,
        grau: grade.grade,
        color: grade.color,
      } as NotaRow;
    })
    .filter((x): x is NotaRow => x !== null)
    .sort((a, b) => b.notaGrupo - a.notaGrupo || a.nome.localeCompare(b.nome, "pt-BR"));

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filteredRows: NotaRow[] = filterGrau === ""
    ? rows
    : filterGrau === "ajustadas"
      ? rows.filter((r) => !!adjustments[r.studentId])
      : rows.filter((r) => r.grau === filterGrau);

  // ── Sort (aplicado sobre filteredRows) ────────────────────────────────────────
  const sortedRows: NotaRow[] = [...filteredRows].sort((a, b) => {
    let cmp = 0;
    if (sortCol === "nome")       cmp = a.nome.localeCompare(b.nome, "pt-BR");
    else if (sortCol === "grupo") cmp = a.grupo.localeCompare(b.grupo, "pt-BR");
    else if (sortCol === "notaGrupo") cmp = a.notaGrupo - b.notaGrupo;
    else if (sortCol === "notaFinal") {
      const fa = adjustments[a.studentId]?.adjusted_nota ?? a.notaGrupo;
      const fb = adjustments[b.studentId]?.adjusted_nota ?? b.notaGrupo;
      cmp = fa - fb;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Count per grade for badge counters
  const gradeCountMap: Record<string, number> = {};
  for (const r of rows) {
    gradeCountMap[r.grau] = (gradeCountMap[r.grau] ?? 0) + 1;
  }
  const adjustedCount = rows.filter((r) => !!adjustments[r.studentId]).length;

  // ── Edit helpers ──────────────────────────────────────────────────────────────
  function getEdit(studentId: string, notaGrupo: number): EditState {
    if (editMap[studentId]) return editMap[studentId];
    const adj = adjustments[studentId];
    return {
      nota: adj ? String(adj.adjusted_nota) : notaGrupo.toFixed(1),
      justification: adj?.justification ?? "",
      saving: false,
      error: "",
      expanded: false,
    };
  }

  function setEdit(studentId: string, patch: Partial<EditState>) {
    setEditMap((prev) => ({
      ...prev,
      [studentId]: { ...getEdit(studentId, 0), ...prev[studentId], ...patch },
    }));
  }

  async function saveAdjustment(row: NotaRow) {
    const edit = editMap[row.studentId];
    if (!edit) return;
    const nota = Number(edit.nota);
    if (isNaN(nota) || nota < 0 || nota > 10) {
      setEdit(row.studentId, { error: "Nota deve ser entre 0,0 e 10,0" }); return;
    }
    if (!edit.justification.trim()) {
      setEdit(row.studentId, { error: "Justificativa obrigatória" }); return;
    }
    setEdit(row.studentId, { saving: true, error: "" });
    try {
      const res = await fetch("/api/grade-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: row.studentId, round_id: Number(selectedId), adjusted_nota: nota, justification: edit.justification.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setEdit(row.studentId, { saving: false, error: data.error || "Erro ao salvar" }); return; }
      setAdjustments((prev) => ({ ...prev, [row.studentId]: data.adjustment }));
      setEditMap((prev) => { const n = { ...prev }; delete n[row.studentId]; return n; });
    } catch {
      setEdit(row.studentId, { saving: false, error: "Erro de rede" });
    }
  }

  async function resetAdjustment(row: NotaRow) {
    setEdit(row.studentId, { saving: true, error: "" });
    try {
      const res = await fetch(`/api/grade-adjustments?student_id=${row.studentId}&round_id=${selectedId}`, { method: "DELETE" });
      if (!res.ok) { setEdit(row.studentId, { saving: false, error: "Erro ao remover ajuste" }); return; }
      setAdjustments((prev) => { const n = { ...prev }; delete n[row.studentId]; return n; });
      setEditMap((prev) => { const n = { ...prev }; delete n[row.studentId]; return n; });
    } catch {
      setEdit(row.studentId, { saving: false, error: "Erro de rede" });
    }
  }

  // ── Export helpers (use nota final = ajustada ou grupo) ────────────────────
  function notaFinal(row: NotaRow): number {
    return adjustments[row.studentId]?.adjusted_nota ?? row.notaGrupo;
  }

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFontSize(10); doc.setTextColor(8, 145, 178);
    doc.text(turmaName, 14, 12);
    doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text(`Notas dos Alunos — ${roundName}`, 14, 19);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 25);
    autoTable(doc, {
      startY: 30,
      head: [["Empresa", "Grupo", "Região", "Nome do Aluno", "RA", "Nota do Grupo", "Nota Final", "Ajustada?"]],
      body: rows.map((r) => {
        const adj = adjustments[r.studentId];
        return [r.empresa, r.grupo, r.regiao, r.nome, r.ra, r.notaGrupo.toFixed(1), notaFinal(r).toFixed(1), adj ? `Sim — ${adj.justification}` : "Não"];
      }),
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: { 5: { halign: "center", fontStyle: "bold" }, 6: { halign: "center", fontStyle: "bold" }, 7: { halign: "left", fontSize: 7 } },
    });
    doc.save(`notas-alunos-${roundName}.pdf`);
  }

  async function exportExcel() {
    const { exportToExcel } = await import("@/lib/utils/exportExcel");
    const excelRows = rows.map((r) => ({
      "Empresa": r.empresa, "Grupo": r.grupo, "Região": r.regiao,
      "Nome do Aluno": r.nome, "RA": r.ra, "Score": r.score,
      "Grau": r.grau, "Nota do Grupo": r.notaGrupo,
      "Nota Final": notaFinal(r),
      "Ajustada pelo Professor": adjustments[r.studentId] ? "Sim" : "Não",
      "Justificativa": adjustments[r.studentId]?.justification ?? "",
    }));
    await exportToExcel(excelRows, `notas-alunos-${roundName}`, "Notas dos Alunos");
  }

  function imprimir() {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${turmaName} — Notas dos Alunos — ${roundName}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 20px; }
    h1 { font-size: 13px; color: #0891b2; margin: 0 0 2px 0; font-weight: 600; }
    h2 { font-size: 15px; margin: 0 0 4px 0; }
    p.sub { font-size: 10px; color: #64748b; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0891b2; color: #fff; }
    th, td { padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; }
    tbody tr:nth-child(even) { background: #f1f5f9; }
    .nota { text-align: center; font-weight: bold; }
    .adj { font-size: 9px; color: #7c3aed; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>${turmaName}</h1>
  <h2>Notas dos Alunos — ${roundName}</h2>
  <p class="sub">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
  <table>
    <thead>
      <tr><th>Empresa</th><th>Grupo</th><th>Região</th><th>Nome do Aluno</th><th>RA</th><th class="nota">Nota Grupo</th><th class="nota">Nota Final</th></tr>
    </thead>
    <tbody>
      ${rows.map((r) => {
        const adj = adjustments[r.studentId];
        const final = notaFinal(r);
        return `<tr>
          <td>${r.empresa}</td><td>${r.grupo}</td><td>${r.regiao}</td>
          <td>${r.nome}</td><td>${r.ra}</td>
          <td class="nota">${r.notaGrupo.toFixed(1)}</td>
          <td class="nota">${final.toFixed(1)}${adj ? `<br/><span class="adj">✎ Ajustada</span>` : ""}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</body>
</html>`;
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); }, 300);
  }

  return (
    <Panel
      title="Notas dos Alunos"
      icon={GraduationCap}
      subtitle={`${sortedRows.length}${sortedRows.length !== rows.length ? ` de ${rows.length}` : ""} aluno${rows.length !== 1 ? "s" : ""} com resultado nesta rodada`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* ── Filtro de classificação ── */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterGrau("")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                filterGrau === ""
                  ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Todos <span className="ml-1 opacity-70">{rows.length}</span>
            </button>
            {gradeScale.map((level) => {
              const cnt = gradeCountMap[level.grade] ?? 0;
              if (cnt === 0) return null;
              const isActive = filterGrau === level.grade;
              const bg = BG_MAP[level.color] ?? "bg-white/5 border-white/10";
              return (
                <button
                  key={level.grade}
                  onClick={() => setFilterGrau(isActive ? "" : level.grade)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${
                    isActive ? `${bg} ${level.color}` : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {level.grade} <span className="ml-1 opacity-70">{cnt}</span>
                </button>
              );
            })}
            {adjustedCount > 0 && (
              <button
                onClick={() => setFilterGrau(filterGrau === "ajustadas" ? "" : "ajustadas")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${
                  filterGrau === "ajustadas"
                    ? "bg-violet-500/20 border-violet-400/40 text-violet-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                ✎ Ajustadas <span className="ml-1 opacity-70">{adjustedCount}</span>
              </button>
            )}
          </div>
          {/* ── Exports ── */}
          <div className="flex items-center gap-1.5">
            <ExportBtn onClick={exportPDF}   color="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"           icon={FileText} label="PDF"      />
            <ExportBtn onClick={exportExcel} color="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" icon={Download} label="Excel"    />
            <ExportBtn onClick={imprimir}    color="border-slate-500/30 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20"         icon={Printer}  label="Imprimir" />
          </div>
        </div>
      }
    >
      {/* Seletor de rodada */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative max-w-xs">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm font-semibold text-white focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
          >
            {roundOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        {selectedRound && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-white">{selectedRound.name}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{selectedRound.event_type}</span>
          </div>
        )}
        {isLastRound && (
          <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-0.5 text-xs font-semibold text-violet-300">
            ★ Nota Definitiva da Universidade
          </span>
        )}
        {loadingResults && <span className="text-xs text-slate-500 animate-pulse">Carregando...</span>}
      </div>

      {/* Chips */}
      {processedRounds.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {processedRounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(String(r.id))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                String(r.id) === selectedId
                  ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Info box about adjustments */}
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-violet-400/20 bg-violet-500/5 px-4 py-3 text-[12px] leading-relaxed text-slate-400">
        <Edit3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
        <span>
          Para ajustar a nota de um aluno específico, clique em{" "}
          <strong className="text-white">✎ Ajustar</strong>{" "}
          na coluna <strong className="text-white">Nota Final</strong>. A justificativa é obrigatória e ficará visível para o aluno.
        </span>
      </div>

      {loadingResults ? (
        <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          {results.length === 0 ? "Nenhum resultado encontrado para esta rodada." : "Nenhum aluno vinculado a grupos com resultado."}
        </p>
      ) : filteredRows.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-400">Nenhum aluno com classificação <strong className="text-white">{filterGrau}</strong> nesta rodada.</p>
          <button onClick={() => setFilterGrau("")} className="mt-3 text-xs text-cyan-400 underline hover:text-cyan-300">Mostrar todos</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.07]">
                {(
                  [
                    { col: "nome",       label: "Aluno / Empresa",       align: "left",   cls: "" },
                    { col: "grupo",      label: "Grupo",                  align: "left",   cls: "" },
                    { col: "notaGrupo",  label: "Nota do Grupo",          align: "center", cls: "" },
                    { col: "notaFinal",  label: "Nota Final (Ajustável)", align: "left",   cls: "min-w-[280px]" },
                  ] as { col: SortCol; label: string; align: string; cls: string }[]
                ).map(({ col, label, align, cls }) => {
                  const isActive = sortCol === col;
                  return (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className={`px-3 py-2.5 text-${align} cursor-pointer select-none group ${cls}`}
                    >
                      <div className={`inline-flex items-center gap-1 ${align === "center" ? "justify-center w-full" : ""}`}>
                        <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"}`}>
                          {label}
                        </span>
                        {isActive ? (
                          sortDir === "desc"
                            ? <ChevronDown className="h-3.5 w-3.5 text-cyan-300" />
                            : <ChevronUp   className="h-3.5 w-3.5 text-cyan-300" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => {
                const adj = adjustments[row.studentId];
                const isEditing = !!editMap[row.studentId];
                const edit = isEditing ? editMap[row.studentId] : null;
                const hasAdjustment = !!adj;
                const finalNota = adj?.adjusted_nota ?? row.notaGrupo;
                const finalColor = hasAdjustment ? "text-violet-400" : row.color;

                return (
                  <tr key={row.studentId} className={`border-b border-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    {/* Aluno info */}
                    <td className="px-3 py-3">
                      <p className="font-semibold text-white">{row.nome}</p>
                      <p className="text-[10px] text-slate-400">RA {row.ra} · {row.empresa}</p>
                    </td>

                    {/* Grupo */}
                    <td className="px-3 py-3 text-slate-400 whitespace-nowrap">
                      <p className="text-slate-300">{row.grupo}</p>
                      <p className="text-[10px] text-slate-500">{row.regiao}</p>
                    </td>

                    {/* Nota do Grupo */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-lg font-black ${row.color}`}>{row.notaGrupo.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500">{row.grau}</span>
                      </div>
                    </td>

                    {/* Nota Final (ajustável) */}
                    <td className="px-3 py-3">
                      {!isEditing ? (
                        /* ── Modo visualização ── */
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-black ${finalColor}`}>{finalNota.toFixed(1)}</span>
                            {hasAdjustment && (
                              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-300">
                                ✎ Ajustada
                              </span>
                            )}
                          </div>
                          {hasAdjustment && (
                            <p className="max-w-[180px] text-[11px] italic text-slate-400 leading-snug">
                              "{adj.justification}"
                            </p>
                          )}
                          <div className="ml-auto flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setEdit(row.studentId, {
                                nota: hasAdjustment ? String(adj.adjusted_nota) : row.notaGrupo.toFixed(1),
                                justification: adj?.justification ?? "",
                                expanded: true, saving: false, error: "",
                              })}
                              className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-violet-300 transition hover:bg-violet-500/20"
                            >
                              <Edit3 className="h-3 w-3" />
                              {hasAdjustment ? "Editar" : "Ajustar"}
                            </button>
                            {hasAdjustment && (
                              <button
                                onClick={() => resetAdjustment(row)}
                                title="Remover ajuste — volta para nota do grupo"
                                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20"
                              >
                                <X className="h-3 w-3" />
                                Desfazer
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* ── Modo edição ── */
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs text-slate-400 whitespace-nowrap">Nota (0–10):</label>
                              <input
                                type="number"
                                min={0} max={10} step={0.1}
                                value={edit!.nota}
                                onChange={(e) => setEdit(row.studentId, { nota: e.target.value })}
                                className="w-20 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1.5 text-center text-sm font-bold text-white focus:border-violet-400/60 focus:outline-none"
                                autoFocus
                              />
                            </div>
                            <span className="text-xs text-slate-500">
                              Grupo: <span className={`font-semibold ${row.color}`}>{row.notaGrupo.toFixed(1)}</span>
                            </span>
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400">Justificativa <span className="text-rose-400">*</span></label>
                            <input
                              type="text"
                              placeholder="Ex: Ausência em aulas, baixa participação…"
                              value={edit!.justification}
                              onChange={(e) => setEdit(row.studentId, { justification: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-violet-400/50 focus:outline-none"
                            />
                          </div>
                          {edit!.error && (
                            <p className="text-[11px] text-rose-400">{edit!.error}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveAdjustment(row)}
                              disabled={edit!.saving}
                              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              <Save className="h-3 w-3" />
                              {edit!.saving ? "Salvando…" : "Salvar"}
                            </button>
                            <button
                              onClick={() => setEditMap((prev) => { const n = { ...prev }; delete n[row.studentId]; return n; })}
                              disabled={edit!.saving}
                              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/10 disabled:opacity-50"
                            >
                              <X className="h-3 w-3" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Nota do Grupo calculada com base no score · Nota Final = ajuste do professor (se houver) ou nota do grupo ·{" "}
        <span className="font-semibold text-violet-400">Ajustes ficam visíveis para o aluno</span>
      </p>
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function NotasPage() {
  const { poloParam, selectedPolo } = usePoloContext();

  const [rounds, setRounds]           = useState<Round[]>([]);
  const [students, setStudents]       = useState<Student[]>([]);
  const [gradeScale, setGradeScale]   = useState<GradeLevel[]>(DEFAULT_GRADE_SCALE);
  const [gradeScaleRows, setGradeScaleRows] = useState<EditableGradeRow[]>([]);
  const [scoreWeights, setScoreWeights]     = useState<Record<string, number>>({});
  const [turmaName, setTurmaName]     = useState("Desafio CFO");
  const [loading, setLoading]         = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [roundsRes, studentsRes, classRes] = await Promise.all([
        fetch(`/api/rounds?v=1${poloParam}`, { cache: "no-store" }),
        fetch(`/api/students?v=1${poloParam}`, { cache: "no-store" }),
        fetch("/api/classes", { cache: "no-store" }),
      ]);
      const [roundsData, studentsData, classData] = await Promise.all([
        roundsRes.json(), studentsRes.json(), classRes.json(),
      ]);

      setRounds((roundsData.rounds || []).sort((a: Round, b: Round) => a.id - b.id));
      setStudents(studentsData.students || []);

      const cls = classData.class;
      if (cls?.name) setTurmaName(cls.name);
      if (cls?.score_weights) setScoreWeights(cls.score_weights);
      if (Array.isArray(cls?.grade_scale) && cls.grade_scale.length > 0) {
        const scale = buildGradeScale(cls.grade_scale);
        setGradeScale(scale);
        setGradeScaleRows(scale.map(({ color: _c, ...g }) => g));
      } else {
        setGradeScaleRows(DEFAULT_GRADE_SCALE.map(({ color: _c, ...g }) => g));
      }
    } finally {
      setLoading(false);
    }
  }, [poloParam]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function handleScaleSaved() {
    fetch("/api/classes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const raw = d.class?.grade_scale;
        if (Array.isArray(raw) && raw.length > 0) {
          const scale = buildGradeScale(raw);
          setGradeScale(scale);
          setGradeScaleRows(scale.map(({ color: _c, ...g }) => g));
        }
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando dados de notas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-black text-white sm:text-2xl">
          <GraduationCap className="h-6 w-6 text-cyan-400" />
          Notas
        </h1>
        <p className="text-sm text-slate-400">
          {selectedPolo
            ? <><span className="text-cyan-400 font-semibold">{selectedPolo}</span> · {students.length} aluno{students.length !== 1 ? "s" : ""}</>
            : "Gerencie a escala de avaliação, metodologia de pontuação e consulte as notas de grupos e alunos"}
        </p>
      </div>

      {/* Seção 1 — Notas dos Alunos */}
      <NotasAlunos rounds={rounds} students={students} gradeScale={gradeScale} turmaName={turmaName} poloParam={poloParam} />

      {/* Seção 2 — Classificação por Rodada */}
      <ClassificacaoRodada rounds={rounds} gradeScale={gradeScale} turmaName={turmaName} poloParam={poloParam} />

      {/* Seção 3 — Escala de Notas */}
      <GradeScaleEditor initialRows={gradeScaleRows} onSaved={handleScaleSaved} />

      {/* Seção 4 — Metodologia de Pontuação */}
      <MetodologiaPontuacao
        scoreWeights={scoreWeights}
        turmaName={turmaName}
        onWeightsSaved={() => {
          fetch("/api/classes", { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => { if (d.class?.score_weights) setScoreWeights(d.class.score_weights); })
            .catch(() => {});
        }}
      />
    </div>
  );
}
