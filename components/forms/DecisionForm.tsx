"use client";

import { Input, Select } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { Decision, Group, MachinePurchase, RegionalSale } from "@/types";
import {
  DEFAULT_DECISION,
  DEFAULT_MACHINE_PURCHASE,
  DEFAULT_EMPLOYEES,
  MACHINE_CATALOG,
  MACHINE_INSTALLMENT_RATE,
  BASE_PRODUCTION_CAPACITY,
  DEFAULT_MARKETING_INSERTION_COST,
  REGIONAL_TRANSPORT_COST_PER_UNIT,
  HIRING_COST_MULTIPLIER,
  FIRING_COST_MULTIPLIER,
} from "@/lib/simulation/engine";

interface Props {
  decision: Decision;
  onChange: (decision: Decision) => void;
  disabled?: boolean;
  groups?: Group[];      // all regions / groups available for regional sales
  myGroup?: Group;       // o grupo do aluno (para identificar a região de origem)
  priceMin?: number | null;
  priceMax?: number | null;
  // Despesas travadas pelo professor (null = aluno pode editar)
  lockedFixedExpenses?: number | null;
  lockedTransport?: number | null;
  lockedMaintenance?: number | null;
  lockedAvgSalary?: number | null;
  // Preços unitários de materiais travados (null = aluno define livremente)
  lockedPlasticUnit?: number | null;
  lockedCapsUnit?: number | null;
  lockedPackageUnit?: number | null;
  lockedLabelUnit?: number | null;
  // Saldo de matéria-prima da rodada anterior (carryover)
  materialStock?: { plastic: number; caps: number; package: number; label: number };
  // Capacidade acumulada de máquinas de rounds anteriores (carryover)
  accumulatedMachineCapacity?: number;
  // Funcionários ativos no início da rodada (carryover Migration 008)
  currentEmployees?: number;
  // Custo por inserção de marketing (configurado pelo professor, null = padrão)
  marketingInsertionCost?: number | null;
  // Min funcionários por 1.000 unidades (null = padrão)
  machineMinEmployees?: number | null;
  // Encargos sobre folha salarial em % (null/0 = sem encargos)
  payrollChargesPct?: number | null;
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
          R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
  const active = rs.filter((r) => r.active && (r.price || 0) > 0);
  if (!active.length) return { salePrice: 0, expectedSales: rs.filter((r) => r.active).reduce((s, r) => s + (r.qty || 0), 0) };

  const totalQty = active.reduce((s, r) => s + (r.qty || 0), 0);
  const weightedPrice =
    totalQty > 0
      ? active.reduce((s, r) => s + (r.price || 0) * (r.qty || 0), 0) / totalQty
      : active[0].price;

  const totalQtyAll = rs.filter((r) => r.active).reduce((s, r) => s + (r.qty || 0), 0);
  return { salePrice: Math.round(weightedPrice * 100) / 100, expectedSales: totalQtyAll };
}

export function DecisionForm({
  decision,
  onChange,
  disabled = false,
  groups = [],
  myGroup,
  priceMin,
  priceMax,
  lockedFixedExpenses,
  lockedTransport,
  lockedMaintenance,
  lockedAvgSalary,
  lockedPlasticUnit,
  lockedCapsUnit,
  lockedPackageUnit,
  lockedLabelUnit,
  materialStock,
  accumulatedMachineCapacity = 0,
  currentEmployees: currentEmployeesProp,
  marketingInsertionCost: marketingInsertionCostProp,
  machineMinEmployees,
  payrollChargesPct,
}: Props) {
  const d = { ...DEFAULT_DECISION, ...decision };

  // Funcionários ativos no início desta rodada
  const prevEmployees = currentEmployeesProp ?? DEFAULT_EMPLOYEES;
  const admitted  = Math.max(0, Number(d.admittedEmployees ?? 0));
  const dismissed = Math.max(0, Number(d.dismissedEmployees ?? 0));
  const netEmployees = Math.max(0, prevEmployees + admitted - Math.min(dismissed, prevEmployees + admitted));

  // Custo de inserção por unidade
  const insertionUnitCost = marketingInsertionCostProp ?? DEFAULT_MARKETING_INSERTION_COST;
  const insertions = Math.min(8, Math.max(0, Number(d.marketingInsertions ?? 0)));
  const totalInsertionCost = insertions * insertionUnitCost;

  // Status dos funcionários (cálculo client-side para prévia)
  const minEmployeesPerThousand = machineMinEmployees ?? 3;
  const unitsPerEmployee = Math.max(1, Math.floor(1000 / minEmployeesPerThousand));
  const minEmployeesNeeded = Math.max(1, Math.ceil(Number(d.productionQty) / unitsPerEmployee));
  const idleEmployees    = Math.max(0, netEmployees - minEmployeesNeeded);
  const missingEmployees = Math.max(0, minEmployeesNeeded - netEmployees);
  const employeeRatio    = minEmployeesNeeded > 0 ? netEmployees / minEmployeesNeeded : 1;
  const idleRatio        = netEmployees > 0 ? idleEmployees / netEmployees : 0;

  let employeeStatus: "good" | "alert" | "strike";
  let employeeStatusLabel: string;
  let employeeStatusColor: string;
  let employeeStatusEmoji: string;
  let employeeProductionFactor: number;

  if (employeeRatio < 0.65 || idleRatio > 0.60) {
    employeeStatus = "strike";
    employeeStatusLabel = "Está em greve";
    employeeStatusColor = "text-rose-400";
    employeeStatusEmoji = "🔴";
    employeeProductionFactor = 0.70;
  } else if (employeeRatio < 0.85 || idleRatio > 0.35) {
    employeeStatus = "alert";
    employeeStatusLabel = "Está em alerta";
    employeeStatusColor = "text-amber-400";
    employeeStatusEmoji = "⚠️";
    employeeProductionFactor = 0.90;
  } else {
    employeeStatus = "good";
    employeeStatusLabel = "Está bom";
    employeeStatusColor = "text-emerald-400";
    employeeStatusEmoji = "✅";
    employeeProductionFactor = 1.0;
  }

  // Custo de hiring/firing
  const hiringCost = admitted  * Number(d.laborCost) * HIRING_COST_MULTIPLIER;
  const firingCost = dismissed * Number(d.laborCost) * FIRING_COST_MULTIPLIER;

  const set = (key: keyof Decision, value: number | string) => {
    onChange({ ...d, [key]: typeof value === "string" ? Number(value) : value });
  };

  // Quando altera admitted/dismissed, também atualiza d.employees para manter compat
  const setEmployees = (patch: { admittedEmployees?: number; dismissedEmployees?: number }) => {
    const newAdmitted  = patch.admittedEmployees  ?? admitted;
    const newDismissed = patch.dismissedEmployees ?? dismissed;
    const safeDismissed = Math.min(newDismissed, prevEmployees + newAdmitted);
    const net = Math.max(0, prevEmployees + newAdmitted - safeDismissed);
    onChange({
      ...d,
      admittedEmployees:  newAdmitted,
      dismissedEmployees: safeDismissed,
      employees: net,
    });
  };

  /* ── Machine purchase helpers ──────────────────────────────────────────────── */
  const currentMachines: MachinePurchase = { ...DEFAULT_MACHINE_PURCHASE, ...(d.machines ?? {}) };
  const setMachines = (patch: Partial<MachinePurchase>) => {
    onChange({ ...d, machines: { ...currentMachines, ...patch } });
  };
  void setMachines; // silencia lint (usado em setMachineQty / setPaymentMethod)

  // Totais calculados para exibição
  const totalMachineCost = MACHINE_CATALOG.reduce(
    (acc, m) => acc + Math.max(0, Number(currentMachines[m.id] || 0)) * m.price,
    0
  );
  const totalMachineCapacity = MACHINE_CATALOG.reduce(
    (acc, m) => acc + Math.max(0, Number(currentMachines[m.id] || 0)) * m.capacity,
    0
  );
  const machineDownPayment =
    currentMachines.paymentMethod === "installments" ? totalMachineCost / 3 : totalMachineCost;
  const machineDeferred =
    currentMachines.paymentMethod === "installments" ? (totalMachineCost * 2) / 3 : 0;
  const machineInterestTotal = machineDeferred * MACHINE_INSTALLMENT_RATE * 2;

  /* ── Regional Sales helpers ─────────────────────────────────────────────── */
  const regionalSales: RegionalSale[] = (() => {
    if (d.regionalSales && d.regionalSales.length > 0) {
      return groups.map((g) => {
        const existing = d.regionalSales!.find((rs) => rs.group_id === g.id);
        if (existing) return existing;
        // Nova região adicionada: preço começa BRANCO
        return { group_id: g.id, region_name: g.region_name, qty: 0, price: 0, active: false };
      });
    }
    // Primeira vez: todas inativas, preço BRANCO (aluno digita)
    return groups.map((g) => ({
      group_id: g.id,
      region_name: g.region_name,
      qty: 0,
      price: 0,
      active: false,
    }));
  })();

  const updateRegional = (idx: number, patch: Partial<RegionalSale>) => {
    const updated = regionalSales.map((rs, i) => (i === idx ? { ...rs, ...patch } : rs));
    const derived = deriveFromRegional(updated);
    onChange({ ...d, regionalSales: updated, ...derived });
  };

  const hasGroups = groups.length > 0;

  // Identifica se a região da venda é a mesma do grupo do aluno
  const homeRegion = myGroup?.region_name ?? null;

  // Handler explícito para quantidade de máquinas — usado fora do <fieldset>
  const setMachineQty = (type: "small" | "medium" | "large", delta: number) => {
    const current = Math.max(0, Number(currentMachines[type] || 0));
    const next = Math.max(0, current + delta);
    onChange({ ...d, machines: { ...currentMachines, [type]: next } });
  };

  const setPaymentMethod = (method: "cash" | "installments") => {
    onChange({ ...d, machines: { ...currentMachines, paymentMethod: method } });
  };

  return (
    <div className="space-y-8">
    {/* ── Seções dentro do fieldset (inputs controlados pelo disabled) ── */}
    <fieldset disabled={disabled} className="w-full min-w-0 space-y-8 border-0 p-0 m-0">
      {/* PRODUÇÃO */}
      <div>
        <SectionTitle>🏭 Produção</SectionTitle>

        {/* Capacidade travada — só aumenta comprando máquinas */}
        {(() => {
          const machinesThisRound = MACHINE_CATALOG.reduce(
            (acc, m) => acc + Math.max(0, Number(currentMachines[m.id] || 0)) * m.capacity,
            0
          );
          const effectiveCap = BASE_PRODUCTION_CAPACITY + accumulatedMachineCapacity + machinesThisRound;
          return (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Capacidade de Produção (calculada automaticamente)
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg bg-white/5 px-2.5 py-2 text-center">
                  <p className="text-slate-400">Base da fábrica</p>
                  <p className="font-black text-white mt-0.5">{BASE_PRODUCTION_CAPACITY.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-slate-600">unidades</p>
                </div>
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-2 text-center">
                  <p className="text-slate-400">Máquinas acumuladas</p>
                  <p className="font-black text-cyan-400 mt-0.5">+{(accumulatedMachineCapacity + machinesThisRound).toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-slate-600">unidades</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-2 text-center">
                  <p className="text-slate-400">Capacidade total</p>
                  <p className="font-black text-emerald-400 mt-0.5">{effectiveCap.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-slate-600">unidades</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-600 italic">
                🔒 Travado — compre máquinas na seção abaixo para aumentar a capacidade.
              </p>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Input label="Qtd. a produzir (unid.)" type="number" value={Number(d.productionQty) === 0 ? "" : d.productionQty} onChange={(e) => set("productionQty", e.target.value)} min={0} step={1} placeholder="Digite a quantidade a produzir" />
          {/* Colaboradores — agora exibido como campo somente-leitura */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Colaboradores Ativos (resultado)</p>
            <p className="text-2xl font-black text-white">{netEmployees}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {prevEmployees} anterior{admitted > 0 ? ` +${admitted}` : ""}{dismissed > 0 ? ` −${dismissed}` : ""}
            </p>
          </div>
          {lockedAvgSalary != null ? (
            <div className="flex flex-col gap-1">
              <LockedField label="Valor Médio de Salário R$" value={lockedAvgSalary} />
              {(() => {
                const folha = netEmployees * lockedAvgSalary;
                const pct = payrollChargesPct ?? 0;
                const encargos = folha * (pct / 100);
                return (
                  <p className="text-[10px] text-slate-500">
                    Folha: R$ {folha.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    {pct > 0 && <> · Encargos {pct}%: <span className="text-rose-400">R$ {encargos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> · Custo total: <span className="text-white font-semibold">R$ {(folha + encargos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></>}
                  </p>
                );
              })()}
            </div>
          ) : (
            <div>
              <CurrencyInput label="Valor Médio de Salário" value={d.laborCost || null} onChange={(n) => set("laborCost", n ?? 0)} />
              {(() => {
                const folha = netEmployees * (d.laborCost || 0);
                const pct = payrollChargesPct ?? 0;
                const encargos = folha * (pct / 100);
                return (
                  <p className="mt-1 text-[10px] text-slate-500">
                    {d.laborCost > 0 && netEmployees > 0 ? (
                      <>
                        Folha: R$ {folha.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        {pct > 0 && <> · Encargos {pct}%: <span className="text-rose-400">R$ {encargos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> · Custo total: <span className="text-white font-semibold">R$ {(folha + encargos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></>}
                      </>
                    ) : "Informe o salário"}
                  </p>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Gestão de Colaboradores ─────────────────────────────────────────── */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            👥 Gestão de Colaboradores
          </p>

          {/* Admissões e Demissões */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Input
                label="Qtd. Admitidos"
                type="number"
                value={admitted}
                onChange={(e) => setEmployees({ admittedEmployees: Math.max(0, Number(e.target.value)) })}
                min={0}
              />
              {admitted > 0 && (
                <p className="mt-1 text-[10px] text-emerald-400">
                  Custo de contratação: R$ {hiringCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <div>
              <Input
                label="Qtd. Demitidos"
                type="number"
                value={dismissed}
                onChange={(e) => setEmployees({ dismissedEmployees: Math.max(0, Number(e.target.value)) })}
                min={0}
                max={prevEmployees + admitted}
              />
              {dismissed > 0 && (
                <p className="mt-1 text-[10px] text-rose-400">
                  Custo de demissão: R$ {firingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {/* Painel de Status dos Colaboradores */}
          <div className={`rounded-xl border p-3 ${
            employeeStatus === "strike"
              ? "border-rose-500/30 bg-rose-500/5"
              : employeeStatus === "alert"
              ? "border-amber-400/30 bg-amber-500/5"
              : "border-emerald-400/20 bg-emerald-500/5"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Status dos Colaboradores
              </p>
              <span className={`text-sm font-black ${employeeStatusColor}`}>
                {employeeStatusEmoji} {employeeStatusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
              <div>
                <p className="text-slate-500">Disponíveis</p>
                <p className="font-bold text-white">{netEmployees}</p>
              </div>
              <div>
                <p className="text-slate-500">Necessários*</p>
                <p className={`font-bold ${missingEmployees > 0 ? "text-rose-400" : "text-white"}`}>
                  {minEmployeesNeeded}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Ociosos</p>
                <p className={`font-bold ${idleRatio > 0.35 ? "text-amber-400" : "text-slate-300"}`}>
                  {idleEmployees}
                  {idleEmployees > 0 ? ` (${(idleRatio * 100).toFixed(0)}%)` : ""}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Faltando</p>
                <p className={`font-bold ${missingEmployees > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {missingEmployees > 0 ? missingEmployees : "0 ✓"}
                </p>
              </div>
            </div>

            {employeeStatus !== "good" && (
              <div className={`mt-2.5 rounded-lg px-3 py-2 text-xs ${
                employeeStatus === "strike"
                  ? "bg-rose-500/10 text-rose-300"
                  : "bg-amber-500/10 text-amber-300"
              }`}>
                {employeeStatus === "strike" ? (
                  <>
                    <strong>⚠️ Greve!</strong>{" "}
                    {missingEmployees > 0
                      ? `Faltam ${missingEmployees} colaborador(es) para a produção planejada. `
                      : `${idleEmployees} colaboradores ociosos (${(idleRatio * 100).toFixed(0)}%). `}
                    Produção reduzida para <strong>{(employeeProductionFactor * 100).toFixed(0)}%</strong> da capacidade.
                  </>
                ) : (
                  <>
                    <strong>⚠️ Atenção:</strong>{" "}
                    {missingEmployees > 0
                      ? `${missingEmployees} colaborador(es) abaixo do ideal. `
                      : `${idleEmployees} colaboradores ociosos. `}
                    Produção com <strong>{((1 - employeeProductionFactor) * 100).toFixed(0)}%</strong> de perda.
                  </>
                )}
              </div>
            )}

            <p className="mt-2 text-[10px] text-slate-600 italic">
              * Necessários: {minEmployeesNeeded} = {Number(d.productionQty).toLocaleString("pt-BR")} unid. ÷ {unitsPerEmployee} un./colab.
            </p>
          </div>
        </div>
      </div>
    </fieldset>

    {/* ── Compra de Máquinas — FORA do fieldset para os botões funcionarem ── */}
    <div className={disabled ? "pointer-events-none select-none opacity-50" : ""}>
      <SectionTitle>🔧 Compra de Máquinas</SectionTitle>
        <p className="mb-4 text-xs text-slate-400 leading-relaxed">
          Selecione quantas máquinas deseja adquirir nesta rodada. A capacidade é{" "}
          <strong className="text-white">acumulativa</strong> — máquinas compradas agora
          continuam produzindo nas rodadas seguintes. Você pode combinar tipos livremente.
        </p>

        {/* Aviso sobre colaboradores necessários para as máquinas */}
        {totalMachineCapacity > 0 && (
          <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-xs">
            <p className="font-semibold text-amber-300 mb-1">👷 Colaboradores para operar as novas máquinas</p>
            <p className="text-slate-400">
              Capacidade adicional:{" "}
              <strong className="text-white">+{totalMachineCapacity.toLocaleString("pt-BR")} unid.</strong>{" "}
              · Requer mais{" "}
              <strong className="text-amber-300">
                {Math.ceil(totalMachineCapacity / unitsPerEmployee)} colaborador(es)
              </strong>{" "}
              (base: {unitsPerEmployee} unid./colab.)
            </p>
          </div>
        )}

        {/* Cards das máquinas */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {MACHINE_CATALOG.map((machine) => {
            const qty = Math.max(0, Number(currentMachines[machine.id] || 0));
            const subtotal = qty * machine.price;
            const employeesNeededForMachine = Math.ceil(machine.capacity / unitsPerEmployee);
            return (
              <div
                key={machine.id}
                className={`rounded-xl border p-4 transition-all ${
                  qty > 0
                    ? "border-cyan-400/30 bg-cyan-500/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {/* Cabeçalho do card */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white text-sm">{machine.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      +{machine.capacity.toLocaleString("pt-BR")} unid./rodada
                    </p>
                    <p className="text-[11px] text-amber-400 mt-0.5">
                      👷 +{employeesNeededForMachine} colab. necessários
                    </p>
                    <p className="text-sm font-black text-cyan-400 mt-1">
                      R$ {machine.price.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-3xl leading-none">{machine.icon}</span>
                </div>

                {/* Seletor de quantidade */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMachineQty(machine.id, -1)}
                    className={`h-9 w-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors ${
                      qty === 0
                        ? "border-white/10 bg-white/5 text-slate-600 cursor-not-allowed"
                        : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-black text-white">{qty}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">unidade{qty !== 1 ? "s" : ""}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMachineQty(machine.id, 1)}
                    className="h-9 w-9 rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 font-bold text-lg hover:bg-cyan-400/20 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal do tipo */}
                {qty > 0 && (
                  <div className="mt-3 rounded-lg bg-white/5 px-2.5 py-1.5 text-center">
                    <p className="text-xs text-slate-400">
                      Subtotal:{" "}
                      <strong className="text-emerald-400">
                        R$ {subtotal.toLocaleString("pt-BR")}
                      </strong>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      +{(qty * machine.capacity).toLocaleString("pt-BR")} unid. de capacidade
                    </p>
                    <p className="text-[10px] text-amber-400 mt-0.5">
                      👷 +{qty * employeesNeededForMachine} colab. necessários
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Painel de pagamento */}
        {totalMachineCost > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
            {/* Forma de pagamento */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Forma de Pagamento
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* À vista */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    currentMachines.paymentMethod === "cash"
                      ? "border-emerald-400/40 bg-emerald-500/10 ring-1 ring-emerald-400/20"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                      currentMachines.paymentMethod === "cash"
                        ? "border-emerald-400 bg-emerald-400"
                        : "border-white/30"
                    }`}>
                      {currentMachines.paymentMethod === "cash" && (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                      )}
                    </div>
                    <p className={`font-bold text-sm ${
                      currentMachines.paymentMethod === "cash" ? "text-emerald-400" : "text-slate-300"
                    }`}>
                      À Vista
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">Pagamento em 15 dias</p>
                  <p className="text-xs font-semibold text-white mt-1.5">
                    R$ {totalMachineCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-emerald-500 mt-0.5">Sem juros</p>
                </button>

                {/* 3× parcelado */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("installments")}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    currentMachines.paymentMethod === "installments"
                      ? "border-amber-400/40 bg-amber-500/10 ring-1 ring-amber-400/20"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                      currentMachines.paymentMethod === "installments"
                        ? "border-amber-400 bg-amber-400"
                        : "border-white/30"
                    }`}>
                      {currentMachines.paymentMethod === "installments" && (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                      )}
                    </div>
                    <p className={`font-bold text-sm ${
                      currentMachines.paymentMethod === "installments" ? "text-amber-400" : "text-slate-300"
                    }`}>
                      3× Parcelado
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Juros: {(MACHINE_INSTALLMENT_RATE * 100).toFixed(1)}% a.m.
                  </p>
                  <p className="text-xs font-semibold text-white mt-1.5">
                    Entrada: R$ {(totalMachineCost / 3).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-amber-500 mt-0.5">
                    + 2× R$ {((totalMachineCost / 3) * (1 + MACHINE_INSTALLMENT_RATE)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </button>
              </div>
            </div>

            {/* Resumo da compra */}
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 space-y-1.5 text-xs">
              <p className="font-black uppercase tracking-widest text-slate-500 text-[10px] mb-2">
                Resumo da Compra
              </p>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacidade adicionada</span>
                <span className="font-bold text-cyan-400">
                  +{totalMachineCapacity.toLocaleString("pt-BR")} unid.
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Custo total das máquinas</span>
                <span className="font-bold text-white">
                  R$ {totalMachineCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1.5">
                <span className="text-slate-400">
                  {currentMachines.paymentMethod === "cash" ? "Pago agora (saída de caixa)" : "Entrada paga agora"}
                </span>
                <span className={`font-bold ${currentMachines.paymentMethod === "cash" ? "text-rose-400" : "text-amber-400"}`}>
                  R$ {machineDownPayment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {currentMachines.paymentMethod === "installments" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parcelas restantes (passivo)</span>
                    <span className="font-bold text-slate-300">
                      R$ {machineDeferred.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total de juros</span>
                    <span className="font-bold text-amber-300">
                      R$ {machineInterestTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span className="text-slate-400">Custo total com juros</span>
                    <span className="font-black text-white">
                      R$ {(totalMachineCost + machineInterestTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Adicionado ao Imobilizado (BP)</span>
                <span className="font-bold text-emerald-400">
                  +R$ {totalMachineCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
    </div>
    {/* ── Fim da seção de máquinas ── */}

    {/* ── Materiais, Vendas, Marketing, Financeiro ── */}
    <fieldset disabled={disabled} className="w-full min-w-0 space-y-8 border-0 p-0 m-0">
      {/* MATERIAIS */}
      <div>
        <SectionTitle>📦 Compra de Materiais</SectionTitle>

        {/* Banner preços travados — compacto */}
        {(lockedPlasticUnit != null || lockedCapsUnit != null || lockedPackageUnit != null || lockedLabelUnit != null) && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs text-slate-300">
            <span className="text-amber-400 shrink-0">🔒</span>
            Um ou mais preços foram <strong className="text-amber-300 ml-1">fixados pelo professor</strong>.
          </div>
        )}

        {/* Saldo da rodada anterior — compacto */}
        {materialStock && (materialStock.plastic > 0 || materialStock.caps > 0 || materialStock.package > 0 || materialStock.label > 0) && (
          <div className="mb-2 rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400 mb-1.5">
              📦 Estoque anterior disponível
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {[
                { label: "Plástico",  qty: materialStock.plastic },
                { label: "Tampas",    qty: materialStock.caps },
                { label: "Embalagem", qty: materialStock.package },
                { label: "Rótulo",    qty: materialStock.label },
              ].map(({ label, qty }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">{label}:</span>
                  <span className={`font-bold tabular-nums ${qty > 0 ? "text-cyan-300" : "text-slate-600"}`}>
                    {qty.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Campo único + preços unitários em grid unificado ── */}
        {(() => {
          const totalProductsQty = Number(d.plasticQty || 0);

          const setAllMaterials = (qty: number) => {
            onChange({ ...d, plasticQty: qty, capsQty: qty, packageQty: qty, labelQty: qty });
          };

          const uPlastic = lockedPlasticUnit ?? Number(d.plasticUnit || 0);
          const uCaps    = lockedCapsUnit    ?? Number(d.capsUnit    || 0);
          const uPkg     = lockedPackageUnit ?? Number(d.packageUnit || 0);
          const uLabel   = lockedLabelUnit   ?? Number(d.labelUnit   || 0);
          const costPerProduct = uPlastic + uCaps + uPkg + uLabel;
          const totalMaterialCost = totalProductsQty * costPerProduct;

          const minStock = Math.min(
            materialStock?.plastic ?? 0,
            materialStock?.caps    ?? 0,
            materialStock?.package ?? 0,
            materialStock?.label   ?? 0,
          );

          return (
            <>
              {/* Linha 1: qty + prazo + 4 preços unitários em desktop */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
                {/* Qty */}
                <div className="sm:col-span-1 lg:col-span-2">
                  <Input
                    label="Qtd. de produtos completos"
                    type="number"
                    value={totalProductsQty || ""}
                    onChange={(e) => setAllMaterials(Math.max(0, Number(e.target.value) || 0))}
                    min={0}
                  />
                  {minStock > 0 ? (
                    <p className="mt-0.5 text-[10px] text-cyan-400">
                      +{minStock.toLocaleString("pt-BR")} kits do estoque anterior
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      1 und = 1 plástico + 1 tampa + 1 embal. + 1 rótulo
                    </p>
                  )}
                </div>

                {/* Prazo fornecedor */}
                <div className="sm:col-span-1 lg:col-span-1">
                  <Select
                    label="Prazo fornecedor"
                    value={d.supplierTerm}
                    onChange={(e) => set("supplierTerm", e.target.value)}
                    options={SUPPLIER_OPTIONS}
                  />
                </div>

                {/* 4 preços unitários */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="grid grid-cols-2 gap-2 xs:grid-cols-4 sm:grid-cols-4">
                    {lockedPlasticUnit != null ? (
                      <LockedField label="Plástico" value={lockedPlasticUnit} />
                    ) : (
                      <CurrencyInput label="Plástico" value={d.plasticUnit || null} onChange={(n) => set("plasticUnit", n ?? 0)} />
                    )}
                    {lockedCapsUnit != null ? (
                      <LockedField label="Tampas" value={lockedCapsUnit} />
                    ) : (
                      <CurrencyInput label="Tampas" value={d.capsUnit || null} onChange={(n) => set("capsUnit", n ?? 0)} />
                    )}
                    {lockedPackageUnit != null ? (
                      <LockedField label="Embalagem" value={lockedPackageUnit} />
                    ) : (
                      <CurrencyInput label="Embalagem" value={d.packageUnit || null} onChange={(n) => set("packageUnit", n ?? 0)} />
                    )}
                    {lockedLabelUnit != null ? (
                      <LockedField label="Rótulo" value={lockedLabelUnit} />
                    ) : (
                      <CurrencyInput label="Rótulo" value={d.labelUnit || null} onChange={(n) => set("labelUnit", n ?? 0)} />
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo do pedido — linha compacta */}
              {totalProductsQty > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-cyan-400/15 bg-cyan-500/5 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 shrink-0">
                    📋 Pedido:
                  </span>
                  {["Plástico", "Tampas", "Embalagem", "Rótulo"].map((label) => (
                    <span key={label} className="text-xs text-slate-300">
                      <span className="text-slate-500">{label} </span>
                      <span className="font-bold tabular-nums text-white">{totalProductsQty.toLocaleString("pt-BR")}</span>
                    </span>
                  ))}
                  {costPerProduct > 0 && (
                    <span className="ml-auto text-xs font-black text-white tabular-nums">
                      Total: R$ {totalMaterialCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* VENDAS POR REGIÃO */}
      <div>
        <SectionTitle>🗺️ Vendas por Região</SectionTitle>

        {/* Professor price limits banner */}
        {(priceMin != null || priceMax != null) && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm min-w-0">
            <span className="text-amber-400 text-base">💰</span>
            <div>
              <p className="font-semibold text-amber-300">Faixa de preço permitida pelo professor</p>
              <p className="text-slate-300 mt-0.5">
                {priceMin != null && priceMax != null && `R$ ${priceMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} – R$ ${priceMax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                {priceMin != null && priceMax == null && `Mínimo: R$ ${priceMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                {priceMin == null && priceMax != null && `Máximo: R$ ${priceMax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
        )}

        {/* Aviso sobre custo regional */}
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-3 text-xs">
          <span className="text-cyan-400">🚚</span>
          <p className="text-slate-400">
            <strong className="text-cyan-300">Custo de logística regional:</strong>{" "}
            Vendas fora da sua região de origem geram custo adicional de{" "}
            <strong className="text-white">R$ {REGIONAL_TRANSPORT_COST_PER_UNIT.toFixed(2)}/unidade</strong>.
            {homeRegion && ` Sua região base é ${homeRegion}.`}
          </p>
        </div>

        {hasGroups ? (
          <div className="w-full min-w-0">
            {/* ── Layout mobile: um card por região (< sm) ── */}
            <div className="flex flex-col gap-3 sm:hidden">
              {regionalSales.map((rs, idx) => {
                const isHome = homeRegion && rs.region_name === homeRegion;
                return (
                  <div
                    key={rs.group_id}
                    className={`rounded-xl border p-3 transition-all ${
                      rs.active
                        ? isHome
                          ? "border-emerald-400/30 bg-emerald-500/10"
                          : "border-cyan-400/30 bg-cyan-500/10"
                        : "border-white/10 bg-white/[0.02] opacity-70"
                    }`}
                  >
                    {/* Cabeçalho do card com toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-white text-sm">{rs.region_name}</span>
                        {isHome && <span className="ml-2 text-[10px] text-emerald-400">🏠 origem</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => !disabled && updateRegional(idx,
                          rs.active
                            ? { active: false, qty: 0, price: 0, insertions: 0 }
                            : { active: true }
                        )}
                        disabled={disabled}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          rs.active
                            ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                            : "border-white/20 bg-white/5 text-slate-400"
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded border-2 flex items-center justify-center shrink-0 ${
                          rs.active ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/30"
                        }`}>
                          {rs.active && (
                            <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </span>
                        {rs.active ? "Vender aqui" : "Não vender"}
                      </button>
                    </div>

                    {/* Campos — só editáveis quando ativa */}
                    <div className={`grid grid-cols-2 gap-2 ${!rs.active ? "opacity-40 pointer-events-none" : ""}`}>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Qtd. (unid.)</label>
                        <input
                          type="number" min={0}
                          value={rs.qty === 0 ? "" : rs.qty}
                          disabled={disabled || !rs.active}
                          onChange={(e) => updateRegional(idx, { qty: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none disabled:opacity-40"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inserções Mkt.</label>
                        <input
                          type="number" min={0} max={8}
                          value={rs.active && (rs.insertions ?? 0) > 0 ? rs.insertions : ""}
                          disabled={disabled || !rs.active}
                          onChange={(e) => {
                            const v = Math.min(8, Math.max(0, Number(e.target.value)));
                            const updated = regionalSales.map((r, i) => i === idx ? { ...r, insertions: v } : r);
                            const derived = deriveFromRegional(updated);
                            const totalIns = updated.filter((r) => r.active).reduce((s, r) => s + (r.insertions ?? 0), 0);
                            onChange({ ...d, regionalSales: updated, ...derived, marketingInsertions: Math.min(8, totalIns) });
                          }}
                          placeholder="0"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-400/50 focus:outline-none disabled:opacity-40"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preço de venda (R$)</label>
                        <CurrencyInput
                          value={rs.active && rs.price > 0 ? rs.price : null}
                          onChange={(n) => updateRegional(idx, { price: n ?? 0 })}
                          disabled={disabled || !rs.active}
                          placeholder="0,00"
                          error={
                            rs.active
                              ? rs.price <= 0 ? "Informe o preço"
                              : priceMin != null && rs.price < priceMin ? `Mín. R$ ${priceMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : priceMax != null && rs.price > priceMax ? `Máx. R$ ${priceMax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : undefined
                              : undefined
                          }
                          className={
                            rs.active && ((priceMin != null && rs.price < priceMin) || (priceMax != null && rs.price > priceMax) || rs.price <= 0)
                              ? "" : "border-white/10 focus:border-cyan-400/50"
                          }
                        />
                      </div>
                    </div>
                    {rs.active && (rs.insertions ?? 0) > 0 && (
                      <p className="mt-1 text-[10px] text-purple-400 text-right">
                        Mkt: R$ {((rs.insertions ?? 0) * insertionUnitCost).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Layout desktop: grade por coluna (≥ sm) ── */}
            <div className="hidden sm:block w-full overflow-x-auto">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `140px repeat(${regionalSales.length}, minmax(130px, 1fr))`, minWidth: `${140 + regionalSales.length * 130}px` }}
              >
              {/* Row 0: empty corner + region column headers */}
              <div />
              {regionalSales.map((rs) => {
                const isHome = homeRegion && rs.region_name === homeRegion;
                return (
                  <div
                    key={rs.group_id}
                    className={`rounded-xl border px-3 py-2 text-center transition-all ${
                      rs.active
                        ? isHome
                          ? "border-emerald-400/30 bg-emerald-500/10"
                          : "border-cyan-400/30 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 opacity-60"
                    }`}
                  >
                    <span className="text-sm font-bold text-white">{rs.region_name}</span>
                    {isHome && <span className="ml-1.5 text-[10px] text-emerald-400">🏠 origem</span>}
                  </div>
                );
              })}

              {/* Row 1: Vender aqui? */}
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Vender aqui?
              </div>
              {regionalSales.map((rs, idx) => (
                <div key={rs.group_id} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => !disabled && updateRegional(idx,
                      rs.active
                        ? { active: false, qty: 0, price: 0, insertions: 0 }
                        : { active: true }
                    )}
                    disabled={disabled}
                    title={rs.active ? "Desmarcar região" : "Marcar para vender"}
                    className={`h-7 w-7 rounded border-2 transition-colors flex items-center justify-center ${
                      rs.active
                        ? "bg-cyan-400 border-cyan-400 text-slate-950"
                        : "border-white/30 bg-white/5"
                    }`}
                  >
                    {rs.active && (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}

              {/* Row 2: Quantidade */}
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quantidade (unid.)
              </div>
              {regionalSales.map((rs, idx) => (
                <div key={rs.group_id}>
                  <input
                    type="number" min={0}
                    value={rs.qty === 0 ? "" : rs.qty}
                    disabled={disabled || !rs.active}
                    onChange={(e) => updateRegional(idx, { qty: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none disabled:opacity-40"
                  />
                </div>
              ))}

              {/* Row 3: Inserções de Marketing */}
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>
                  Inserções Mkt.
                  <span className="block font-normal normal-case text-slate-500">(0–8)</span>
                </span>
              </div>
              {regionalSales.map((rs, idx) => (
                <div key={rs.group_id} className="flex flex-col gap-0.5">
                  <input
                    type="number" min={0} max={8}
                    value={rs.active && (rs.insertions ?? 0) > 0 ? rs.insertions : ""}
                    disabled={disabled || !rs.active}
                    onChange={(e) => {
                      const v = Math.min(8, Math.max(0, Number(e.target.value)));
                      const updated = regionalSales.map((r, i) =>
                        i === idx ? { ...r, insertions: v } : r
                      );
                      const derived = deriveFromRegional(updated);
                      const totalIns = updated.filter((r) => r.active)
                        .reduce((s, r) => s + (r.insertions ?? 0), 0);
                      onChange({ ...d, regionalSales: updated, ...derived, marketingInsertions: Math.min(8, totalIns) });
                    }}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-400/50 focus:outline-none disabled:opacity-40"
                  />
                  {rs.active && (rs.insertions ?? 0) > 0 && (
                    <p className="text-[10px] text-purple-400 text-center">
                      R$ {((rs.insertions ?? 0) * insertionUnitCost).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              ))}

              {/* Row 4: Preço de Venda */}
              <div className="flex items-start pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Preço de Venda
              </div>
              {regionalSales.map((rs, idx) => (
                <div key={rs.group_id}>
                  <CurrencyInput
                    value={rs.active && rs.price > 0 ? rs.price : null}
                    onChange={(n) => updateRegional(idx, { price: n ?? 0 })}
                    disabled={disabled || !rs.active}
                    placeholder="0,00"
                    error={
                      rs.active
                        ? rs.price <= 0 ? "Informe o preço"
                        : priceMin != null && rs.price < priceMin ? `Mín. R$ ${priceMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : priceMax != null && rs.price > priceMax ? `Máx. R$ ${priceMax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : undefined
                        : undefined
                    }
                    className={
                      rs.active && ((priceMin != null && rs.price < priceMin) || (priceMax != null && rs.price > priceMax) || rs.price <= 0)
                        ? "" : "border-white/10 focus:border-cyan-400/50"
                    }
                  />
                </div>
              ))}
            </div>{/* end grid */}
            </div>{/* end desktop wrapper */}

            {/* Summary */}
            {regionalSales.some((rs) => rs.active) && (
              <div className="mt-3 space-y-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
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
                        {deriveFromRegional(regionalSales).salePrice > 0
                          ? `R$ ${deriveFromRegional(regionalSales).salePrice.toFixed(2)}`
                          : "—"}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      Regiões ativas:{" "}
                      <strong className="text-white">
                        {regionalSales.filter((r) => r.active).length} / {regionalSales.length}
                      </strong>
                    </span>
                    {insertions > 0 && (
                      <span className="text-slate-400">
                        Inserções marketing:{" "}
                        <strong className="text-purple-300">
                          {insertions} × R$ {insertionUnitCost.toLocaleString("pt-BR")} = R$ {totalInsertionCost.toLocaleString("pt-BR")}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Custo regional detalhado */}
                {regionalSales.some((rs) => rs.active && homeRegion && rs.region_name !== homeRegion) && (
                  <div className="rounded-xl border border-orange-400/20 bg-orange-500/5 px-4 py-2.5 text-xs">
                    <p className="font-semibold text-orange-300 mb-1">🚚 Custo de logística inter-regional</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                      {regionalSales
                        .filter((rs) => rs.active && homeRegion != null && rs.region_name !== homeRegion)
                        .map((rs) => (
                          <span key={rs.group_id} className="text-slate-400">
                            {rs.region_name}: {(rs.qty || 0).toLocaleString("pt-BR")} unid. ×{" "}
                            R$ {REGIONAL_TRANSPORT_COST_PER_UNIT.toFixed(2)} ={" "}
                            <strong className="text-orange-300">
                              R$ {((rs.qty || 0) * REGIONAL_TRANSPORT_COST_PER_UNIT).toLocaleString("pt-BR")}
                            </strong>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Fallback quando grupos não carregados */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <CurrencyInput
                label="Preço de venda"
                value={d.salePrice > 0 ? d.salePrice : null}
                onChange={(n) => set("salePrice", n ?? 0)}
                placeholder="0,00"
                error={
                  d.salePrice <= 0
                    ? "Informe o preço"
                    : priceMin != null && d.salePrice < priceMin
                    ? `Mín. R$ ${priceMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : priceMax != null && d.salePrice > priceMax
                    ? `Máx. R$ ${priceMax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : undefined
                }
              />
              <Input
                label="Previsão de vendas"
                type="number"
                value={d.expectedSales}
                onChange={(e) => set("expectedSales", e.target.value)}
                min={0}
              />
            </div>
          </div>
        )}

        {/* Marketing global + inserções (exibido quando não tem grade regional) */}
        {!hasGroups && (
          <div className="mt-3 rounded-xl border border-purple-400/20 bg-purple-500/5 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">
              📢 Inserções de Marketing
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">
                  Número de Inserções (0–8)
                </label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={insertions || ""}
                  onChange={(e) => set("marketingInsertions", Math.min(8, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-purple-400/50 focus:outline-none"
                />
              </div>
              <div className="flex flex-col justify-center rounded-lg bg-purple-500/10 px-3 py-2 text-xs">
                <p className="text-slate-400">Custo por inserção: <strong className="text-white">R$ {insertionUnitCost.toLocaleString("pt-BR")}</strong></p>
                <p className="text-slate-400 mt-0.5">Total: <strong className="text-purple-300">R$ {totalInsertionCost.toLocaleString("pt-BR")}</strong></p>
                {insertions > 0 && <p className="text-emerald-400 mt-0.5">+{(insertions * 6).toFixed(0)}% na demanda</p>}
              </div>
            </div>
          </div>
        )}

        {/* Prazo de recebimento */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Select
            label="Prazo de recebimento"
            value={d.receivableTerm}
            onChange={(e) => set("receivableTerm", e.target.value)}
            options={RECEIVABLE_OPTIONS}
          />
          {/* Resumo de inserções quando grade regional está ativa */}
          {hasGroups && insertions > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">Inserções de Marketing</label>
              <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-sm">
                <p className="font-bold text-purple-300">{insertions} inserções</p>
                <p className="text-[11px] text-slate-400">
                  R$ {totalInsertionCost.toLocaleString("pt-BR")} · +{(insertions * 6).toFixed(0)}% demanda
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FINANCEIRO */}
      <div>
        <SectionTitle>💰 Gestão Financeira</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CurrencyInput label="Empréstimo" value={d.loan || null} onChange={(n) => set("loan", n ?? 0)} />

          {/* Taxa de juros — BLOQUEADA */}
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
        </div>
      </div>

    </fieldset>

    {/* ── Despesas — volta para o fieldset ── */}
    <fieldset disabled={disabled} className="w-full min-w-0 space-y-8 border-0 p-0 m-0">
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
              label="Despesas Fixas"
              value={lockedFixedExpenses}
            />
          ) : (
            <CurrencyInput label="Despesas fixas" value={d.fixedExpenses || null} onChange={(n) => set("fixedExpenses", n ?? 0)} />
          )}

          {lockedTransport != null ? (
            <LockedField
              label="Transporte"
              value={lockedTransport}
            />
          ) : (
            <CurrencyInput label="Transporte" value={d.transport || null} onChange={(n) => set("transport", n ?? 0)} />
          )}

          {lockedMaintenance != null ? (
            <LockedField
              label="Manutenção"
              value={lockedMaintenance}
            />
          ) : (
            <CurrencyInput label="Manutenção" value={d.maintenance || null} onChange={(n) => set("maintenance", n ?? 0)} />
          )}
        </div>

        {/* Resumo de despesas adicionais automáticas */}
        {(hiringCost > 0 || firingCost > 0 || totalInsertionCost > 0) && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs">
            <p className="font-black uppercase tracking-widest text-slate-500 text-[10px] mb-2">
              Despesas adicionais calculadas automaticamente
            </p>
            <div className="space-y-1">
              {hiringCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Contratações ({admitted} func.)</span>
                  <span className="font-bold text-emerald-400">R$ {hiringCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {firingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Demissões ({dismissed} func.)</span>
                  <span className="font-bold text-rose-400">R$ {firingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {totalInsertionCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Inserções de marketing ({insertions}×)</span>
                  <span className="font-bold text-purple-400">R$ {totalInsertionCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </fieldset>
    </div>
  );
}
