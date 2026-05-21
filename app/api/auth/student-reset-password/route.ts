import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/auth/student-reset-password
// Body: { ra: string; newPassword: string }
// Verifica se o RA existe e atualiza a senha diretamente — sem e-mail, sem código.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ra: string = (body.ra ?? "").trim();
    const newPassword: string = body.newPassword ?? "";

    // Validações básicas
    if (!ra) {
      return NextResponse.json({ error: "Informe o RA." }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verifica se o aluno existe
    const { data: student, error: fetchErr } = await supabase
      .from("students")
      .select("id")
      .eq("ra", ra)
      .maybeSingle();

    if (fetchErr) {
      console.error("student-reset-password fetch error:", fetchErr.message);
      return NextResponse.json(
        { error: "Erro ao verificar o RA. Tente novamente." },
        { status: 500 }
      );
    }

    if (!student) {
      return NextResponse.json(
        { error: "RA não encontrado. Verifique o número informado." },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha
    const { error: updateErr } = await supabase
      .from("students")
      .update({ password_hash: passwordHash })
      .eq("id", student.id);

    if (updateErr) {
      console.error("student-reset-password update error:", updateErr.message);
      return NextResponse.json(
        { error: "Erro ao salvar a nova senha. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("student-reset-password error:", e);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}
