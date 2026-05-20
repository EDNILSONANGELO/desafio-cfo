import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// ── GET /api/grade-adjustments?round_id=X[&own=true] ─────────────────────────
// Teacher: returns all adjustments for the round
// Student (?own=true): returns only the student's own adjustment
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roundId = searchParams.get("round_id");
  const own = searchParams.get("own") === "true";

  if (!roundId) return NextResponse.json({ error: "round_id obrigatório" }, { status: 400 });

  const supabase = createAdminClient();

  let query = supabase
    .from("grade_adjustments")
    .select("*")
    .eq("round_id", Number(roundId));

  if (session.role === "student" || own) {
    // Students can only see their own adjustment
    query = query.eq("student_id", session.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ adjustments: data || [] });
}

// ── POST /api/grade-adjustments ───────────────────────────────────────────────
// Teacher only: upsert an adjustment for a student in a round
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { student_id, round_id, adjusted_nota, justification } = body;

  if (!student_id || !round_id || adjusted_nota === undefined || adjusted_nota === null) {
    return NextResponse.json({ error: "student_id, round_id e adjusted_nota são obrigatórios" }, { status: 400 });
  }
  if (!justification?.trim()) {
    return NextResponse.json({ error: "Justificativa é obrigatória" }, { status: 400 });
  }
  const nota = Number(adjusted_nota);
  if (isNaN(nota) || nota < 0 || nota > 10) {
    return NextResponse.json({ error: "Nota ajustada deve ser entre 0 e 10" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("grade_adjustments")
    .upsert(
      {
        student_id,
        round_id: Number(round_id),
        adjusted_nota: nota,
        justification: justification.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,round_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ adjustment: data }, { status: 200 });
}

// ── DELETE /api/grade-adjustments?student_id=X&round_id=Y ────────────────────
// Teacher only: remove (reset) an adjustment — student reverts to group nota
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("student_id");
  const roundId = searchParams.get("round_id");

  if (!studentId || !roundId) {
    return NextResponse.json({ error: "student_id e round_id obrigatórios" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("grade_adjustments")
    .delete()
    .eq("student_id", studentId)
    .eq("round_id", Number(roundId));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
