"use client";

import { useState, useCallback } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { Panel } from "@/components/ui/Panel";

// ─── Helpers ────────────────────────────────────────────────────────────────
const TAXA_ANUAL  = 0.10; // 10 % ao ano
const VIDA_UTIL   = 10;   // 10 anos

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseBRL(raw: string): number {
  // Remove tudo que não seja dígito ou vírgula, trata vírgula como separador decimal
  const clean = raw.replace(/[^\d,]/g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function ResultLine({
  label,
  formula,
  result,
  accent = false,
}: {
  label: string;
  formula: string;
  result: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? "bg-cyan-400/10 border border-cyan-400/20" : "bg-white/5"}`}>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mb-2 font-mono text-sm text-slate-400">{formula}</p>
      <p className={`text-xl font-black ${accent ? "text-cyan-300" : "text-white"}`}>
        {result}
      </p>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export function DepreciacaoCalculadora() {
  const [rawInput, setRawInput]       = useState("");
  const [displayInput, setDisplayInput] = useState("");
  const [collapsed, setCollapsed]     = useState(false);

  const valorMaquina = parseBRL(rawInput);
  const depAnual     = valorMaquina * TAXA_ANUAL;
  const depMensal    = depAnual / 12;

  // Formata enquanto o usuário digita (sem o símbolo R$, só separadores numéricos)
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, ""); // só números
    if (!digits) {
      setRawInput("");
      setDisplayInput("");
      return;
    }
    // Trata os dois últimos dígitos como centavos (entrada tipo "caixa registradora")
    const cents    = parseInt(digits, 10);
    const reals    = cents / 100;
    setRawInput(String(reals));
    setDisplayInput(
      reals.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }, []);

  return (
    <Panel
      title="Calculadora de Depreciação Linear"
      subtitle={`Taxa ${(TAXA_ANUAL * 100).toFixed(0)}% a.a. · Vida útil ${VIDA_UTIL} anos`}
      icon={Calculator}
      actions={
        <button
          onClick={() => setCollapsed(c => !c)}
          className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      }
    >
      {!collapsed && (
        <div className="space-y-4">
          {/* ── Entrada ── */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Valor da Máquina / Bem (R$)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={displayInput}
                onChange={handleChange}
                placeholder="0,00"
                className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-right text-lg font-bold text-white placeholder-slate-600 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>
            {valorMaquina > 0 && (
              <p className="mt-1 text-right text-[11px] text-slate-500">
                Valor reconhecido: {formatBRL(valorMaquina)}
              </p>
            )}
          </div>

          {/* ── Resultados ── */}
          {valorMaquina > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <ResultLine
                  label="Depreciação Anual"
                  formula={`${formatBRL(valorMaquina)} × ${(TAXA_ANUAL * 100).toFixed(0)}% = ${formatBRL(depAnual)}`}
                  result={`${formatBRL(depAnual)} / ano`}
                />
                <ResultLine
                  label="Depreciação Mensal"
                  formula={`${formatBRL(depAnual)} ÷ 12 = ${formatBRL(depMensal)}`}
                  result={`${formatBRL(depMensal)} / mês`}
                  accent
                />
              </div>

              {/* ── Tabela resumo ── */}
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-2.5 text-left">Período</th>
                      <th className="px-4 py-2.5 text-right">Depreciação Acumulada</th>
                      <th className="px-4 py-2.5 text-right">Valor Residual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: VIDA_UTIL }, (_, i) => {
                      const ano        = i + 1;
                      const acumulada  = depAnual * ano;
                      const residual   = valorMaquina - acumulada;
                      const isLast     = ano === VIDA_UTIL;
                      return (
                        <tr
                          key={ano}
                          className={`border-b border-white/5 text-sm transition hover:bg-white/5 ${isLast ? "bg-white/5" : ""}`}
                        >
                          <td className="px-4 py-2 font-semibold text-slate-300">
                            Ano {ano}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-rose-400">
                            {formatBRL(acumulada)}
                          </td>
                          <td className={`px-4 py-2 text-right font-bold ${isLast ? "text-slate-500" : "text-white"}`}>
                            {isLast ? "—  (totalmente depreciado)" : formatBRL(residual)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Nota conceitual ── */}
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-[12px] leading-relaxed text-slate-400">
                <p className="mb-1 font-semibold text-slate-300">Como funciona a depreciação linear?</p>
                <p>
                  O método linear distribui o custo do bem <strong className="text-white">igualmente</strong> ao longo
                  da vida útil. A cota anual é sempre a mesma:&nbsp;
                  <span className="font-mono text-cyan-300">Valor ÷ Vida Útil</span>&nbsp;ou, equivalentemente,&nbsp;
                  <span className="font-mono text-cyan-300">Valor × Taxa</span>.
                  Cada mês, <strong className="text-white">{formatBRL(depMensal)}</strong> são reconhecidos como despesa no resultado
                  e reduzem o saldo do imobilizado no balanço patrimonial.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-slate-500">
              <Calculator className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">Digite o valor da máquina para calcular</p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
