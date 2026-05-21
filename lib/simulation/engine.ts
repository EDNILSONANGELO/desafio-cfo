import type { Group, Decision, SimulationResult, EconomicEvent, InitialBalance, MachinePurchase, RoundConfig } from "@/types";

// ─── Catálogo de Máquinas ─────────────────────────────────────────────────────
export const MACHINE_CATALOG = [
  { id: "small"  as const, label: "Máquina Pequena", icon: "⚙️",  capacity: 10_000, price: 20_000 },
  { id: "medium" as const, label: "Máquina Média",   icon: "🏭",  capacity: 20_000, price: 40_000 },
  { id: "large"  as const, label: "Máquina Grande",  icon: "🏗️", capacity: 60_000, price: 80_000 },
] as const;

/** Taxa de juros de mercado para parcelamento de máquinas (ao mês por parcela) */
export const MACHINE_INSTALLMENT_RATE = 0.02; // 2% a.m.

/**
 * Capacidade produtiva base da fábrica (rodada 1, sem máquinas extras).
 * Representa o parque fabril inicial refletido nos R$150.000 de imobilizado.
 * O aluno SÓ aumenta essa capacidade comprando máquinas.
 */
export const BASE_PRODUCTION_CAPACITY = 5000; // unidades/rodada

/** Funcionários padrão na rodada 1 (sem carryover) */
export const DEFAULT_EMPLOYEES = 6;

/**
 * Unidades que 1 funcionário consegue produzir por rodada.
 * Base: 5000 capacidade / 6 funcionários = 833 unid./funcionário
 * Usado no cálculo de idle e status de funcionários.
 * O professor pode alterar via machine_min_employees na rodada.
 */
export const UNITS_PER_EMPLOYEE_DEFAULT = Math.floor(BASE_PRODUCTION_CAPACITY / DEFAULT_EMPLOYEES); // 833

/** Custo por inserção de marketing (padrão, professor pode customizar na rodada) */
export const DEFAULT_MARKETING_INSERTION_COST = 1500; // R$ 1.500 por inserção

/** Boost de demanda por inserção de marketing adicional */
export const MARKETING_INSERTION_DEMAND_BOOST = 0.06; // +6% por inserção

/** Custo de transporte por unidade vendida fora da região de origem (R$/unid.) */
export const REGIONAL_TRANSPORT_COST_PER_UNIT = 3; // R$ 3,00/unidade

/** Multiplicador de custo de contratação (salary × multiplier) */
export const HIRING_COST_MULTIPLIER = 1.5; // salário + encargos (FGTS/INSS) + treinamento

/** Multiplicador de custo de demissão (salary × multiplier) */
export const FIRING_COST_MULTIPLIER = 1.2; // aviso prévio + multa FGTS + encargos

// Thresholds para status de funcionários
const EMPLOYEE_RATIO_STRIKE = 0.65; // < 65% dos necessários → greve
const EMPLOYEE_RATIO_ALERT  = 0.85; // < 85% dos necessários → alerta
const EMPLOYEE_IDLE_STRIKE  = 0.60; // > 60% ociosos → greve (custo alto, desmotivação)
const EMPLOYEE_IDLE_ALERT   = 0.35; // > 35% ociosos → alerta

// Penalidade de produção por status
const PROD_FACTOR_STRIKE = 0.70; // 30% de queda de produtividade
const PROD_FACTOR_ALERT  = 0.90; // 10% de queda de produtividade

export const INITIAL_BALANCE: InitialBalance = {
  cash: 50000,
  banks: 30000,
  applications: 20000,
  clients: 40000,
  inventory: 25000,
  fixedAssets: 150000,
  suppliers: 35000,
  loans: 60000,
  equity: 220000, // Capital Social inicial
};

export const DEFAULT_MACHINE_PURCHASE: MachinePurchase = {
  small: 0,
  medium: 0,
  large: 0,
  paymentMethod: "cash",
};

export const DEFAULT_DECISION: Decision = {
  productionQty: 1300,
  productiveCapacity: 1500,
  employees: DEFAULT_EMPLOYEES,
  laborCost: 2000, // Valor médio de salário por funcionário (R$/mês)
  admittedEmployees: 0,
  dismissedEmployees: 0,
  marketingInsertions: 0,
  plasticQty: 1300,
  plasticUnit: 7,
  capsQty: 1300,
  capsUnit: 1.2,
  packageQty: 1300,
  packageUnit: 1.8,
  labelQty: 1300,
  labelUnit: 0.7,
  supplierTerm: 30,
  salePrice: 42,
  expectedSales: 1200,
  marketing: 9000,
  discount: 2,
  receivableTerm: 30,
  loan: 0,
  loanRate: 3.2,
  machineInvestment: 0,
  fixedExpenses: 26000,
  transport: 6000,
  maintenance: 3000,
  machines: { ...DEFAULT_MACHINE_PURCHASE },
};

const MATERIAL_COST_PER_UNIT = (d: Decision) =>
  Number(d.plasticUnit) + Number(d.capsUnit) + Number(d.packageUnit) + Number(d.labelUnit);

const materialNeeded = (d: Decision) =>
  Math.min(
    Number(d.plasticQty),
    Number(d.capsQty),
    Number(d.packageQty),
    Number(d.labelQty)
  );

/**
 * Converte o resultado de uma rodada anterior no saldo patrimonial de abertura
 * para a próxima rodada (carryover contábil).
 *
 * Se o caixa final for negativo, considera-se que a empresa tomou um empréstimo
 * emergencial exatamente para zerar o caixa, adicionando esse valor ao passivo
 * de empréstimos. Assim o BP permanece equilibrado no início da nova rodada.
 */
export function resultToOpeningBalance(prev: SimulationResult): Partial<InitialBalance> {
  const rawCash = prev.finalCash;
  const emergencyLoan = rawCash < 0 ? Math.abs(rawCash) : 0;

  return {
    cash:        Math.max(0, rawCash),
    banks:       0,
    applications: 0,
    clients:     prev.clients,
    inventory:   prev.endingInventory,
    fixedAssets: prev.fixedAssets,
    suppliers:   prev.suppliers,
    loans:       prev.loans + emergencyLoan,
    equity:      prev.equity,
    // Carryover de capacidade acumulada de máquinas
    machineCapacity: prev.accumulatedMachineCapacity ?? 0,
    // Carryover de parcelas a vencer (2ª e 3ª parcelas do parcelamento de máquinas)
    machinePayableBalance: prev.machinesPayable ?? 0,
    // Carryover de matéria-prima não consumida
    plasticStock:  prev.plasticLeftover  ?? 0,
    capsStock:     prev.capsLeftover     ?? 0,
    packageStock:  prev.packageLeftover  ?? 0,
    labelStock:    prev.labelLeftover    ?? 0,
    // Carryover de funcionários ativos (Migration 008)
    currentEmployees: prev.netEmployees ?? DEFAULT_EMPLOYEES,
  };
}

export function simulateCompany(
  company: Group,
  decision: Partial<Decision>,
  marketAvgPrice = 42,
  event?: EconomicEvent | null,
  openingBalance?: Partial<InitialBalance>,  // ← carryover da rodada anterior
  roundConfig?: RoundConfig                  // ← configurações da rodada (professor)
): SimulationResult {
  const d: Decision = { ...DEFAULT_DECISION, ...decision };
  // Mescla o saldo padrão com o carryover da rodada anterior (quando houver)
  const ib: InitialBalance = { ...INITIAL_BALANCE, ...(openingBalance ?? {}) };
  const isCarryover = !!openingBalance;

  const demand_factor = company.region_demand ?? 1;
  const cost_factor = company.region_cost ?? 1;

  // ── FUNCIONÁRIOS: ADMISSÕES E DEMISSÕES (Migration 008) ──────────────────────
  // Carryover: funcionários ativos no início da rodada
  const prevEmployees = ib.currentEmployees ?? DEFAULT_EMPLOYEES;
  const admitted  = Math.max(0, Number(d.admittedEmployees ?? 0));
  const dismissed = Math.max(0, Number(d.dismissedEmployees ?? 0));

  // Se o aluno usa os novos campos de admissão/demissão, calcula net.
  // Caso contrário (submissão antiga), usa d.employees diretamente.
  const hasNewEmployeeFields = d.admittedEmployees !== undefined || d.dismissedEmployees !== undefined;
  const netEmployees = hasNewEmployeeFields
    ? Math.max(0, prevEmployees + admitted - Math.min(dismissed, prevEmployees + admitted))
    : Math.max(1, Number(d.employees));

  // Custo de contratação e demissão (encargos, treinamento, aviso prévio, FGTS)
  const hiringCost = admitted  * Number(d.laborCost) * HIRING_COST_MULTIPLIER;
  const firingCost = dismissed * Number(d.laborCost) * FIRING_COST_MULTIPLIER;

  // ── STATUS DOS FUNCIONÁRIOS ──────────────────────────────────────────────────
  // Calcula quantos funcionários são necessários para a produção planejada
  const minEmployeesPerThousand = roundConfig?.machine_min_employees ?? 3; // padrão: 3/1000
  const unitsPerEmployee = Math.max(1, Math.floor(1000 / minEmployeesPerThousand));
  const minEmployeesNeeded = Math.max(1, Math.ceil(Number(d.productionQty) / unitsPerEmployee));
  const idleEmployees    = Math.max(0, netEmployees - minEmployeesNeeded);
  const missingEmployees = Math.max(0, minEmployeesNeeded - netEmployees);

  const employeeRatio = minEmployeesNeeded > 0 ? netEmployees / minEmployeesNeeded : 1;
  const idleRatio     = netEmployees > 0 ? idleEmployees / netEmployees : 0;

  let employeeStatus: "good" | "alert" | "strike";
  let employeeStatusLabel: string;
  let employeeProductionFactor: number;

  if (employeeRatio < EMPLOYEE_RATIO_STRIKE || idleRatio > EMPLOYEE_IDLE_STRIKE) {
    employeeStatus        = "strike";
    employeeStatusLabel   = "Está em greve";
    employeeProductionFactor = PROD_FACTOR_STRIKE;
  } else if (employeeRatio < EMPLOYEE_RATIO_ALERT || idleRatio > EMPLOYEE_IDLE_ALERT) {
    employeeStatus        = "alert";
    employeeStatusLabel   = "Está em alerta";
    employeeProductionFactor = PROD_FACTOR_ALERT;
  } else {
    employeeStatus        = "good";
    employeeStatusLabel   = "Está bom";
    employeeProductionFactor = 1.0;
  }

  // ── COMPRA DE MÁQUINAS ───────────────────────────────────────────────────────
  const mPurchase = { ...DEFAULT_MACHINE_PURCHASE, ...(d.machines ?? {}) };

  // Calcula custo total e capacidade adicionada pelas novas máquinas
  let machinesTotalCost = 0;
  let machinesCapacityAdded = 0;
  for (const m of MACHINE_CATALOG) {
    const qty = Math.max(0, Math.floor(Number(mPurchase[m.id]) || 0));
    machinesTotalCost    += qty * m.price;
    machinesCapacityAdded += qty * m.capacity;
  }

  // Pagamento: à vista = paga tudo agora; 3× = entrada (1/3) + 2 parcelas futuras com juros
  let machinesDownPayment: number;
  let machinesPayable: number;
  let machinesInterest: number;

  if (mPurchase.paymentMethod === "installments" && machinesTotalCost > 0) {
    machinesDownPayment = machinesTotalCost / 3;                   // 1ª parcela (sem juros)
    const deferred       = (machinesTotalCost * 2) / 3;           // 2/3 diferidos
    machinesInterest    = deferred * MACHINE_INSTALLMENT_RATE * 2; // juros sobre 2 parcelas futuras
    // Passivo = apenas principal diferido (juros são despesa financeira, não capitalizado)
    machinesPayable     = deferred;
  } else {
    machinesDownPayment = machinesTotalCost; // à vista: paga tudo agora
    machinesPayable     = 0;
    machinesInterest    = 0;
  }

  // Capacidade acumulada = rodadas anteriores + novas máquinas desta rodada
  const accumulatedMachineCapacity = (ib.machineCapacity ?? 0) + machinesCapacityAdded;

  // Capacidade efetiva total: base fixa da fábrica + máquinas acumuladas (travado)
  const effectiveCapacity = BASE_PRODUCTION_CAPACITY + accumulatedMachineCapacity;

  // ── MATERIAIS DISPONÍVEIS (comprados agora + saldo da rodada anterior) ───────
  const totalPlastic  = Number(d.plasticQty)  + (ib.plasticStock  ?? 0);
  const totalCaps     = Number(d.capsQty)     + (ib.capsStock     ?? 0);
  const totalPackage  = Number(d.packageQty)  + (ib.packageStock  ?? 0);
  const totalLabel    = Number(d.labelQty)    + (ib.labelStock    ?? 0);
  const totalMaterialAvailable = Math.min(totalPlastic, totalCaps, totalPackage, totalLabel);

  // ── PRODUÇÃO ────────────────────────────────────────────────────────────────
  const possibleProduction = Math.min(
    Math.floor(Number(d.productionQty) * employeeProductionFactor), // ← penalidade por status
    effectiveCapacity,
    totalMaterialAvailable      // ← considera saldo anterior + compra atual
  );

  // ── INSERÇÕES DE MARKETING (Migration 008) ───────────────────────────────────
  const insertions = Math.min(8, Math.max(0, Math.floor(Number(d.marketingInsertions ?? 0))));
  const insertionUnitCost = roundConfig?.marketing_insertion_cost ?? DEFAULT_MARKETING_INSERTION_COST;
  const marketingInsertionCost = insertions * insertionUnitCost;
  // Boost de demanda acumulado pelas inserções (cap em +48% com 8 inserções)
  const insertionsDemandFactor = 1 + insertions * MARKETING_INSERTION_DEMAND_BOOST;

  // ── DEMANDA E VENDAS ─────────────────────────────────────────────────────────
  const priceFactor = Math.max(
    0.6,
    1 + ((marketAvgPrice - Number(d.salePrice)) / Math.max(marketAvgPrice, 1)) * 0.55
  );
  const marketingFactor = 1 + Math.min(Number(d.marketing) / 50000, 0.45);
  const eventDemandFactor = event?.demandFactor ?? 1;
  const eventCostFactor = event?.costFactor ?? 1;

  const demand = Math.round(
    Number(d.expectedSales) *
      priceFactor *
      marketingFactor *
      insertionsDemandFactor *  // ← boost das inserções de marketing
      demand_factor *
      eventDemandFactor
  );

  // ── CUSTO DE TRANSPORTE REGIONAL (Migration 008) ─────────────────────────────
  // Vender fora da região de origem gera custo adicional de logística
  const regionalTransportCost = (d.regionalSales ?? [])
    .filter((rs) => rs.active && rs.region_name !== company.region_name)
    .reduce((sum, rs) => sum + Math.max(0, rs.qty || 0) * REGIONAL_TRANSPORT_COST_PER_UNIT, 0);

  const realSalesQty = Math.min(demand, possibleProduction);

  // ── DRE ─────────────────────────────────────────────────────────────────────
  // Receita Líquida
  const netPrice = Number(d.salePrice) * (1 - Number(d.discount || 0) / 100);
  const netRevenue = realSalesQty * netPrice;

  // CMV: custo dos produtos VENDIDOS (materiais + depreciação)
  const unitMaterialCost = MATERIAL_COST_PER_UNIT(d) * cost_factor * eventCostFactor;
  const unitProductionCost = unitMaterialCost; // custo unitário = só material

  const materialCost = realSalesQty * unitMaterialCost;   // materiais das unidades vendidas

  // ── DEPRECIAÇÃO LINEAR ────────────────────────────────────────────────────────
  // Taxa: 10% ao ano / Vida útil: 10 anos (método linear, conforme NBC TG 27)
  // Base: saldo inicial do imobilizado + novos investimentos deste período
  // Taxa mensal = 10% ÷ 12 meses = 0,8333% a.m.
  // A depreciação NÃO compõe o CMV — aparece como linha separada na DRE,
  // após as Despesas Operacionais e antes do EBIT.
  const DEPRECIATION_ANNUAL_RATE = 0.10; // 10 % a.a.
  const depreciationBase   = ib.fixedAssets; // saldo líquido de abertura
  const depreciationNewInv = Number(d.machineInvestment || 0) + machinesTotalCost; // novos desta rodada
  const depreciationExpense = (depreciationBase + depreciationNewInv) * (DEPRECIATION_ANNUAL_RATE / 12);

  // CMV = custo dos materiais vendidos + depreciação (custo de fabricação)
  const cmv = materialCost + depreciationExpense;

  // Resultado Bruto
  const grossProfit = netRevenue - cmv;

  // Salários: Funcionários ATIVOS (netEmployees) × Valor médio de salário
  const totalSalary = netEmployees * Number(d.laborCost);

  // ── CUSTO DE ARMAZENAGEM (Phase 1) ──────────────────────────────────────────
  // Unidades não vendidas geram custo de estoque (5% do valor de custo do estoque
  // acumulado no período). Incentiva o aluno a planejar melhor a produção.
  const unsoldUnits = Math.max(0, possibleProduction - realSalesQty);
  const periodEndingInventoryValue = ib.inventory + unsoldUnits * unitProductionCost;
  const storageExpense = periodEndingInventoryValue * 0.05; // 5% a.p. sobre saldo de estoque

  // Despesas Operacionais (inclui salários + armazenagem + novas despesas Migration 008)
  // Despesa financeira = juros do empréstimo + juros das parcelas de máquinas (accrual)
  const financialExpense = Number(d.loan || 0) * (Number(d.loanRate || 0) / 100) + machinesInterest;
  const operationalExpenses =
    Number(d.fixedExpenses) +
    totalSalary +
    Number(d.marketing) +
    marketingInsertionCost +    // ← custo das inserções de marketing
    Number(d.transport) +
    Number(d.maintenance) +
    storageExpense +
    hiringCost +                // ← encargos de contratação
    firingCost +                // ← encargos de demissão
    regionalTransportCost;      // ← logística inter-regional

  // EBIT = Lucro Bruto − Despesas Operacionais (depreciação já está no CMV)
  const ebit = grossProfit - operationalExpenses;

  // Resultado Antes do IR
  const ebt = ebit - financialExpense; // LAIR = EBIT - Despesa Financeira
  const ir   = Math.max(0, ebt * 0.15); // IR  15% sobre LAIR positivo
  const csll = Math.max(0, ebt * 0.09); // CSLL 9% sobre LAIR positivo
  const incomeTax = ir + csll;           // Total tributos = 24%
  const netProfit = ebt - incomeTax;

  // ── COMPRAS DE MATERIAIS ─────────────────────────────────────────────────────
  const purchases = possibleProduction * unitMaterialCost;

  // ── FLUXO DE CAIXA ───────────────────────────────────────────────────────────
  const cashCollectionRate =
    Number(d.receivableTerm) <= 30
      ? 0.75
      : Number(d.receivableTerm) <= 60
      ? 0.48
      : 0.25;
  const supplierPaymentRate =
    Number(d.supplierTerm) <= 30
      ? 0.75
      : Number(d.supplierTerm) <= 60
      ? 0.45
      : 0.25;

  // Entradas: recebimento de clientes + empréstimo captado
  const cashIn = netRevenue * cashCollectionRate + Number(d.loan || 0);

  // Salários pagos no período (saída de caixa)
  const laborCashOut = totalSalary;

  // Saídas de caixa
  const cashOut =
    purchases * supplierPaymentRate +
    laborCashOut +
    (operationalExpenses - totalSalary) + // demais desp. operac. (incl. armazenagem)
    financialExpense +
    Number(d.machineInvestment || 0) * 0.3 + // legado: 30% do investimento livre
    machinesDownPayment +                      // entrada das novas máquinas (à vista ou 1ª parcela)
    incomeTax;

  // ── BALANÇO PATRIMONIAL ──────────────────────────────────────────────────────
  // ATIVO CIRCULANTE
  let rawFinalCash = ib.cash + ib.banks + ib.applications + cashIn - cashOut;

  // ── EMPRÉSTIMO EMERGENCIAL (Phase 1) ─────────────────────────────────────────
  // Se o caixa for negativo, a empresa ativa automaticamente uma linha de crédito
  // emergencial para cobrir o deficit. O custo é registrado nos loans do BP.
  // O pedagógico: o grupo perde pontos por necessitar de resgate financeiro.
  let emergencyLoan = 0;
  if (rawFinalCash < 0) {
    emergencyLoan = Math.abs(rawFinalCash);
    rawFinalCash  = 0; // linha de crédito zera o caixa
  }
  const finalCash = rawFinalCash;

  const clients = ib.clients + netRevenue * (1 - cashCollectionRate);

  // Estoque = unidades NÃO vendidas × custo de produção unitário
  const endingInventory = ib.inventory + unsoldUnits * unitProductionCost;

  const currentAssets = finalCash + clients + endingInventory;

  // ATIVO NÃO CIRCULANTE
  // Imobilizado líquido = saldo anterior + novos investimentos − depreciação do período
  const fixedAssets = ib.fixedAssets + Number(d.machineInvestment || 0) + machinesTotalCost - depreciationExpense;

  const totalAssets = currentAssets + fixedAssets;

  // PASSIVO
  const suppliersBalance = ib.suppliers + purchases * (1 - supplierPaymentRate);
  const loansBalance     = ib.loans + Number(d.loan || 0) + emergencyLoan;
  // machinePayable: legado (70% do machineInvestment livre) + parcelas novas + parcelas em aberto
  const machinePayable   =
    Number(d.machineInvestment || 0) * 0.7  // legado
    + machinesPayable                        // parcelas futuras das novas máquinas (2/3 + juros)
    + (ib.machinePayableBalance ?? 0);       // parcelas herdadas de rounds anteriores

  const currentLiabilities  = suppliersBalance + loansBalance * 0.35 + machinePayable;
  const longTermLiabilities  = loansBalance * 0.65;
  const totalLiabilities     = currentLiabilities + longTermLiabilities;

  // PATRIMÔNIO LÍQUIDO
  // No carryover, o equity de abertura é o PL final da rodada anterior.
  // O capital social (baseEquity) é o equity inicial — para rodada 1 é o INITIAL_BALANCE.equity;
  // para rodadas seguintes, é o equity já acumulado (carregado via openingBalance).
  const baseEquity = ib.equity;
  const equity = baseEquity + netProfit;

  // ── INDICADORES FINANCEIROS ───────────────────────────────────────────────────
  const currentRatio    = currentLiabilities ? currentAssets / currentLiabilities : 0;
  const quickRatio      = currentLiabilities ? (currentAssets - endingInventory) / currentLiabilities : 0;
  const immediateRatio  = currentLiabilities ? finalCash / currentLiabilities : 0;
  const grossMargin     = netRevenue ? (grossProfit / netRevenue) * 100 : 0;
  const operatingMargin = netRevenue ? (ebit / netRevenue) * 100 : 0;
  const netMargin       = netRevenue ? (netProfit / netRevenue) * 100 : 0;
  const roa             = totalAssets ? (netProfit / totalAssets) * 100 : 0;
  const roe             = equity      ? (netProfit / equity) * 100 : 0;
  const comprasContabil = cmv + endingInventory - ib.inventory;

  const pme       = cmv             ? (endingInventory / cmv) * 30 : 0;
  const pmr       = netRevenue      ? (clients / netRevenue) * 30 : 0;
  const pmp       = comprasContabil > 0 ? (suppliersBalance / comprasContabil) * 30 : 0;
  const cashCycle = pme + pmr - pmp;

  // ── INCONSISTÊNCIAS ───────────────────────────────────────────────────────────
  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const inconsistencies: string[] = [];
  if (Number(d.productionQty) > effectiveCapacity)
    inconsistencies.push(`Produção (${Number(d.productionQty).toLocaleString("pt-BR")}) acima da capacidade efetiva (${effectiveCapacity.toLocaleString("pt-BR")} unid.).`);
  if (totalMaterialAvailable < Number(d.productionQty))
    inconsistencies.push(`Materiais insuficientes para a produção planejada (disponível: ${totalMaterialAvailable.toLocaleString("pt-BR")} unid.).`);
  if (emergencyLoan > 0)
    inconsistencies.push(`Caixa negativo — empréstimo emergencial de ${fmt(emergencyLoan)} acionado automaticamente.`);
  if (Number(d.salePrice) <= 0)
    inconsistencies.push("Preço de venda inválido (zero ou negativo).");
  if (Number(d.fixedExpenses) < 0)
    inconsistencies.push("Despesas fixas com valor negativo.");
  if (netProfit < -50000)
    inconsistencies.push("Prejuízo elevado — avalie as decisões estratégicas.");
  if (storageExpense > 5000)
    inconsistencies.push(`Alto custo de armazenagem (${fmt(storageExpense)}) — produza mais próximo da demanda.`);
  if (machinesTotalCost > 0 && machinesDownPayment > (ib.cash + ib.banks + ib.applications))
    inconsistencies.push(`Entrada das máquinas (${fmt(machinesDownPayment)}) pode superar o caixa disponível (${fmt(ib.cash + ib.banks + ib.applications)}).`);
  // Inconsistências de colaboradores (Migration 008)
  if (employeeStatus === "strike")
    inconsistencies.push(`⚠️ Colaboradores em GREVE! ${missingEmployees > 0 ? `Faltam ${missingEmployees} colaborador(es)` : `${idleEmployees} ociosos (${(idleRatio * 100).toFixed(0)}%)`} — produção reduzida a ${(employeeProductionFactor * 100).toFixed(0)}%.`);
  else if (employeeStatus === "alert")
    inconsistencies.push(`⚠️ Alerta de colaboradores: ${missingEmployees > 0 ? `${missingEmployees} a menos do necessário` : `${idleEmployees} ociosos`} — produção com ${((1 - employeeProductionFactor) * 100).toFixed(0)}% de perda.`);
  if (dismissed > (prevEmployees + admitted))
    inconsistencies.push(`Demissões (${dismissed}) superam o total disponível (${prevEmployees + admitted}) — ajuste os valores.`);
  if (regionalTransportCost > 0)
    inconsistencies.push(`Custo de logística inter-regional: ${fmt(regionalTransportCost)} (${(d.regionalSales ?? []).filter((rs) => rs.active && rs.region_name !== company.region_name).length} região(ões) fora da origem).`);

  // ── SALDO DE MATERIAIS (matéria-prima não consumida) ─────────────────────────
  // Materiais comprados + saldo anterior − unidades efetivamente produzidas
  const plasticLeftover  = Math.max(0, totalPlastic  - possibleProduction);
  const capsLeftover     = Math.max(0, totalCaps     - possibleProduction);
  const packageLeftover  = Math.max(0, totalPackage  - possibleProduction);
  const labelLeftover    = Math.max(0, totalLabel    - possibleProduction);

  // ── FLUXO DE CAIXA (breakdown para demonstração) ─────────────────────────────
  const cfOpeningBalance = ib.cash + ib.banks + ib.applications;
  const cfReceipts = netRevenue * cashCollectionRate;
  const cfSupplierPayments = purchases * supplierPaymentRate;
  const cfLaborPayments = totalSalary;
  const cfOperationalPayments = operationalExpenses - totalSalary;
  const cfFinancialPayments = financialExpense;
  const cfTaxPaid = ir + csll;
  const cfOperating =
    cfReceipts -
    cfSupplierPayments -
    cfLaborPayments -
    cfOperationalPayments -
    cfFinancialPayments -
    cfTaxPaid;

  const cfLoanReceived = Number(d.loan || 0);
  const cfMachinePayment = Number(d.machineInvestment || 0) * 0.3 + machinesDownPayment;
  const cfInvesting = -cfMachinePayment;
  const cfFinancing = cfLoanReceived;
  const cfNetChange = cfOperating + cfInvesting + cfFinancing;

  return {
    companyId: company.id,
    group: company.name,
    company: company.company_name,
    region: company.region_name,
    demand,
    realSalesQty,
    productionEffective: possibleProduction,
    unsoldUnits,
    unitProductionCost,
    netRevenue,
    purchases,
    cmv,
    grossProfit,
    totalSalary,
    operationalExpenses,
    ebit,
    ebt,
    ir,
    csll,
    incomeTax,
    netProfit,
    // Depreciação (exposta separadamente para exibição nos relatórios)
    depreciationExpense,
    // Ativo
    currentAssets,
    fixedAssets,
    totalAssets,
    finalCash,
    clients,
    endingInventory,
    // Passivo
    currentLiabilities,
    longTermLiabilities,
    totalLiabilities,
    suppliers: suppliersBalance,
    loans: loansBalance,
    machinePayable,
    // PL
    baseEquity,
    equity,
    // Indicadores
    currentRatio,
    quickRatio,
    immediateRatio,
    grossMargin,
    operatingMargin,
    netMargin,
    roa,
    roe,
    pme,
    pmr,
    pmp,
    cashCycle,
    inconsistencies,
    // Phase 1
    emergencyLoan,
    isCarryover,
    storageExpense,
    // Migration 008: Funcionários
    netEmployees,
    minEmployeesNeeded,
    idleEmployees,
    missingEmployees,
    employeeStatus,
    employeeStatusLabel,
    employeeProductionFactor,
    hiringCost,
    firingCost,
    // Migration 008: Marketing e transporte regional
    marketingInsertionCost,
    regionalTransportCost,
    // Saldo de materiais
    plasticLeftover,
    capsLeftover,
    packageLeftover,
    labelLeftover,
    // Compra de máquinas
    machinesTotalCost,
    machinesCapacityAdded,
    machinesDownPayment,
    machinesPayable,
    machinesInterest,
    accumulatedMachineCapacity,
    // Cash flow
    cfReceipts,
    cfSupplierPayments,
    cfLaborPayments,
    cfOperationalPayments,
    cfFinancialPayments,
    cfTaxPaid,
    cfOperating,
    cfMachinePayment,
    cfInvesting,
    cfLoanReceived,
    cfFinancing,
    cfNetChange,
    cfOpeningBalance,
  };
}
