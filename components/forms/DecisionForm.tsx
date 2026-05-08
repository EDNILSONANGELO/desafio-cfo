"use client";

import { Input, Select } from "@/components/ui/Input";
import type { Decision, Group, RegionalSale } from "@/types";
import { DEFAULT_DECISION } from "@/lib/simulation/engine";

interface Props {
  decision: Decision;
  onChange: (decision: Decision) => void;
  disabled?: boolean;
  groups?: Group[];      // all regions / groups available for regional sales
  priceMin?: number | null;
  priceMax?: number | null;
  // Despesas travadas pelo professor (null = aluno pode editar)
  lockedFixedExpenses?: number | null;
  lockedTransport?: number | null;
  lockedMaintenance?: number | null;
}

const SUPPLIER_OPTIONS = [
  { value: 15, label: "15 dias" },
  { value: 30, label: "30 dias" },
  { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" },
];

const RECEIVABLE_OPTIONS = [
  { value: 15, label: "15 dias (à vista)" },
  { value: 30, label: "30 dias" },
  { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-white/10 pb-2 text-xs font-black uppercase tracking-widest text-cyan-400">
      {children}
    </h3>
  );
}

function LockedField({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-400">{label}</label>
      <div className="flex items-center rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-sm cursor-not-allowed select-none">
        <span className="flex-1 font-semibold text-white">
          {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <span className="ml-2 rounded bg-amber-700/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
          Fixo
        </span>
      </div>
      <p className="text-[10px] text-slate-600">Definido pelo professor</p>
    </div>
  );
}

/** Derive salePrice and expectedSales from regional sales entries */
function deriveFromRegional(rs: RegionalSale[]): { salePrice: number; expectedSales: number } {
  const active = rs.filter((r) => r.active);
  if (!active.length) return { salePrice: DEFAULT_DECISION.salePrice, expectedSales: 0 };

  const totalQty = active.reduce((s, r) => s + (r.qty || 0), 0);
  const weightedPrice =
    totalQty > 0
      ? active.reduce((s, r) => s + (r.price || 0) * (r.qty || 0), 0) / totalQty
      : active[0].price;

  return { salePrice: Math.round(weightedPrice * 100) / 100, expectedSales: totalQty };
}

export function DecisionForm({
  decision,
  onChange,
  disabled = false,
  groups = [],
  priceMin,
  priceMax,
  lockedFixedExpenses,
  lockedTransport,
  lockedMaintenance,
}: Props) {
  const d = { ...DEFAULT_DECISION, ...decision };

  const set = (key: keyof Decision, value: number | string) => {
    onChange({ ...d, [key]: typeof value === "string" ? Number(value) : value });
  };

  /* ── Regional Sales helpers ─────────────────────────────────────────────── */
  // Build or restore the regional sales array from decision
  const regionalSales: RegionalSale[] = (() => {
    if (d.regionalSales && d.regionalSales.length > 0) {
      // Merge with current groups in case groups changed
      return groups.map((g) => {
        const existing = d.regionalSales!.find((rs) => rs.group_id === g.id);
        if (existing) return existing;
        return { group_id: g.id, region_name: g.region_name, qty: 0, price: d.salePrice, active: false };
      });
    }
    // First time: default current region active, others inactive
    return groups.map((g, i) => ({
      group_id: g.id,
      region_name: g.region_name,
      qty: i === 0 ? d.expectedSales : 0,
      price: d.salePrice,
      active: i === 0,
    }));
  })();

  const updateRegional = (idx: number, patch: Partial<RegionalSale>) => {
    const updated = regionalSales.map((rs, i) => (i === idx ? { ...rs, ...patch } : rs));
    const derived = deriveFromRegional(updated);
    onChange({ ...d, regionalSales: updated, ...derived });
  };

  const hasGroups = groups.length > 0;

  return (
    <fieldset disabled={disabled} className="space-y-8">
      {/* PRODUÇÃO */}
      <div>
        <SectionTitle>🏭 Produção</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input label="Qtd. a produzir" type="number" value={d.productionQty} onChange={(e) => set("productionQty", e.target.value)} min={0} />
          <Input label="Cap. produtiva" type="number" value={d.productiveCapacity} onChange={(e) => set("productiveCapacity", e.target.value)} min={0} />
          <Input label="Funcionários" type="number" value={d.employees} onChange={(e) => set("employees", e.target.value)} min={0} />
          <Input label="Custo MO / unid. R$" type="number" value={d.laborCost} onChange={(e) => set("laborCost", e.target.value)} min={0} step={0.1} />
        </div>
      </div>

      {/* MATERIAIS */}
      <div>
        <SectionTitle>📦 Compra de Materiais</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input label="Plástico reciclado (qtd.)" type="number" value={d.plasticQty} onChange={(e) => set("plasticQty", e.target.value)} min={0} />
          <Input label="Plástico unit. R$" type="number" value={d.plasticUnit} onChange={(e) => set("plasticUnit", e.target.value)} min={0} step={0.1} />
          <Input label="Tampas (qtd.)" type="number" value={d.capsQty} onChange={(e) => set("capsQty", e.target.value)} min={0} />
          <Input label="Tampas unit. R$" type="number" value={d.capsUnit} onChange={(e) => set("capsUnit", e.target.value)} min={0} step={0.1} />
          <Input label="Embalagens (qtd.)" type="number" value={d.packageQty} onChange={(e) => set("packageQty", e.target.value)} min={0} />
          <Input label="Embalagem unit. R$" type="number" value={d.packageUnit} onChange={(e) => set("packageUnit", e.target.value)} min={0} step={0.1} />
          <Input label="Rótulos (qtd.)" type="number" value={d.labelQty} onChange={(e) => set("labelQty", e.target.value)} min={0} />
          <Input label="Rótulo unit. R$" type="number" value={d.labelUnit} onChange={(e) => set("labelUnit", e.target.value)} min={0} step={0.1} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Select
            label="Prazo fornecedor"
            value={d.supplierTerm}
            onChange={(e) => set("supplierTerm", e.target.value)}
            options={SUPPLIER_OPTIONS}
          />
        </div>
      </div>

      {/* VENDAS POR REGIÃO */}
      <div>
        <SectionTitle>🗺️ Vendas por Região</SectionTitle>

        {/* Professor price limits banner */}
        {(priceMin != null || priceMax != null) && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm">
            <span className="text-amber-400 text-base">💰</span>
            <div>
              <p className="font-semibold text-amber-300">Faixa de preço permitida pelo professor</p>
              <p className="text-slate-300 mt-0.5">
                {priceMin != null && priceMax != null && `R$ ${priceMin.toFixed(2)} – R$ ${priceMax.toFixed(2)}`}
                {priceMin != null && priceMax == null && `Mínimo: R$ ${priceMin.toFixed(2)}`}
                {priceMin == null && priceMax != null && `Máximo: R$ ${priceMax.toFixed(2)}`}
              </p>
            </div>
          </div>
        )}

        {hasGroups ? (
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 md:grid px-1">
              <div className="col-span-1">Vender</div>
              <div className="col-span-3">Região</div>
              <div className="col-span-4">Quantidade</div>
              <div className="col-span-4">Preço de Venda R$</div>
            </div>

            {regionalSales.map((rs, idx) => (
              <div
                key={rs.group_id}
                className={`rounded-xl border p-3 transition-all ${
                  rs.active
                    ? "border-cyan-400/30 bg-cyan-500/5"
                    : "border-white/10 bg-white/3 opacity-60"
                }`}
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Toggle */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => !disabled && updateRegional(idx, { active: !rs.active })}
                      className={`h-5 w-5 rounded border-2 transition-colors flex items-center justify-center ${
                        rs.active
                          ? "bg-cyan-400 border-cyan-400 text-slate-950"
                          : "border-white/30 text-transparent"
                      }`}
                      disabled={disabled}
                      title={rs.active ? "Desmarcar região" : "Marcar para vender"}
                    >
                      {rs.active && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Region name */}
                  <div className="col-span-3">
                    <span className="text-sm font-semibold text-white">{rs.region_name}</span>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4">
                    <input
                      type="number"
                      min={0}
                      value={rs.qty}
                      disabled={disabled || !rs.active}
                      onChange={(e) => updateRegional(idx, { qty: Number(e.target.value) })}
                      placeholder="Qtd."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none disabled:opacity-40"
                    />
                  </div>

                  {/* Price */}
                  <div className="col-span-4">
                    <input
                      type="number"
                      min={priceMin ?? 0.1}
                      max={priceMax ?? undefined}
                      step={0.5}
                      value={rs.price}
                      disabled={disabled || !rs.active}
                      onChange={(e) => updateRegional(idx, { price: Number(e.target.value) })}
                      placeholder="Preço"
                      className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none disabled:opacity-40 ${
                        (priceMin != null && rs.price < priceMin) || (priceMax != null && rs.price > priceMax)
                          ? "border-rose-400/50 focus:border-rose-400"
                          : "border-white/10 focus:border-cyan-400/50"
                      }`}
                    />
                    {priceMin != null && rs.active && rs.price < priceMin && (
                      <p className="mt-0.5 text-[10px] text-rose-400">Abaixo do mínimo (R$ {priceMin.toFixed(2)})</p>
                    )}
                    {priceMax != null && rs.active && rs.price > priceMax && (
                      <p className="mt-0.5 text-[10px] text-rose-400">Acima do máximo (R$ {priceMax.toFixed(2)})</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            {regionalSales.some((rs) => rs.active) && (
              <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span className="text-slate-400">
                    Total a vender:{" "}
                    <strong className="text-white">
                      {regionalSales.filter((r) => r.active).reduce((s, r) => s + (r.qty || 0), 0).toLocaleString("pt-BR")} unid.
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    Preço médio ponderado:{" "}
                    <strong className="text-cyan-300">
                      R$ {deriveFromRegional(regionalSales).salePrice.toFixed(2)}
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    Regiões ativas:{" "}
                    <strong className="text-white">
                      {regionalSales.filter((r) => r.active).length} / {regionalSales.length}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fallback when groups not loaded: classic fields */
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Input
              label="Preço de venda R$"
              type="number"
              value={d.salePrice}
              onChange={(e) => set("salePrice", e.target.value)}
              min={priceMin ?? 0.1}
              step={0.5}
            />
            <Input
              label="Previsão de vendas"
              type="number"
              value={d.expectedSales}
              onChange={(e) => set("expectedSales", e.target.value)}
              min={0}
            />
          </div>
        )}

        {/* Marketing and discount (always shown) */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input label="Invest. marketing R$" type="number" value={d.marketing} onChange={(e) => set("marketing", e.target.value)} min={0} />
          <Input label="Desconto %" type="number" value={d.discount} onChange={(e) => set("discount", e.target.value)} min={0} max={50} step={0.5} />
          <Select
            label="Prazo de recebimento"
            value={d.receivableTerm}
            onChange={(e) => set("receivableTerm", e.target.value)}
            options={RECEIVABLE_OPTIONS}
          />
        </div>
      </div>

      {/* FINANCEIRO */}
      <div>
        <SectionTitle>💰 Gestão Financeira</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input label="Empréstimo R$" type="number" value={d.loan} onChange={(e) => set("loan", e.target.value)} min={0} />

          {/* Taxa de juros — BLOQUEADA (fixada pelo professor) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Taxa de juros %</label>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 cursor-not-allowed select-none">
              <span className="flex-1 font-semibold text-white">{d.loanRate}%</span>
              <span className="ml-2 rounded bg-slate-700/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Fixo
              </span>
            </div>
            <p className="text-[10px] text-slate-600">Definida pelo professor — não editável</p>
          </div>

          <Input label="Compra imobilizado R$" type="number" value={d.machineInvestment} onChange={(e) => set("machineInvestment", e.target.value)} min={0} />
        </div>
      </div>

      {/* DESPESAS */}
      <div>
        <SectionTitle>📋 Despesas Operacionais</SectionTitle>

        {(lockedFixedExpenses != null || lockedTransport != null || lockedMaintenance != null) && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm">
            <span className="text-amber-400">🔒</span>
            <p className="text-slate-300">
              Um ou mais valores foram <strong className="text-amber-300">fixados pelo professor</strong> e não podem ser alterados.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {lockedFixedExpenses != null ? (
            <LockedField
              label="Despesas Fixas R$"
              value={lockedFixedExpenses}
            />
          ) : (
            <Input label="Despesas fixas R$" type="number" value={d.fixedExpenses} onChange={(e) => set("fixedExpenses", e.target.value)} min={0} />
          )}

          {lockedTransport != null ? (
            <LockedField
              label="Transporte R$"
              value={lockedTransport}
            />
          ) : (
            <Input label="Transporte R$" type="number" value={d.transport} onChange={(e) => set("transport", e.target.value)} min={0} />
          )}

          {lockedMaintenance != null ? (
            <LockedField
              label="Manutenção R$"
              value={lockedMaintenance}
            />
          ) : (
            <Input label="Manutenção R$" type="number" value={d.maintenance} onChange={(e) => set("maintenance", e.target.value)} min={0} />
          )}
        </div>
      </div>
    </fieldset>
  );
}
