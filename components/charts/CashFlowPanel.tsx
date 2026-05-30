"use client";

import type { SimulationResult } from "@/types";
import { currency } from "@/lib/utils/format";

interface Props {
  result: SimulationResult;
}

function Row({
  label,
  value,
  indent = false,
  highlight = false,
  color = "white",
  separator = false,
}: {
  label: string;
  value: number;
  indent?: boolean;
  highlight?: boolean;
  color?: "white" | "emerald" | "rose" | "cyan" | "amber";
  separator?: boolean;
}) {
  const colorClass =
    color === "emerald"
      ? value >= 0 ? "text-emerald-400" : "text-rose-400"
      : color === "rose"
      ? "text-rose-400"
      : color === "cyan"
      ? "text-cyan-400"
      : color === "amber"
      ? "text-amber-400"
      : "text-white";

  return (
    <div
      className={[
        "flex justify-between py-1.5 text-sm",
        separator ? "border-t border-white/10 mt-1" : "border-b border-white/5",
        highlight ? "rounded-lg bg-white/5 px-2 -mx-2 font-bold" : "",
        indent ? "pl-4" : "",
      ].join(" ")}
    >
      <span className={indent ? "text-slate-400" : highlight ? "text-slate-100" : "text-slate-300"}>
        {label}
      </span>
      <span className={`font-semibold ${colorClass}`}>
        {value >= 0 ? currency(value) : `(${currency(Math.abs(value))})`}
      </span>
    </div>
  );
}

function SectionHeader({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p className={`mb-2 mt-4 text-[10px] font-black uppercase tracking-widest ${color}`}>
      {children}
    </p>
  );
}

export function CashFlowPanel({ result }: Props) {
  // Guard: older stored results may not have CF fields — show placeholder
  if (result.cfOperating === undefined) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-500 text-sm italic">
        Dados de fluxo de caixa não disponíveis para esta rodada.<br />
        Processe novamente a rodada para gerar o fluxo de caixa.
      </div>
    );
  }

  // After the guard above, all CF fields are guaranteed present
  const r = result as Required<typeof result>;

  return (
    <div className="text-sm">
      {/* ── SALDO DE ABERTURA ── */}
      <div className="mb-3 flex justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
        <span className="font-semibold text-slate-300">Saldo Inicial de Caixa</span>
        <span className="font-bold text-white">{currency(r.cfOpeningBalance)}</span>
      </div>

      {/* ── FCO ── */}
      <SectionHeader color="text-cyan-400">
        FCO — Atividades Operacionais
      </SectionHeader>

      <Row label="(+) Recebimentos de Duplicatas a Receber" value={r.cfReceipts} indent color="emerald" />
      <Row label="(−) Pagamentos a fornecedores" value={-r.cfSupplierPayments} indent color="rose" />
      <Row label="(−) Mão de obra (produção)" value={-r.cfLaborPayments} indent color="rose" />
      <Row label="(−) Despesas operacionais" value={-r.cfOperationalPayments} indent color="rose" />
      {r.cfFinancialPayments > 0 && (
        <Row label="(−) Despesa financeira (juros)" value={-r.cfFinancialPayments} indent color="rose" />
      )}
      {r.cfTaxPaid > 0 && (
        <Row label="(−) IR / CSLL (24%)" value={-r.cfTaxPaid} indent color="rose" />
      )}
      <Row
        label="= Fluxo Operacional Líquido (FCO)"
        value={r.cfOperating}
        highlight
        color="emerald"
        separator
      />

      {/* ── FCI ── */}
      <SectionHeader color="text-violet-400">
        FCI — Atividades de Investimento
      </SectionHeader>

      {r.cfMachinePayment > 0 ? (
        <Row
          label="(−) Aquisição de imobilizado (30% à vista)"
          value={-r.cfMachinePayment}
          indent
          color="rose"
        />
      ) : (
        <p className="py-1.5 pl-4 text-xs text-slate-500 italic">Nenhum investimento em imobilizado</p>
      )}
      <Row
        label="= Fluxo de Investimento Líquido (FCI)"
        value={r.cfInvesting}
        highlight
        color={r.cfInvesting >= 0 ? "emerald" : "rose"}
        separator
      />

      {/* ── FCF ── */}
      <SectionHeader color="text-amber-400">
        FCF — Atividades de Financiamento
      </SectionHeader>

      {r.cfLoanReceived > 0 ? (
        <Row label="(+) Empréstimos captados" value={r.cfLoanReceived} indent color="emerald" />
      ) : (
        <p className="py-1.5 pl-4 text-xs text-slate-500 italic">Nenhum empréstimo captado</p>
      )}
      <Row
        label="= Fluxo de Financiamento Líquido (FCF)"
        value={r.cfFinancing}
        highlight
        color={r.cfFinancing >= 0 ? "emerald" : "rose"}
        separator
      />

      {/* ── RESULTADO ── */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2">
          <span className="font-bold text-white">Variação Líquida de Caixa</span>
          <span className={`font-black ${r.cfNetChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {r.cfNetChange >= 0 ? `+ ${currency(r.cfNetChange)}` : `(${currency(Math.abs(r.cfNetChange))})`}
          </span>
        </div>

        <div className="flex justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-slate-300">Saldo Inicial</span>
          <span className="font-semibold text-white">{currency(r.cfOpeningBalance)}</span>
        </div>

        <div
          className={`flex justify-between rounded-xl px-3 py-3 border ${
            r.finalCash >= 0
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-rose-500/10 border-rose-500/30"
          }`}
        >
          <span className="text-base font-black text-white">= SALDO FINAL DE CAIXA</span>
          <span
            className={`text-base font-black ${r.finalCash >= 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {currency(r.finalCash)}
          </span>
        </div>

        {r.finalCash < 0 && (
          <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            ⚠ Caixa negativo — a empresa não possui liquidez suficiente para honrar todos os
            compromissos do período. Considere reduzir despesas ou captar empréstimo.
          </p>
        )}
      </div>
    </div>
  );
}
