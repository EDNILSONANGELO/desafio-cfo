// ============================================================
// DESAFIO CFO – TypeScript Types
// ============================================================

export interface Professor {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  professor_id: string;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  company_name: string;
  region_name: string;
  region_trait: string;
  region_demand: number;
  region_cost: number;
  color: string;
  class_id: string;
  created_at: string;
}

export interface Student {
  id: string;
  ra: string;
  name: string;
  group_id: number | null;
  class_id: string | null;
  email?: string;
  created_at: string;
  // Joined fields
  group?: Group;
  class?: Class;
}

export interface Round {
  id: number;
  name: string;
  status: RoundStatus;
  event_type: string;
  demand_factor: number;
  cost_factor: number;
  price_min: number | null;
  price_max: number | null;
  // Despesas travadas pelo professor para esta rodada (null = aluno define livremente)
  fixed_expenses: number | null;
  transport: number | null;
  maintenance: number | null;
  class_id: string;
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  processed_at: string | null;
}

export type RoundStatus =
  | "Não iniciada"
  | "Aberta"
  | "Em preenchimento"
  | "Enviada"
  | "Encerrada"
  | "Processada";

export interface RegionalSale {
  group_id: number;
  region_name: string;
  qty: number;
  price: number;
  active: boolean;
}

export interface Decision {
  productionQty: number;
  productiveCapacity: number;
  employees: number;
  laborCost: number;
  plasticQty: number;
  plasticUnit: number;
  capsQty: number;
  capsUnit: number;
  packageQty: number;
  packageUnit: number;
  labelQty: number;
  labelUnit: number;
  supplierTerm: number;
  salePrice: number;
  expectedSales: number;
  marketing: number;
  discount: number;
  receivableTerm: number;
  loan: number;
  loanRate: number;
  machineInvestment: number;
  fixedExpenses: number;
  transport: number;
  maintenance: number;
  regionalSales?: RegionalSale[];
}

export interface Submission {
  id: number;
  round_id: number;
  group_id: number;
  decision: Decision;
  status: "Rascunho" | "Enviada";
  sent_by_ra: string | null;
  sent_by_name: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  group?: Group;
}

export interface SimulationResult {
  companyId: number;
  group: string;
  company: string;
  region: string;
  demand: number;
  realSalesQty: number;
  productionEffective: number;  // unidades efetivamente produzidas
  unsoldUnits: number;          // unidades não vendidas (ficaram em estoque)
  unitProductionCost: number;   // custo unitário total (mat + MO)

  // ── DRE ──────────────────────────────────────────────────────────────────────
  netRevenue: number;
  purchases: number;
  cmv: number;
  grossProfit: number;
  operationalExpenses: number;
  ebit: number;
  ebt: number;          // LAIR = EBIT - Despesa Financeira
  ir: number;           // IR  15% sobre LAIR positivo
  csll: number;         // CSLL 9% sobre LAIR positivo
  incomeTax: number;    // Total tributos = IR + CSLL (24%)
  netProfit: number;

  // ── ATIVO ─────────────────────────────────────────────────────────────────────
  finalCash: number;
  clients: number;
  endingInventory: number;
  currentAssets: number;
  fixedAssets: number;
  totalAssets: number;

  // ── PASSIVO ───────────────────────────────────────────────────────────────────
  suppliers: number;          // Fornecedores (PC)
  loans: number;              // Empréstimos total
  machinePayable: number;     // Financiamento de máquinas (PC – 70% não pago)
  currentLiabilities: number; // Passivo Circulante total
  longTermLiabilities: number;// Passivo Não Circulante (LP dos empréstimos)
  totalLiabilities: number;   // Passivo Total = PC + PNC

  // ── PATRIMÔNIO LÍQUIDO ────────────────────────────────────────────────────────
  baseEquity: number;  // Capital Social (fixo)
  equity: number;      // PL Total = Capital Social + resultado do período

  // ── INDICADORES ───────────────────────────────────────────────────────────────
  currentRatio: number;
  quickRatio: number;
  immediateRatio: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  roa: number;
  roe: number;
  pme: number;
  pmr: number;
  pmp: number;
  cashCycle: number;
  inconsistencies: string[];

  // ── FLUXO DE CAIXA (opcionais — podem estar ausentes em resultados antigos) ───
  cfReceipts?: number;           // Recebimentos de clientes (FCO entrada)
  cfSupplierPayments?: number;   // Pagamentos a fornecedores
  cfLaborPayments?: number;      // Pagamentos de MO (produção toda)
  cfOperationalPayments?: number;// Despesas operacionais pagas
  cfFinancialPayments?: number;  // Juros pagos
  cfTaxPaid?: number;            // IR/CSLL pago
  cfOperating?: number;          // FCO — Fluxo das Atividades Operacionais
  cfMachinePayment?: number;     // Pagamento caixa de imobilizado (30%)
  cfInvesting?: number;          // FCI — Fluxo das Atividades de Investimento
  cfLoanReceived?: number;       // Empréstimo captado
  cfFinancing?: number;          // FCF — Fluxo das Atividades de Financiamento
  cfNetChange?: number;          // Variação Líquida de Caixa
  cfOpeningBalance?: number;     // Saldo inicial de caixa
}

export interface RankedResult extends SimulationResult {
  position: number;
  score: number;
  marketShare: number;
}

export interface StoredResult {
  id: number;
  round_id: number;
  group_id: number;
  data: RankedResult;
  position: number;
  score: number;
  created_at: string;
  group?: Group;
}

export interface Medal {
  id: number;
  group_id: number;
  round_id: number;
  type: string;
  description: string;
  icon: string;
  created_at: string;
  group?: Group;
}

export interface AuditLog {
  id: number;
  user_identifier: string;
  user_name: string;
  role: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface EconomicEvent {
  type: string;
  demandFactor: number;
  costFactor: number;
  description: string;
}

// Session payload stored in JWT
export interface SessionPayload {
  id: string;
  identifier: string; // email for professor, RA for student
  name: string;
  role: "teacher" | "student";
  groupId?: number;
  classId?: string;
  iat?: number;
  exp?: number;
}

// Initial balance constants
export interface InitialBalance {
  cash: number;
  banks: number;
  applications: number;
  clients: number;
  inventory: number;
  fixedAssets: number;
  suppliers: number;
  loans: number;
  equity: number;
}
