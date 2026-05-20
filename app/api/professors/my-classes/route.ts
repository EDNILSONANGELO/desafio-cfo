import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/professors/my-classes
// Retorna todas as turmas do professor logado com polo (para switcher e filtros)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher" || session.isMaster) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Tenta buscar com polo (requer migration 006). Fallback sem polo.
  const { data: withPolo, error: e1 } = await supabase
    .from("classes")
    .select("id, name, polo, created_at")
    .eq("professor_id", session.id)
    .order("created_at", { ascending: true });

  let classes;
  if (e1) {
    // coluna polo não existe ainda — busca sem ela
    const { data: basic, error: e2 } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .eq("professor_id", session.id)
      .order("created_at", { ascending: true });

    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    classes = (basic ?? []).map((c) => ({ ...c, polo: null }));
  } else {
    classes = withPolo ?? [];
  }

  return NextResponse.json({
    classes,
    activeClassId: session.classId ?? null,
    professorPolo: session.polo ?? null, // polos do professor (string separada por vírgula)
  });
}
