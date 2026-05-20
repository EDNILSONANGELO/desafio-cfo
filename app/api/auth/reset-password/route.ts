import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/auth/reset-password
// Body: { student_id: string; code: string; new_password: string }
// Verifica o código e redefine a senha do aluno.
export async function POST(req: NextRequest) {
  try {
    const { student_id, code, new_password } = await req.json();

    if (!student_id || !code || !new_password) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Busca token válido mais recente
    const { data: token } = await supabase
      .from("password_reset_tokens")
      .select("id, code, attempts, used, expires_at")
      .eq("student_id", student_id)
      .eq("used", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!token) {
      return NextResponse.json(
        { error: "Código inválido ou expirado. Solicite um novo código." },
        { status: 400 }
      );
    }

    if (token.attempts >= 5) {
      await supabase
        .from("password_reset_tokens")
        .update({ used: true })
        .eq("id", token.id);
      return NextResponse.json(
        { error: "Número máximo de tentativas atingido. Solicite um novo código." },
        { status: 400 }
      );
    }

    if (token.code !== code.trim()) {
      // Incrementa tentativas
      await supabase
        .from("password_reset_tokens")
        .update({ attempts: token.attempts + 1 })
        .eq("id", token.id);

      const remaining = 4 - token.attempts;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Código incorreto. ${remaining} tentativa(s) restante(s).`
              : "Código incorreto. Limite de tentativas atingido.",
        },
        { status: 400 }
      );
    }

    // Código correto — redefine senha
    const password_hash = await bcrypt.hash(new_password, 10);

    const { error: updateErr } = await supabase
      .from("students")
      .update({ password_hash, first_access: false })
      .eq("id", student_id);

    if (updateErr) {
      return NextResponse.json({ error: "Erro ao salvar a nova senha." }, { status: 500 });
    }

    // Invalida o token usado
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", token.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
