import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { simulateCompany, DEFAULT_DECISION } from "@/lib/simulation/engine";
import { rankResults } from "@/lib/simulation/scoring";
import { assignMedals } from "@/lib/simulation/medals";
import type { Group, Decision, EconomicEvent } from "@/types";

const EVENT_MAP: Record<string, EconomicEvent> = {
  "Inflação alta": { type: "Inflação alta", demandFactor: 0.94, costFactor: 1.1, description: "Alta inflação reduz demanda e aumenta custos" },
  "Incentivo fiscal": { type: "Incentivo fiscal", demandFactor: 1.06, costFactor: 0.96, description: "Incentivos do governo estimulam demanda" },
  "Crise econômica": { type: "Crise econômica", demandFactor: 0.85, costFactor: 1.05, description: "Crise reduz significativamente a demanda" },
  "Crescimento econômico": { type: "Crescimento econômico", demandFactor: 1.1, costFactor: 1.02, description: "Crescimento aquece o mercado" },
  "Escassez de matéria-prima": { type: "Escassez de matéria-prima", demandFactor: 1.0, costFactor: 1.2, description: "Custos de materiais aumentam" },
  "Alta do dólar": { type: "Alta do dólar", demandFactor: 0.97, costFactor: 1.08, description: "Importações ficam mais caras" },
  "Mercado normal": { type: "Mercado normal", demandFactor: 1.0, costFactor: 1.0, description: "" },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Load round
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", id)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
  }

  // Load groups for this class
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .eq("class_id", round.class_id)
    .order("id");

  if (groupsError || !groups?.length) {
    return NextResponse.json({ error: "Nenhum grupo encontrado" }, { status: 400 });
  }

  // Load submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("round_id", id);

  // Determine event
  const event = EVENT_MAP[round.event_type] || null;

  // Apply round-level demand/cost overrides
  const effectiveEvent: EconomicEvent | null = event
    ? {
        ...event,
        demandFactor: event.demandFactor * (round.demand_factor || 1),
        costFactor: event.costFactor * (round.cost_factor || 1),
      }
    : null;

  // Calculate market avg price from submitted decisions
  const submissionMap = new Map(
    (submissions || []).map((s) => [s.group_id, s.decision as Decision])
  );

  const decisions = groups.map(
    (g: Group) => submissionMap.get(g.id) || DEFAULT_DECISION
  );
  const prices = decisions.map((d) => Number(d.salePrice || 42));
  const marketAvgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;

  // Simulate each company
  const simResults = groups.map((g: Group) => {
    const decision = submissionMap.get(g.id) || DEFAULT_DECISION;
    return simulateCompany(g, decision, marketAvgPrice, effectiveEvent);
  });

  // Rank results
  const ranked = rankResults(simResults);

  // Save results to DB (upsert)
  const resultRows = ranked.map((r) => ({
    round_id: parseInt(id),
    group_id: r.companyId,
    data: r,
    position: r.position,
    score: r.score,
  }));

  await supabase
    .from("results")
    .upsert(resultRows, { onConflict: "round_id,group_id" });

  // Assign medals
  const medals = assignMedals(ranked);
  if (medals.length) {
    // Delete old medals for this round
    await supabase.from("medals").delete().eq("round_id", id);
    await supabase.from("medals").insert(
      medals.map((m) => ({ ...m, round_id: parseInt(id) }))
    );
  }

  // Update round status
  await supabase
    .from("rounds")
    .update({ status: "Processada", processed_at: new Date().toISOString() })
    .eq("id", id);

  // Audit log
  await supabase.from("audit_logs").insert({
    user_identifier: session.identifier,
    user_name: session.name,
    role: "teacher",
    action: "process_round",
    details: { round_id: id, groups_processed: groups.length },
  });

  return NextResponse.json({
    success: true,
    results: ranked,
    medals,
    processedAt: new Date().toISOString(),
  });
}
