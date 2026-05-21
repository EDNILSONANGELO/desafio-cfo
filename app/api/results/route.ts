import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * PATCH /api/results
 * Allows a teacher to add/update a professor comment on a result.
 * Body: { round_id, group_id, professor_comment }
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { round_id, group_id, professor_comment } = body;
  if (!round_id || !group_id) {
    return NextResponse.json({ error: "round_id e group_id são obrigatórios" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch existing result data
  const { data: existing, error: fetchErr } = await supabase
    .from("results")
    .select("data")
    .eq("round_id", round_id)
    .eq("group_id", group_id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Resultado não encontrado" }, { status: 404 });
  }

  // Merge professor_comment into data
  const updatedData = { ...(existing.data as object), professor_comment: professor_comment ?? "" };

  const { error: updateErr } = await supabase
    .from("results")
    .update({ data: updatedData })
    .eq("round_id", round_id)
    .eq("group_id", group_id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roundId    = searchParams.get("round_id");
  const classId    = searchParams.get("class_id");
  const poloFilter = searchParams.get("polo")?.trim() || null;

  const supabase = createAdminClient();

  // Quando polo filtrado: descobre group_ids dos alunos do polo
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
  }

  let query = supabase
    .from("results")
    .select("*, group:groups(id, name, company_name, region_name, color)")
    .order("position");

  if (roundId)  query = query.eq("round_id", roundId);
  if (classId) {
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id")
      .eq("class_id", classId);
    if (rounds?.length) query = query.in("round_id", rounds.map((r) => r.id));
  }
  // Filtra por grupo do polo (aplicado no banco quando possível)
  if (poloGroupIds && poloGroupIds.size > 0) {
    query = query.in("group_id", [...poloGroupIds]);
  } else if (poloGroupIds && poloGroupIds.size === 0) {
    return NextResponse.json({ results: [] });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-numera posições sequencialmente (evita lacunas quando grupos são deletados)
  const resequenced = (data || []).map((r, idx) => ({
    ...r,
    position: idx + 1,
    data: { ...(r.data as object), position: idx + 1 },
  }));

  return NextResponse.json({ results: resequenced });
}
