import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import type { RankedResult } from "@/types";

// GET /api/reports/regional?round_id=X
// Returns all processed results for a class, organized by round + company
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roundId    = searchParams.get("round_id");
    const poloFilter = searchParams.get("polo")?.trim() || null;

    const supabase = createAdminClient();

    // Resolve classId: prefer session, fallback to group lookup for students
    let classId = session.classId ?? null;

    if (!classId && session.groupId) {
      const { data: grp } = await supabase
        .from("groups")
        .select("class_id")
        .eq("id", session.groupId)
        .maybeSingle();
      classId = grp?.class_id ?? null;
    }

    if (!classId && session.role === "teacher") {
      // Teacher without classId yet: fetch their first class
      const { data: cls } = await supabase
        .from("classes")
        .select("id")
        .eq("professor_id", session.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      classId = cls?.id ?? null;
    }

    if (!classId) {
      return NextResponse.json({ rounds: [], results: [], groups: [], evolutionData: [], companies: [], myGroupId: session.groupId });
    }

    // Group IDs do polo (quando filtrado)
    let poloGroupIds: Set<number> | null = null;
    if (poloFilter) {
      const supabaseInner = createAdminClient();
      const { data: poloStudents } = await supabaseInner
        .from("students")
        .select("group_id")
        .ilike("polo", `%${poloFilter}%`)
        .not("group_id", "is", null);
      poloGroupIds = new Set(
        (poloStudents ?? [])
          .map((s: { group_id: number | null }) => s.group_id)
          .filter((id): id is number => id !== null)
      );
      if (poloGroupIds.size === 0) {
        return NextResponse.json({ rounds: [], results: [], evolutionData: [], companies: [], myGroupId: session.groupId });
      }
    }

    // Get all processed rounds for this class
    const { data: rounds, error: roundsErr } = await supabase
      .from("rounds")
      .select("id, name, status, event_type, demand_factor, cost_factor, processed_at, opened_at")
      .eq("class_id", classId)
      .eq("status", "Processada")
      .order("id", { ascending: true });

    if (roundsErr) return NextResponse.json({ error: roundsErr.message }, { status: 500 });
    if (!rounds?.length) return NextResponse.json({ rounds: [], results: [], groups: [], evolutionData: [], companies: [], myGroupId: session.groupId });

    // Target round (default = latest processed)
    const targetRoundId = roundId
      ? parseInt(roundId)
      : rounds[rounds.length - 1].id;

    // Get results for target round with group info (filtered by polo if needed)
    let resultsQuery = supabase
      .from("results")
      .select("*, group:groups(id, name, company_name, region_name, region_trait, region_demand, region_cost, color)")
      .eq("round_id", targetRoundId)
      .order("position", { ascending: true });
    if (poloGroupIds && poloGroupIds.size > 0) resultsQuery = resultsQuery.in("group_id", [...poloGroupIds]);

    const { data: results, error: resultsErr } = await resultsQuery;
    if (resultsErr) return NextResponse.json({ error: resultsErr.message }, { status: 500 });

    // Get all results across all rounds for evolution charts (filtered by polo if needed)
    let allResultsQuery = supabase
      .from("results")
      .select("round_id, group_id, data, position, score, group:groups(id, company_name, color)")
      .in("round_id", rounds.map((r) => r.id))
      .order("round_id", { ascending: true });
    if (poloGroupIds && poloGroupIds.size > 0) allResultsQuery = allResultsQuery.in("group_id", [...poloGroupIds]);

    const { data: allResults } = await allResultsQuery;

    // Build evolution data: profit by company across rounds
    const evolutionMap: Record<string, Record<string, number>> = {};
    const companyColors: Record<string, string> = {};

    for (const r of (allResults || [])) {
      const round = rounds.find((rd) => rd.id === r.round_id);
      if (!round) continue;
      const groupInfo = r.group as unknown as { company_name: string; color: string } | null;
      const company = groupInfo?.company_name || `Grupo ${r.group_id}`;
      const color = groupInfo?.color || "#22d3ee";
      const data = r.data as RankedResult;

      if (!evolutionMap[round.name]) evolutionMap[round.name] = {};
      evolutionMap[round.name][company] = data.netProfit;
      companyColors[company] = color;
    }

    const evolutionData = rounds.map((r) => ({
      round: r.name,
      ...(evolutionMap[r.name] || {}),
    }));

    const companies = Object.keys(companyColors).map((name) => ({
      name,
      color: colorToHex(companyColors[name]),
    }));

    return NextResponse.json({
      rounds,
      targetRoundId,
      results: results || [],
      evolutionData,
      companies,
      myGroupId: session.groupId ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Convert tailwind gradient string to first hex color
function colorToHex(color: string): string {
  const map: Record<string, string> = {
    "from-emerald-500": "#10b981",
    "from-sky-500": "#0ea5e9",
    "from-violet-500": "#8b5cf6",
    "from-amber-500": "#f59e0b",
    "from-rose-500": "#f43f5e",
    "from-indigo-500": "#6366f1",
    "from-teal-500": "#14b8a6",
    "from-orange-500": "#f97316",
    "from-cyan-500": "#06b6d4",
    "from-green-500": "#22c55e",
  };
  for (const [key, hex] of Object.entries(map)) {
    if (color.includes(key)) return hex;
  }
  return "#22d3ee";
}
