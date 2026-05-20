import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/results/accumulated?class_id=X
 *
 * Retorna o ranking acumulado de todas as rodadas processadas de uma turma.
 * Soma os scores de cada grupo em todas as rodadas e ordena do maior para o menor.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId    = searchParams.get("class_id") || session.classId || null;
  const poloFilter = searchParams.get("polo")?.trim() || null;

  if (!classId) {
    return NextResponse.json({ error: "class_id é obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Group IDs do polo (quando filtrado)
  let poloGroupIds: Set<number> | null = null;
  if (poloFilter) {
    const { data: poloStudents } = await supabase
      .from("students")
      .select("group_id")
      .ilike("polo", `%${poloFilter}%`)
      .not("group_id", "is", null);
    poloGroupIds = new Set(
      (poloStudents ?? [])
        .map((s: { group_id: number | null }) => s.group_id)
        .filter((id): id is number => id !== null)
    );
    if (poloGroupIds.size === 0) return NextResponse.json({ ranking: [], rounds: [] });
  }

  // Busca todas as rodadas processadas da turma
  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, name")
    .eq("class_id", classId)
    .eq("status", "Processada")
    .order("id");

  if (!rounds?.length) {
    return NextResponse.json({ ranking: [], rounds: [] });
  }

  const roundIds = rounds.map((r: { id: number }) => r.id);

  // Busca todos os resultados dessas rodadas com dados do grupo
  let resultsQuery = supabase
    .from("results")
    .select("round_id, group_id, score, position, data, groups(id, name, company_name, color, region_name)")
    .in("round_id", roundIds);

  // Filtra pelo polo se ativo
  if (poloGroupIds && poloGroupIds.size > 0) {
    resultsQuery = resultsQuery.in("group_id", [...poloGroupIds]);
  }

  const { data: results, error } = await resultsQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Acumula score por grupo
  type GroupAccum = {
    group_id: number;
    group_name: string;
    company_name: string;
    region_name: string;
    color: string;
    totalScore: number;
    roundCount: number;
    bestPosition: number;
    rounds: Array<{ round_id: number; round_name: string; score: number; position: number; netProfit: number; netRevenue: number }>;
  };

  const accumMap = new Map<number, GroupAccum>();
  const roundNameMap = new Map(rounds.map((r: { id: number; name: string }) => [r.id, r.name]));

  for (const row of results || []) {
    const rawG = row.groups;
    const g = (Array.isArray(rawG) ? rawG[0] : rawG) as { id: number; name: string; company_name: string; color: string; region_name: string } | null;
    if (!g) continue;

    if (!accumMap.has(row.group_id)) {
      accumMap.set(row.group_id, {
        group_id:     row.group_id,
        group_name:   g.name,
        company_name: g.company_name,
        region_name:  g.region_name,
        color:        g.color,
        totalScore:   0,
        roundCount:   0,
        bestPosition: 99,
        rounds:       [],
      });
    }

    const entry = accumMap.get(row.group_id)!;
    entry.totalScore   += row.score || 0;
    entry.roundCount   += 1;
    entry.bestPosition  = Math.min(entry.bestPosition, row.position || 99);
    entry.rounds.push({
      round_id:   row.round_id,
      round_name: roundNameMap.get(row.round_id) || `Rodada ${row.round_id}`,
      score:      row.score || 0,
      position:   row.position || 0,
      netProfit:  (row.data as { netProfit?: number })?.netProfit ?? 0,
      netRevenue: (row.data as { netRevenue?: number })?.netRevenue ?? 0,
    });
  }

  // Ordena por score total (maior primeiro), desempate por melhor posição média
  const ranking = Array.from(accumMap.values())
    .sort((a, b) => b.totalScore - a.totalScore || a.bestPosition - b.bestPosition)
    .map((entry, idx) => ({
      ...entry,
      accumulatedPosition: idx + 1,
      avgScore: entry.roundCount ? entry.totalScore / entry.roundCount : 0,
    }));

  return NextResponse.json({ ranking, rounds, totalRounds: rounds.length });
}
