"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Zap, Database, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ClassData {
  id: string;
  name: string;
  fixed_expenses: number | null;
  transport: number | null;
  maintenance: number | null;
}

// ── Painel de Despesas Operacionais Fixas ─────────────────────────────────────
function DespesasFixasPanel() {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  // Campos do formulário (string para suportar vazio = "livre")
  const [feVal, setFeVal] = useState("");   // fixed_expenses
  const [trVal, setTrVal] = useState("");   // transport
  const [maVal, setMaVal] = useState("");   // maintenance

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/classes");
      const json = await res.json();
      if (json.migration_needed) setMigrationNeeded(true);
      const c: ClassData | null = json.class ?? null;
      setClassData(c);
      setFeVal(c?.fixed_expenses != null ? String(c.fixed_expenses) : "");
      setTrVal(c?.transport != null ? String(c.transport) : "");
      setMaVal(c?.maintenance != null ? String(c.maintenance) : "");
    } catch {
      setErrorMsg("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function save() {
    setSaving(true);
    setErrorMsg("");
    setSavedMsg("");
    const res = await fetch("/api/classes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fixed_expenses: feVal === "" ? null : Number(feVal),
        transport:      trVal === "" ? null : Number(trVal),
        maintenance:    maVal === "" ? null : Number(maVal),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(json.error || "Erro ao salvar.");
    } else {
      setClassData(json.class);
      setSavedMsg("Configurações salvas com sucesso!");
      setTimeout(() => setSavedMsg(""), 3500);
    }
    setSaving(false);
  }

  function clearAll() {
    setFeVal("");
    setTrVal("");
    setMaVal("");
    setSavedMsg("");
  }

  const hasAnyLock = feVal !== "" || trVal !== "" || maVal !== "";
  const hasSavedLock =
    classData?.fixed_expenses != null ||
    classData?.transport != null ||
    classData?.maintenance != null;

  const fields = [
    {
      key: "fixed_expenses" as const,
      label: "Despesas Fixas",
      placeholder: "Ex.: 26000",
      val: feVal,
      setVal: setFeVal,
      savedVal: classData?.fixed_expenses,
    },
    {
      key: "transport" as const,
      label: "Transporte",
      placeholder: "Ex.: 6000",
      val: trVal,
      setVal: setTrVal,
      savedVal: classData?.transport,
    },
    {
      key: "maintenance" as const,
      label: "Manutenção",
      placeholder: "Ex.: 3000",
      val: maVal,
      setVal: setMaVal,
      savedVal: classData?.maintenance,
    },
  ];

  return (
    <Panel title="Despesas Operacionais Fixas" icon={Lock}>

      {/* Instruções */}
      <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm">
        <p className="mb-2 font-bold text-amber-300">Como funciona</p>
        <ul className="space-y-1 text-slate-300">
          <li>• Preencha um valor para <strong className="text-white">travar</strong> aquele campo no formulário do aluno — ele verá o número mas não poderá alterar.</li>
          <li>• Deixe o campo <strong className="text-white">em branco</strong> para que o aluno defina livremente.</li>
          <li>• Clique em <strong className="text-white">Salvar</strong> sempre que alterar algo.</li>
        </ul>
      </div>

      {/* Alerta de migração pendente */}
      {migrationNeeded && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <p className="font-bold text-rose-300">Migração de banco necessária</p>
          </div>
          <p className="mb-3 text-slate-300">
            Execute o SQL abaixo no{" "}
            <a
              href="https://supabase.com/dashboard/project/dfeskrjvhyfhafbwhhmz/sql/new"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-400 underline"
            >
              Supabase SQL Editor
            </a>{" "}
            para ativar esta funcionalidade:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">
{`ALTER TABLE classes ADD COLUMN IF NOT EXISTS fixed_expenses DECIMAL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS transport DECIMAL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS maintenance DECIMAL;`}
          </pre>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={loadData}
          >
            Verificar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Carregando...</p>
      ) : (
        <>
          {classData && (
            <p className="mb-4 text-xs text-slate-500">
              Turma:{" "}
              <span className="font-semibold text-slate-300">{classData.name}</span>
            </p>
          )}

          {/* Campos */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key}>
                <Input
                  label={`${f.label} R$`}
                  type="number"
                  min={0}
                  step={100}
                  value={f.val}
                  placeholder={`Livre — ${f.placeholder}`}
                  onChange={(e) => {
                    f.setVal(e.target.value);
                    setSavedMsg("");
                  }}
                  disabled={saving}
                />
                <p className="mt-1 text-[11px]">
                  {f.val !== "" ? (
                    <span className="text-amber-400">
                      🔒 Será travado em R${" "}
                      {Number(f.val).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-600 italic">Aluno define livremente</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Feedback */}
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
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={save} loading={saving} disabled={migrationNeeded}>
              <Lock className="h-4 w-4" />
              Salvar configurações
            </Button>
            {hasAnyLock && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={saving}
              >
                Limpar travas (liberar tudo)
              </Button>
            )}
          </div>

          {/* Painel de status atual (o que está salvo no banco) */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
              Status salvo no banco
            </p>
            <div className="space-y-2">
              {fields.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center justify-between border-b border-white/5 pb-2 text-sm"
                >
                  <span className="text-slate-400">{f.label}</span>
                  {f.savedVal != null ? (
                    <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <Lock className="h-3 w-3" />
                      R${" "}
                      {f.savedVal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="rounded bg-amber-700/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                        fixo
                      </span>
                    </span>
                  ) : (
                    <span className="italic text-slate-500">
                      Livre — aluno define
                    </span>
                  )}
                </div>
              ))}
            </div>
            {!hasSavedLock && !migrationNeeded && (
              <p className="mt-3 text-center text-xs text-slate-600 italic">
                Nenhuma despesa travada no momento
              </p>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string>("");

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Configurações</h1>
        <p className="text-sm text-slate-400">Parâmetros da turma e do sistema</p>
      </div>

      {/* ── DESPESAS OPERACIONAIS FIXAS ── */}
      <DespesasFixasPanel />

      {/* ── DADOS DE DEMONSTRAÇÃO ── */}
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
          <Zap className="h-4 w-4" />
          Inicializar dados de demonstração
        </Button>
      </Panel>

      {/* ── INFORMAÇÕES DO SISTEMA ── */}
      <Panel title="Informações do Sistema" icon={Settings}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-slate-400">Versão do sistema</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-slate-400">Plataforma</span>
            <span className="text-white">Desafio CFO – Simulador Empresarial</span>
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
    </div>
  );
}
