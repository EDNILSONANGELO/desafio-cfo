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
    fixed_expenses, transport, maintenance,
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

  const { data, error } = await supabase
    .from("rounds")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ round: data });
}
