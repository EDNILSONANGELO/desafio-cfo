"use client";

import type { SimulationResult } from "@/types";
import { currency } from "@/lib/utils/format";

interface Props {
  result: SimulationResult;
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-1.5 text-sm">
      <span className={bold ? "font-semibold text-slate-200" : "text-slate-400"}>{label}</span>
      <span className={bold ? "font-bold text-white" : "font-semibold text-white"}>{value}</span>
    </div>
  );
}

function SubTotal({ label, value, color }: { label: string; value: string; color: "cyan" | "rose" | "emerald" }) {
  const cls =
    color === "cyan"
      ? "text-cyan-300"
      : color === "rose"
      ? "text-rose-300"
      : "text-emerald-300";
  return (
    <div className="flex justify-between pb-1 pt-0.5 text-sm">
      <span className="font-semibold text-slate-300">{label}</span>
      <span className={`font-bold ${cls}`}>{value}</span>
    </div>
  );
}

function TotalBar({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "cyan" | "rose" | "emerald";
}) {
  const bg =
    color === "cyan"
      ? "bg-cyan-400/10"
      : color === "rose"
      ? "bg-rose-400/10"
      : "bg-emerald-400/10";
  const txt =
    color === "cyan"
      ? "text-cyan-400"
      : color === "rose"
      ? "text-rose-400"
      : "text-emerald-400";
  return (
    <div className={`flex justify-between rounded-xl px-3 py-2 ${bg}`}>
      <span className="font-black text-white">{label}</span>
      <span className={`font-black ${txt}`}>{value}</span>
    </div>
  );
}

export function BalancoPatrimonialPanel({ result: r }: Props) {
  // Compute totals robustly, supporting old stored results
  const pnc = r.longTermLiabilities ?? r.loans * 0.65;
  const totalPassivo = r.totalLiabilities ?? (r.currentLiabilities + pnc);
  const totalPassivoPL = totalPassivo + r.equity;
  const diff = Math.abs(r.totalAssets - totalPassivoPL);

  return (
    <div className="space-y-1">

      {/* ══════════════ ATIVO ══════════════ */}
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
        Ativo
      </p>

      <Sub>Ativo Circulante</Sub>
      <div className="mb-2 space-y-1.5">
        <Row label="Caixa e Disponíveis" value={currency(r.finalCash)} />
        <Row label="Contas a Receber (Clientes)" value={currency(r.clients)} />
        <Row label="Estoques" value={currency(r.endingInventory)} />
        <SubTotal label="Total Ativo Circulante" value={currency(r.currentAssets)} color="cyan" />
      </div>

      <Sub>Ativo Não Circulante</Sub>
      <div className="mb-3 space-y-1.5">
        <Row label="Imobilizado (líq. de depreciação)" value={currency(r.fixedAssets)} />
        <SubTotal label="Total Ativo Não Circulante" value={currency(r.fixedAssets)} color="cyan" />
      </div>

      <TotalBar label="ATIVO TOTAL" value={currency(r.totalAssets)} color="cyan" />

      {/* ══════════════ PASSIVO ══════════════ */}
      <p className="mb-2 mt-5 text-[10px] font-black uppercase tracking-widest text-rose-400">
        Passivo
      </p>

      <Sub>Passivo Circulante</Sub>
      <div className="mb-2 space-y-1.5">
        <Row label="Fornecedores" value={currency(r.suppliers)} />
        <Row label="Empréstimos – curto prazo (35%)" value={currency(r.loans * 0.35)} />
        {(r.machinePayable ?? 0) > 0 && (
          <Row label="Financiamento de Máquinas" value={currency(r.machinePayable)} />
        )}
        <SubTotal label="Total Passivo Circulante" value={currency(r.currentLiabilities)} color="rose" />
      </div>

      {pnc > 0 && (
        <>
          <Sub>Passivo Não Circulante</Sub>
          <div className="mb-2 space-y-1.5">
            <Row label="Empréstimos – longo prazo (65%)" value={currency(pnc)} />
            <SubTotal label="Total Passivo Não Circulante" value={currency(pnc)} color="rose" />
          </div>
        </>
      )}

      <TotalBar label="PASSIVO TOTAL" value={currency(totalPassivo)} color="rose" />

      {/* ══════════════ PATRIMÔNIO LÍQUIDO ══════════════ */}
      <p className="mb-2 mt-5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
        Patrimônio Líquido
      </p>
      <div className="mb-2 space-y-1.5">
        <Row label="Capital Social" value={currency(r.baseEquity ?? 220000)} />
        {r.netProfit >= 0 ? (
          <div className="flex justify-between border-b border-white/5 pb-1.5 text-sm">
            <span className="text-slate-400">Reserva de Lucros</span>
            <span className="font-semibold text-emerald-400">+ {currency(r.netProfit)}</span>
          </div>
        ) : (
          <div className="flex justify-between border-b border-white/5 pb-1.5 text-sm">
            <span className="text-slate-400">Prejuízo Acumulado</span>
            <span className="font-semibold text-rose-400">({currency(Math.abs(r.netProfit))})</span>
          </div>
        )}
        <SubTotal
          label="Total Patrimônio Líquido"
          value={currency(r.equity)}
          color={r.equity >= 0 ? "emerald" : "rose"}
        />
      </div>

      {/* ══════════════ TOTAL PASSIVO + PL ══════════════ */}
      <TotalBar
        label="PASSIVO TOTAL + PL"
        value={currency(totalPassivoPL)}
        color="emerald"
      />

      {/* Verificação de equilíbrio */}
      <p
        className={`mt-2 text-center text-[10px] font-semibold ${
          diff < 1 ? "text-emerald-500" : "text-amber-500"
        }`}
      >
        {diff < 1
          ? "✅ Balanço equilibrado — Ativo Total = Passivo Total + PL"
          : `⚠ Diferença de ${currency(diff)} entre Ativo e Passivo + PL`}
      </p>
    </div>
  );
}
