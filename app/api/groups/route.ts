import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// Colors cycling for groups
const COLORS = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-500",
  "from-indigo-500 to-violet-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-red-600",
  "from-teal-500 to-cyan-600",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedClassId = searchParams.get("class_id");
  const poloFilter = searchParams.get("polo")?.trim() || null;

  const supabase = createAdminClient();

  // Resolve classId garantindo que professores só acessem as próprias turmas
  let effectiveClassId: string | null = null;
  let allMyClassIds: string[] | null = null;

  if (session.role === "teacher") {
    const { data: myClasses } = await supabase
      .from("classes")
      .select("id")
      .eq("professor_id", session.id);
    allMyClassIds = (myClasses ?? []).map((c: { id: string }) => c.id);

    if (allMyClassIds.length === 0) return NextResponse.json({ groups: [] });

    if (requestedClassId && allMyClassIds.includes(requestedClassId)) {
      effectiveClassId = requestedClassId;
    } else if (session.classId && allMyClassIds.includes(session.classId)) {
      effectiveClassId = session.classId;
    }
    // effectiveClassId = null → mostrar todos os grupos das turmas do professor
  } else {
    effectiveClassId = requestedClassId || session.classId || null;
  }

  // Se polo selecionado: busca group_ids dos alunos desse polo primeiro
  let poloGroupIds: number[] | null = null;
  if (poloFilter) {
    const { data: poloStudents } = await supabase
      .from("students")
      .select("group_id")
      .ilike("polo", `%${poloFilter}%`)
      .not("group_id", "is", null);
    poloGroupIds = [...new Set(
      (poloStudents ?? [])
        .map((s: { group_id: number | null }) => s.group_id)
        .filter((id): id is number => id !== null)
    )];
    // Polo sem alunos → retorna lista vazia
    if (poloGroupIds.length === 0) return NextResponse.json({ groups: [] });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from("groups").select("*").order("id");
  if (poloGroupIds !== null) {
    // Filtra apenas os grupos que têm alunos nesse polo
    query = query.in("id", poloGroupIds);
  } else if (effectiveClassId) {
    query = query.eq("class_id", effectiveClassId);
  } else if (allMyClassIds && allMyClassIds.length > 0) {
    query = query.in("class_id", allMyClassIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch student counts per group (respeitando o polo se filtrado)
  const groupIds = (data || []).map((g: { id: number }) => g.id);
  let countMap: Record<number, number> = {};
  if (groupIds.length > 0) {
    let countQuery = supabase
      .from("students")
      .select("group_id")
      .in("group_id", groupIds);
    if (poloFilter) countQuery = countQuery.ilike("polo", `%${poloFilter}%`);
    const { data: studentRows } = await countQuery;
    (studentRows || []).forEach((s: { group_id: number | null }) => {
      if (s.group_id != null) countMap[s.group_id] = (countMap[s.group_id] || 0) + 1;
    });
  }

  const groups = (data || []).map((g: { id: number }) => ({
    ...g,
    student_count: countMap[g.id] || 0,
  }));

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, class_id, polo } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nome do grupo é obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Resolve a turma válida do professor — não confia cegamente no classId da sessão,
  // pois pode estar desatualizado (re-seed, classe recriada, etc.)
  let effectiveClassId: string | null = class_id || session.classId || null;

  // Verifica se o classId realmente existe e pertence a este professor
  if (effectiveClassId) {
    const { data: classCheck } = await supabase
      .from("classes")
      .select("id")
      .eq("id", effectiveClassId)
      .eq("professor_id", session.id)
      .maybeSingle();

    if (!classCheck) {
      // classId da sessão não é válido — busca a turma real do professor
      effectiveClassId = null;
    }
  }

  // Se ainda não tem classId válido, busca a primeira turma do professor no banco
  if (!effectiveClassId) {
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

  // Determina número da região: por polo (se informado) ou global na turma
  let regionNumber = 1;
  let colorIndex = 0;

  if (polo?.trim()) {
    // Conta grupos que já têm alunos neste polo
    const { data: poloStudents } = await supabase
      .from("students")
      .select("group_id")
      .ilike("polo", `%${polo.trim()}%`)
      .not("group_id", "is", null)
      .eq("class_id", effectiveClassId);

    const poloGroupCount = new Set(
      (poloStudents ?? [])
        .map((s: { group_id: number | null }) => s.group_id)
        .filter((id): id is number => id !== null)
    ).size;

    regionNumber = poloGroupCount + 1;
    colorIndex = poloGroupCount % COLORS.length;
  } else {
    // Sem polo: sequência global da turma
    const { count } = await supabase
      .from("groups")
      .select("id", { count: "exact", head: true })
      .eq("class_id", effectiveClassId);

    regionNumber = (count ?? 0) + 1;
    colorIndex = (count ?? 0) % COLORS.length;
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      company_name: name.trim(),
      region_name: `Região ${regionNumber}`,
      region_trait: `Região ${regionNumber} — condições padrão de mercado`,
      region_demand: 1.0,
      region_cost: 1.0,
      color: COLORS[colorIndex],
      class_id: effectiveClassId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ group: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("id");

  if (!groupId) {
    return NextResponse.json({ error: "ID do grupo é obrigatório" }, { status: 400 });
  }

  const body = await req.json();
  const updates: Record<string, string | number | null> = {};

  if (body.name?.trim())         updates.name         = body.name.trim();
  if (body.company_name?.trim()) updates.company_name = body.company_name.trim();
  // Se só o name for enviado, company_name acompanha
  if (body.name?.trim() && !body.company_name) updates.company_name = body.name.trim();

  if (body.region_name?.trim())           updates.region_name  = body.region_name.trim();
  if (body.region_trait !== undefined)    updates.region_trait = body.region_trait?.trim() || null;
  if (body.region_demand !== undefined && !isNaN(Number(body.region_demand))) {
    updates.region_demand = Math.max(0.1, Math.min(3.0, Number(body.region_demand)));
  }
  if (body.region_cost !== undefined && !isNaN(Number(body.region_cost))) {
    updates.region_cost = Math.max(0.1, Math.min(3.0, Number(body.region_cost)));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", groupId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ group: data });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("id");

  if (!groupId) {
    return NextResponse.json({ error: "ID do grupo é obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
