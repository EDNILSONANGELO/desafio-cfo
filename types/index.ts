// ============================================================
// ARENA CONTÁBIL – TypeScript Types
// ============================================================

export interface Professor {
  id: string;
  email: string;
  name: string;
  polo?: string | null;
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
  semestre?: number | null;
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
  // Despesas/salário travados pelo professor para esta rodada (null = aluno define livremente)
  fixed_expenses: number | null;
  transport: number | null;
  maintenance: number | null;
  avg_salary: number | null;   // Valor médio de salário por funcionário (trava)
  // Preços unitários de materiais travados (null = aluno define livremente)
  plastic_unit: number | null;
  caps_unit: number | null;
  package_unit: number | null;
  label_unit: number | null;
  // ── Novos campos (Migration 008) ──────────────────────────────────────────────
  marketing_insertion_cost: number | null;  // Custo por inserção de marketing (null = padrão R$1.500)
  machine_min_employees: number | null;     // Min. funcionários por 1.000 unidades (null = 3)
  // ── Novos campos (Migration 009 — Encargos sobre folha) ───────────────────────
  payroll_charges_pct: number | null;       // % de encargos sobre folha salarial (null = 0%)
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
  insertions?: number;  // Inserções de marketing nesta região (0–8, Migration 008)
}

// ─── Compra de Máquinas ───────────────────────────────────────────────────────
export interface MachinePurchase {
  small: number;        // Máquina Pequena: R$20.000 / +10.000 unid.
  medium: number;       // Máquina Média:   R$40.000 / +20.000 unid.
  large: number;        // Máquina Grande:  R$80.000 / +60.000 unid.
  paymentMethod: "cash" | "installments"; // à vista (15 dias) ou 3× parcelado
}

export interface Decision {
  productionQty: number;
  productiveCapacity: number;
  employees: number;       // funcionários ativos (net = prevEmployees + admitted - dismissed)
  laborCost: number;
  // ── Funcionários admit/demit (Migration 008) ──────────────────────────────────
  admittedEmployees?: number;   // admissões nesta rodada
  dismissedEmployees?: number;  // demissões nesta rodada
  // ── Inserções de Marketing (Migration 008) ────────────────────────────────────
  marketingInsertions?: number; // 0–8 inserções de marketing
  // ── Materiais ─────────────────────────────────────────────────────────────────
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
  machines?: MachinePurchase;  // ← compra estruturada de máquinas
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
  cmv: number;                  // CMV total (materiais + depreciação)
  depreciationExpense?: number; // Depreciação linear 10% a.a. — componente do CMV (não-caixa)
  grossProfit: number;
  totalSalary: number;        // Qtde. funcionários × valor médio de salário
  payrollCharges?: number;    // Encargos sobre folha salarial (totalSalary × payrollChargesPct)
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

  // ── NOVOS CAMPOS (Phase 1) ────────────────────────────────────────────────────
  storageExpense?: number;       // Custo de armazenagem (5% do estoque não vendido)
  emergencyLoan?: number;        // Empréstimo emergencial acionado (caixa negativo)

  // ── FUNCIONÁRIOS (Migration 008) ─────────────────────────────────────────────
  netEmployees?: number;          // Funcionários ativos após admissões/demissões
  minEmployeesNeeded?: number;    // Mínimo necessário para a produção planejada
  idleEmployees?: number;         // Ociosos (disponíveis − necessários)
  missingEmployees?: number;      // Faltando (necessários − disponíveis)
  employeeStatus?: "good" | "alert" | "strike";
  employeeStatusLabel?: string;   // "Está bom" | "Está em alerta" | "Está em greve"
  hiringCost?: number;            // Custo total de contratações (encargos + treinamento)
  firingCost?: number;            // Custo total de demissões (aviso prévio + FGTS multa)
  employeeProductionFactor?: number; // Fator de produtividade aplicado (1.0 / 0.90 / 0.70)

  // ── MARKETING E VENDAS REGIONAIS (Migration 008) ─────────────────────────────
  marketingInsertionCost?: number; // Custo total das inserções de marketing
  regionalTransportCost?: number;  // Custo de transporte inter-regional (fora da região de origem)

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

  // ── CAMPOS DE CARRYOVER ───────────────────────────────────────────────────────
  isCarryover?: boolean;         // true se usou saldo do período anterior

  // ── SALDO DE MATERIAIS (carryover) ───────────────────────────────────────────
  plasticLeftover?: number;    // plástico não consumido no período
  capsLeftover?: number;
  packageLeftover?: number;
  labelLeftover?: number;

  // ── COMPRA DE MÁQUINAS ────────────────────────────────────────────────────────
  machinesTotalCost?: number;       // custo total das máquinas compradas na rodada
  machinesCapacityAdded?: number;   // capacidade adicionada pelas novas máquinas
  machinesDownPayment?: number;     // valor pago no ato (à vista = total; 3x = 1/3)
  machinesPayable?: number;         // parcelas futuras (3x = 2/3 + juros)
  machinesInterest?: number;        // total de juros do parcelamento
  accumulatedMachineCapacity?: number; // capacidade total acumulada (inclui rounds anteriores)
}

export interface RankedResult extends SimulationResult {
  position: number;
  score: number;
  marketShare: number;
  professor_comment?: string; // Comentário do professor (opcional, adicionado pós-processamento)
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
  identifier: string;  // email para professor, RA para aluno
  name: string;
  role: "teacher" | "student";
  groupId?: number;
  classId?: string;
  isMaster?: boolean;  // true = usuário master institucional (admin de professores)
  polo?: string;       // polo/campus do professor
  firstAccess?: boolean; // true = aluno deve trocar a senha antes de acessar o sistema
  iat?: number;
  exp?: number;
}

export interface GradeAdjustment {
  id: number;
  student_id: string;
  round_id: number;
  adjusted_nota: number;
  justification: string;
  created_at: string;
  updated_at: string;
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
  machineCapacity?: number;      // capacidade acumulada de máquinas compradas (carryover)
  machinePayableBalance?: number; // parcelas de máquinas a vencer (carryover de 3x)
  // Saldo de matérias-primas não consumidas (carryover)
  plasticStock?: number;
  capsStock?: number;
  packageStock?: number;
  labelStock?: number;
  // Funcionários ativos no início da rodada (carryover Migration 008)
  currentEmployees?: number;
}

// Configuração da rodada passada ao engine de simulação
export interface RoundConfig {
  marketing_insertion_cost?: number | null;
  machine_min_employees?: number | null;
  payroll_charges_pct?: number | null;       // % de encargos sobre folha (null/0 = sem encargos)
}
