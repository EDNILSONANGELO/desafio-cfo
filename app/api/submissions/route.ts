import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// GET: get submission for a group+round
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roundId = searchParams.get("round_id");
  const groupId = searchParams.get("group_id");

  if (!roundId || !groupId) {
    return NextResponse.json({ error: "round_id e group_id são obrigatórios" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("round_id", roundId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ submission: data });
}

// POST: save or update draft
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { round_id, group_id, decision } = body;

  if (!round_id || !group_id || !decision) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check round is open
  const { data: round } = await supabase
    .from("rounds")
    .select("status")
    .eq("id", round_id)
    .single();

  if (!round || round.status !== "Aberta") {
    return NextResponse.json({ error: "Esta rodada não está aberta para preenchimento" }, { status: 400 });
  }

  // Check if already sent (locked)
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("round_id", round_id)
    .eq("group_id", group_id)
    .maybeSingle();

  if (existing?.status === "Enviada") {
    return NextResponse.json({
      error: "Esta rodada já foi enviada pelo seu grupo e não pode mais ser alterada.",
    }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("submissions")
    .upsert(
      {
        round_id,
        group_id,
        decision,
        status: "Rascunho",
        updated_at: now,
      },
      { onConflict: "round_id,group_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ submission: data });
}

// DELETE: cancel/reset submission back to draft (teacher only)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const roundId = searchParams.get("round_id");
  const groupId = searchParams.get("group_id");

  if (!roundId || !groupId) {
    return NextResponse.json({ error: "round_id e group_id são obrigatórios" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("submissions")
    .update({
      status: "Rascunho",
      sent_by_ra: null,
      sent_by_name: null,
      sent_at: null,
      updated_at: now,
    })
    .eq("round_id", roundId)
    .eq("group_id", groupId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await supabase.from("audit_logs").insert({
    user_identifier: session.identifier,
    user_name: session.name,
    role: "teacher",
    action: "cancel_submission",
    details: { round_id: Number(roundId), group_id: Number(groupId) },
  });

  return NextResponse.json({ submission: data });
}

// PATCH: finalize (send) submission
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { round_id, group_id, decision } = body;

  const supabase = createAdminClient();

  // Check round is open
  const { data: round } = await supabase
    .from("rounds")
    .select("status")
    .eq("id", round_id)
    .single();

  if (!round || round.status !== "Aberta") {
    return NextResponse.json({ error: "Esta rodada não está aberta" }, { status: 400 });
  }

  // Check if already sent
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("round_id", round_id)
    .eq("group_id", group_id)
    .maybeSingle();

  if (existing?.status === "Enviada") {
    return NextResponse.json({
      error: "Esta rodada já foi enviada pelo seu grupo e não pode mais ser alterada.",
    }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("submissions")
    .upsert(
      {
        round_id,
        group_id,
        decision,
        status: "Enviada",
        sent_by_ra: session.identifier,
        sent_by_name: session.name,
        sent_at: now,
        updated_at: now,
      },
      { onConflict: "round_id,group_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await supabase.from("audit_logs").insert({
    user_identifier: session.identifier,
    user_name: session.name,
    role: "student",
    action: "submit_round",
    details: { round_id, group_id },
  });

  return NextResponse.json({ submission: data });
}
