import type { Group, Decision, SimulationResult, EconomicEvent } from "@/types";

export const INITIAL_BALANCE = {
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

export const DEFAULT_DECISION: Decision = {
  productionQty: 1300,
  productiveCapacity: 1500,
  employees: 6,
  laborCost: 8,
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

export function simulateCompany(
  company: Group,
  decision: Partial<Decision>,
  marketAvgPrice = 42,
  event?: EconomicEvent | null
): SimulationResult {
  const d: Decision = { ...DEFAULT_DECISION, ...decision };
  const ib = INITIAL_BALANCE;

  const demand_factor = company.region_demand ?? 1;
  const cost_factor = company.region_cost ?? 1;

  // ── PRODUÇÃO ────────────────────────────────────────────────────────────────
  const possibleProduction = Math.min(
    Number(d.productionQty),
    Number(d.productiveCapacity),
    materialNeeded(d)
  );

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
      demand_factor *
      eventDemandFactor
  );

  const realSalesQty = Math.min(demand, possibleProduction);

  // ── DRE ─────────────────────────────────────────────────────────────────────
  // Receita Líquida
  const netPrice = Number(d.salePrice) * (1 - Number(d.discount || 0) / 100);
  const netRevenue = realSalesQty * netPrice;

  // CMV: custo dos produtos VENDIDOS
  const unitMaterialCost = MATERIAL_COST_PER_UNIT(d) * cost_factor * eventCostFactor;
  const unitLaborCost = Number(d.laborCost);
  const unitProductionCost = unitMaterialCost + unitLaborCost; // custo total por unidade

  const materialCost = realSalesQty * unitMaterialCost;   // materiais das unidades vendidas
  const laborCost    = realSalesQty * unitLaborCost;       // MO das unidades vendidas
  const depreciation = Number(d.machineInvestment || 0) / 60;
  const cmv = materialCost + laborCost + depreciation;

  // Resultado Bruto
  const grossProfit = netRevenue - cmv;

  // Despesas Operacionais
  const financialExpense = Number(d.loan || 0) * (Number(d.loanRate || 0) / 100);
  const operationalExpenses =
    Number(d.fixedExpenses) +
    Number(d.marketing) +
    Number(d.transport) +
    Number(d.maintenance);

  const ebit = grossProfit - operationalExpenses;

  // Resultado Antes do IR
  const ebt = ebit - financialExpense; // LAIR = EBIT - Despesa Financeira
  const ir   = Math.max(0, ebt * 0.15); // IR  15% sobre LAIR positivo
  const csll = Math.max(0, ebt * 0.09); // CSLL 9% sobre LAIR positivo
  const incomeTax = ir + csll;           // Total tributos = 24%
  const netProfit = ebt - incomeTax;

  // ── COMPRAS DE MATERIAIS ─────────────────────────────────────────────────────
  // Compras = produção EFETIVA × custo unitário de material
  // (usa possibleProduction para garantir equilíbrio do BP quando há restrição
  //  de capacidade ou material: a empresa só compra o que pode produzir)
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

  // Mão de obra paga sobre TODA a produção efetiva (custo de fabricação):
  //   - unidades vendidas → sai do caixa e vai para o CMV
  //   - unidades não vendidas → sai do caixa e fica capitalizada no Estoque
  // Ambas as parcelas precisam sair do caixa para o BP fechar.
  const laborCashOut = possibleProduction * unitLaborCost;

  // Saídas:
  //   - pagamento a fornecedores de materiais (baseado nas compras efetivas)
  //   - MÃO DE OBRA de TODA a produção efetiva   ← FIX #1 (definitivo)
  //   - despesas operacionais
  //   - despesa financeira (juros)
  //   - 30% do investimento em máquinas (70% vira Passivo — financiamento)
  //   - IRPJ/CSLL apurado no período               ← FIX #2
  const cashOut =
    purchases * supplierPaymentRate +
    laborCashOut +
    operationalExpenses +
    financialExpense +
    Number(d.machineInvestment || 0) * 0.3 +
    incomeTax;

  // ── BALANÇO PATRIMONIAL ──────────────────────────────────────────────────────
  // ATIVO CIRCULANTE
  const finalCash = ib.cash + ib.banks + ib.applications + cashIn - cashOut;

  const clients = ib.clients + netRevenue * (1 - cashCollectionRate);

  // Estoque = unidades NÃO vendidas × custo de produção unitário (mat + MO)
  // FIX #3: custo real (unitProductionCost), não o valor fixo 11
  // FIX #4: base = possibleProduction (produção efetiva), não productionQty (planejada)
  const unsoldUnits = Math.max(0, possibleProduction - realSalesQty);
  const endingInventory = ib.inventory + unsoldUnits * unitProductionCost;

  const currentAssets = finalCash + clients + endingInventory;

  // ATIVO NÃO CIRCULANTE
  const fixedAssets = ib.fixedAssets + Number(d.machineInvestment || 0) - depreciation;

  const totalAssets = currentAssets + fixedAssets;

  // PASSIVO
  // Fornecedores: saldo inicial + compras não pagas no período
  const suppliersBalance = ib.suppliers + purchases * (1 - supplierPaymentRate);

  // Empréstimos totais
  const loansBalance = ib.loans + Number(d.loan || 0);

  // FIX #4: 70% do investimento em máquinas vira passivo (financiamento)
  const machinePayable = Number(d.machineInvestment || 0) * 0.7;

  // Passivo Circulante: fornecedores + parcela CP dos empréstimos (35%) + máquinas
  const currentLiabilities = suppliersBalance + loansBalance * 0.35 + machinePayable;

  // Passivo Não Circulante: parcela LP dos empréstimos (65%)
  const longTermLiabilities = loansBalance * 0.65;

  const totalLiabilities = currentLiabilities + longTermLiabilities;
  // = suppliersBalance + loansBalance + machinePayable  (matematicamente)

  // PATRIMÔNIO LÍQUIDO
  // Capital Social (fixo) + resultado do período (DRE)
  const baseEquity = ib.equity; // Capital Social: R$ 220.000
  const equity = baseEquity + netProfit;

  // ── VERIFICAÇÃO: Ativo = Passivo + PL ────────────────────────────────────────
  // (com os 4 fixes acima, esta equação se verifica algebricamente)
  // const check = totalAssets - totalLiabilities - equity; // deve ser ≈ 0

  // ── INDICADORES FINANCEIROS ───────────────────────────────────────────────────
  const currentRatio    = currentLiabilities ? currentAssets / currentLiabilities : 0;
  const quickRatio      = currentLiabilities ? (currentAssets - endingInventory) / currentLiabilities : 0;
  const immediateRatio  = currentLiabilities ? finalCash / currentLiabilities : 0;
  const grossMargin     = netRevenue ? (grossProfit / netRevenue) * 100 : 0;
  const operatingMargin = netRevenue ? (ebit / netRevenue) * 100 : 0;
  const netMargin       = netRevenue ? (netProfit / netRevenue) * 100 : 0;
  const roa             = totalAssets ? (netProfit / totalAssets) * 100 : 0;
  const roe             = equity      ? (netProfit / equity) * 100 : 0;
  // Compras (fórmula contábil) — usada exclusivamente no PMP:
  //   Compras = CMV + Estoque Final − Estoque Inicial
  // (Estoque Inicial = saldo do período anterior; aqui é ib.inventory para a 1ª rodada)
  const comprasContabil = cmv + endingInventory - ib.inventory;

  const pme             = cmv             ? (endingInventory / cmv) * 30 : 0;
  const pmr             = netRevenue      ? (clients / netRevenue) * 30 : 0;
  const pmp             = comprasContabil > 0 ? (suppliersBalance / comprasContabil) * 30 : 0;
  const cashCycle       = pme + pmr - pmp;

  // ── INCONSISTÊNCIAS ───────────────────────────────────────────────────────────
  const inconsistencies: string[] = [];
  if (Number(d.productionQty) > Number(d.productiveCapacity))
    inconsistencies.push("Produção acima da capacidade produtiva.");
  if (materialNeeded(d) < Number(d.productionQty))
    inconsistencies.push("Materiais insuficientes para a produção planejada.");
  if (finalCash < 0)
    inconsistencies.push("Caixa projetado negativo — risco de insolvência.");
  if (Number(d.salePrice) <= 0)
    inconsistencies.push("Preço de venda inválido (zero ou negativo).");
  if (Number(d.fixedExpenses) < 0)
    inconsistencies.push("Despesas fixas com valor negativo.");
  if (netProfit < -50000)
    inconsistencies.push("Prejuízo elevado — avalie as decisões estratégicas.");

  // ── FLUXO DE CAIXA (breakdown para demonstração) ─────────────────────────────
  const cfOpeningBalance = ib.cash + ib.banks + ib.applications;
  const cfReceipts = netRevenue * cashCollectionRate;
  const cfSupplierPayments = purchases * supplierPaymentRate;
  const cfLaborPayments = laborCashOut;
  const cfOperationalPayments = operationalExpenses;
  const cfFinancialPayments = financialExpense;
  const cfTaxPaid = ir + csll; // IR + CSLL pagos no período
  const cfOperating =
    cfReceipts -
    cfSupplierPayments -
    cfLaborPayments -
    cfOperationalPayments -
    cfFinancialPayments -
    cfTaxPaid;

  const cfLoanReceived = Number(d.loan || 0);
  const cfMachinePayment = Number(d.machineInvestment || 0) * 0.3;
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
    // Dados de produção detalhados
    productionEffective: possibleProduction,   // unidades efetivamente produzidas
    unsoldUnits,                               // unidades não vendidas no período
    unitProductionCost,                        // custo unitário total (mat + MO)
    netRevenue,
    purchases,
    cmv,
    grossProfit,
    operationalExpenses,
    ebit,
    ebt,
    ir,
    csll,
    incomeTax,
    netProfit,
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
