"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trophy, TrendingUp, BarChart3, Globe,
  Zap, Shield, Target, DollarSign, Activity, Star,
  ChevronUp, ChevronDown, ChevronsUpDown, Download,
} from "lucide-react";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { currency, percent, number } from "@/lib/utils/format";
import { Panel } from "@/components/ui/Panel";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { RankedResult, Group } from "@/types";

/* ─── Types ─── */
interface RoundInfo { id: number; name: string; event_type: string; processed_at: string; }
interface ResultRow { id: number; round_id: number; group_id: number; data: RankedResult; position: number; score: number; group: Group; }
interface ApiResponse { rounds: RoundInfo[]; targetRoundId: number; results: ResultRow[]; evolutionData: Record<string, number | string>[]; companies: { name: string; color: string }[]; myGroupId?: number; }

type SortDir = "asc" | "desc";

/* ─── Helpers ─── */
function colorFromTailwind(color: string): string {
  const map: Record<string, string> = {
    "from-emerald-500": "#10b981", "from-sky-500": "#0ea5e9",
    "from-violet-500": "#8b5cf6", "from-amber-500": "#f59e0b",
    "from-rose-500": "#f43f5e",   "from-indigo-500": "#6366f1",
    "from-teal-500": "#14b8a6",   "from-orange-500": "#f97316",
    "from-cyan-500": "#06b6d4",   "from-green-500": "#22c55e",
  };
  for (const [k, v] of Object.entries(map)) if (color?.includes(k)) return v;
  return "#22d3ee";
}

function sortRows(rows: ResultRow[], key: string, dir: SortDir): ResultRow[] {
  return [...rows].sort((a, b) => {
    let av: unknown, bv: unknown;
    if (key === "company")  { av = a.group?.company_name ?? ""; bv = b.group?.company_name ?? ""; }
    else if (key === "region") { av = a.group?.region_name ?? ""; bv = b.group?.region_name ?? ""; }
    else if (key === "position") { av = a.position; bv = b.position; }
    else if (key === "score")    { av = a.data.score; bv = b.data.score; }
    else { av = (a.data as unknown as Record<string, number>)[key] ?? 0; bv = (b.data as unknown as Record<string, number>)[key] ?? 0; }
    const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string, "pt-BR") : (Number(av) - Number(bv));
    return dir === "asc" ? cmp : -cmp;
  });
}

const TOOLTIP_STYLE = { backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f1f5f9" };
const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

/* ─── Sortable TH ─── */
function SortTh({ label, title, colKey, sortKey, sortDir, onSort }: {
  label: string; title: string; colKey: string;
  sortKey: string; sortDir: SortDir; onSort: (k: string) => void;
}) {
  const active = sortKey === colKey;
  return (
    <th
      title={title}
      onClick={() => onSort(colKey)}
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider transition-colors hover:text-white ${active ? "text-cyan-400" : "text-slate-500"}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );
}

/* ─── Section title ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400">{children}</h2>;
}

/* ─── Metric pill ─── */
function MetricPill({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/5 px-3 py-2 border border-white/10">
      <span className={`text-sm font-black ${color}`}>{value}</span>
      <span className="mt-0.5 text-[10px] text-slate-500 leading-tight text-center">{label}</span>
    </div>
  );
}

/* ─── Region Profile Table (horizontal, sortable) ─── */
function RegionProfileTable({ results, myGroupId }: { results: ResultRow[]; myGroupId?: number }) {
  const [sortKey, setSortKey] = useState("position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  async function handleExport() {
    const rows = [...results]
      .sort((a, b) => a.position - b.position)
      .map(r => ({
        "#": r.position,
        "Empresa":        r.group?.company_name ?? "",
        "Região":         r.group?.region_name ?? "",
        "Receita Líquida (R$)":    r.data.netRevenue,
        "Lucro Líquido (R$)":      r.data.netProfit,
        "Margem Bruta (%)":        Number(percent(r.data.grossMargin).replace("%","").replace(",",".")),
        "Margem Líquida (%)":      Number(percent(r.data.netMargin).replace("%","").replace(",",".")),
        "Liquidez Corrente":       r.data.currentRatio,
        "Liquidez Seca":           r.data.quickRatio,
        "Liquidez Imediata":       r.data.immediateRatio,
        "ROA (%)":                 Number(percent(r.data.roa).replace("%","").replace(",",".")),
        "ROE (%)":                 Number(percent(r.data.roe).replace("%","").replace(",",".")),
        "Ciclo Financeiro (dias)": r.data.cashCycle,
        "Market Share (%)":        r.data.marketShare,
        "Score":                   r.data.score,
      }));
    await exportToExcel(rows, "perfil-por-regiao", "Comparativo por Região");
  }

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const cols = [
    { key: "position",     label: "#",          title: "Posição no ranking" },
    { key: "company",      label: "Empresa",     title: "Nome da empresa" },
    { key: "region",       label: "Região",      title: "Região" },
    { key: "netRevenue",   label: "Receita",     title: "Receita Líquida" },
    { key: "netProfit",    label: "Lucro Líq.",  title: "Lucro Líquido" },
    { key: "grossMargin",  label: "Mg. Bruta",   title: "Margem Bruta" },
    { key: "netMargin",    label: "Mg. Líq.",    title: "Margem Líquida" },
    { key: "currentRatio", label: "Liq. C.",     title: "Liquidez Corrente" },
    { key: "quickRatio",   label: "Liq. S.",     title: "Liquidez Seca" },
    { key: "roa",          label: "ROA",         title: "Retorno sobre Ativos" },
    { key: "roe",          label: "ROE",         title: "Retorno sobre Patrimônio" },
    { key: "cashCycle",    label: "Ciclo Fin.",  title: "Ciclo Financeiro (dias)" },
    { key: "marketShare",  label: "Mkt Share",   title: "Market Share (%)" },
    { key: "score",        label: "Score",       title: "Pontuação final" },
  ];

  const lowerBetter = new Set(["cashCycle", "pme", "pmr"]);

  // Best values per numeric column
  const bests: Record<string, number> = {};
  for (const col of cols.slice(3)) {
    const vals = results.map(r => {
      if (col.key === "score") return r.data.score ?? 0;
      return (r.data as unknown as Record<string, number>)[col.key] ?? 0;
    });
    bests[col.key] = lowerBetter.has(col.key) ? Math.min(...vals) : Math.max(...vals);
  }

  const sorted = sortRows(results, sortKey, sortDir);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar Excel
        </button>
      </div>
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-slate-900/80 sticky top-0 z-10">
            {cols.map(c => (
              <SortTh key={c.key} colKey={c.key} label={c.label} title={c.title} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const d = r.data;
            const hex = colorFromTailwind(r.group?.color || "");
            const isMe = r.group_id === myGroupId;
            const originalRank = results.findIndex(x => x.group_id === r.group_id) + 1;

            function cell(key: string) {
              const val = key === "score"
                ? (d.score ?? 0)
                : (d as unknown as Record<string, number>)[key] ?? 0;
              const isBest = val === bests[key];
              const isLower = lowerBetter.has(key);
              const isNeg = key === "netProfit" && val < 0;
              let formatted = "";
              if (key === "netRevenue" || key === "netProfit") formatted = currency(val);
              else if (["grossMargin","netMargin","roa","roe"].includes(key)) formatted = percent(val);
              else if (key === "cashCycle") formatted = `${number(val,0)}d`;
              else if (key === "marketShare") formatted = `${number(val,1)}%`;
              else formatted = number(val, key === "score" ? 1 : 2);
              return (
                <td key={key} className={`px-3 py-2.5 font-mono font-semibold whitespace-nowrap ${
                  isBest ? (isLower ? "text-emerald-400" : "text-amber-400") : isNeg ? "text-rose-400" : "text-slate-300"
                }`}>
                  {formatted}{isBest && <span className="ml-1 text-[9px]">★</span>}
                </td>
              );
            }

            return (
              <tr key={r.group_id} className={`border-b border-white/5 transition-colors hover:bg-white/[0.04] ${isMe ? "bg-cyan-400/5" : i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                {/* # */}
                <td className="px-3 py-2.5 text-base font-bold text-slate-300">{MEDAL_ICONS[originalRank - 1] || `${originalRank}º`}</td>
                {/* Empresa */}
                <td className="px-3 py-2.5 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hex }} />
                    <div>
                      <p className="font-semibold whitespace-nowrap" style={{ color: isMe ? "#22d3ee" : "#f1f5f9" }}>
                        {r.group?.company_name || `Grupo ${r.group_id}`}
                      </p>
                      {isMe && <span className="text-[9px] font-black text-cyan-400">MEU GRUPO</span>}
                    </div>
                  </div>
                </td>
                {/* Região */}
                <td className="px-3 py-2.5 min-w-[100px]">
                  <span className="rounded-lg px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap" style={{ background: `${hex}22`, color: hex }}>
                    {r.group?.region_name}
                  </span>
                </td>
                {/* Numeric cols */}
                {cols.slice(3).map(c => cell(c.key))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-white/5 px-3 py-2 text-right text-[10px] text-slate-600">
        ★ melhor da rodada &nbsp;·&nbsp; Ordenado por{" "}
        <span className="text-cyan-500">{cols.find(c => c.key === sortKey)?.title}</span>{" "}
        {sortDir === "asc" ? "↑" : "↓"}
      </p>
    </div>
    </div>
  );
}

/* ─── Score bars ─── */
function ScoreBars({ results, myGroupId }: { results: ResultRow[]; myGroupId?: number }) {
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sortOptions = [
    { key: "score", label: "Score" },
    { key: "netProfit", label: "Lucro" },
    { key: "netRevenue", label: "Receita" },
    { key: "netMargin", label: "Margem" },
    { key: "currentRatio", label: "Liquidez" },
  ];

  const sorted = sortRows(results, sortKey, sortDir);
  const max = Math.max(...results.map(r => {
    if (sortKey === "score") return r.data.score;
    return Math.abs((r.data as unknown as Record<string, number>)[sortKey] ?? 0);
  }), 1);

  return (
    <div>
      {/* Sort filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Ordenar por:</span>
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => handleSort(opt.key)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
              sortKey === opt.key ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {opt.label}
            {sortKey === opt.key && (sortDir === "asc" ? " ↑" : " ↓")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((r, i) => {
          const hex = colorFromTailwind(r.group?.color || "");
          const isMe = r.group_id === myGroupId;
          const val = sortKey === "score"
            ? r.data.score
            : (r.data as unknown as Record<string, number>)[sortKey] ?? 0;
          const pct = (Math.abs(val) / max) * 100;
          const originalRank = results.findIndex(x => x.group_id === r.group_id) + 1;

          return (
            <div key={r.group_id} className={`rounded-xl p-3 transition-all ${isMe ? "bg-cyan-400/8 border border-cyan-400/30" : "bg-white/5"}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{MEDAL_ICONS[originalRank - 1] || `${originalRank}º`}</span>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">
                      {r.group?.company_name || `Grupo ${r.group_id}`}
                      {isMe && <span className="ml-2 text-[10px] font-black text-cyan-400">MEU GRUPO</span>}
                    </p>
                    <p className="text-[11px] text-slate-500">{r.group?.region_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm" style={{ color: hex }}>
                    {sortKey === "score" ? `${number(val, 1)} pts`
                      : sortKey === "netProfit" || sortKey === "netRevenue" ? currency(val)
                      : sortKey === "netMargin" ? percent(val)
                      : number(val, 2)}
                  </p>
                  <p className="text-[10px] text-slate-500">{sortOptions.find(o => o.key === sortKey)?.label}</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: hex }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Revenue bar chart ─── */
function RevenueBarChart({ results, myGroupId }: { results: ResultRow[]; myGroupId?: number }) {
  const data = results.map(r => ({
    name: (r.group?.company_name || `G${r.group_id}`).split(" ").slice(-1)[0],
    receita: r.data.netRevenue,
    lucro: r.data.netProfit,
    fill: colorFromTailwind(r.group?.color || ""),
    isMe: r.group_id === myGroupId,
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v, n) => [currency(Number(v)), n === "receita" ? "Receita" : "Lucro Líq."]} contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="receita" name="receita" radius={[6,6,0,0]} fill="#22d3ee" opacity={0.8} />
        <Bar dataKey="lucro"   name="lucro"   radius={[6,6,0,0]} fill="#10b981" opacity={0.8} />
        <Legend formatter={v => <span className="text-xs text-slate-300">{v === "receita" ? "Receita Líquida" : "Lucro Líquido"}</span>} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Insight card ─── */
function InsightCard({ icon: Icon, title, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>; title: string; value: string; sub: string; color: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 opacity-70" />
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{title}</span>
      </div>
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-xs opacity-60 leading-tight">{sub}</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MercadoPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (roundId?: number) => {
    setLoading(true);
    try {
      const url = roundId ? `/api/reports/regional?round_id=${roundId}` : "/api/reports/regional";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar");
      setData(json);
      setSelectedRound(json.targetRoundId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (initialLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" /></div>;

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center text-rose-400">
      <p className="font-semibold">Erro ao carregar dados</p>
      <p className="mt-1 text-sm text-slate-500">{error}</p>
    </div>
  );

  if (!data?.results?.length) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">Inteligência de Mercado</h1>
        <p className="text-sm text-slate-400">Dados dos competidores por região</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-24 text-slate-400">
        <Globe className="mb-4 h-12 w-12 opacity-30" />
        <p className="text-lg font-semibold">Nenhum resultado disponível ainda</p>
        <p className="mt-1 text-sm">Os dados aparecem após o professor processar uma rodada.</p>
      </div>
    </div>
  );

  const { rounds, results, companies, evolutionData, myGroupId } = data;
  const myResult = results.find(r => r.group_id === myGroupId);
  const myPos = myResult?.position ?? 0;
  const leader = results[0];
  const bestMargin = [...results].sort((a,b) => b.data.netMargin - a.data.netMargin)[0];
  const bestLiquidity = [...results].sort((a,b) => b.data.currentRatio - a.data.currentRatio)[0];
  const bestCycle = [...results].sort((a,b) => a.data.cashCycle - b.data.cashCycle)[0];

  const selectedRoundInfo = rounds.find(r => r.id === selectedRound);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">
          <Globe className="mr-2 inline h-6 w-6 text-cyan-400" />
          Inteligência de Mercado
        </h1>
        <p className="mt-1 text-sm text-slate-400">Compare o desempenho de todas as empresas concorrentes</p>
      </div>

      {/* ── Filtro de rodada ── */}
      <Panel title="Selecionar Rodada" icon={ChevronDown}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Dropdown */}
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedRound ?? ""}
              onChange={(e) => load(Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm font-semibold text-white focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
            >
              {rounds.map(r => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Info da rodada selecionada */}
          {selectedRoundInfo && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">
              <span className="font-semibold text-white">{selectedRoundInfo.name}</span>
              {selectedRoundInfo.event_type && selectedRoundInfo.event_type !== "Mercado normal" && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Zap className="h-3.5 w-3.5" />
                    {selectedRoundInfo.event_type}
                  </span>
                </>
              )}
              {selectedRoundInfo.processed_at && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">
                    processada em {new Date(selectedRoundInfo.processed_at).toLocaleDateString("pt-BR")}
                  </span>
                </>
              )}
            </div>
          )}

          {loading && (
            <span className="text-xs text-slate-500 animate-pulse">Carregando...</span>
          )}
        </div>

        {/* Chips de navegação rápida */}
        {rounds.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {rounds.map(r => (
              <button
                key={r.id}
                onClick={() => load(r.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedRound === r.id
                    ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </Panel>

      {/* My position */}
      {myResult && (
        <div className="rounded-2xl border border-cyan-400/40 bg-cyan-400/8 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-2xl font-black text-slate-950">
              {MEDAL_ICONS[myPos - 1] || `${myPos}º`}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Sua Empresa</p>
              <p className="text-xl font-black text-white">{myResult.group?.company_name}</p>
              <p className="text-sm text-slate-400">
                {myResult.group?.region_name} · {myPos}º lugar ·{" "}
                Score: <span className="font-bold text-cyan-400">{number(myResult.data.score, 1)} pts</span>
              </p>
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <MetricPill label="Receita" value={currency(myResult.data.netRevenue)} />
              <MetricPill label="Lucro" value={currency(myResult.data.netProfit)} color={myResult.data.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"} />
              <MetricPill label="Market Share" value={`${number(myResult.data.marketShare, 1)}%`} />
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div>
        <SectionTitle>Destaques da Rodada</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InsightCard icon={Trophy} title="Líder Geral" value={leader.group?.company_name || ""} sub={`${leader.group?.region_name} · ${number(leader.data.score, 1)} pts`} color="border-amber-500/30 bg-amber-500/8 text-amber-300" />
          <InsightCard icon={DollarSign} title="Maior Margem" value={percent(bestMargin.data.netMargin)} sub={bestMargin.group?.company_name || ""} color="border-emerald-500/30 bg-emerald-500/8 text-emerald-300" />
          <InsightCard icon={Shield} title="Maior Liquidez" value={number(bestLiquidity.data.currentRatio, 2)} sub={bestLiquidity.group?.company_name || ""} color="border-sky-500/30 bg-sky-500/8 text-sky-300" />
          <InsightCard icon={Activity} title="Melhor Ciclo Fin." value={`${number(bestCycle.data.cashCycle, 0)} dias`} sub={bestCycle.group?.company_name || ""} color="border-violet-500/30 bg-violet-500/8 text-violet-300" />
        </div>
      </div>

      {/* Score bars + Revenue chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <SectionTitle>Ranking por Score</SectionTitle>
          <ScoreBars results={results} myGroupId={myGroupId} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <SectionTitle>Receita vs. Lucro Líquido</SectionTitle>
          <RevenueBarChart results={results} myGroupId={myGroupId} />
        </div>
      </div>

      {/* Evolution */}
      {evolutionData.length > 1 && companies.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <SectionTitle>Evolução do Lucro por Rodada</SectionTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="round" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [currency(Number(v)), n]} contentStyle={TOOLTIP_STYLE} />
                <Legend formatter={v => <span className="text-xs text-slate-300">{v}</span>} />
                {companies.map(c => <Bar key={c.name} dataKey={c.name} fill={c.color} radius={[4,4,0,0]} opacity={0.85} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Perfil por Região — horizontal table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <SectionTitle>
          <BarChart3 className="mr-2 inline h-4 w-4" />
          Perfil por Região — Comparativo Completo
        </SectionTitle>
        <p className="mb-4 text-xs text-slate-500">
          Clique nos cabeçalhos para ordenar ↑↓ &nbsp;·&nbsp; ★ = melhor da rodada &nbsp;·&nbsp;
          <span className="text-amber-400 font-semibold">Amarelo</span> = melhor (maior é melhor) &nbsp;·&nbsp;
          <span className="text-emerald-400 font-semibold">Verde</span> = melhor (menor é melhor)
        </p>
        <RegionProfileTable results={results} myGroupId={myGroupId} />
      </div>

      {/* Strategic tips */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <SectionTitle>
          <Target className="mr-2 inline h-4 w-4" />
          Como usar esses dados na próxima rodada
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: TrendingUp, color: "text-emerald-400", title: "Analise margens", desc: "Compare sua Margem Líquida com a dos líderes. Se estiver abaixo, reduza custos operacionais ou aumente o preço de venda." },
            { icon: Shield,     color: "text-sky-400",     title: "Gerencie liquidez", desc: "Liquidez Corrente < 1 significa risco. Reduza prazos de recebimento (PMR) e negocie mais prazo com fornecedores (PMP)." },
            { icon: Activity,   color: "text-violet-400",  title: "Reduza o ciclo financeiro", desc: "Ciclo Financeiro = PME + PMR - PMP. Quanto menor, melhor o fluxo de caixa. Gire o estoque mais rápido." },
            { icon: DollarSign, color: "text-amber-400",   title: "Otimize ROA e ROE", desc: "Baixo ROA indica ativos improdutivos. Evite maquinário desnecessário e mantenha o caixa aplicado." },
            { icon: Globe,      color: "text-cyan-400",    title: "Condições iguais para todos", desc: "Todos os grupos competem com os mesmos multiplicadores de mercado. A diferença de resultado vem das suas decisões estratégicas." },
            { icon: Star,       color: "text-rose-400",    title: "Estratégia de preço", desc: "Preço abaixo da média de mercado aumenta vendas mas comprime margens. Decida: volume ou rentabilidade?" },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-xl border border-white/8 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm font-bold text-white">{title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
