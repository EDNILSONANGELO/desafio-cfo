/**
 * Utilitário de exportação para Excel (.xlsx)
 * Usa a biblioteca xlsx (SheetJS) com import dinâmico para evitar SSR
 */

type Row = Record<string, string | number | null | undefined>;

export async function exportToExcel(rows: Row[], filename: string, sheetName = "Dados") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportMultiSheet(
  sheets: { name: string; rows: Row[] }[],
  filename: string
) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
