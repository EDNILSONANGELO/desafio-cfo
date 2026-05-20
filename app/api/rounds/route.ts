import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedClassId = searchParams.get("class_id");
  const poloFilter = searchParams.get("polo")?.trim() || null;

  const supabase = createAdminClient();

  // Professores veem apenas rodadas das próprias turmas
  let effectiveClassId: string | null = null;
  let allMyClassIds: string[] | null = null;

  if (session.role === "teacher") {
    const { data: myClasses } = await supabase
      .from("classes")
      .select("id")
      .eq("professor_id", session.id);
    allMyClassIds = (myClasses ?? []).map((c: { id: string }) => c.id);

    if (allMyClassIds.length === 0) return NextResponse.json({ rounds: [] });

    if (requestedClassId && allMyClassIds.includes(requestedClassId)) {
      effectiveClassId = requestedClassId;
    } else if (session.classId && allMyClassIds.includes(session.classId)) {
      effectiveClassId = session.classId;
    }
    // null → mostra de todas as turmas do professor (sem turma ativa selecionada)
  } else {
    effectiveClassId = requestedClassId || session.classId || null;
  }

  // Busca rodadas da turma
  let query = supabase.from("rounds").select("*").order("id", { ascending: false });
  if (effectiveClassId) {
    query = query.eq("class_id", effectiveClassId);
  } else if (allMyClassIds && allMyClassIds.length > 0) {
    query = query.in("class_id", allMyClassIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Rodadas são da turma inteira — sempre retorna todas.
  // Quando polo filtrado, enriquece cada rodada com contagem de submissões do polo.
  if (poloFilter && data && data.length > 0) {
    // Group IDs dos alunos deste polo
    const { data: poloStudents } = await supabase
      .from("students")
      .select("group_id")
      .ilike("polo", `%${poloFilter}%`)
      .not("group_id", "is", null);

    const poloGroupIds = [...new Set(
      (poloStudents ?? [])
        .map((s: { group_id: number | null }) => s.group_id)
        .filter((id): id is number => id !== null)
    )];

    const poloGroupsTotal = poloGroupIds.length;

    // Submissões enviadas (status = "Enviada") por rodada, para os grupos do polo
    let submittedByRound: Record<number, number> = {};
    if (poloGroupIds.length > 0) {
      const { data: subs } = await supabase
        .from("submissions")
        .select("round_id")
        .in("group_id", poloGroupIds)
        .eq("status", "Enviada");

      (subs ?? []).forEach((s: { round_id: number }) => {
        submittedByRound[s.round_id] = (submittedByRound[s.round_id] || 0) + 1;
      });
    }

    const rounds = (data || []).map((r: { id: number }) => ({
      ...r,
      polo_groups_total: poloGroupsTotal,
      polo_groups_submitted: submittedByRound[r.id] || 0,
    }));

    return NextResponse.json({ rounds });
  }

  return NextResponse.json({ rounds: data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, class_id, event_type = "Mercado normal" } = body;

  if (!name) {
    return NextResponse.json({ error: "Nome da rodada é obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Resolve a turma: tenta usar class_id enviado; senão busca do professor no banco
  let effectiveClassId: string | null = class_id || null;

  if (effectiveClassId) {
    // Verifica se pertence a este professor
    const { data: classCheck } = await supabase
      .from("classes")
      .select("id")
      .eq("id", effectiveClassId)
      .eq("professor_id", session.id)
      .maybeSingle();
    if (!classCheck) effectiveClassId = null;
  }

  if (!effectiveClassId) {
    // Fallback: pega a primeira turma do professor
    const { data: firstClass } = await supabase
      .from("classes")
      .select("id")
      .eq("professor_id", session.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    effectiveClassId = firstClass?.id ?? null;
  }

  if (!effectiveClassId) {
    return NextResponse.json({
      error: "Turma não encontrada. Acesse Configurações e crie sua turma primeiro.",
    }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("rounds")
    .insert({ name, class_id: effectiveClassId, event_type, status: "Não iniciada" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ round: data }, { status: 201 });
}
