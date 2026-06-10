import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/classes — retorna a turma com configurações de despesas fixas
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createAdminClient();
  let classId = session.classId;

  // Aluno: busca pelo group_id
  if (!classId && session.groupId) {
    const { data: group } = await supabase
      .from("groups")
      .select("class_id")
      .eq("id", session.groupId)
      .maybeSingle();
    classId = group?.class_id;
  }

  // Professor sem classId no JWT: busca pelo professor_id
  if (!classId && session.role === "teacher") {
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("professor_id", session.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    classId = cls?.id;
  }

  if (!classId) return NextResponse.json({ class: null });

  // Tenta buscar com colunas de despesas, score_weights e grade_scale
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, fixed_expenses, transport, maintenance, score_weights, grade_scale, score_targets")
    .eq("id", classId)
    .maybeSingle();

  if (error) {
    // Colunas ainda não existem (migration pendente) → retorna apenas id/name
    const { data: basic } = await supabase
      .from("classes")
      .select("id, name")
      .eq("id", classId)
      .maybeSingle();

    return NextResponse.json({
      class: basic
        ? { ...basic, fixed_expenses: null, transport: null, maintenance: null, score_weights: null, grade_scale: null, score_targets: null }
        : null,
      migration_needed: true,
    });
  }

  return NextResponse.json({ class: data });
}

// POST /api/classes — professor cria uma nova turma
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher" || session.isMaster) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, polo } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome da turma é obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("professor_id", session.id)
    .ilike("name", name.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Você já tem uma turma com esse nome" }, { status: 400 });
  }

  // Tenta criar com polo; fallback sem polo se coluna não existir
  const insertData: Record<string, string> = { name: name.trim(), professor_id: session.id };
  if (polo?.trim()) insertData.polo = polo.trim();

  const { data, error } = await supabase.from("classes").insert(insertData).select("id, name, created_at").single();

  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from("classes").insert({ name: name.trim(), professor_id: session.id }).select("id, name, created_at").single();
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    return NextResponse.json({ class: { ...d2, polo: null } }, { status: 201 });
  }

  return NextResponse.json({ class: { ...data, polo: polo?.trim() || null } }, { status: 201 });
}

// DELETE /api/classes?id=xxx — professor exclui uma de suas turmas
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher" || session.isMaster) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("id");
  if (!classId) return NextResponse.json({ error: "ID da turma é obrigatório" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: cls } = await supabase.from("classes").select("id, name")
    .eq("id", classId).eq("professor_id", session.id).maybeSingle();

  if (!cls) return NextResponse.json({ error: "Turma não encontrada ou sem permissão" }, { status: 404 });

  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, deleted: cls.name });
}

// PATCH /api/classes — professor atualiza configurações ou nome da turma
// Body opcional: { class_id: string } para editar turma específica (ex: renomear).
// Se omitido, usa session.classId.
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await req.json();

  // Determina qual turma atualizar
  let classId: string | undefined = body.class_id?.trim() || session.classId;

  if (!classId) {
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("professor_id", session.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    classId = cls?.id;
  }

  if (!classId) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  // Garante que a turma pertence ao professor
  const { data: ownerCheck } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("professor_id", session.id)
    .maybeSingle();

  if (!ownerCheck) {
    return NextResponse.json({ error: "Turma não encontrada ou sem permissão" }, { status: 403 });
  }

  const updates: Record<string, number | null> = {};

  for (const field of ["fixed_expenses", "transport", "maintenance"] as const) {
    if (field in body) {
      updates[field] =
        body[field] === "" || body[field] === null ? null : Number(body[field]);
    }
  }

  // score_weights e grade_scale são JSONB — aceitam objeto/array ou null
  const allUpdates: Record<string, unknown> = { ...updates };
  if ("score_weights" in body) {
    allUpdates["score_weights"] = body.score_weights ?? null;
  }
  if ("grade_scale" in body) {
    allUpdates["grade_scale"] = body.grade_scale ?? null;
  }
  if ("score_targets" in body) {
    allUpdates["score_targets"] = body.score_targets ?? null;
  }

  // Renomear turma
  if ("name" in body) {
    const newName = String(body.name ?? "").trim();
    if (!newName) {
      return NextResponse.json({ error: "O nome da turma não pode estar vazio" }, { status: 400 });
    }
    allUpdates["name"] = newName;
  }

  const { data, error } = await supabase
    .from("classes")
    .update(allUpdates)
    .eq("id", classId)
    .select("id, name, fixed_expenses, transport, maintenance, score_weights, grade_scale, score_targets")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error:
          "Erro ao salvar. Execute a migração SQL primeiro:\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS fixed_expenses DECIMAL;\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS transport DECIMAL;\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS maintenance DECIMAL;\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS score_weights JSONB;\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade_scale JSONB;\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS score_targets JSONB;\n\n" +
          "Detalhe: " + error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ class: data });
}
