"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trophy, TrendingUp, BarChart3, Globe,
  Zap, Shield, Target, DollarSign, Activity, Star,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { currency, percent, number } from "@/lib/utils/format";
import type { RankedResult, Group } from "@/types";
import { usePoloContext } from "@/contexts/PoloContext";

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
    if (key === "company")   { av = a.group?.company_name ?? ""; bv = b.group?.company_name ?? ""; }
    else if (key === "region")    { av = a.group?.region_name ?? ""; bv = b.group?.region_name ?? ""; }
    else if (key === "position")  { av = a.position; bv = b.position; }
    else if (key === "score")     { av = a.data.score; bv = b.data.score; }
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400">{children}</h2>;
}

function MetricPill({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/5 px-3 py-2 border border-white/10">
      <span className={`text-sm font-black ${color}`}>{value}</span>
      <span className="mt-0.5 text-[10px] text-slate-500 leading-tight text-center">{label}</span>
    </div>
  );
}

/* ─── Region Profile Table (horizontal, sortable) ─── */
function RegionProfileTable({ results }: { results: ResultRow[] }) {
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "score" ? "desc" : "asc"); }
  }

  const cols = [
    { key: "position",     label: "#",           title: "Posição no ranking" },
    { key: "score",        label: "Score ★",     title: "Score — pontuação final (maior = melhor)" },
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
    { key: "pme",          label: "PME",         title: "Prazo Médio de Estoque (dias)" },
    { key: "pmr",          label: "PMR",         title: "Prazo Médio de Recebimento (dias)" },
    { key: "pmp",          label: "PMP",         title: "Prazo Médio de Pagamento (dias)" },
    { key: "cashCycle",    label: "Ciclo Fin.",  title: "Ciclo Financeiro (dias)" },
    { key: "marketShare",  label: "Mkt Share",   title: "Market Share (%)" },
  ];

  const lowerBetter = new Set(["cashCycle", "pme", "pmr"]);

  const bests: Record<string, number> = {};
  for (const col of cols.slice(1)) { // começa do score (índice 1), pula position
    if (col.key === "company" || col.key === "region") continue;
    const vals = results.map(r => col.key === "score" ? (r.data.score ?? 0) : ((r.data as unknown as Record<string, number>)[col.key] ?? 0));
    bests[col.key] = lowerBetter.has(col.key) ? Math.min(...vals) : Math.max(...vals);
  }

  const sorted = sortRows(results, sortKey, sortDir);

  return (
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
            const originalRank = results.findIndex(x => x.group_id === r.group_id) + 1;

            function cell(key: string) {
              const val = key === "score" ? (d.score ?? 0) : ((d as unknown as Record<string, number>)[key] ?? 0);
              const isBest = val === bests[key];
              const isLower = lowerBetter.has(key);
              const isNeg = key === "netProfit" && val < 0;
              let fmt = "";
              if (key === "netRevenue" || key === "netProfit") fmt = currency(val);
              else if (["grossMargin","netMargin","roa","roe"].includes(key)) fmt = percent(val);
              else if (["cashCycle","pme","pmr","pmp"].includes(key)) fmt = `${number(val,0)}d`;
              else if (key === "marketShare") fmt = `${number(val,1)}%`;
              else fmt = number(val, key === "score" ? 1 : 2);
              return (
                <td key={key} className={`px-3 py-2.5 font-mono font-semibold whitespace-nowrap ${
                  isBest ? (isLower ? "text-emerald-400" : "text-amber-400") : isNeg ? "text-rose-400" : "text-slate-300"
                }`}>
                  {fmt}{isBest && <span className="ml-1 text-[9px]">★</span>}
                </td>
              );
            }

            return (
              <tr key={r.group_id} className={`border-b border-white/5 transition-colors hover:bg-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                {/* # posição */}
                <td className="px-3 py-2.5 text-base font-bold text-slate-300">{MEDAL_ICONS[originalRank - 1] || `${originalRank}º`}</td>
                {/* Score — destaque visual */}
                {cell("score")}
                {/* Empresa */}
                <td className="px-3 py-2.5 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hex }} />
                    <p className="font-semibold whitespace-nowrap text-white">{r.group?.company_name || `Grupo ${r.group_id}`}</p>
                  </div>
                </td>
                {/* Região */}
                <td className="px-3 py-2.5 min-w-[100px]">
                  <span className="rounded-lg px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap" style={{ background: `${hex}22`, color: hex }}>
                    {r.group?.region_name}
                  </span>
                </td>
                {/* Demais colunas numéricas (pula position=0, score=1, company=2, region=3) */}
                {cols.slice(4).map(c => cell(c.key))}
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
  );
}

/* ─── Score bars with sort filter ─── */
function ScoreBars({ results }: { results: ResultRow[] }) {
  const [sortKey, setSortKey] = useState("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sortOptions = [
    { key: "score",        label: "Score"    },
    { key: "netProfit",    label: "Lucro"    },
    { key: "netRevenue",   label: "Receita"  },
    { key: "netMargin",    label: "Margem"   },
    { key: "currentRatio", label: "Liquidez" },
  ];

  const sorted = sortRows(results, sortKey, sortDir);
  const max = Math.max(...results.map(r =>
    sortKey === "score" ? r.data.score : Math.abs((r.data as unknown as Record<string, number>)[sortKey] ?? 0)
  ), 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Ordenar por:</span>
        {sortOptions.map(opt => (
          <button key={opt.key} onClick={() => handleSort(opt.key)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${sortKey === opt.key ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
            {opt.label}{sortKey === opt.key && (sortDir === "asc" ? " ↑" : " ↓")}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {sorted.map((r, i) => {
          const hex = colorFromTailwind(r.group?.color || "");
          const val = sortKey === "score" ? r.data.score : ((r.data as unknown as Record<string, number>)[sortKey] ?? 0);
          const pct = (Math.abs(val) / max) * 100;
          const originalRank = results.findIndex(x => x.group_id === r.group_id) + 1;
          return (
            <div key={r.group_id} className="rounded-xl bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{MEDAL_ICONS[originalRank - 1] || `${originalRank}º`}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.group?.company_name || `Grupo ${r.group_id}`}</p>
                    <p className="text-[11px] text-slate-500">{r.group?.region_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm" style={{ color: hex }}>
                    {sortKey === "score" ? `${number(val,1)} pts`
                      : sortKey === "netProfit" || sortKey === "netRevenue" ? currency(val)
                      : sortKey === "netMargin" ? percent(val)
                      : number(val, 2)}
                  </p>
                  <p className="text-[10px] text-slate-500">{sortOptions.find(o => o.key === sortKey)?.label}</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                  className="h-full rounded-full" style={{ background: hex }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
export default function MercadoProfessorPage() {
  const { poloParam, selectedPolo } = usePoloContext();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (roundId?: number) => {
    setLoading(true);
    setError("");
    try {
      const base = roundId
        ? `/api/reports/regional?round_id=${roundId}${poloParam}`
        : `/api/reports/regional?v=1${poloParam}`;
      const res = await fetch(base);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar");
      setData(json);
      setSelectedRound(json.targetRoundId ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [poloParam]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" /></div>;
  if (error) return <div className="flex h-64 flex-col items-center justify-center text-rose-400"><p className="font-semibold">Erro ao carregar dados</p><p className="mt-1 text-sm text-slate-500">{error}</p></div>;

  if (!data?.results?.length) return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-white sm:text-2xl"><Globe className="mr-2 inline h-6 w-6 text-cyan-400" />Mercado & Relatório Regional</h1>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-24 text-slate-400">
        <Globe className="mb-4 h-12 w-12 opacity-30" />
        <p className="text-lg font-semibold">Nenhuma rodada processada ainda</p>
        <p className="mt-1 text-sm">Processe uma rodada para visualizar os dados comparativos.</p>
      </div>
    </div>
  );

  const { rounds, results, companies, evolutionData } = data;
  const leader = results[0];
  const bestMargin    = [...results].sort((a,b) => b.data.netMargin - a.data.netMargin)[0];
  const bestLiquidity = [...results].sort((a,b) => b.data.currentRatio - a.data.currentRatio)[0];
  const bestCycle     = [...results].sort((a,b) => a.data.cashCycle - b.data.cashCycle)[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl"><Globe className="mr-2 inline h-6 w-6 text-cyan-400" />Mercado & Relatório Regional</h1>
          <p className="mt-1 text-sm text-slate-400">
            {selectedPolo
              ? <><span className="text-cyan-400 font-semibold">{selectedPolo}</span> · {results.length} grupo{results.length !== 1 ? "s" : ""}</>
              : <>Visão completa do desempenho de todas as empresas · {results.length} grupos</>}
          </p>
        </div>
        {rounds.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {rounds.map(r => (
              <button key={r.id} onClick={() => load(r.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${selectedRound === r.id ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
                {r.name}
              </button>
            ))}
          </div>
        )}
        {selectedPolo && (
          <span className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400">
            📍 {selectedPolo}
          </span>
        )}
      </div>

      {/* Event */}
      {rounds.find(r => r.id === selectedRound)?.event_type && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm text-amber-300 font-semibold">Evento: {rounds.find(r => r.id === selectedRound)?.event_type}</span>
        </div>
      )}

      {/* Insights */}
      <div>
        <SectionTitle>Destaques da Rodada</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InsightCard icon={Trophy}    title="Líder Geral"     value={leader.group?.company_name || ""}          sub={`${leader.group?.region_name} · ${number(leader.data.score, 1)} pts`}       color="border-amber-500/30 bg-amber-500/8 text-amber-300" />
          <InsightCard icon={DollarSign} title="Maior Margem"   value={percent(bestMargin.data.netMargin)}        sub={bestMargin.group?.company_name || ""}                                           color="border-emerald-500/30 bg-emerald-500/8 text-emerald-300" />
          <InsightCard icon={Shield}     title="Maior Liquidez" value={number(bestLiquidity.data.currentRatio,2)} sub={bestLiquidity.group?.company_name || ""}                                        color="border-sky-500/30 bg-sky-500/8 text-sky-300" />
          <InsightCard icon={Activity}   title="Melhor Ciclo"   value={`${number(bestCycle.data.cashCycle,0)} dias`} sub={bestCycle.group?.company_name || ""}                                        color="border-violet-500/30 bg-violet-500/8 text-violet-300" />
        </div>
      </div>

      {/* Score bars + Revenue chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <SectionTitle>Ranking por Score</SectionTitle>
          <ScoreBars results={results} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <SectionTitle>Receita vs. Lucro</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={results.map(r => ({
              name: (r.group?.company_name || `G${r.group_id}`).split(" ").slice(-1)[0],
              receita: r.data.netRevenue, lucro: r.data.netProfit,
            }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v,n) => [currency(Number(v)), n === "receita" ? "Receita" : "Lucro"]} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="receita" fill="#22d3ee" radius={[6,6,0,0]} opacity={0.8} />
              <Bar dataKey="lucro"   fill="#10b981" radius={[6,6,0,0]} opacity={0.8} />
              <Legend formatter={v => <span className="text-xs text-slate-300">{v === "receita" ? "Receita Líquida" : "Lucro Líquido"}</span>} />
            </BarChart>
          </ResponsiveContainer>
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
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v,n) => [currency(Number(v)), n]} contentStyle={TOOLTIP_STYLE} />
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
        <RegionProfileTable results={results} />
      </div>

      {/* Inteligência de Mercado Regional */}
      {(results[0]?.data?.allRegionsCompetition?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <SectionTitle>
            <Target className="mr-2 inline h-4 w-4" />
            Inteligência de Mercado Regional
          </SectionTitle>
          <p className="mb-5 text-xs text-slate-500">
            Visão completa da competição por região — demanda, oferta e desempenho de cada concorrente.
          </p>
          <div className="space-y-6">
            {results[0].data.allRegionsCompetition!.map((region) => {
              const unmetPct = region.totalDemand > 0 ? ((region.demandUnmet / region.totalDemand) * 100) : 0;
              return (
                <div key={region.region_name} className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden">
                  {/* Region header */}
                  <div className="flex flex-wrap items-center gap-4 border-b border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span className="font-bold text-white">{region.region_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 ml-auto">
                      <div className="flex flex-col items-center rounded-lg bg-white/5 px-3 py-1.5 border border-white/10">
                        <span className="text-xs font-black text-white">{number(region.totalDemand, 0)}</span>
                        <span className="text-[10px] text-slate-500">Demanda Total</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg bg-white/5 px-3 py-1.5 border border-white/10">
                        <span className="text-xs font-black text-emerald-400">{number(region.totalSold, 0)}</span>
                        <span className="text-[10px] text-slate-500">Total Vendido</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg bg-white/5 px-3 py-1.5 border border-white/10">
                        <span className={`text-xs font-black ${unmetPct > 20 ? "text-rose-400" : unmetPct > 5 ? "text-amber-400" : "text-slate-300"}`}>
                          {number(unmetPct, 1)}%
                        </span>
                        <span className="text-[10px] text-slate-500">Dem. Não Atend.</span>
                      </div>
                    </div>
                  </div>
                  {/* Competitors table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-slate-900/60">
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Empresa</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Preço Praticado</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Qtd. Ofertada</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Qtd. Vendida</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Market Share</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Score Competitivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {region.competitors.map((comp, ci) => {
                          const sc = comp.competitiveScore ?? 0;
                          const scoreColor = sc >= 0.7 ? "bg-emerald-500" : sc >= 0.4 ? "bg-amber-500" : "bg-rose-500";
                          const scoreBadge = sc >= 0.7 ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" : sc >= 0.4 ? "text-amber-400 bg-amber-500/15 border-amber-500/30" : "text-rose-400 bg-rose-500/15 border-rose-500/30";
                          const ms = comp.marketShare ?? 0;
                          return (
                            <tr key={comp.groupId} className={`border-b border-white/5 transition-colors hover:bg-white/[0.04] ${ci % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                              <td className="px-3 py-2.5 min-w-[140px]">
                                <span className="font-semibold text-white">{comp.company}</span>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">{currency(comp.price)}</td>
                              <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">
                                {comp.offeredQty != null && comp.offeredQty > 0
                                  ? number(comp.offeredQty, 0)
                                  : <span className="text-slate-600">—</span>}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">{number(comp.soldQty, 0)}</td>
                              <td className="px-3 py-2.5 min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-slate-300 w-10 shrink-0">{number(ms * 100, 1)}%</span>
                                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(ms * 100, 100)}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 min-w-[160px]">
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${scoreBadge}`}>
                                    {number(sc * 100, 0)}%
                                  </span>
                                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${Math.min(sc * 100, 100)}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Professor tips */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <SectionTitle>
          <Target className="mr-2 inline h-4 w-4" />
          Pontos de Atenção para o Professor
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: TrendingUp, color: "text-rose-400",   title: "Empresas com prejuízo",    desc: "Grupos com lucro negativo precisam de orientação sobre preço, produção ou gestão de custos. Convoque-os para análise individualizada." },
            { icon: Shield,     color: "text-amber-400",  title: "Risco de insolvência",     desc: "Liquidez Corrente < 1 indica que o passivo circulante supera o ativo. Esses grupos podem ter dificuldades na próxima rodada." },
            { icon: Activity,   color: "text-cyan-400",   title: "Ciclo financeiro alto",    desc: "Ciclo > 60 dias significa capital parado. Oriente a reduzir PME e PMR, ou aumentar o PMP negociando mais prazo com fornecedores." },
            { icon: Star,       color: "text-emerald-400",title: "Destaque as melhores práticas", desc: "Mostre o grupo líder como case de sucesso. Discuta as decisões que geraram o melhor score com toda a turma." },
            { icon: Globe,      color: "text-violet-400", title: "Condições de mercado iguais", desc: "Todos os grupos têm os mesmos multiplicadores. A diferença de resultado reflete exclusivamente as decisões estratégicas de cada equipe." },
            { icon: BarChart3,  color: "text-sky-400",    title: "Dispersão de resultados",  desc: "Grande diferença de score entre grupos indica estratégias díspares. Use a tabela para mostrar onde cada grupo perdeu pontos." },
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
