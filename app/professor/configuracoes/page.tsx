"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  Zap,
  Database,
  Lock,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  BarChart3,
  RefreshCw,
  Sliders,
  GraduationCap,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  BookOpen,
  Edit3,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePoloContext } from "@/contexts/PoloContext";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DEFAULT_WEIGHTS, DEFAULT_GRADE_SCALE, buildGradeScale } from "@/lib/simulation/scoring";
import type { GradeLevel } from "@/lib/simulation/scoring";
import type { Round } from "@/types";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ClassData {
  id: string;
  name: string;
  fixed_expenses: number | null;
  transport: number | null;
  maintenance: number | null;
  score_weights?: Record<string, number> | null;
  grade_scale?: Omit<GradeLevel, "color">[] | null;
}

// ── Eventos econômicos (mesma lista da rodada) ─────────────────────────────────
const EVENT_OPTIONS = [
  { value: "Mercado normal",               label: "📊 Mercado normal" },
  { value: "Crescimento econômico",        label: "🚀 Crescimento econômico (+10% demanda)" },
  { value: "Crise econômica",              label: "📉 Crise econômica (-15% demanda)" },
  { value: "Inflação alta",                label: "📈 Inflação alta (-6% demanda, +10% custos)" },
  { value: "Incentivo fiscal",             label: "💰 Incentivo fiscal (+6% demanda)" },
  { value: "Escassez de matéria-prima",    label: "⚠️ Escassez de matéria-prima (+20% custos)" },
  { value: "Alta do dólar",               label: "💵 Alta do dólar (+8% custos)" },
  { value: "Alta temporada",              label: "☀️ Alta temporada (+50% demanda)" },
  { value: "Baixa temporada",             label: "🌧️ Baixa temporada (-30% demanda)" },
  { value: "Lançamento de produto",        label: "🎁 Lançamento de produto (+25% demanda)" },
  { value: "Concorrência externa",         label: "🏭 Concorrência externa (-10% demanda)" },
  { value: "Regulação ambiental",          label: "🌿 Regulação ambiental (+15% custos)" },
  { value: "Campanha de sustentabilidade", label: "♻️ Campanha de sustentabilidade (+12% demanda)" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PAINEL: PESOS DO SCORE
// ═══════════════════════════════════════════════════════════════════════════════
const WEIGHT_ROWS = [
  { key: "currentRatio"   as const, label: "Liquidez Corrente",  color: "text-cyan-400"    },
  { key: "quickRatio"     as const, label: "Liquidez Seca",      color: "text-cyan-400"    },
  { key: "immediateRatio" as const, label: "Liquidez Imediata",  color: "text-cyan-400"    },
  { key: "roa"            as const, label: "ROA",                color: "text-emerald-400" },
  { key: "netMargin"      as const, label: "Margem Líquida",     color: "text-emerald-400" },
  { key: "cashCycle"      as const, label: "Ciclo Financeiro",   color: "text-amber-400"   },
];

type WeightKey = (typeof WEIGHT_ROWS)[number]["key"];
type WeightStrings = Record<WeightKey, string>;

function toStrings(w: Record<string, number>): WeightStrings {
  const r = {} as WeightStrings;
  for (const row of WEIGHT_ROWS) {
    r[row.key] = String(Math.round((w[row.key] ?? DEFAULT_WEIGHTS[row.key]) * 100));
  }
  return r;
}

function toDecimals(s: WeightStrings): Record<WeightKey, number> {
  const r = {} as Record<WeightKey, number>;
  for (const row of WEIGHT_ROWS) r[row.key] = Number(s[row.key]) / 100;
  return r;
}

function ScoreWeightsPanel({ classData, onSave }: { classData: ClassData | null; onSave: () => void }) {
  const saved = classData?.score_weights;
  const initial = saved ? toStrings(saved as Record<string, number>) : toStrings(DEFAULT_WEIGHTS);
  const [vals, setVals] = useState<WeightStrings>(initial);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  // Re-sync when classData loads
  useEffect(() => {
    if (classData?.score_weights) setVals(toStrings(classData.score_weights as Record<string, number>));
  }, [classData]);

  const sum = WEIGHT_ROWS.reduce((acc, r) => acc + (Number(vals[r.key]) || 0), 0);
  const isValid = sum === 100;

  function set(key: WeightKey, v: string) {
    setVals((prev) => ({ ...prev, [key]: v }));
    setSavedMsg("");
    setErrorMsg("");
  }

  function restore() {
    setVals(toStrings(DEFAULT_WEIGHTS));
    setSavedMsg("");
    setErrorMsg("");
  }

  async function save() {
    if (!isValid) {
      setErrorMsg("A soma dos pesos deve totalizar 100%.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    setSavedMsg("");
    const res = await fetch("/api/classes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score_weights: toDecimals(vals) }),
    });
    const json = await res.json();
    if (!res.ok) {
      const msg = json.error || "Erro ao salvar.";
      if (msg.includes("score_weights")) setMigrationNeeded(true);
      setErrorMsg(msg);
    } else {
      setSavedMsg("Pesos salvos! Reprocesse as rodadas para aplicar.");
      onSave();
    }
    setSaving(false);
  }

  return (
    <Panel title="Pesos do Score" subtitle="Personalize os indicadores para o cálculo do score final" icon={Sliders}>
      {/* Instrução */}
      <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4 text-sm">
        <p className="mb-1.5 font-bold text-cyan-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Ajuste os percentuais conforme a metodologia da sua disciplina.</li>
          <li>• A <strong className="text-white">soma obrigatória é 100%</strong>. O bônus de market share (+5%) é fixo e não entra nesta conta.</li>
          <li>• Após salvar, <strong className="text-white">reprocesse as rodadas</strong> para aplicar os novos pesos nos resultados.</li>
        </ul>
      </div>

      {migrationNeeded && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <p className="font-bold text-rose-300">Migração necessária</p>
          </div>
          <p className="mb-3 text-slate-300">Execute o SQL abaixo no Supabase:</p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">
{`ALTER TABLE classes ADD COLUMN IF NOT EXISTS score_weights JSONB;`}
          </pre>
        </div>
      )}

      {/* Tabela de pesos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2.5 text-left">Indicador</th>
              <th className="py-2.5 text-center">Peso (%)</th>
              <th className="py-2.5 text-center">Padrão</th>
            </tr>
          </thead>
          <tbody>
            {WEIGHT_ROWS.map((row, i) => (
              <tr key={row.key} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                <td className={`py-3 pr-4 font-semibold ${row.color}`}>{row.label}</td>
                <td className="py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={vals[row.key]}
                      onChange={(e) => set(row.key, e.target.value)}
                      className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm font-bold text-white focus:border-cyan-400/50 focus:outline-none"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </td>
                <td className="py-3 text-center text-xs text-slate-500">
                  {Math.round(DEFAULT_WEIGHTS[row.key] * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-white/5">
              <td className="py-2.5 font-black text-white">TOTAL</td>
              <td className="py-2.5 text-center">
                <span className={`text-base font-black ${isValid ? "text-emerald-400" : "text-rose-400"}`}>
                  {sum}%
                </span>
              </td>
              <td className="py-2.5 text-center text-xs text-slate-500">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bônus fixo */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/5 px-4 py-2.5 text-xs text-slate-300">
        <span className="font-semibold text-violet-300">Bônus Market Share (+5%)</span>
        <span className="text-slate-500">— fixo, proporcional à receita vs. maior receita da rodada. Não altera a soma acima.</span>
      </div>

      {/* Validação */}
      {!isValid && sum > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          A soma dos pesos deve totalizar 100%. Atualmente: <strong>{sum}%</strong>
        </div>
      )}
      {errorMsg && !errorMsg.includes("migr") && (
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
        <Button onClick={save} loading={saving} disabled={!isValid || migrationNeeded}>
          <CheckCircle2 className="h-4 w-4" />
          Salvar Configuração
        </Button>
        <Button variant="ghost" size="sm" onClick={restore} disabled={saving}>
          <RefreshCw className="h-4 w-4" />
          Restaurar Padrão
        </Button>
      </div>
    </Panel>
  );
}

function GradeScalePanel({ classData, onSave }: { classData: ClassData | null; onSave: () => void }) {
  type EditableGradeRow = Omit<GradeLevel, "color">;
  const defaultRows: EditableGradeRow[] = DEFAULT_GRADE_SCALE.map(({ color: _c, ...g }) => g);

  function fromClassData(cd: ClassData | null): EditableGradeRow[] {
    if (!cd?.grade_scale?.length) return defaultRows;
    // Mescla com defaults para garantir 6 linhas
    const stored = buildGradeScale(cd.grade_scale);
    return stored.map(({ color: _c, ...g }) => g);
  }

  const [rows, setRows] = React.useState<EditableGradeRow[]>(() => fromClassData(classData));
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [migrationNeeded, setMigrationNeeded] = React.useState(false);

  React.useEffect(() => {
    setRows(fromClassData(classData));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData]);

  function setRow(idx: number, patch: Partial<EditableGradeRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setSavedMsg("");
    setErrorMsg("");
  }

  function restore() {
    setRows(defaultRows);
    setSavedMsg("");
    setErrorMsg("");
  }

  // Validação
  const scores = rows.map((r) => Number(r.minScore));
  const isDescending = scores.every((s, i) => i === 0 || s < scores[i - 1]);
  const notas = rows.map((r) => Number(r.nota));
  const notasOk = notas.every((n) => n >= 0 && n <= 10);
  const lastIsZero = scores[scores.length - 1] === 0;
  const namesOk = rows.every((r) => r.grade.trim() && r.label.trim());
  const isValid = isDescending && notasOk && lastIsZero && namesOk;

  async function save() {
    if (!isValid) { setErrorMsg("Verifique os erros antes de salvar."); return; }
    setSaving(true);
    setErrorMsg("");
    setSavedMsg("");
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
      setSavedMsg("Escala salva! Ela será usada nos resultados das rodadas.");
      onSave();
    }
    setSaving(false);
  }

  const GRADE_COLORS = DEFAULT_GRADE_SCALE.map((g) => g.color);

  return (
    <Panel title="Classificação Acadêmica" subtitle="Configure os limiares de score e as notas correspondentes" icon={BarChart3}>
      {/* Instrução */}
      <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4 text-sm">
        <p className="mb-1.5 font-bold text-cyan-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Cada nível define o <strong className="text-white">score mínimo</strong> para obter aquele grau e nota.</li>
          <li>• Os scores devem ser <strong className="text-white">decrescentes</strong> (maior para menor) e o último nível deve iniciar em <strong className="text-white">0</strong>.</li>
          <li>• As notas (0–10) são visíveis nos relatórios e no dashboard do aluno.</li>
        </ul>
      </div>

      {migrationNeeded && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <p className="font-bold text-rose-300">Migração necessária</p>
          </div>
          <p className="mb-3 text-slate-300">Execute o SQL abaixo no Supabase:</p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">
{`ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade_scale JSONB;`}
          </pre>
        </div>
      )}

      {/* Tabela editável */}
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
              const color = GRADE_COLORS[i] ?? "text-slate-400";
              const scoreErr = i < rows.length - 1 && Number(row.minScore) <= Number(rows[i + 1]?.minScore);
              const lastErr = i === rows.length - 1 && Number(row.minScore) !== 0;
              const notaErr = Number(row.nota) < 0 || Number(row.nota) > 10;
              return (
                <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                  {/* Nível (badge colorido) */}
                  <td className="py-2.5 pr-2">
                    <span className={`text-base font-black ${color}`}>{i + 1}º</span>
                  </td>
                  {/* Score mínimo */}
                  <td className="py-2 px-2">
                    {i === rows.length - 1 ? (
                      <div className="flex items-center justify-center">
                        <span className="rounded bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-400 select-none">0</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={row.minScore}
                          onChange={(e) => setRow(i, { minScore: Number(e.target.value) })}
                          className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold text-white focus:outline-none ${
                            scoreErr ? "border-rose-400/60 bg-rose-900/20 focus:border-rose-400" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
                          }`}
                        />
                        {scoreErr && <span className="text-[9px] text-rose-400">Deve ser &gt; {rows[i + 1]?.minScore}</span>}
                      </div>
                    )}
                    {lastErr && <span className="text-[9px] text-rose-400">Deve ser 0</span>}
                  </td>
                  {/* Grau */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={row.grade}
                      onChange={(e) => setRow(i, { grade: e.target.value.toUpperCase() })}
                      className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-black focus:outline-none ${color} ${
                        !row.grade.trim() ? "border-rose-400/60 bg-rose-900/20" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
                      }`}
                    />
                  </td>
                  {/* Conceito */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      maxLength={20}
                      value={row.label}
                      onChange={(e) => setRow(i, { label: e.target.value })}
                      className={`w-full min-w-[100px] rounded-lg border px-2 py-1.5 text-sm text-white focus:outline-none ${
                        !row.label.trim() ? "border-rose-400/60 bg-rose-900/20" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
                      }`}
                    />
                  </td>
                  {/* Nota */}
                  <td className="py-2 px-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={row.nota}
                        onChange={(e) => setRow(i, { nota: Number(e.target.value) })}
                        className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm font-bold text-white focus:outline-none ${
                          notaErr ? "border-rose-400/60 bg-rose-900/20 focus:border-rose-400" : "border-white/10 bg-white/5 focus:border-cyan-400/50"
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

      {/* Mensagens */}
      {!isValid && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            {!isDescending && <p>• Os scores mínimos devem ser decrescentes (linha 1 &gt; linha 2 &gt; ... &gt; linha 6).</p>}
            {!lastIsZero && <p>• O último nível deve ter score mínimo = 0 (não editável).</p>}
            {!notasOk && <p>• Notas devem estar entre 0 e 10.</p>}
            {!namesOk && <p>• Grau e Conceito não podem estar vazios.</p>}
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

      {/* Botões */}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={save} loading={saving} disabled={!isValid || migrationNeeded}>
          <CheckCircle2 className="h-4 w-4" />
          Salvar Classificação
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
// PAINEL: CONFIGURAÇÕES POR RODADA (com seletor de rodada)
// ═══════════════════════════════════════════════════════════════════════════════
function RoundConfigSection() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [round, setRound] = useState<Round | null>(null);
  const [loadingRound, setLoadingRound] = useState(false);

  // Carrega lista de rodadas
  useEffect(() => {
    fetch("/api/rounds")
      .then((r) => r.json())
      .then((d) => {
        const list: Round[] = d.rounds || [];
        setRounds(list);
        if (list.length) setSelectedRoundId(String(list[0].id));
      })
      .finally(() => setLoadingRounds(false));
  }, []);

  // Carrega a rodada selecionada
  useEffect(() => {
    if (!selectedRoundId) { setRound(null); return; }
    setLoadingRound(true);
    fetch(`/api/rounds/${selectedRoundId}`)
      .then((r) => r.json())
      .then((d) => setRound(d.round ?? null))
      .finally(() => setLoadingRound(false));
  }, [selectedRoundId]);

  const roundOptions = rounds.map((r) => ({
    value: String(r.id),
    label: `${r.name} — ${r.status}`,
  }));

  return (
    <div className="space-y-6">
      {/* Seletor */}
      <Panel title="Configurações por Rodada" subtitle="Selecione a rodada para configurar evento e parâmetros" icon={PlayCircle}>
        {loadingRounds ? (
          <p className="py-4 text-center text-sm text-slate-500">Carregando rodadas...</p>
        ) : rounds.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Nenhuma rodada criada. Crie uma rodada no menu <strong className="text-white">Rodadas</strong> primeiro.</p>
        ) : (
          <div className="max-w-sm">
            <Select
              label="Selecionar rodada"
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              options={roundOptions}
            />
          </div>
        )}
      </Panel>

      {/* Painéis da rodada selecionada */}
      {loadingRound && (
        <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
      )}

      {!loadingRound && round && (
        <>
          {/* Evento econômico */}
          <EventPanel round={round} onUpdate={(u) => setRound((r) => r ? { ...r, ...u } : r)} />
          {/* Despesas travadas */}
          <FixedExpensesRoundPanel round={round} onUpdate={(u) => setRound((r) => r ? { ...r, ...u } : r)} />
          {/* Materiais travados */}
          <MaterialPricesRoundPanel round={round} onUpdate={(u) => setRound((r) => r ? { ...r, ...u } : r)} />
          {/* Faixa de preço */}
          <PriceLimitsRoundPanel round={round} onUpdate={(u) => setRound((r) => r ? { ...r, ...u } : r)} />
          {/* Marketing e Colaboradores */}
          <EmployeeMarketingPanel round={round} onUpdate={(u) => setRound((r) => r ? { ...r, ...u } : r)} />
        </>
      )}
    </div>
  );
}

// ── Evento econômico ───────────────────────────────────────────────────────────
function EventPanel({ round, onUpdate }: { round: Round; onUpdate: (u: Partial<Round>) => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(event_type: string) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type }),
    });
    onUpdate({ event_type });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  return (
    <Panel title="Evento Econômico" subtitle="Define o contexto de mercado desta rodada" icon={Zap}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select
            label="Evento desta rodada"
            value={round.event_type}
            onChange={(e) => save(e.target.value)}
            options={EVENT_OPTIONS}
            disabled={saving}
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
          {EVENT_OPTIONS.find((e) => e.value === round.event_type)?.label ?? round.event_type}
        </div>
      </div>
      {saved && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2.5 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Evento salvo com sucesso.
        </div>
      )}
    </Panel>
  );
}

// ── Despesas operacionais travadas (por rodada) ────────────────────────────────
function FixedExpensesRoundPanel({ round, onUpdate }: { round: Round; onUpdate: (u: Partial<Round>) => void }) {
  const [feVal, setFeVal] = React.useState<number | null>(round.fixed_expenses ?? null);
  const [trVal, setTrVal] = React.useState<number | null>(round.transport ?? null);
  const [maVal, setMaVal] = React.useState<number | null>(round.maintenance ?? null);
  const [saVal, setSaVal] = React.useState<number | null>(round.avg_salary ?? null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const hasAnyLock = feVal !== null || trVal !== null || maVal !== null || saVal !== null;

  async function save() {
    setSaving(true);
    setSaveError(null);
    const body = {
      fixed_expenses: feVal,
      transport:      trVal,
      maintenance:    maVal,
      avg_salary:     saVal,
    };
    const res = await fetch(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSaveError(err.error || "Erro ao salvar. Execute o SQL de migração no Supabase.");
      setSaving(false);
      return;
    }
    onUpdate(body);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  function clearAll() { setFeVal(null); setTrVal(null); setMaVal(null); setSaVal(null); setSaved(false); }

  const fields: { label: string; ph: string; val: number | null; setVal: (n: number | null) => void; savedVal: number | null | undefined }[] = [
    { label: "Despesas Fixas",   ph: "26.000,00", val: feVal, setVal: setFeVal, savedVal: round.fixed_expenses },
    { label: "Transporte",       ph: "6.000,00",  val: trVal, setVal: setTrVal, savedVal: round.transport },
    { label: "Manutenção",       ph: "3.000,00",  val: maVal, setVal: setMaVal, savedVal: round.maintenance },
    { label: "Salário Médio/Colab.", ph: "2.000,00", val: saVal, setVal: setSaVal, savedVal: round.avg_salary },
  ];

  return (
    <Panel title="Despesas Operacionais Travadas" icon={Lock}>
      <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm">
        <p className="mb-1 font-bold text-amber-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Preencha um valor para <strong className="text-white">travar</strong> aquela despesa nesta rodada — o aluno verá o número mas não poderá alterar.</li>
          <li>• Deixe em <strong className="text-white">branco</strong> para o aluno definir livremente.</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => (
          <div key={f.label}>
            <CurrencyInput
              label={f.label}
              value={f.val}
              placeholder={`Ex.: ${f.ph}`}
              onChange={(n) => { f.setVal(n); setSaved(false); }}
              disabled={saving}
            />
            <p className="mt-1 text-[11px]">
              {f.val !== null ? (
                <span className="text-amber-400">🔒 Travado em R$ {f.val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              ) : (
                <span className="italic text-slate-600">Aluno define livremente</span>
              )}
            </p>
          </div>
        ))}
      </div>
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Configurações salvas!
        </div>
      )}
      {saveError && (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <p className="font-bold">❌ Erro ao salvar</p>
          <p className="mt-1">{saveError}</p>
          <pre className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs text-emerald-300 overflow-x-auto">
            ALTER TABLE rounds ADD COLUMN IF NOT EXISTS avg_salary DECIMAL;
          </pre>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={save} loading={saving} size="sm">
          <Lock className="h-4 w-4" /> Salvar travas
        </Button>
        {hasAnyLock && (
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={saving}>
            Limpar travas (liberar tudo)
          </Button>
        )}
      </div>
      {/* Status salvo */}
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status atual desta rodada</p>
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
              <span className="text-slate-400">{f.label}</span>
              {f.savedVal != null ? (
                <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Lock className="h-3 w-3" />
                  R$ {f.savedVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

// ── Preços de materiais travados (por rodada) ──────────────────────────────────
function MaterialPricesRoundPanel({ round, onUpdate }: { round: Round; onUpdate: (u: Partial<Round>) => void }) {
  const [plasticVal,  setPlasticVal]  = React.useState<number | null>(round.plastic_unit  ?? null);
  const [capsVal,     setCapsVal]     = React.useState<number | null>(round.caps_unit     ?? null);
  const [packageVal,  setPackageVal]  = React.useState<number | null>(round.package_unit  ?? null);
  const [labelVal,    setLabelVal]    = React.useState<number | null>(round.label_unit    ?? null);
  const [saving,      setSaving]      = React.useState(false);
  const [saved,       setSaved]       = React.useState(false);
  const [saveError,   setSaveError]   = React.useState<string | null>(null);

  const hasAnyLock = plasticVal !== null || capsVal !== null || packageVal !== null || labelVal !== null;

  async function save() {
    setSaving(true);
    setSaveError(null);
    const body = {
      plastic_unit:  plasticVal,
      caps_unit:     capsVal,
      package_unit:  packageVal,
      label_unit:    labelVal,
    };
    const res = await fetch(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSaveError(err.error || "Erro ao salvar.");
      setSaving(false);
      return;
    }
    onUpdate(body);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  function clearAll() { setPlasticVal(null); setCapsVal(null); setPackageVal(null); setLabelVal(null); setSaved(false); }

  const fields: { label: string; ph: string; val: number | null; setVal: (n: number | null) => void; savedVal: number | null | undefined }[] = [
    { label: "Plástico reciclado /un.", ph: "7,00",  val: plasticVal,  setVal: setPlasticVal,  savedVal: round.plastic_unit },
    { label: "Tampas /un.",            ph: "1,20",  val: capsVal,     setVal: setCapsVal,     savedVal: round.caps_unit },
    { label: "Embalagem /un.",         ph: "1,80",  val: packageVal,  setVal: setPackageVal,  savedVal: round.package_unit },
    { label: "Rótulo /un.",            ph: "0,70",  val: labelVal,    setVal: setLabelVal,    savedVal: round.label_unit },
  ];

  return (
    <Panel title="Custo de Materiais Travados" icon={Lock}>
      <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm">
        <p className="mb-1 font-bold text-amber-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Preencha o valor unitário para <strong className="text-white">travar</strong> o preço de cada material nesta rodada.</li>
          <li>• O aluno verá o custo mas <strong className="text-white">não poderá alterar</strong>.</li>
          <li>• Deixe em <strong className="text-white">branco</strong> para o aluno negociar livremente.</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => (
          <div key={f.label}>
            <CurrencyInput
              label={f.label}
              value={f.val}
              placeholder={`Ex.: ${f.ph}`}
              onChange={(n) => { f.setVal(n); setSaved(false); }}
              disabled={saving}
            />
            <p className="mt-1 text-[11px]">
              {f.val !== null ? (
                <span className="text-amber-400">🔒 Travado em R$ {f.val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              ) : (
                <span className="italic text-slate-600">Aluno define livremente</span>
              )}
            </p>
          </div>
        ))}
      </div>
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Preços de materiais salvos!
        </div>
      )}
      {saveError && (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <p className="font-bold">❌ Erro ao salvar</p>
          <p className="mt-1">{saveError}</p>
          <pre className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS plastic_unit DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS caps_unit DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS package_unit DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS label_unit DECIMAL;`}
          </pre>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={save} loading={saving} size="sm">
          <Lock className="h-4 w-4" /> Salvar travas
        </Button>
        {hasAnyLock && (
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={saving}>
            Limpar travas (liberar tudo)
          </Button>
        )}
      </div>
      {/* Status */}
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status atual desta rodada</p>
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
              <span className="text-slate-400">{f.label}</span>
              {f.savedVal != null ? (
                <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Lock className="h-3 w-3" />
                  R$ {f.savedVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

// ── Faixa de preço de venda (por rodada) ──────────────────────────────────────
function PriceLimitsRoundPanel({ round, onUpdate }: { round: Round; onUpdate: (u: Partial<Round>) => void }) {
  const [min, setMin] = React.useState<number | null>(round.price_min ?? null);
  const [max, setMax] = React.useState<number | null>(round.price_max ?? null);
  const [saving, setSaving] = React.useState(false);
  const [saved,  setSaved]  = React.useState(false);

  async function save() {
    setSaving(true);
    const body = { price_min: min, price_max: max };
    await fetch(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onUpdate(body);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  return (
    <Panel title="Faixa de Preço de Venda" icon={BarChart3}>
      <p className="mb-4 text-sm text-slate-400">
        Defina o preço mínimo e/ou máximo que os alunos podem praticar nesta rodada.
        Deixe em branco para não restringir.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-48">
          <CurrencyInput
            label="Preço mínimo"
            value={min}
            onChange={(n) => { setMin(n); setSaved(false); }}
            placeholder="Sem limite"
          />
        </div>
        <div className="w-48">
          <CurrencyInput
            label="Preço máximo"
            value={max}
            onChange={(n) => { setMax(n); setSaved(false); }}
            placeholder="Sem limite"
          />
        </div>
        <Button variant="secondary" onClick={save} loading={saving} size="sm">
          {saved ? "✓ Salvo" : "Salvar limites"}
        </Button>
      </div>
      {(round.price_min != null || round.price_max != null) && (
        <p className="mt-3 text-xs text-amber-400">
          ⚠ Limites ativos:{" "}
          {round.price_min != null && `mín. R$ ${round.price_min.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          {round.price_min != null && round.price_max != null && " · "}
          {round.price_max != null && `máx. R$ ${round.price_max.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          {" — visíveis no formulário do aluno."}
        </p>
      )}
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAINEL — Inserções de Marketing e Colaboradores (Migration 008)
// ═══════════════════════════════════════════════════════════════════════════════
function EmployeeMarketingPanel({ round, onUpdate }: { round: Round; onUpdate: (u: Partial<Round>) => void }) {
  const DEFAULT_INSERTION_COST = 1500;
  const DEFAULT_MIN_EMPLOYEES  = 3;
  const MAX_MIN_EMPLOYEES      = 20;

  const [insertionCost, setInsertionCost] = React.useState<number | null>(round.marketing_insertion_cost ?? null);
  const [minEmployees,  setMinEmployees]  = React.useState<number | null>(round.machine_min_employees ?? null);
  const [saving,  setSaving]  = React.useState(false);
  const [saved,   setSaved]   = React.useState(false);
  const [saveErr, setSaveErr] = React.useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = React.useState(false);

  // Sincroniza state quando a rodada selecionada muda (evita valores residuais)
  React.useEffect(() => {
    setInsertionCost(round.marketing_insertion_cost ?? null);
    setMinEmployees(round.machine_min_employees ?? null);
    setSaved(false);
    setSaveErr(null);
  }, [round.id]);

  async function save() {
    setSaving(true);
    setSaveErr(null);
    const res = await fetch(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketing_insertion_cost: insertionCost,
        machine_min_employees:    minEmployees,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const msg = json.error || "Erro ao salvar.";
      if (msg.includes("marketing_insertion_cost") || msg.includes("column")) setNeedsMigration(true);
      setSaveErr(msg);
    } else {
      onUpdate({ marketing_insertion_cost: insertionCost, machine_min_employees: minEmployees });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  const effectiveInsertionCost = insertionCost ?? DEFAULT_INSERTION_COST;
  const effectiveMinEmployees  = minEmployees  ?? DEFAULT_MIN_EMPLOYEES;
  const unitsPerEmployee       = Math.max(1, Math.floor(1000 / effectiveMinEmployees));

  return (
    <Panel
      title="Marketing e Colaboradores"
      subtitle="Configure o custo de inserções de marketing e a relação colaboradores/produção"
      icon={Settings}
    >
      {needsMigration && (
        <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="font-bold text-amber-300">Migração necessária</p>
          </div>
          <p className="mb-2 text-slate-300">Execute no Supabase SQL Editor:</p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">
{`ALTER TABLE rounds ADD COLUMN IF NOT EXISTS marketing_insertion_cost DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS machine_min_employees INTEGER DEFAULT NULL;`}
          </pre>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Custo por Inserção de Marketing */}
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-slate-400">
            📢 Custo por Inserção de Marketing
          </p>
          <p className="mb-3 text-xs text-slate-500">
            Quanto o aluno paga por cada inserção (1–8). Impacta a DRE e o fluxo de caixa.
          </p>
          <div className="flex items-center gap-2">
            <CurrencyInput
              label="Custo por inserção (R$)"
              value={insertionCost}
              onChange={(n) => { setInsertionCost(n); setSaved(false); }}
              placeholder={`${DEFAULT_INSERTION_COST.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (padrão)`}
            />
            {insertionCost !== null && (
              <button
                type="button"
                onClick={() => { setInsertionCost(null); setSaved(false); }}
                className="mt-5 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-slate-400 hover:text-white"
                title="Usar padrão do sistema"
              >
                ✕
              </button>
            )}
          </div>
          <div className="mt-2 rounded-xl border border-purple-400/10 bg-purple-500/5 px-3 py-2 text-xs">
            <p className="text-slate-400">
              Padrão do sistema:{" "}
              <strong className="text-white">R$ {DEFAULT_INSERTION_COST.toLocaleString("pt-BR")}</strong>
              {insertionCost !== null && insertionCost !== DEFAULT_INSERTION_COST && (
                <span className="ml-2 text-purple-300">
                  → usando <strong>R$ {insertionCost.toLocaleString("pt-BR")}</strong> nesta rodada
                </span>
              )}
            </p>
            <p className="mt-1 text-slate-500">
              Cada inserção aumenta a demanda em <strong className="text-white">+6%</strong>
            </p>
            {[1, 2, 4, 8].map((n) => (
              <span key={n} className="mr-2 text-slate-500">
                {n}×: <strong className="text-purple-300">R$ {(effectiveInsertionCost * n).toLocaleString("pt-BR")}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Funcionários por 1.000 unidades */}
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-slate-400">
            👷 Colaboradores por 1.000 Unidades
          </p>
          <p className="mb-3 text-xs text-slate-500">
            Mínimo de colaboradores necessários a cada 1.000 unidades de produção. Afeta o status dos colaboradores e a produtividade.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                Colaboradores / 1.000 unid.
              </label>
              <input
                type="number"
                inputMode="numeric"
                autoComplete="off"
                min={1}
                max={MAX_MIN_EMPLOYEES}
                step={1}
                value={minEmployees ?? ""}
                onChange={(e) => {
                  if (e.target.value === "") { setMinEmployees(null); setSaved(false); return; }
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed)) {
                    setMinEmployees(Math.min(MAX_MIN_EMPLOYEES, Math.max(1, parsed)));
                    setSaved(false);
                  }
                }}
                placeholder="Digite a quantidade (ex: 3)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
            {minEmployees !== null && (
              <button
                type="button"
                onClick={() => { setMinEmployees(null); setSaved(false); }}
                className="mt-5 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-slate-400 hover:text-white"
                title="Usar padrão do sistema"
              >
                ✕
              </button>
            )}
          </div>
          <div className="mt-2 rounded-xl border border-amber-400/10 bg-amber-500/5 px-3 py-2 text-xs">
            <p className="text-slate-400">
              Padrão: <strong className="text-white">{DEFAULT_MIN_EMPLOYEES} colab./1.000 unid.</strong>
              {" = "}<strong className="text-white">{Math.floor(1000 / DEFAULT_MIN_EMPLOYEES)} unid./colab.</strong>
            </p>
            {minEmployees !== null && (
              <p className="mt-1 text-amber-300">
                Esta rodada: <strong>{effectiveMinEmployees} colab./1.000 unid.</strong>
                {" = "}<strong>{unitsPerEmployee} unid./colab.</strong>
              </p>
            )}
            <p className="mt-1 text-slate-500">
              Ex.: produção de 1.300 unid. requer{" "}
              <strong className="text-white">
                {Math.ceil(1300 / unitsPerEmployee)} colab.
              </strong>
              {" "}com este parâmetro.
            </p>
          </div>
        </div>
      </div>

      {/* Regras de status */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
        <p className="font-black uppercase tracking-widest text-slate-500 mb-2">
          Regras de Status dos Colaboradores
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-2">
            <p className="font-bold text-emerald-400">✅ Está bom</p>
            <p className="text-slate-400 mt-0.5">≥ 85% dos colab. necessários E &lt; 35% ociosos</p>
            <p className="text-emerald-500 mt-0.5">Produção: 100%</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-400/20 p-2">
            <p className="font-bold text-amber-400">⚠️ Está em alerta</p>
            <p className="text-slate-400 mt-0.5">65–85% dos necessários OU 35–60% ociosos</p>
            <p className="text-amber-500 mt-0.5">Produção: 90%</p>
          </div>
          <div className="rounded-lg bg-rose-500/10 border border-rose-400/20 p-2">
            <p className="font-bold text-rose-400">🔴 Está em greve</p>
            <p className="text-slate-400 mt-0.5">&lt; 65% dos necessários OU &gt; 60% ociosos</p>
            <p className="text-rose-500 mt-0.5">Produção: 70%</p>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {saveErr && (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <strong>Erro:</strong> {saveErr}
        </div>
      )}
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Configurações salvas com sucesso.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={save} loading={saving}>
          <CheckCircle2 className="h-4 w-4" /> Salvar Configurações
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setInsertionCost(null); setMinEmployees(null); setSaved(false); }}>
          <RefreshCw className="h-4 w-4" /> Restaurar Padrão
        </Button>
      </div>
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAINEL — Alterar senha do professor
// ═══════════════════════════════════════════════════════════════════════════════
function ChangePasswordPanel() {
  const [currentPw, setCurrentPw]   = React.useState("");
  const [newPw, setNewPw]           = React.useState("");
  const [confirmPw, setConfirmPw]   = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew]       = React.useState(false);
  const [saving, setSaving]         = React.useState(false);
  const [success, setSuccess]       = React.useState(false);
  const [error, setError]           = React.useState("");

  async function save() {
    setError("");
    if (!currentPw || !newPw || !confirmPw) { setError("Preencha todos os campos"); return; }
    if (newPw !== confirmPw)                { setError("As senhas novas não coincidem"); return; }
    if (newPw.length < 6)                  { setError("Nova senha deve ter pelo menos 6 caracteres"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/professors/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao alterar senha"); return; }
      setSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Alterar Senha" icon={KeyRound}>
      <p className="mb-5 text-sm text-slate-400">
        Altere a senha da sua conta de professor. Após a alteração, o próximo login exigirá a nova senha.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Senha atual */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Senha atual</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setError(""); setSuccess(false); }}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Nova senha */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Nova senha</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setError(""); setSuccess(false); }}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar nova senha */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => { setConfirmPw(e.target.value); setError(""); setSuccess(false); }}
            placeholder="Repita a nova senha"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
          />
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Senha alterada com sucesso!
        </div>
      )}
      {/* Validação em tempo real */}
      {confirmPw && newPw !== confirmPw && !error && (
        <p className="mt-2 text-xs text-amber-400">As senhas não coincidem</p>
      )}

      <div className="mt-5">
        <Button
          onClick={save}
          loading={saving}
          disabled={!currentPw || !newPw || !confirmPw || newPw !== confirmPw}
          size="sm"
        >
          <KeyRound className="h-4 w-4" />
          Alterar senha
        </Button>
      </div>
    </Panel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAINEL DE TURMAS
// ═══════════════════════════════════════════════════════════════════════════════
interface ClassItem {
  id: string;
  name: string;
  polo: string | null;
  created_at: string;
}

function TurmasPanel() {
  const router = useRouter();
  const { activeClassId, reloadClasses } = usePoloContext();

  const [classes, setClasses]         = useState<ClassItem[]>([]);
  const [professorPolos, setProfPolos] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [newName, setNewName]         = useState("");
  const [newPolo, setNewPolo]         = useState("");
  const [creating, setCreating]       = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [activating, setActivating]   = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClassItem | null>(null);

  // Estado de renomeação inline
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renaming, setRenaming]       = useState(false);
  const editInputRef                  = useRef<HTMLInputElement>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/professors/my-classes");
    const d   = await res.json();
    setClasses(d.classes ?? []);
    const polos = (d.professorPolo ?? "")
      .split(",").map((p: string) => p.trim()).filter(Boolean);
    setProfPolos(polos);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Selecionar turma para configuração ───────────────────────────────────────
  async function handleActivate(cls: ClassItem) {
    if (cls.id === activeClassId) return;
    setActivating(cls.id);
    try {
      const res = await fetch("/api/professors/switch-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: cls.id }),
      });
      if (res.ok) {
        showToast(`Turma "${cls.name}" selecionada para configuração!`);
        reloadClasses(); // atualiza o contexto global
        router.refresh(); // re-hidrata server components com o novo JWT
      } else {
        const d = await res.json();
        showToast(d.error || "Erro ao selecionar turma", false);
      }
    } finally {
      setActivating(null);
    }
  }

  // ── Criar turma ───────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res  = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), polo: newPolo.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Erro ao criar turma", false);
    } else {
      showToast(`Turma "${data.class.name}" criada e selecionada!`);
      setNewName("");
      setNewPolo("");
      await load();
      // Auto-seleciona a nova turma
      await handleActivate(data.class as ClassItem);
    }
    setCreating(false);
  }

  // ── Excluir turma ─────────────────────────────────────────────────────────────
  async function handleDelete(cls: ClassItem) {
    setDeleting(cls.id);
    const res  = await fetch(`/api/classes?id=${cls.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Erro ao excluir", false); }
    else {
      showToast(`Turma "${cls.name}" removida`);
      load();
      reloadClasses();
      if (cls.id === activeClassId) router.refresh();
    }
    setDeleting(null);
    setConfirmDelete(null);
  }

  // ── Renomear inline ───────────────────────────────────────────────────────────
  function startRename(cls: ClassItem) {
    setEditingId(cls.id);
    setEditingName(cls.name);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
  }

  async function confirmRename(cls: ClassItem) {
    const trimmed = editingName.trim();
    if (!trimmed) { showToast("O nome não pode estar vazio", false); return; }
    if (trimmed === cls.name) { cancelRename(); return; }
    setRenaming(true);
    const res = await fetch("/api/classes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: cls.id, name: trimmed }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Erro ao renomear turma", false);
    } else {
      showToast(`Turma renomeada para "${trimmed}"!`);
      cancelRename();
      load();
      reloadClasses();
      if (cls.id === activeClassId) router.refresh();
    }
    setRenaming(false);
  }

  const busyAny = !!deleting || !!editingId || !!activating;

  return (
    <div className="relative space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl ${toast.ok ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Banner: nenhuma turma selecionada */}
      {!loading && !activeClassId && classes.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            <strong>Selecione uma turma para configuração</strong> clicando em <span className="font-semibold text-white">Selecionar</span> na turma desejada.
            As demais funcionalidades do sistema (rodadas, alunos, configurações) utilizam a turma selecionada.
          </p>
        </div>
      )}

      {/* Lista de turmas */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-400 text-sm font-semibold">Nenhuma turma criada ainda</p>
          <p className="mt-1 text-slate-600 text-xs">Crie sua primeira turma no formulário abaixo para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map((cls) => {
            const isActive  = cls.id === activeClassId;
            const isEditing = editingId === cls.id;
            const isActivating = activating === cls.id;

            return (
              <div
                key={cls.id}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-500/10 shadow-sm shadow-cyan-500/10"
                    : isEditing
                    ? "border-violet-400/30 bg-violet-500/5"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {/* Ícone */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-cyan-400/20" : "bg-white/5"}`}>
                  <BookOpen className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                </div>

                {/* Nome + polo */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename(cls);
                        if (e.key === "Escape") cancelRename();
                      }}
                      className="w-full rounded-lg border border-violet-400/40 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white focus:border-violet-400/70 focus:outline-none"
                      placeholder="Nome da turma"
                    />
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-slate-300"}`}>
                        {cls.name}
                      </p>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-cyan-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          Selecionada
                        </span>
                      )}
                    </div>
                  )}
                  {!isEditing && (cls.polo ? (
                    <p className="flex items-center gap-1 mt-0.5 text-xs text-cyan-400/70">
                      <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {cls.polo}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-600 italic">Sem polo</p>
                  ))}
                </div>

                {/* Botões de ação */}
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => confirmRename(cls)}
                        disabled={renaming || !editingName.trim()}
                        className="flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {renaming ? "Salvando…" : "Salvar"}
                      </button>
                      <button
                        onClick={cancelRename}
                        disabled={renaming}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Botão Selecionar — somente para turmas não selecionadas */}
                      {!isActive && (
                        <button
                          onClick={() => handleActivate(cls)}
                          disabled={busyAny || isActivating}
                          className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
                          title="Selecionar esta turma para configuração"
                        >
                          {isActivating ? (
                            <><span className="h-3 w-3 animate-spin rounded-full border border-cyan-400 border-t-transparent" /> Selecionando…</>
                          ) : (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Selecionar</>
                          )}
                        </button>
                      )}
                      {/* Renomear */}
                      <button
                        onClick={() => startRename(cls)}
                        disabled={busyAny}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-violet-500/10 hover:text-violet-400 transition-colors"
                        title="Renomear turma"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {/* Excluir */}
                      <button
                        onClick={() => setConfirmDelete(cls)}
                        disabled={busyAny}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        title="Excluir turma"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
              <svg className="h-5 w-5 shrink-0 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-white">{confirmDelete.name}</p>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Todos os <strong className="text-white">grupos, alunos e rodadas</strong> desta turma serão <span className="text-rose-400 font-bold">permanentemente excluídos</span>.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5">Cancelar</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete.id}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:opacity-60"
              >
                {deleting === confirmDelete.id ? "Excluindo…" : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de criação */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nova Turma</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Nome da turma <span className="text-rose-400">*</span></label>
            <input
              type="text"
              placeholder="Ex: Turma 2026-1, Contábeis A…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              Polo / Campus
              <span className="ml-1 text-slate-600 font-normal">(opcional)</span>
            </label>
            {professorPolos.length > 0 ? (
              <select
                value={newPolo}
                onChange={(e) => setNewPolo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="">— Sem polo —</option>
                {professorPolos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Ex: Polo Norte, EAD…"
                value={newPolo}
                onChange={(e) => setNewPolo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            )}
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {creating ? "Criando…" : "Criar Turma"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function ConfiguracoesPage() {
  const { isMaster } = usePoloContext();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string>("");
  const [masterSetup, setMasterSetup] = useState(false);
  const [masterResult, setMasterResult] = useState<string>("");

  const loadClass = useCallback(async () => {
    const res = await fetch("/api/classes");
    const json = await res.json();
    setClassData(json.class ?? null);
  }, []);

  useEffect(() => { loadClass(); }, [loadClass]);

  async function setupMaster() {
    setMasterSetup(true);
    const res = await fetch("/api/master/setup", { method: "POST" });
    const data = await res.json();
    setMasterResult(
      data.success
        ? `✅ ${data.action === "created" ? "Conta master criada" : "Conta master atualizada"}! E-mail: ${data.credentials?.email} · Senha: ${data.credentials?.password}`
        : `❌ Erro: ${data.error}`
    );
    setMasterSetup(false);
  }

  async function runSeed() {
    setSeeding(true);
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    setSeedResult(
      data.success
        ? `✅ Dados criados! Professor: ${data.credentials?.professor?.email} / ${data.credentials?.professor?.password}. Alunos: RAs 1001-4001, senha 123456.`
        : `❌ Erro: ${data.error}`
    );
    setSeeding(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">Configurações</h1>
        <p className="text-sm text-slate-400">Parâmetros da turma, rodadas e metodologia de avaliação</p>
      </div>

      {/* ── GERENCIAR TURMAS ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Minhas Turmas</h2>
        </div>
        <TurmasPanel />
      </section>

      {/* ── PESOS DO SCORE + LINK PARA NOTAS ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Sliders className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Metodologia de Avaliação</h2>
        </div>
        {/* Escala primeiro — conforme solicitado */}
        <Link href="/professor/notas">
          <div className="flex items-center justify-between rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5 transition-colors hover:bg-violet-400/10 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/20">
                <GraduationCap className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-bold text-white">Escala de Classificação Acadêmica</p>
                <p className="text-sm text-slate-400">Configure graus, notas e limiares de score no menu Notas</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-violet-400 shrink-0" />
          </div>
        </Link>
        <ScoreWeightsPanel classData={classData} onSave={loadClass} />
      </section>

      {/* ── CONFIGURAÇÕES POR RODADA ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <PlayCircle className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Configurações por Rodada</h2>
        </div>
        <RoundConfigSection />
      </section>

      {/* ── SEGURANÇA ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Segurança</h2>
        </div>
        <ChangePasswordPanel />
      </section>

      {/* ── SISTEMA — exclusivo do usuário Master ─────────────────────── */}
      {isMaster && <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Settings className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Sistema</h2>
        </div>

        <Panel title="Conta Master (Administrador Institucional)" icon={ShieldCheck}>
          <p className="mb-4 text-sm text-slate-300">
            Cria ou atualiza a conta de administrador master usando as credenciais definidas
            em <code className="rounded bg-white/10 px-1 text-xs text-cyan-300">.env.local</code> (
            <code className="text-xs text-violet-300">MASTER_EMAIL</code> e{" "}
            <code className="text-xs text-violet-300">MASTER_PASSWORD</code>).
          </p>
          <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-slate-400">
            <p className="font-semibold text-violet-300 mb-1">Credenciais configuradas no .env.local:</p>
            <p>E-mail: <span className="font-mono text-white">MASTER_EMAIL</span></p>
            <p>Senha: <span className="font-mono text-white">MASTER_PASSWORD</span></p>
            <p className="mt-2 text-xs text-slate-500">
              Para alterar, edite o <code className="text-violet-400">.env.local</code> e clique em Configurar novamente.
            </p>
          </div>
          {masterResult && (
            <div className="mb-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-3 text-sm text-violet-200">
              {masterResult}
            </div>
          )}
          <Button onClick={setupMaster} loading={masterSetup} variant="secondary" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
            <ShieldCheck className="h-4 w-4" /> Configurar conta Master
          </Button>
        </Panel>

        <Panel title="Dados de Demonstração" icon={Database}>
          <p className="mb-4 text-sm text-slate-300">
            Cria automaticamente: 1 professor, 1 turma, 4 grupos (Grupo 1 a 4 com Região 1 a 4),
            5 alunos de teste e 1 rodada aberta. Todos os grupos iniciam com condições iguais de mercado.
          </p>
          {seedResult && (
            <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-200">
              {seedResult}
            </div>
          )}
          <Button onClick={runSeed} loading={seeding} variant="secondary">
            <Zap className="h-4 w-4" /> Inicializar dados de demonstração
          </Button>
        </Panel>

        <Panel title="Informações do Sistema" icon={Settings}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Versão do sistema</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Plataforma</span>
              <span className="text-white">Arena Contábil – Simulador Empresarial</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Empresa simulada</span>
              <span className="text-white">EcoBottle Ind. de Garrafas Sustentáveis</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-400">Stack</span>
              <span className="text-white">Next.js 15 + Supabase + TypeScript</span>
            </div>
          </div>
        </Panel>
      </section>}
    </div>
  );
}
