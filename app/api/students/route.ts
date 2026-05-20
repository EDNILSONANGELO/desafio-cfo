import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

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

// Find existing group by name or create a new one with sequential region
async function resolveGroup(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createAdminClient>,
  groupName: string,
  classId: string
): Promise<number> {
  const trimmed = groupName.trim();

  // Try to find existing group with same name in the class
  const { data: existing } = await supabase
    .from("groups")
    .select("id")
    .eq("class_id", classId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return existing.id;

  // Count existing groups to determine next region number
  const { count } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);

  const regionNumber = (count ?? 0) + 1;
  const colorIndex = (count ?? 0) % COLORS.length;

  const { data: newGroup, error } = await supabase
    .from("groups")
    .insert({
      name: trimmed,
      company_name: trimmed,
      region_name: `Região ${regionNumber}`,
      region_trait: `Região ${regionNumber} — condições padrão de mercado`,
      region_demand: 1.0,
      region_cost: 1.0,
      color: COLORS[colorIndex],
      class_id: classId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Erro ao criar grupo: ${error.message}`);
  return newGroup.id;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedClassId = searchParams.get("class_id");
  // class_ids=id1,id2,id3 — filtro de múltiplas turmas (usado pelo filtro de polo via turmas)
  const requestedClassIds = searchParams.get("class_ids")?.split(",").filter(Boolean) ?? [];
  // polo=Norte — filtro direto pelo campo polo do aluno
  const poloFilter = searchParams.get("polo")?.trim() || null;

  const supabase = createAdminClient();

  // Busca todas as turmas do professor — nunca expõe alunos de outros professores
  const { data: myClasses } = await supabase
    .from("classes")
    .select("id")
    .eq("professor_id", session.id);
  const myClassIds = (myClasses ?? []).map((c: { id: string }) => c.id);

  if (myClassIds.length === 0) {
    return NextResponse.json({ students: [] });
  }

  let query = supabase
    .from("students")
    .select("*, group:groups(id, name, company_name, region_name)")
    .order("name");

  // Filtro por múltiplas turmas (polo filter via turma) — valida que pertencem ao professor
  if (requestedClassIds.length > 0) {
    const validIds = requestedClassIds.filter((id) => myClassIds.includes(id));
    if (validIds.length === 0) return NextResponse.json({ students: [] });
    query = query.in("class_id", validIds);
  } else {
    // Filtro por turma única: pedida → ativa na sessão → todas do professor
    let effectiveClassId: string | null = null;
    if (requestedClassId && myClassIds.includes(requestedClassId)) {
      effectiveClassId = requestedClassId;
    } else if (session.classId && myClassIds.includes(session.classId)) {
      effectiveClassId = session.classId;
    }

    if (effectiveClassId) {
      query = query.eq("class_id", effectiveClassId);
    } else {
      query = query.in("class_id", myClassIds);
    }
  }

  // Filtro direto por polo do aluno — case-insensitive, busca parcial
  if (poloFilter) {
    query = query.ilike("polo", `%${poloFilter}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ students: data });
}

// Helper: lista de polos autorizados do professor (null = sem restrição)
function professorAllowedPolos(professorPolo: string | null | undefined): string[] | null {
  if (!professorPolo?.trim()) return null;
  return professorPolo.split(",").map((p) => p.trim()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { ra, name, password, group_name, email, semestre, polo } = body;

  if (!ra || !name || !password) {
    return NextResponse.json({ error: "RA, nome e senha são obrigatórios" }, { status: 400 });
  }

  const effectiveClassId = session.classId;
  if (!effectiveClassId) {
    return NextResponse.json({ error: "Turma não identificada. Faça login novamente." }, { status: 400 });
  }

  // Validação de polo: professor só pode cadastrar alunos em seus polos autorizados
  const allowedPolos = professorAllowedPolos(session.polo);
  if (allowedPolos && polo?.trim()) {
    const studentPolo = polo.trim().toLowerCase();
    const isAllowed = allowedPolos.some((p) => p.toLowerCase() === studentPolo);
    if (!isAllowed) {
      return NextResponse.json(
        { error: `Polo "${polo.trim()}" não está na sua lista de polos autorizados: ${allowedPolos.join(", ")}` },
        { status: 403 }
      );
    }
  }

  const supabase = createAdminClient();

  // Check RA uniqueness
  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("ra", ra)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Este RA já está cadastrado" }, { status: 400 });
  }

  // Resolve group: find or create by name
  let group_id: number | null = null;
  if (group_name?.trim()) {
    try {
      group_id = await resolveGroup(supabase, group_name, effectiveClassId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao resolver grupo";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const password_hash = await bcrypt.hash(password, 10);

  // Tenta inserir com polo; fallback sem polo se coluna ainda não existir
  const insertBase = {
    ra,
    name,
    password_hash,
    group_id,
    class_id: effectiveClassId,
    email: email || null,
    semestre: semestre ? Number(semestre) : null,
  };

  const { data, error } = await supabase
    .from("students")
    .insert({ ...insertBase, polo: polo?.trim() || null })
    .select("*, group:groups(id, name, company_name, region_name)")
    .single();

  if (error) {
    // Fallback: coluna polo ainda não foi criada no banco
    const { data: d2, error: e2 } = await supabase
      .from("students")
      .insert(insertBase)
      .select("*, group:groups(id, name, company_name, region_name)")
      .single();
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    return NextResponse.json({ student: { ...d2, polo: null } }, { status: 201 });
  }

  return NextResponse.json({ student: data }, { status: 201 });
}
