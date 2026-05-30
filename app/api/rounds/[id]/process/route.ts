import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { simulateCompany, DEFAULT_DECISION, resultToOpeningBalance } from "@/lib/simulation/engine";
import { rankResults, DEFAULT_WEIGHTS, ScoreWeights } from "@/lib/simulation/scoring";
import { assignMedals } from "@/lib/simulation/medals";
import type { Group, Decision, EconomicEvent, SimulationResult, InitialBalance, RoundConfig } from "@/types";

const EVENT_MAP: Record<string, EconomicEvent> = {
  // ── Eventos macroeconômicos ──────────────────────────────────────────────────
  "Mercado normal":            { type: "Mercado normal",            demandFactor: 1.0,  costFactor: 1.0,  description: "" },
  "Crescimento econômico":     { type: "Crescimento econômico",     demandFactor: 1.10, costFactor: 1.02, description: "Crescimento aquece o mercado" },
  "Crise econômica":           { type: "Crise econômica",           demandFactor: 0.85, costFactor: 1.05, description: "Crise reduz significativamente a demanda" },
  "Inflação alta":             { type: "Inflação alta",             demandFactor: 0.94, costFactor: 1.10, description: "Alta inflação reduz demanda e aumenta custos" },
  "Incentivo fiscal":          { type: "Incentivo fiscal",          demandFactor: 1.06, costFactor: 0.96, description: "Incentivos do governo estimulam demanda" },
  "Escassez de matéria-prima": { type: "Escassez de matéria-prima", demandFactor: 1.00, costFactor: 1.20, description: "Custos de materiais aumentam" },
  "Alta do dólar":             { type: "Alta do dólar",             demandFactor: 0.97, costFactor: 1.08, description: "Importações ficam mais caras" },
  // ── Sazonalidade (Phase 3) ───────────────────────────────────────────────────
  "Alta temporada":            { type: "Alta temporada",            demandFactor: 1.50, costFactor: 1.05, description: "Pico sazonal de demanda (+50%)" },
  "Baixa temporada":           { type: "Baixa temporada",           demandFactor: 0.70, costFactor: 0.98, description: "Período de baixa demanda sazonal (-30%)" },
  "Lançamento de produto":     { type: "Lançamento de produto",     demandFactor: 1.25, costFactor: 1.03, description: "Curiosidade dos consumidores aumenta a demanda (+25%)" },
  "Concorrência externa":      { type: "Concorrência externa",      demandFactor: 0.90, costFactor: 1.00, description: "Produto importado concorre no mercado (-10% demanda)" },
  "Regulação ambiental":       { type: "Regulação ambiental",       demandFactor: 1.00, costFactor: 1.15, description: "Novas normas ambientais aumentam custos de produção" },
  "Campanha de sustentabilidade": { type: "Campanha de sustentabilidade", demandFactor: 1.12, costFactor: 1.02, description: "Apelo ecológico melhora percepção da EcoBottle (+12% demanda)" },
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

  // ── CARRYOVER: buscar resultados da rodada anterior processada ───────────────
  // Encontra a rodada imediatamente anterior (por id) da mesma turma que foi processada
  const { data: prevRounds } = await supabase
    .from("rounds")
    .select("id")
    .eq("class_id", round.class_id)
    .eq("status", "Processada")
    .lt("id", id)
    .order("id", { ascending: false })
    .limit(1);

  const prevRoundId = prevRounds?.[0]?.id ?? null;

  // Mapa: group_id → saldo patrimonial de abertura
  const openingBalanceMap = new Map<number, Partial<InitialBalance>>();

  if (prevRoundId) {
    const { data: prevResults } = await supabase
      .from("results")
      .select("group_id, data")
      .eq("round_id", prevRoundId);

    (prevResults || []).forEach((row: { group_id: number; data: SimulationResult }) => {
      openingBalanceMap.set(row.group_id, resultToOpeningBalance(row.data));
    });
  }
  // ────────────────────────────────────────────────────────────────────────────

  // Determine event
  const event = EVENT_MAP[round.event_type] || null;

  // Apply round-level demand/cost overrides
  const effectiveEvent: EconomicEvent | null = event
    ? {
        ...event,
        demandFactor: event.demandFactor * (round.demand_factor || 1),
        costFactor:   event.costFactor   * (round.cost_factor   || 1),
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

  // Configuração da rodada para o engine (Migration 008 + 009 + 010)
  const roundConfig: RoundConfig = {
    marketing_insertion_cost: round.marketing_insertion_cost ?? null,
    machine_min_employees:    round.machine_min_employees    ?? null,
    payroll_charges_pct:      round.payroll_charges_pct      ?? null,
    loan_limit:               round.loan_limit               ?? null,
    inter_regional_cost:      round.inter_regional_cost      ?? null,
    loan_rate:                round.loan_rate                ?? null,  // Ajuste 10
  };

  // Simulate each company (with carryover opening balance when available)
  const simResults = groups.map((g: Group) => {
    const decision       = submissionMap.get(g.id) || DEFAULT_DECISION;
    const openingBalance = openingBalanceMap.get(g.id) ?? undefined;
    return simulateCompany(g, decision, marketAvgPrice, effectiveEvent, openingBalance, roundConfig);
  });

  // Carregar pesos customizados da turma (se existir a coluna score_weights)
  let customWeights: Partial<ScoreWeights> | undefined;
  try {
    const { data: classData } = await supabase
      .from("classes")
      .select("score_weights")
      .eq("id", round.class_id)
      .maybeSingle();
    if (classData?.score_weights) {
      customWeights = classData.score_weights as Partial<ScoreWeights>;
    }
  } catch {
    // coluna não existe → usa pesos padrão
    customWeights = undefined;
  }

  // Rank results (com pesos customizados ou padrão)
  const ranked = rankResults(simResults, customWeights ?? DEFAULT_WEIGHTS);

  // Save results to DB (upsert)
  const resultRows = ranked.map((r) => ({
    round_id: parseInt(id),
    group_id: r.companyId,
    data:     r,
    position: r.position,
    score:    r.score,
  }));

  await supabase
    .from("results")
    .upsert(resultRows, { onConflict: "round_id,group_id" });

  // Assign medals
  const medals = assignMedals(ranked);
  if (medals.length) {
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
    user_name:       session.name,
    role:            "teacher",
    action:          "process_round",
    details: {
      round_id:         id,
      groups_processed: groups.length,
      used_carryover:   prevRoundId !== null,
      prev_round_id:    prevRoundId,
    },
  });

  return NextResponse.json({
    success:     true,
    results:     ranked,
    medals,
    processedAt: new Date().toISOString(),
    carryover:   prevRoundId !== null,
  });
}
