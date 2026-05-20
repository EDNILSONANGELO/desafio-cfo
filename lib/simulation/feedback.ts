/**
 * Gerador Automático de Feedback Pedagógico
 *
 * Analisa os indicadores de uma empresa e produz textos explicativos
 * que ajudam o aluno a entender o que aconteceu e como melhorar.
 */

import type { RankedResult } from "@/types";

export interface FeedbackItem {
  category: "liquidity" | "profitability" | "production" | "cash" | "market" | "tribute";
  level: "success" | "warning" | "danger" | "info";
  title: string;
  text: string;
  tip?: string;
}

function fmt(v: number, decimals = 2) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function cur(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function generateFeedback(r: RankedResult): FeedbackItem[] {
  const items: FeedbackItem[] = [];

  // ── LIQUIDEZ ────────────────────────────────────────────────────────────────
  if (r.currentRatio < 1) {
    items.push({
      category: "liquidity",
      level: "danger",
      title: "🔴 Liquidez Corrente Crítica",
      text: `Sua Liquidez Corrente foi ${fmt(r.currentRatio)} — abaixo de 1,0 significa que o Passivo Circulante supera o Ativo Circulante. A empresa está em situação de insolvência técnica de curto prazo.`,
      tip: "Reduza empréstimos de curto prazo, aumente vendas ou reduza estoques para melhorar o AC.",
    });
  } else if (r.currentRatio < 1.5) {
    items.push({
      category: "liquidity",
      level: "warning",
      title: "🟡 Liquidez Corrente Moderada",
      text: `Liquidez Corrente de ${fmt(r.currentRatio)}. Razoável, mas há margem para melhorar. O ideal para uma empresa de manufatura é acima de 1,5.`,
      tip: "Avalie reduzir estoques parados e negociar prazos maiores com fornecedores.",
    });
  } else {
    items.push({
      category: "liquidity",
      level: "success",
      title: "🟢 Liquidez Corrente Saudável",
      text: `Liquidez Corrente de ${fmt(r.currentRatio)} — excelente! A empresa tem capacidade confortável de honrar suas obrigações de curto prazo.`,
    });
  }

  if (r.immediateRatio < 0.2) {
    items.push({
      category: "liquidity",
      level: "danger",
      title: "🔴 Liquidez Imediata Crítica",
      text: `Apenas ${fmt(r.immediateRatio, 3)} de liquidez imediata (caixa vs. passivo circulante). Risco elevado de não conseguir pagar obrigações urgentes.`,
      tip: "Mantenha um mínimo de caixa/bancos equivalente a 20–30% do passivo circulante.",
    });
  } else if (r.immediateRatio < 0.5) {
    items.push({
      category: "liquidity",
      level: "warning",
      title: "🟡 Atenção: Caixa Limitado",
      text: `Liquidez imediata de ${fmt(r.immediateRatio)}. O caixa disponível é restrito. Situações inesperadas podem comprometer pagamentos.`,
    });
  }

  // ── RENTABILIDADE ────────────────────────────────────────────────────────────
  if (r.netProfit < 0) {
    items.push({
      category: "profitability",
      level: "danger",
      title: "🔴 Empresa com Prejuízo",
      text: `Prejuízo líquido de ${cur(Math.abs(r.netProfit))} nesta rodada. O resultado negativo reduz o Patrimônio Líquido e pode comprometer a continuidade da empresa.`,
      tip: "Analise se o preço de venda cobre o CMV + todas as despesas. Reduza custos fixos e otimize a produção.",
    });
  } else if (r.netMargin < 5) {
    items.push({
      category: "profitability",
      level: "warning",
      title: "🟡 Margem Líquida Baixa",
      text: `Margem líquida de ${fmt(r.netMargin)}%. Para cada R$ 100 vendidos, a empresa lucrou apenas R$ ${fmt(r.netMargin, 2)}. Margem apertada deixa pouca folga para imprevistos.`,
      tip: "Revise o preço de venda, reduza despesas operacionais ou aumente o volume produzido.",
    });
  } else if (r.netMargin >= 10) {
    items.push({
      category: "profitability",
      level: "success",
      title: "🟢 Excelente Margem Líquida",
      text: `Margem líquida de ${fmt(r.netMargin)}% — muito acima da média. A empresa está convertendo vendas em lucro com alta eficiência.`,
    });
  }

  if (r.roa > 0 && r.roa < 3) {
    items.push({
      category: "profitability",
      level: "warning",
      title: "🟡 ROA Baixo",
      text: `ROA de ${fmt(r.roa)}% — os ativos da empresa estão gerando retorno abaixo do esperado. Cada R$ 100 de ativos gerou apenas R$ ${fmt(r.roa, 2)} de lucro.`,
      tip: "Avalie desinvestir em ativos ociosos ou aumentar a produtividade dos ativos existentes.",
    });
  } else if (r.roa >= 8) {
    items.push({
      category: "profitability",
      level: "success",
      title: "🟢 ROA Excelente",
      text: `ROA de ${fmt(r.roa)}% — excelente retorno sobre os ativos. A empresa usa seu patrimônio com alta eficiência.`,
    });
  }

  // ── PRODUÇÃO E ESTOQUE ───────────────────────────────────────────────────────
  const unsold = r.unsoldUnits ?? 0;
  const taxaVenda = r.productionEffective > 0 ? (r.realSalesQty / r.productionEffective) * 100 : 100;

  if (taxaVenda < 70) {
    items.push({
      category: "production",
      level: "danger",
      title: "🔴 Alto Volume de Estoque Parado",
      text: `Apenas ${fmt(taxaVenda, 1)}% da produção foi vendida. ${unsold.toLocaleString("pt-BR")} unidades ficaram em estoque (valor: ${cur(r.endingInventory)}). Além de imobilizar capital, o custo de armazenagem reduz o resultado.`,
      tip: "Planeje a produção mais próxima da demanda esperada. Considere reduzir o preço ou aumentar o marketing para estimular as vendas.",
    });
  } else if (taxaVenda < 90) {
    items.push({
      category: "production",
      level: "warning",
      title: "🟡 Estoque Residual",
      text: `${fmt(taxaVenda, 1)}% de aproveitamento da produção. Restaram ${unsold.toLocaleString("pt-BR")} unidades em estoque. Pequeno, mas ainda gera custo de armazenagem.`,
    });
  } else {
    items.push({
      category: "production",
      level: "success",
      title: "🟢 Produção Bem Calibrada",
      text: `${fmt(taxaVenda, 1)}% das unidades produzidas foram vendidas — excelente alinhamento entre produção e demanda.`,
    });
  }

  if ((r.storageExpense ?? 0) > 3000) {
    items.push({
      category: "production",
      level: "warning",
      title: "📦 Custo de Armazenagem Elevado",
      text: `O custo de armazenagem foi de ${cur(r.storageExpense ?? 0)} nesta rodada (5% sobre o valor do estoque acumulado). Estoques altos custam dinheiro mesmo quando a empresa não está produzindo.`,
      tip: "Reduza a produção ou aumente as vendas para diminuir o saldo de estoque.",
    });
  }

  // ── CAIXA ────────────────────────────────────────────────────────────────────
  if ((r.emergencyLoan ?? 0) > 0) {
    items.push({
      category: "cash",
      level: "danger",
      title: "🚨 Empréstimo Emergencial Acionado",
      text: `O caixa ficou negativo e um empréstimo emergencial de ${cur(r.emergencyLoan ?? 0)} foi ativado automaticamente. Isso aumenta o endividamento e reduz todos os indicadores de liquidez.`,
      tip: "Revise o fluxo de caixa: aumente o prazo de recebimento de clientes, reduza compras ou diminua despesas operacionais.",
    });
  }

  // ── CICLO FINANCEIRO ─────────────────────────────────────────────────────────
  if (r.cashCycle > 60) {
    items.push({
      category: "cash",
      level: "warning",
      title: "⏱ Ciclo Financeiro Longo",
      text: `Ciclo financeiro de ${fmt(r.cashCycle, 0)} dias — a empresa demora muito para receber das vendas em relação ao que paga a fornecedores. Isso pressiona o caixa.`,
      tip: `PME: ${fmt(r.pme, 0)} dias · PMR: ${fmt(r.pmr, 0)} dias · PMP: ${fmt(r.pmp, 0)} dias. Reduza prazo de recebimento ou negocie prazo maior com fornecedores.`,
    });
  } else if (r.cashCycle < 0) {
    items.push({
      category: "cash",
      level: "success",
      title: "🟢 Ciclo Financeiro Negativo",
      text: `Ciclo financeiro de ${fmt(r.cashCycle, 0)} dias — a empresa recebe dos clientes antes de pagar os fornecedores. Situação financeiramente privilegiada (similar a grandes varejistas).`,
    });
  } else if (r.cashCycle <= 30) {
    items.push({
      category: "cash",
      level: "success",
      title: "🟢 Ciclo Financeiro Eficiente",
      text: `Ciclo financeiro de ${fmt(r.cashCycle, 0)} dias — boa gestão do capital de giro.`,
    });
  }

  // ── MERCADO ──────────────────────────────────────────────────────────────────
  if (r.marketShare >= 30) {
    items.push({
      category: "market",
      level: "success",
      title: "🏆 Liderança de Mercado",
      text: `Market share de ${fmt(r.marketShare, 1)}% — sua empresa domina o mercado nesta rodada! Continue com a estratégia de preço e marketing.`,
    });
  } else if (r.marketShare < 15 && r.demand < r.realSalesQty * 1.2) {
    items.push({
      category: "market",
      level: "warning",
      title: "📉 Market Share Baixo",
      text: `Market share de ${fmt(r.marketShare, 1)}%. Outras empresas estão vendendo mais. Avalie se seu preço está competitivo e se o investimento em marketing é adequado.`,
    });
  }

  // ── TRIBUTAÇÃO ───────────────────────────────────────────────────────────────
  if ((r.incomeTax ?? 0) > 0) {
    items.push({
      category: "tribute",
      level: "info",
      title: "📋 IR e CSLL Apurados",
      text: `IR (15%): ${cur(r.ir ?? 0)} · CSLL (9%): ${cur(r.csll ?? 0)} · Total tributos: ${cur(r.incomeTax ?? 0)} sobre o LAIR de ${cur(r.ebt ?? r.ebit)}. Tributos são apurados somente sobre resultado positivo.`,
    });
  }

  // Nota geral de posição
  if (r.position === 1) {
    items.push({
      category: "market",
      level: "success",
      title: "🥇 MELHOR GESTOR DA RODADA!",
      text: `Parabéns! Sua empresa ficou em 1º lugar com score de ${fmt(r.score, 1)}. Excelente gestão financeira — continue assim nas próximas rodadas!`,
    });
  }

  return items;
}
