"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Save, AlertTriangle, CheckCircle2, Calculator, Printer, Trash2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DecisionForm } from "@/components/forms/DecisionForm";
import { CashFlowPanel } from "@/components/charts/CashFlowPanel";
import { currency, percent, number } from "@/lib/utils/format";
import { simulateCompany, DEFAULT_DECISION, resultToOpeningBalance } from "@/lib/simulation/engine";
import type { Decision, Group, Round, Submission, SimulationResult, InitialBalance, RoundConfig } from "@/types";

interface ClassSettings {
  fixed_expenses: number | null;
  transport: number | null;
  maintenance: number | null;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export default function FormularioPage() {
  const { roundId } = useParams<{ roundId: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [classSettings, setClassSettings] = useState<ClassSettings | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [decision, setDecision] = useState<Decision>({ ...DEFAULT_DECISION, productionQty: 0, plasticQty: 0, capsQty: 0, packageQty: 0, labelQty: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState<Partial<InitialBalance> | undefined>(undefined);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const load = useCallback(async () => {
    // Load round + groups + class settings in parallel
    const [rRes, gRes, csRes] = await Promise.all([
      fetch(`/api/rounds/${roundId}`),
      fetch("/api/groups"),
      fetch("/api/classes"),
    ]);
    const rData = await rRes.json();
    const gData = await gRes.json();
    const csData = await csRes.json();

    const roundData: Round = rData.round;
    setRound(roundData);

    const groups: Group[] = gData.groups || [];
    setAllGroups(groups);
    setClassSettings(csData.class ?? null);

    // Get my group from session
    const sessionRes = await fetch("/api/auth/me").catch(() => null);
    let groupId: number | null = null;
    if (sessionRes?.ok) {
      const sessionData = await sessionRes.json();
      groupId = sessionData.groupId;
    }

    let myGroup = groups[0] || null;
    if (groupId) {
      myGroup = groups.find((g: Group) => g.id === groupId) || myGroup;
    }
    setGroup(myGroup);

    if (myGroup) {
      const subRes = await fetch(
        `/api/submissions?round_id=${roundId}&group_id=${myGroup.id}`
      );
      const subData = await subRes.json();
      const base = subData.submission
        // Envio existente: restaura tudo o que o aluno digitou
        ? { ...DEFAULT_DECISION, ...subData.submission.decision }
        // Nova rodada sem envio: qtds de produção e materiais iniciam em 0 (campo em branco)
        : { ...DEFAULT_DECISION, productionQty: 0, plasticQty: 0, capsQty: 0, packageQty: 0, labelQty: 0 };

      // Prioridade: valores travados na RODADA (round-level) sobrescrevem os da turma
      const cs = csData.class as ClassSettings | null;

      // 1) turma (Configurações do professor)
      if (cs?.fixed_expenses != null) base.fixedExpenses = cs.fixed_expenses;
      if (cs?.transport != null)       base.transport     = cs.transport;
      if (cs?.maintenance != null)     base.maintenance   = cs.maintenance;

      // 2) rodada sobrescreve turma quando definido
      if (roundData?.fixed_expenses != null) base.fixedExpenses = roundData.fixed_expenses;
      if (roundData?.transport      != null) base.transport     = roundData.transport;
      if (roundData?.maintenance    != null) base.maintenance   = roundData.maintenance;
      if (roundData?.avg_salary     != null) base.laborCost     = roundData.avg_salary;
      // 3) preços unitários de materiais travados pela rodada
      if (roundData?.plastic_unit   != null) base.plasticUnit   = roundData.plastic_unit;
      if (roundData?.caps_unit      != null) base.capsUnit      = roundData.caps_unit;
      if (roundData?.package_unit   != null) base.packageUnit   = roundData.package_unit;
      if (roundData?.label_unit     != null) base.labelUnit     = roundData.label_unit;

      if (subData.submission) setSubmission(subData.submission);
      setDecision(base);

      // ── Carryover: buscar resultado da rodada anterior para este grupo ──────
      if (groupId) {
        try {
          const accumRes = await fetch("/api/results/accumulated");
          if (accumRes.ok) {
            const accumData = await accumRes.json();
            const myEntry = (accumData.ranking || []).find(
              (e: { group_id: number }) => e.group_id === groupId
            );
            if (myEntry?.rounds?.length > 0) {
              // Pega o resultado da rodada mais recente processada antes desta
              const prevRounds = myEntry.rounds.filter(
                (r: { round_id: number }) => r.round_id < Number(roundId)
              );
              if (prevRounds.length > 0) {
                const lastPrev = prevRounds[prevRounds.length - 1];
                // Busca o resultado completo para calcular o carryover
                const prevResRes = await fetch(`/api/results?round_id=${lastPrev.round_id}`);
                if (prevResRes.ok) {
                  const prevResData = await prevResRes.json();
                  const myPrevResult = (prevResData.results || []).find(
                    (r: { group_id: number }) => r.group_id === groupId
                  );
                  if (myPrevResult?.data) {
                    setOpeningBalance(resultToOpeningBalance(myPrevResult.data as SimulationResult));
                  }
                }
              }
            }
          }
        } catch {
          // silently fail — opening balance is optional for preview
        }
      }
    }

    setLoading(false);
  }, [roundId]);

  useEffect(() => { load(); }, [load]);

  // Configuração da rodada para o engine (Migration 008 + 009)
  const roundConfig: RoundConfig | undefined = round
    ? {
        marketing_insertion_cost: round.marketing_insertion_cost ?? null,
        machine_min_employees:    round.machine_min_employees    ?? null,
        payroll_charges_pct:      round.payroll_charges_pct      ?? null,
      }
    : undefined;

  const preview = useMemo(
    () => (group ? simulateCompany(group, decision, 42, null, openingBalance, roundConfig) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [group, decision, openingBalance, round]
  );

  async function saveDraft() {
    if (!group) return;
    setSaving(true);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round_id: roundId, group_id: group.id, decision }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmission(data.submission);
      setSavedAt(new Date().toLocaleString("pt-BR"));
    } else {
      alert(data.error);
    }
    setSaving(false);
  }

  function printDecision() {
    const fmt = (n: number, dec = 2) =>
      n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const brl = (n: number) => "R$ " + fmt(n);

    const machines = decision.machines;
    const rs = decision.regionalSales ?? [];

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Decisões — ${round?.name ?? "Rodada"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; background: #fff; padding: 20pt; }
    h1 { font-size: 15pt; margin-bottom: 2pt; }
    .subtitle { font-size: 9pt; color: #555; margin-bottom: 14pt; }
    .section { margin-bottom: 14pt; page-break-inside: avoid; }
    .section-title {
      font-size: 8pt; font-weight: bold; text-transform: uppercase;
      letter-spacing: 1px; color: #1a56d4; border-bottom: 1.5pt solid #1a56d4;
      padding-bottom: 3pt; margin-bottom: 7pt;
    }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6pt; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6pt; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6pt; }
    .field { border: 1pt solid #d1d5db; border-radius: 4pt; padding: 5pt 7pt; background: #f9fafb; }
    .field label { display: block; font-size: 7.5pt; color: #6b7280; margin-bottom: 2pt; }
    .field span { font-size: 10pt; font-weight: bold; }
    .field.locked { background: #fffbeb; border-color: #fbbf24; }
    .field.locked span::after { content: " 🔒"; font-size: 8pt; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th { background: #f3f4f6; text-align: left; padding: 5pt 7pt; border: 1pt solid #d1d5db; font-size: 8pt; }
    td { padding: 5pt 7pt; border: 1pt solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .check { color: #16a34a; font-weight: bold; }
    .cross { color: #9ca3af; }
    .total-row td { font-weight: bold; background: #f3f4f6 !important; border-top: 2pt solid #d1d5db; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14pt; border-bottom: 2pt solid #1a56d4; padding-bottom: 8pt; }
    .logo { font-size: 13pt; font-weight: bold; color: #1a56d4; }
    .logo small { display: block; font-size: 8pt; font-weight: normal; color: #6b7280; }
    .status-box { border: 1.5pt solid #16a34a; border-radius: 6pt; padding: 6pt 12pt; color: #15803d; font-weight: bold; font-size: 9pt; }
    .balance-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5pt; }
    @media print {
      body { padding: 10pt 14pt; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">Arena Contábil<small>Business Accounting Simulator</small></div>
    <h1>${round?.name ?? "Formulário da Rodada"}</h1>
    <p class="subtitle">${group?.name ?? ""} · ${group?.company_name ?? ""} · Região: ${group?.region_name ?? ""}</p>
  </div>
  <div>
    <div class="status-box">${submission?.status === "Enviada"
      ? `✅ ENVIADA<br/><span style="font-size:8pt;font-weight:normal">por ${submission.sent_by_name} (RA ${submission.sent_by_ra})<br/>${submission.sent_at ? new Date(submission.sent_at).toLocaleString("pt-BR") : ""}</span>`
      : "⏳ Rascunho"
    }</div>
    <p style="font-size:8pt;color:#6b7280;margin-top:5pt;text-align:right">Impresso em ${new Date().toLocaleString("pt-BR")}</p>
  </div>
</div>

${openingBalance ? `
<div class="section">
  <div class="section-title">Saldo de Abertura (Carryover da Rodada Anterior)</div>
  <div class="balance-grid">
    <div class="field"><label>Caixa Inicial</label><span>${brl(openingBalance.cash ?? 0)}</span></div>
    <div class="field"><label>Duplicatas a Receber</label><span>${brl(openingBalance.clients ?? 0)}</span></div>
    <div class="field"><label>Estoques</label><span>${brl(openingBalance.inventory ?? 0)}</span></div>
    <div class="field"><label>Imobilizado</label><span>${brl(openingBalance.fixedAssets ?? 0)}</span></div>
    <div class="field"><label>Empréstimos</label><span>${brl(openingBalance.loans ?? 0)}</span></div>
    <div class="field"><label>Patrimônio Líquido</label><span>${brl(openingBalance.equity ?? 0)}</span></div>
  </div>
  ${(openingBalance.machineCapacity ?? 0) > 0 ? `<p style="margin-top:6pt;font-size:8.5pt;color:#1a56d4">🔧 Capacidade acumulada de máquinas: +${(openingBalance.machineCapacity ?? 0).toLocaleString("pt-BR")} unid.</p>` : ""}
</div>` : ""}

<div class="section">
  <div class="section-title">1. Produção</div>
  <div class="grid">
    <div class="field"><label>Quantidade a Produzir (unid.)</label><span>${fmt(decision.productionQty, 0)}</span></div>
    <div class="field"><label>Colaboradores</label><span>${fmt(decision.employees, 0)}</span></div>
    <div class="field ${round?.avg_salary != null ? "locked" : ""}"><label>Custo Médio por Colaborador (R$)</label><span>${brl(decision.laborCost)}</span></div>
    <div class="field"><label>Prazo de Pagamento Fornecedores</label><span>${decision.supplierTerm} dias</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">2. Compra de Materiais</div>
  <table>
    <thead>
      <tr><th>Material</th><th>Estoque Anterior</th><th>Qtd. a Comprar</th><th>Preço Unit. (R$)</th><th>Total (R$)</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Plástico</td>
        <td>${openingBalance ? fmt(openingBalance.plasticStock ?? 0, 0) : "—"}</td>
        <td>${fmt(decision.plasticQty, 0)}</td>
        <td class="${round?.plastic_unit != null ? "locked" : ""}">${brl(decision.plasticUnit)}</td>
        <td>${brl(decision.plasticQty * decision.plasticUnit)}</td>
      </tr>
      <tr>
        <td>Tampas</td>
        <td>${openingBalance ? fmt(openingBalance.capsStock ?? 0, 0) : "—"}</td>
        <td>${fmt(decision.capsQty, 0)}</td>
        <td class="${round?.caps_unit != null ? "locked" : ""}">${brl(decision.capsUnit)}</td>
        <td>${brl(decision.capsQty * decision.capsUnit)}</td>
      </tr>
      <tr>
        <td>Embalagem</td>
        <td>${openingBalance ? fmt(openingBalance.packageStock ?? 0, 0) : "—"}</td>
        <td>${fmt(decision.packageQty, 0)}</td>
        <td class="${round?.package_unit != null ? "locked" : ""}">${brl(decision.packageUnit)}</td>
        <td>${brl(decision.packageQty * decision.packageUnit)}</td>
      </tr>
      <tr>
        <td>Rótulo</td>
        <td>${openingBalance ? fmt(openingBalance.labelStock ?? 0, 0) : "—"}</td>
        <td>${fmt(decision.labelQty, 0)}</td>
        <td class="${round?.label_unit != null ? "locked" : ""}">${brl(decision.labelUnit)}</td>
        <td>${brl(decision.labelQty * decision.labelUnit)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="4">Total de Compras</td>
        <td>${brl(
          decision.plasticQty * decision.plasticUnit +
          decision.capsQty * decision.capsUnit +
          decision.packageQty * decision.packageUnit +
          decision.labelQty * decision.labelUnit
        )}</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">3. Vendas por Região</div>
  ${rs.length > 0 ? `
  <table>
    <thead>
      <tr><th>Região</th><th>Vender?</th><th>Quantidade (unid.)</th><th>Preço de Venda (R$)</th><th>Receita Estimada (R$)</th></tr>
    </thead>
    <tbody>
      ${rs.map(r => `
      <tr>
        <td>${r.region_name}</td>
        <td class="${r.active ? "check" : "cross"}">${r.active ? "✔ Sim" : "✘ Não"}</td>
        <td>${r.active ? fmt(r.qty, 0) : "—"}</td>
        <td>${r.active ? brl(r.price) : "—"}</td>
        <td>${r.active ? brl(r.qty * r.price) : "—"}</td>
      </tr>`).join("")}
      <tr class="total-row">
        <td colspan="2">Total</td>
        <td>${fmt(rs.filter(r => r.active).reduce((s, r) => s + r.qty, 0), 0)} unid.</td>
        <td>—</td>
        <td>${brl(rs.filter(r => r.active).reduce((s, r) => s + r.qty * r.price, 0))}</td>
      </tr>
    </tbody>
  </table>` : `
  <div class="grid-2">
    <div class="field"><label>Preço de Venda</label><span>${brl(decision.salePrice)}</span></div>
    <div class="field"><label>Qtd. Esperada de Vendas</label><span>${fmt(decision.expectedSales, 0)} unid.</span></div>
  </div>`}
</div>

<div class="section">
  <div class="section-title">4. Finanças e Cobrança</div>
  <div class="grid">
    <div class="field"><label>Prazo de Recebimento (Clientes)</label><span>${decision.receivableTerm} dias</span></div>
    <div class="field"><label>Marketing (R$)</label><span>${brl(decision.marketing)}</span></div>
    <div class="field"><label>Desconto Comercial (%)</label><span>${fmt(decision.discount, 1)}%</span></div>
    <div class="field"><label>Empréstimo Captado (R$)</label><span>${brl(decision.loan)}</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">5. Despesas Operacionais</div>
  <div class="grid">
    <div class="field ${round?.fixed_expenses != null ? "locked" : ""}"><label>Despesas Fixas (R$)</label><span>${brl(decision.fixedExpenses)}</span></div>
    <div class="field ${round?.transport != null ? "locked" : ""}"><label>Transporte (R$)</label><span>${brl(decision.transport)}</span></div>
    <div class="field ${round?.maintenance != null ? "locked" : ""}"><label>Manutenção (R$)</label><span>${brl(decision.maintenance)}</span></div>
    <div class="field"><label>Total Despesas Op.</label><span>${brl(decision.fixedExpenses + decision.transport + decision.maintenance)}</span></div>
  </div>
</div>

${machines ? `
<div class="section">
  <div class="section-title">6. Compra de Máquinas</div>
  <table>
    <thead>
      <tr><th>Tipo</th><th>Qtd.</th><th>Capacidade Adicionada</th><th>Valor Unit. (R$)</th><th>Total (R$)</th></tr>
    </thead>
    <tbody>
      <tr><td>Máquina Pequena</td><td>${machines.small}</td><td>${(machines.small * 10000).toLocaleString("pt-BR")} unid.</td><td>${brl(20000)}</td><td>${brl(machines.small * 20000)}</td></tr>
      <tr><td>Máquina Média</td><td>${machines.medium}</td><td>${(machines.medium * 20000).toLocaleString("pt-BR")} unid.</td><td>${brl(40000)}</td><td>${brl(machines.medium * 40000)}</td></tr>
      <tr><td>Máquina Grande</td><td>${machines.large}</td><td>${(machines.large * 60000).toLocaleString("pt-BR")} unid.</td><td>${brl(80000)}</td><td>${brl(machines.large * 80000)}</td></tr>
      <tr class="total-row">
        <td colspan="2">Total</td>
        <td>${((machines.small * 10000) + (machines.medium * 20000) + (machines.large * 60000)).toLocaleString("pt-BR")} unid.</td>
        <td>—</td>
        <td>${brl(machines.small * 20000 + machines.medium * 40000 + machines.large * 80000)}</td>
      </tr>
    </tbody>
  </table>
  <p style="margin-top:5pt;font-size:8.5pt;color:#555">Forma de pagamento: <strong>${machines.paymentMethod === "cash" ? "À vista (30% no ato)" : "Parcelado (3×, 30% entrada + 2 parcelas)"}</strong></p>
</div>` : ""}

<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(html); w.document.close(); }
  }

  async function sendRound() {
    if (!group) return;
    if (!confirm("Após enviar, nenhum integrante do grupo poderá alterar esta rodada. Deseja continuar?")) return;
    setSending(true);
    const res = await fetch("/api/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round_id: roundId, group_id: group.id, decision }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmission(data.submission);
      load();
    } else {
      alert(data.error);
    }
    setSending(false);
  }

  function clearDecision() {
    setDecision((prev) => ({
      ...prev,
      // Produção
      productionQty: 0,
      admittedEmployees: 0,
      dismissedEmployees: 0,
      // Materiais
      plasticQty: 0,
      capsQty: 0,
      packageQty: 0,
      labelQty: 0,
      supplierTerm: 30,
      // Vendas por região
      regionalSales: (prev.regionalSales || []).map((rs) => ({
        ...rs,
        active: false,
        qty: 0,
        price: 0,
        insertions: 0,
      })),
      salePrice: 0,
      expectedSales: 0,
      discount: 0,
      receivableTerm: 30,
      // Marketing
      marketingInsertions: 0,
      marketing: 0,
      // Máquinas
      machines: { small: 0, medium: 0, large: 0, paymentMethod: "cash" },
      machineInvestment: 0,
      // Financiamento
      loan: 0,
      // NÃO limpa: fixedExpenses, transport, maintenance, laborCost
      // NÃO limpa: plasticUnit, capsUnit, packageUnit, labelUnit
      // NÃO limpa: employees, productiveCapacity
    }));
    setShowClearConfirm(false);
    setSavedAt(null);
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const isSubmitted = submission?.status === "Enviada";
  const isOpen = round?.status === "Aberta";
  const canEdit = isOpen && !isSubmitted;

  return (
    <div className="space-y-6">
      {/* Header de impressão (só aparece ao imprimir) */}
      <div className="print-header hidden">
        Arena Contábil — Business Accounting Simulator
        <br />
        <span style={{ fontSize: "11pt", fontWeight: "normal" }}>
          {round?.name || "Formulário da Rodada"} · {group?.company_name} · {group?.region_name}
        </span>
      </div>

      {/* Header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">
            {round?.name || "Formulário da Rodada"}
          </h1>
          <p className="text-sm text-slate-400">
            {group?.company_name || "Sua empresa"} · {group?.region_name}
          </p>
        </div>
        <button
          onClick={printDecision}
          className="no-print flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Imprimir</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

      {/* Submitted banner */}
      {isSubmitted && submission && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="no-print flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-bold text-emerald-300">Rodada enviada com sucesso!</p>
            <p className="mt-1 text-sm text-slate-300">
              Enviada por <strong>{submission.sent_by_name}</strong> – RA {submission.sent_by_ra}{" "}
              – em {submission.sent_at ? new Date(submission.sent_at).toLocaleString("pt-BR") : "—"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              O formulário está bloqueado para todos os integrantes do grupo. Aguarde o professor processar os resultados.
            </p>
          </div>
        </motion.div>
      )}

      {/* Not open / locked banners */}
      {!isOpen && !isSubmitted && (() => {
        const status = round?.status;
        const isEncerrada = status === "Encerrada";
        const isProcessada = status === "Processada";

        if (isProcessada) return (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold text-emerald-300">🏆 Rodada Processada — Resultados Disponíveis</p>
              <p className="mt-1 text-sm text-slate-300">
                Esta rodada foi processada pelo professor. Acesse o menu <strong>Resultados</strong> para ver seu desempenho, DRE, ranking e feedback.
              </p>
              <p className="mt-1 text-xs text-slate-500">As decisões não podem mais ser alteradas.</p>
            </div>
          </motion.div>
        );

        if (isEncerrada) return (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-bold text-rose-300">🔒 Rodada Encerrada</p>
              <p className="mt-1 text-sm text-slate-300">
                O professor encerrou esta rodada. Nenhuma alteração é permitida.
                Aguarde o professor processar os resultados.
              </p>
              <p className="mt-1 text-xs text-slate-500">Apenas o professor pode reabrir a rodada.</p>
            </div>
          </motion.div>
        );

        return (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Rodada não está aberta</p>
              <p className="text-sm text-slate-400">Status atual: <strong className="text-amber-300">{round?.status}</strong>. Aguarde o professor abrir a rodada.</p>
            </div>
          </div>
        );
      })()}

      {/* Opening balance carryover */}
      {openingBalance && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2">Saldo de Abertura (Carryover)</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3 md:grid-cols-6">
            <div className="flex flex-col gap-0.5"><span className="text-slate-400">Caixa inicial</span><span className="text-white font-semibold">{currency(openingBalance.cash ?? 0)}</span></div>
            <div className="flex flex-col gap-0.5"><span className="text-slate-400">Duplicatas a Receber</span><span className="text-white font-semibold">{currency(openingBalance.clients ?? 0)}</span></div>
            <div className="flex flex-col gap-0.5"><span className="text-slate-400">Estoque inicial</span><span className="text-white font-semibold">{currency(openingBalance.inventory ?? 0)}</span></div>
            <div className="flex flex-col gap-0.5"><span className="text-slate-400">Imobilizado</span><span className="text-white font-semibold">{currency(openingBalance.fixedAssets ?? 0)}</span></div>
            <div className="flex flex-col gap-0.5"><span className="text-slate-400">Empréstimos</span><span className="text-rose-400 font-semibold">{currency(openingBalance.loans ?? 0)}</span></div>
            <div className="flex flex-col gap-0.5"><span className="text-slate-400">PL inicial</span><span className="text-emerald-400 font-semibold">{currency(openingBalance.equity ?? 0)}</span></div>
          </div>
          {(openingBalance.machineCapacity ?? 0) > 0 && (
            <p className="mt-2 text-xs text-cyan-300">🔧 Capacidade de máquinas acumulada: <strong>+{(openingBalance.machineCapacity ?? 0).toLocaleString("pt-BR")} unid.</strong></p>
          )}
          <p className="mt-2 text-[10px] text-slate-500 italic">Valores do encerramento da rodada anterior.</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Decision form */}
        <Panel
          title="Decisões da Rodada"
          icon={Calculator}
          actions={
            canEdit ? (
              <div className="no-print flex gap-2">
                <Button variant="secondary" size="sm" onClick={saveDraft} loading={saving}>
                  <Save className="h-4 w-4" />
                  Rascunho
                </Button>
                <Button variant="success" size="sm" onClick={sendRound} loading={sending}>
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              </div>
            ) : undefined
          }
        >
          {savedAt && !isSubmitted && (
            <p className="mb-4 text-xs text-emerald-400">✓ Rascunho salvo em {savedAt}</p>
          )}
          <DecisionForm
            decision={decision}
            onChange={setDecision}
            disabled={!canEdit}
            groups={allGroups}
            myGroup={group ?? undefined}
            priceMin={round?.price_min}
            priceMax={round?.price_max}
            lockedFixedExpenses={round?.fixed_expenses ?? classSettings?.fixed_expenses ?? null}
            lockedTransport={round?.transport ?? classSettings?.transport ?? null}
            lockedMaintenance={round?.maintenance ?? classSettings?.maintenance ?? null}
            lockedAvgSalary={round?.avg_salary ?? null}
            lockedPlasticUnit={round?.plastic_unit ?? null}
            lockedCapsUnit={round?.caps_unit ?? null}
            lockedPackageUnit={round?.package_unit ?? null}
            lockedLabelUnit={round?.label_unit ?? null}
            materialStock={openingBalance ? {
              plastic: openingBalance.plasticStock  ?? 0,
              caps:    openingBalance.capsStock     ?? 0,
              package: openingBalance.packageStock  ?? 0,
              label:   openingBalance.labelStock    ?? 0,
            } : undefined}
            accumulatedMachineCapacity={openingBalance?.machineCapacity ?? 0}
            currentEmployees={openingBalance?.currentEmployees}
            marketingInsertionCost={round?.marketing_insertion_cost}
            machineMinEmployees={round?.machine_min_employees}
            payrollChargesPct={round?.payroll_charges_pct}
          />

          {canEdit && (
            <div className="no-print mt-6 border-t border-white/10 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="ghost"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" /> Limpar tudo
                </Button>
                <Button variant="secondary" onClick={saveDraft} loading={saving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4" /> Salvar rascunho
                </Button>
                <Button variant="success" onClick={sendRound} loading={sending} size="lg" className="w-full sm:w-auto">
                  <Send className="h-4 w-4" /> ENVIAR RODADA
                </Button>
              </div>

              {/* Confirmação de limpeza */}
              {showClearConfirm && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <div>
                      <p className="font-semibold text-rose-300">Limpar todos os campos?</p>
                      <p className="mt-0.5 text-sm text-rose-200/80">
                        Todos os valores preenchidos serão apagados. Campos configurados pelo professor (custos fixos, salários, preços de materiais) serão mantidos. Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearDecision}
                      className="rounded-lg bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors"
                    >
                      Sim, limpar tudo
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Inconsistencies */}
        {preview && preview.inconsistencies.length > 0 && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h4 className="font-bold text-rose-300">Inconsistências detectadas</h4>
            </div>
            <ul className="space-y-1">
              {preview.inconsistencies.map((i) => (
                <li key={i} className="text-xs text-rose-200">• {i}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── DRE Preview ── */}
        {preview && (
          <Panel title="📊 DRE Estimada — Prévia em Tempo Real" icon={Calculator}>
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-3 py-2 text-[11px] text-slate-400">
              <span className="text-cyan-400">ℹ</span>
              <span>
                Prévia calculada com preço médio de mercado estimado (R$ 42,00).
                Os valores reais dependem das decisões de todos os grupos e podem variar após o processamento da rodada.
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              {/* Receita */}
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Receita Líquida de Vendas</span>
                <span className="font-semibold text-emerald-400">{currency(preview.netRevenue)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">(-) CMV</span>
                <span className="font-semibold text-rose-400">({currency(preview.cmv)})</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                <span className="font-semibold text-white">= Lucro Bruto</span>
                <span className={`font-bold ${preview.grossProfit >= 0 ? "text-white" : "text-rose-400"}`}>{currency(preview.grossProfit)}</span>
              </div>
              {/* Despesas op */}
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">(-) Salários</span>
                <span className="font-semibold text-rose-400">({currency(preview.totalSalary ?? 0)})</span>
              </div>
              {(preview.payrollCharges ?? 0) > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">(-) Encargos sobre Folha <span className="text-[10px] text-rose-400 bg-rose-400/10 rounded px-1">FGTS/INSS</span></span>
                  <span className="font-semibold text-rose-400">({currency(preview.payrollCharges ?? 0)})</span>
                </div>
              )}
              {(preview.marketingInsertionCost ?? 0) > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Inserções de Marketing</span>
                  <span className="font-semibold text-rose-400">({currency(preview.marketingInsertionCost ?? 0)})</span>
                </div>
              )}
              {(preview.hiringCost ?? 0) > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Custo de Contratação</span>
                  <span className="font-semibold text-rose-400">({currency(preview.hiringCost ?? 0)})</span>
                </div>
              )}
              {(preview.firingCost ?? 0) > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Custo de Demissão</span>
                  <span className="font-semibold text-rose-400">({currency(preview.firingCost ?? 0)})</span>
                </div>
              )}
              {(preview.storageExpense ?? 0) > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">(-) Custo de Armazenagem (5%)</span>
                  <span className="font-semibold text-amber-400">({currency(preview.storageExpense ?? 0)})</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/5 pb-1.5 text-xs text-slate-500">
                <span className="pl-2 italic">Total Desp. Operacionais</span>
                <span>({currency(preview.operationalExpenses)})</span>
              </div>
              <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                <span className="font-semibold text-white">= EBIT (Lucro Operacional)</span>
                <span className={`font-bold ${preview.ebit >= 0 ? "text-white" : "text-rose-400"}`}>{currency(preview.ebit)}</span>
              </div>
              {/* Financeiro */}
              {(() => {
                const lair = preview.ebt ?? preview.ebit;
                const despFin = preview.ebit - lair;
                return (
                  <>
                    {despFin > 0.01 && (
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-slate-400">(-) Despesa Financeira (juros)</span>
                        <span className="font-semibold text-rose-400">({currency(despFin)})</span>
                      </div>
                    )}
                    <div className="flex justify-between rounded-lg bg-white/5 px-2 py-1.5 mb-1">
                      <span className="font-semibold text-white">= LAIR</span>
                      <span className={`font-bold ${lair >= 0 ? "text-white" : "text-rose-400"}`}>{currency(lair)}</span>
                    </div>
                  </>
                );
              })()}
              {(preview.incomeTax ?? 0) > 0 && (
                <div className="flex justify-between border-b border-white/5 pb-1.5 text-xs text-slate-400">
                  <span className="pl-2 italic">(-) IR + CSLL (24% s/ LAIR positivo)</span>
                  <span>({currency(preview.incomeTax ?? 0)})</span>
                </div>
              )}
              {/* Resultado final */}
              <div className={`flex justify-between rounded-xl px-3 py-3 mt-1 ${preview.netProfit >= 0 ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-rose-500/15 border border-rose-500/30"}`}>
                <span className="text-base font-black text-white">
                  {preview.netProfit >= 0 ? "= LUCRO LÍQUIDO ESTIMADO" : "= PREJUÍZO ESTIMADO"}
                </span>
                <span className={`text-base font-black ${preview.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {preview.netProfit >= 0 ? currency(preview.netProfit) : `(${currency(Math.abs(preview.netProfit))})`}
                </span>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
