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

  // Tenta buscar com colunas de despesas
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, fixed_expenses, transport, maintenance")
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
        ? { ...basic, fixed_expenses: null, transport: null, maintenance: null }
        : null,
      migration_needed: true,
    });
  }

  return NextResponse.json({ class: data });
}

// PATCH /api/classes — professor atualiza as despesas fixas da turma
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let classId = session.classId;

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

  const body = await req.json();
  const updates: Record<string, number | null> = {};

  for (const field of ["fixed_expenses", "transport", "maintenance"] as const) {
    if (field in body) {
      updates[field] =
        body[field] === "" || body[field] === null ? null : Number(body[field]);
    }
  }

  const { data, error } = await supabase
    .from("classes")
    .update(updates)
    .eq("id", classId)
    .select("id, name, fixed_expenses, transport, maintenance")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error:
          "Erro ao salvar. Execute a migração SQL primeiro:\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS fixed_expenses DECIMAL;\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS transport DECIMAL;\n" +
          "ALTER TABLE classes ADD COLUMN IF NOT EXISTS maintenance DECIMAL;\n\n" +
          "Detalhe: " + error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ class: data });
}
