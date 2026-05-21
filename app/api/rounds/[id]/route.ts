import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({ round: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    status, event_type, demand_factor, cost_factor, name,
    price_min, price_max,
    fixed_expenses, transport, maintenance, avg_salary,
    plastic_unit, caps_unit, package_unit, label_unit,
    marketing_insertion_cost, machine_min_employees,
    payroll_charges_pct,
  } = body;

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {};

  if (status) {
    updates.status = status;
    if (status === "Aberta") updates.opened_at = new Date().toISOString();
    if (status === "Encerrada") updates.closed_at = new Date().toISOString();
  }
  if (event_type !== undefined) updates.event_type = event_type;
  if (demand_factor !== undefined) updates.demand_factor = demand_factor;
  if (cost_factor !== undefined) updates.cost_factor = cost_factor;
  if (name) updates.name = name;
  if (price_min !== undefined) updates.price_min = price_min === "" || price_min === null ? null : Number(price_min);
  if (price_max !== undefined) updates.price_max = price_max === "" || price_max === null ? null : Number(price_max);
  // Despesas travadas por rodada
  if (fixed_expenses !== undefined) updates.fixed_expenses = fixed_expenses === "" || fixed_expenses === null ? null : Number(fixed_expenses);
  if (transport !== undefined)      updates.transport      = transport      === "" || transport      === null ? null : Number(transport);
  if (maintenance !== undefined)    updates.maintenance    = maintenance    === "" || maintenance    === null ? null : Number(maintenance);
  if (avg_salary !== undefined)     updates.avg_salary     = avg_salary     === "" || avg_salary     === null ? null : Number(avg_salary);
  // Preços unitários de materiais travados
  if (plastic_unit  !== undefined)  updates.plastic_unit  = plastic_unit  === "" || plastic_unit  === null ? null : Number(plastic_unit);
  if (caps_unit     !== undefined)  updates.caps_unit     = caps_unit     === "" || caps_unit     === null ? null : Number(caps_unit);
  if (package_unit  !== undefined)  updates.package_unit  = package_unit  === "" || package_unit  === null ? null : Number(package_unit);
  if (label_unit    !== undefined)  updates.label_unit    = label_unit    === "" || label_unit    === null ? null : Number(label_unit);
  // Migration 008: novos campos configuráveis pelo professor
  if (marketing_insertion_cost !== undefined)
    updates.marketing_insertion_cost = marketing_insertion_cost === "" || marketing_insertion_cost === null ? null : Number(marketing_insertion_cost);
  if (machine_min_employees !== undefined)
    updates.machine_min_employees = machine_min_employees === "" || machine_min_employees === null ? null : Number(machine_min_employees);
  // Migration 009: Encargos sobre folha
  if (payroll_charges_pct !== undefined)
    updates.payroll_charges_pct = payroll_charges_pct === "" || payroll_charges_pct === null ? null : Number(payroll_charges_pct);

  const { data, error } = await supabase
    .from("rounds")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ round: data });
}

// DELETE /api/rounds/[id] — professor exclui uma rodada (e seus dados em cascata)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Confirma que a rodada pertence ao professor antes de excluir
  const { data: round } = await supabase
    .from("rounds")
    .select("id, name, class_id")
    .eq("id", id)
    .maybeSingle();

  if (!round) {
    return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
  }

  // Exclui em cascata: medals → results → submissions → round
  await supabase.from("medals").delete().eq("round_id", id);
  await supabase.from("results").delete().eq("round_id", id);
  await supabase.from("submissions").delete().eq("round_id", id);

  const { error } = await supabase.from("rounds").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registra no log de auditoria
  await supabase.from("audit_logs").insert({
    user_identifier: session.identifier,
    user_name: session.name,
    role: "teacher",
    action: "delete_round",
    details: { round_id: id, round_name: round.name },
  });

  return NextResponse.json({ success: true });
}
