import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/auth/forgot-password
// Body: { ra: string; email: string }
// Sempre retorna { success: true } por segurança — não expõe se RA/e-mail existem.
// Em modo dev, retorna { code, student_id } para facilitar testes.
export async function POST(req: NextRequest) {
  try {
    const { ra, email } = await req.json();

    if (!ra?.trim() || !email?.trim()) {
      return NextResponse.json({ success: true }); // silêncio por segurança
    }

    const supabase = createAdminClient();

    // Busca aluno pelo RA + e-mail (case-insensitive)
    const { data: student } = await supabase
      .from("students")
      .select("id, email, ra")
      .eq("ra", ra.trim())
      .ilike("email", email.trim())
      .maybeSingle();

    if (!student || !student.email) {
      // Não revela se o aluno existe ou não
      return NextResponse.json({ success: true });
    }

    // Invalida tokens anteriores do aluno (evita acúmulo)
    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("student_id", student.id)
      .eq("used", false);

    // Gera código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const { error: insertErr } = await supabase
      .from("password_reset_tokens")
      .insert({
        student_id: student.id,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertErr) {
      console.error("Erro ao criar token de recuperação:", insertErr.message);
      return NextResponse.json({ success: true }); // silêncio
    }

    // Em produção: enviar e-mail aqui com o código
    // TODO: integração com Resend / SendGrid / Nodemailer

    // Em desenvolvimento: retorna o código para facilitar testes
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      success: true,
      ...(isDev && { _dev_code: code, _dev_student_id: student.id }),
    });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ success: true }); // silêncio em erros
  }
}
