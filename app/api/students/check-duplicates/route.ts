import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/students/check-duplicates
// Body: { ras: string[] }
// Returns: { duplicates: EnrichedDuplicate[] }
//
// Cada duplicata inclui:
//   - is_in_scope: true se o aluno está em uma turma deste professor (visível na tela)
//   - false se o aluno existe mas está em outra turma / professor (registro externo ou órfão)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { ras }: { ras: string[] } = body;

  if (!ras?.length) {
    return NextResponse.json({ duplicates: [] });
  }

  const supabase = createAdminClient();

  // 1. IDs das turmas deste professor (para determinar visibilidade)
  const { data: myClasses } = await supabase
    .from("classes")
    .select("id")
    .eq("professor_id", session.id);
  const myClassIds = new Set((myClasses ?? []).map((c: { id: string }) => c.id));

  // 2. Busca RAs com contexto completo: turma, professor e grupo
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, ra, name, polo, class_id, group:groups(id, name), class:classes(id, name, professor_id, professor:professors(id, name))"
    )
    .in("ra", ras);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase retorna relações como arrays mesmo quando é 1-para-1 via foreign key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    duplicates: (data ?? []).map((s: any) => {
      // Normaliza: Supabase pode retornar array ou objeto dependendo da relação
      const group  = Array.isArray(s.group)  ? s.group[0]  ?? null : s.group  ?? null;
      const cls    = Array.isArray(s.class)   ? s.class[0]  ?? null : s.class  ?? null;
      const prof   = cls && Array.isArray(cls.professor) ? cls.professor[0] ?? null : cls?.professor ?? null;

      return {
        ra: s.ra as string,
        id: s.id as string,
        name: s.name as string,
        polo: (s.polo as string | null) ?? null,
        class_id: (s.class_id as string | null) ?? null,
        class_name: (cls?.name as string | null) ?? null,
        professor_name: (prof?.name as string | null) ?? null,
        group_name: (group?.name as string | null) ?? null,
        /** true = aluno está em turma deste professor (visível na tela de alunos) */
        is_in_scope: s.class_id != null ? myClassIds.has(s.class_id as string) : false,
      };
    }),
  });
}
