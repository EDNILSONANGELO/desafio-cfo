/**
 * Gerador de PDF de Relatório de Rodada — Arena Contábil
 * Usa jsPDF + jsPDF-autotable para gerar um relatório consolidado.
 */

import type { RankedResult } from "@/types";

// ── Formatadores locais (não usa o lib/utils/format pois é server-agnostic) ───
function R$(v: number | undefined | null): string {
  if (v === undefined || v === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
function pct(v: number | undefined | null): string {
  if (v === undefined || v === null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}
function n2(v: number | undefined | null): string {
  if (v === undefined || v === null) return "—";
  return v.toFixed(2);
}

// ── Paleta de cores ────────────────────────────────────────────────────────────
const CYAN   = [6, 182, 212]   as [number, number, number];
const DARK   = [10, 20, 40]    as [number, number, number];
const SLATE  = [15, 23, 42]    as [number, number, number];
const LIGHT  = [226, 232, 240] as [number, number, number];
const MUTED  = [100, 116, 139] as [number, number, number];
const GREEN  = [16, 185, 129]  as [number, number, number];
const RED    = [244, 63, 94]   as [number, number, number];
const AMBER  = [245, 158, 11]  as [number, number, number];

// ── Exporta o PDF ─────────────────────────────────────────────────────────────

export async function generateReportPDF(
  results: RankedResult[],
  roundName: string,
  eventType?: string
) {
  const { jsPDF } = await import("jspdf");
  const autoTable  = (await import("jspdf-autotable")).default;

  const doc      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W        = doc.internal.pageSize.getWidth();
  const H        = doc.internal.pageSize.getHeight();
  const ML       = 14;
  const MR       = 14;
  const CW       = W - ML - MR;
  const today    = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  let page = 1;

  // ── Rodapé de página ────────────────────────────────────────────────────────
  function footer() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.line(ML, H - 11, W - MR, H - 11);
    doc.text("Arena Contábil — Business Accounting Simulator", ML, H - 7);
    doc.text(`Página ${page}`, W - MR, H - 7, { align: "right" });
  }

  // ── Cabeçalho de seção ──────────────────────────────────────────────────────
  function sectionHeader(title: string, y: number): number {
    doc.setFillColor(...CYAN);
    doc.rect(ML, y, 2, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...LIGHT);
    doc.text(title, ML + 5, y + 4.5);
    return y + 10;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CAPA
  // ════════════════════════════════════════════════════════════════════════════

  // Fundo escuro
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");

  // Faixa topo
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, W, 5, "F");

  // Ícone central
  doc.setFillColor(6, 182, 212, 0.12);
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(1);
  doc.roundedRect(W / 2 - 18, 46, 36, 36, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...CYAN);
  doc.text("AC", W / 2, 68, { align: "center" });

  // Título
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("Arena Contábil", W / 2, 100, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(...CYAN);
  doc.text("Relatório de Rodada", W / 2, 111, { align: "center" });

  // Linha divisória
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.4);
  doc.line(ML + 25, 118, W - MR - 25, 118);

  // Info da rodada
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(roundName, W / 2, 130, { align: "center" });

  if (eventType && eventType !== "Mercado normal") {
    doc.setFontSize(9);
    doc.setTextColor(...AMBER);
    // Remove emoji from event type for PDF
    const evtClean = eventType.replace(/[^\w\s\-(),+]/g, "").trim();
    doc.text(`Evento: ${evtClean}`, W / 2, 139, { align: "center" });
  }

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(today, W / 2, 150, { align: "center" });
  doc.text(`${results.length} empresa${results.length !== 1 ? "s" : ""} participante${results.length !== 1 ? "s" : ""}`, W / 2, 158, { align: "center" });

  // Faixa rodapé capa
  doc.setFillColor(...CYAN);
  doc.rect(0, H - 5, W, 5, "F");
  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 2 — RANKING GERAL
  // ════════════════════════════════════════════════════════════════════════════

  page++;
  doc.addPage();
  doc.setFillColor(...SLATE);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, W, 1.5, "F");

  let y = 16;
  y = sectionHeader("Ranking Geral", y);

  const rankData = results.map((r) => [
    r.position <= 3 ? ["🥇", "🥈", "🥉"][r.position - 1] ?? `${r.position}º` : `${r.position}º`,
    r.company,
    r.group,
    r.score.toFixed(1),
    R$(r.netRevenue),
    R$(r.netProfit),
    pct(r.marketShare / 100),
  ]);

  autoTable(doc, {
    head: [["#", "Empresa", "Grupo", "Score", "Receita Liq.", "Lucro Liq.", "Mkt Share"]],
    body: rankData,
    startY: y,
    margin: { left: ML, right: MR },
    styles: { fontSize: 8.5, cellPadding: 3, font: "helvetica", textColor: LIGHT, fillColor: [22, 33, 55] },
    headStyles: { fillColor: [4, 100, 150], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [18, 28, 48] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    didParseCell: (data) => {
      // Lucro negativo em vermelho
      if (data.column.index === 5 && data.section === "body") {
        const val = results[data.row.index]?.netProfit ?? 0;
        if (val < 0) data.cell.styles.textColor = RED;
      }
    },
  });

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 3 — INDICADORES FINANCEIROS
  // ════════════════════════════════════════════════════════════════════════════

  page++;
  doc.addPage();
  doc.setFillColor(...SLATE);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, W, 1.5, "F");

  y = 16;
  y = sectionHeader("Indicadores de Liquidez e Rentabilidade", y);

  const kpiData = results.map((r) => [
    `${r.position}º ${r.company}`,
    n2(r.currentRatio),
    n2(r.quickRatio),
    n2(r.immediateRatio),
    pct(r.grossMargin),
    pct(r.operatingMargin),
    pct(r.netMargin),
    pct(r.roa),
    pct(r.roe),
    n2(r.cashCycle),
  ]);

  autoTable(doc, {
    head: [["Empresa", "LC", "LS", "LI", "Mg.Bruta", "Mg.Op.", "Mg.Liq.", "ROA", "ROE", "Ciclo"]],
    body: kpiData,
    startY: y,
    margin: { left: ML, right: MR },
    styles: { fontSize: 7.5, cellPadding: 2.5, font: "helvetica", textColor: LIGHT, fillColor: [22, 33, 55] },
    headStyles: { fillColor: [4, 100, 150], textColor: 255, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [18, 28, 48] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const r = results[data.row.index];
      if (!r) return;
      const col = data.column.index;
      // Colorir indicadores com referência
      if (col === 1) { // LC
        const v = r.currentRatio;
        data.cell.styles.textColor = v >= 1.5 ? GREEN : v >= 1 ? AMBER : RED;
      } else if (col === 7 || col === 8) { // ROA, ROE
        const v = col === 7 ? r.roa : r.roe;
        data.cell.styles.textColor = v > 0 ? GREEN : RED;
      } else if (col === 9) { // Ciclo
        const v = r.cashCycle;
        data.cell.styles.textColor = v < 30 ? GREEN : v < 60 ? AMBER : RED;
      }
    },
  });

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 4 — DRE CONSOLIDADO
  // ════════════════════════════════════════════════════════════════════════════

  page++;
  doc.addPage();
  doc.setFillColor(...SLATE);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, W, 1.5, "F");

  y = 16;
  y = sectionHeader("Demonstração do Resultado do Exercício (DRE)", y);

  const dreHead = [["Empresa", "Rec. Liq.", "CMV", "Luc. Bruto", "Desp. Op.", "EBIT", "LAIR", "Tributos", "Luc. Liq."]];
  const dreData = results.map((r) => {
    const lair = r.ebt ?? r.ebit;
    return [
      `${r.position}º ${r.company}`,
      R$(r.netRevenue),
      `(${R$(r.cmv)})`,
      R$(r.grossProfit),
      `(${R$(r.operationalExpenses)})`,
      R$(r.ebit),
      R$(lair),
      `(${R$(r.incomeTax ?? 0)})`,
      R$(r.netProfit),
    ];
  });

  autoTable(doc, {
    head: dreHead,
    body: dreData,
    startY: y,
    margin: { left: ML, right: MR },
    styles: { fontSize: 7.5, cellPadding: 2.5, font: "helvetica", textColor: LIGHT, fillColor: [22, 33, 55] },
    headStyles: { fillColor: [4, 100, 150], textColor: 255, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [18, 28, 48] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: "right" },
      2: { halign: "right", textColor: RED },
      3: { halign: "right" },
      4: { halign: "right", textColor: RED },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right", textColor: RED },
      8: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const r = results[data.row.index];
      if (!r) return;
      if (data.column.index === 8) { // Lucro líquido
        data.cell.styles.textColor = r.netProfit >= 0 ? GREEN : RED;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 3) { // Lucro bruto
        data.cell.styles.textColor = r.grossProfit >= 0 ? GREEN : RED;
      }
      if (data.column.index === 5) { // EBIT
        data.cell.styles.textColor = r.ebit >= 0 ? GREEN : RED;
      }
    },
  });

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 5 — BALANÇO PATRIMONIAL RESUMIDO
  // ════════════════════════════════════════════════════════════════════════════

  page++;
  doc.addPage();
  doc.setFillColor(...SLATE);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, W, 1.5, "F");

  y = 16;
  y = sectionHeader("Balanço Patrimonial Resumido", y);

  const bpHead = [["Empresa", "Caixa", "Estoque PA", "Total Ativo", "Fornecedores", "Total Passivo", "PL", "LC"]];
  const bpData = results.map((r) => [
    `${r.position}º ${r.company}`,
    R$(r.finalCash),
    R$(r.endingInventory),
    R$(r.totalAssets),
    R$(r.suppliers),
    R$(r.totalLiabilities),
    R$(r.equity),
    n2(r.currentRatio),
  ]);

  autoTable(doc, {
    head: bpHead,
    body: bpData,
    startY: y,
    margin: { left: ML, right: MR },
    styles: { fontSize: 7.5, cellPadding: 2.5, font: "helvetica", textColor: LIGHT, fillColor: [22, 33, 55] },
    headStyles: { fillColor: [4, 100, 150], textColor: 255, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [18, 28, 48] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
      4: { halign: "right", textColor: RED },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const r = results[data.row.index];
      if (!r) return;
      if (data.column.index === 6) { // PL
        data.cell.styles.textColor = r.equity >= 0 ? GREEN : RED;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 7) { // LC
        const v = r.currentRatio;
        data.cell.styles.textColor = v >= 1.5 ? GREEN : v >= 1 ? AMBER : RED;
      }
    },
  });

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA POR EMPRESA — detalhes individuais (se até 8 empresas)
  // ════════════════════════════════════════════════════════════════════════════

  if (results.length <= 8) {
    for (const r of results) {
      page++;
      doc.addPage();
      doc.setFillColor(...SLATE);
      doc.rect(0, 0, W, H, "F");
      doc.setFillColor(...CYAN);
      doc.rect(0, 0, W, 1.5, "F");

      let ey = 16;

      // Cabeçalho da empresa
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(`${r.position}º lugar — ${r.company}`, ML, ey + 4);
      ey += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(`Grupo: ${r.group}   Score: ${r.score.toFixed(1)} pts   Market Share: ${pct(r.marketShare / 100)}`, ML, ey + 2);
      ey += 8;

      // DRE
      ey = sectionHeader("DRE", ey);
      const lair = r.ebt ?? r.ebit;
      const ir   = r.ir   ?? (r.incomeTax ?? 0) * (15 / 24);
      const csll = r.csll ?? (r.incomeTax ?? 0) * (9  / 24);

      autoTable(doc, {
        head: [["Conta", "Valor"]],
        body: [
          ["= Receita Líquida", R$(r.netRevenue)],
          ["(-) CMV", `(${R$(r.cmv)})`],
          ["= Lucro Bruto", R$(r.grossProfit)],
          ["(-) Despesas Operacionais", `(${R$(r.operationalExpenses)})`],
          ["= EBIT (Resultado Operacional)", R$(r.ebit)],
          r.ebt < r.ebit ? ["(-) Despesas Financeiras", `(${R$(r.ebit - r.ebt)})`] : ["", ""],
          ["= LAIR", R$(lair)],
          ir > 0 ? ["(-) IR (15%)", `(${R$(ir)})`] : ["", ""],
          csll > 0 ? ["(-) CSLL (9%)", `(${R$(csll)})`] : ["", ""],
          ["= LUCRO LÍQUIDO", R$(r.netProfit)],
        ].filter((row) => row[0] !== ""),
        startY: ey,
        margin: { left: ML, right: W / 2 + 2 },
        styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica", textColor: LIGHT, fillColor: [22, 33, 55] },
        headStyles: { fillColor: [4, 100, 150], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
        alternateRowStyles: { fillColor: [18, 28, 48] },
        columnStyles: { 0: { cellWidth: 55 }, 1: { halign: "right" } },
        didParseCell: (data) => {
          if (data.section !== "body") return;
          const label = data.row.cells[0]?.text?.[0] ?? "";
          if (label.startsWith("= LUCRO")) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = r.netProfit >= 0 ? GREEN : RED;
          } else if (label.startsWith("= Lucro Bruto")) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = r.grossProfit >= 0 ? GREEN : RED;
          }
        },
      });

      // Indicadores (coluna direita)
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
      const rightX = W / 2 + 6;
      const rightW = W - MR - rightX;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...CYAN);
      doc.text("INDICADORES", rightX, ey - 2);

      const kpis: [string, string][] = [
        ["Liquidez Corrente", n2(r.currentRatio)],
        ["Liquidez Seca", n2(r.quickRatio)],
        ["Liquidez Imediata", n2(r.immediateRatio)],
        ["Margem Bruta", pct(r.grossMargin)],
        ["Margem Operacional", pct(r.operatingMargin)],
        ["Margem Líquida", pct(r.netMargin)],
        ["ROA", pct(r.roa)],
        ["ROE", pct(r.roe)],
        ["Ciclo Financeiro", `${r.cashCycle?.toFixed(0) ?? "—"} dias`],
        ["Market Share", pct(r.marketShare / 100)],
      ];

      autoTable(doc, {
        head: [["Indicador", "Valor"]],
        body: kpis,
        startY: ey,
        margin: { left: rightX },
        tableWidth: rightW,
        styles: { fontSize: 7.5, cellPadding: 2, font: "helvetica", textColor: LIGHT, fillColor: [22, 33, 55] },
        headStyles: { fillColor: [4, 100, 150], textColor: 255, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [18, 28, 48] },
        columnStyles: { 0: { cellWidth: rightW * 0.6 }, 1: { halign: "right" } },
      });

      // Balanço resumido
      const bpY = Math.max(finalY, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) + 6;
      ey = sectionHeader("Balanço Patrimonial (resumo)", bpY);

      autoTable(doc, {
        head: [["Ativo", "Valor", "Passivo & PL", "Valor"]],
        body: [
          ["Caixa e Disponíveis", R$(r.finalCash), "Fornecedores (CP)", R$(r.suppliers)],
          ["Contas a Receber", R$(r.clients), "Empréstimos", R$(r.loans)],
          ["Estoques", R$(r.endingInventory), "Financ. Máquinas (CP)", R$(r.machinePayable)],
          ["Ativo Circulante", R$(r.currentAssets), "Total Passivo", R$(r.totalLiabilities)],
          ["Imobilizado", R$(r.fixedAssets), "Patrimônio Líquido", R$(r.equity)],
          ["TOTAL ATIVO", R$(r.totalAssets), "TOTAL P + PL", R$(r.totalLiabilities + r.equity)],
        ],
        startY: ey,
        margin: { left: ML, right: MR },
        styles: { fontSize: 7.5, cellPadding: 2.5, font: "helvetica", textColor: LIGHT, fillColor: [22, 33, 55] },
        headStyles: { fillColor: [4, 100, 150], textColor: 255, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [18, 28, 48] },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { halign: "right", cellWidth: 25 },
          2: { cellWidth: 42 },
          3: { halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section !== "body") return;
          const isLast = data.row.index === 5;
          if (isLast) {
            data.cell.styles.fontStyle = "bold";
            if (data.column.index === 3) {
              data.cell.styles.textColor = r.equity >= 0 ? GREEN : RED;
            }
          }
        },
      });

      if (r.professor_comment) {
        const commentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...AMBER);
        doc.text("Comentário do Professor:", ML, commentY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...LIGHT);
        const lines = doc.splitTextToSize(r.professor_comment, CW) as string[];
        doc.text(lines, ML, commentY + 5);
      }

      footer();
    }
  }

  // ── Salva ────────────────────────────────────────────────────────────────────
  const filename = `relatorio-${roundName.toLowerCase().replace(/\s+/g, "-")}-arena-contabil.pdf`;
  doc.save(filename);
}
