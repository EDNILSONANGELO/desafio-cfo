import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, signJWT, setSessionCookie } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/auth/change-password
// Requer sessão de aluno. Troca a senha e limpa o flag first_access no JWT.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { new_password, confirm_password } = await req.json();

    if (!new_password || new_password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    if (new_password !== confirm_password) {
      return NextResponse.json(
        { error: "As senhas não coincidem." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const password_hash = await bcrypt.hash(new_password, 10);

    const { error } = await supabase
      .from("students")
      .update({ password_hash, first_access: false })
      .eq("id", session.id);

    if (error) {
      return NextResponse.json({ error: "Erro ao salvar a nova senha." }, { status: 500 });
    }

    // Re-assina o JWT sem o flag firstAccess para liberar acesso
    const newToken = await signJWT({
      id: session.id,
      identifier: session.identifier,
      name: session.name,
      role: "student",
      groupId: session.groupId,
      classId: session.classId,
      firstAccess: false,
    });

    const response = NextResponse.json({ success: true });
    return setSessionCookie(response, newToken);
  } catch (e) {
    console.error("change-password error:", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
