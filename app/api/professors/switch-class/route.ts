import { NextRequest, NextResponse } from "next/server";
import { getSession, signJWT, setSessionCookie } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/professors/switch-class
// Troca a turma ativa na sessão sem precisar fazer logout
// Body: { classId: string }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher" || session.isMaster) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { classId } = await req.json();
  if (!classId) {
    return NextResponse.json({ error: "classId é obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verifica que a turma pertence a este professor
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .eq("professor_id", session.id)
    .maybeSingle();

  if (!cls) {
    return NextResponse.json({ error: "Turma não encontrada ou não pertence a você" }, { status: 403 });
  }

  // Re-emite o JWT com o novo classId
  const token = await signJWT({
    ...session,
    classId,
  });

  const response = NextResponse.json({
    success: true,
    activeClass: { id: cls.id, name: cls.name },
  });

  return setSessionCookie(response, token);
}
