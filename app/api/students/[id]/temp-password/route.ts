import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// Gera senha temporária legível: 4 letras maiúsculas + 4 dígitos
function generateTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem I, O para evitar confusão
  const digits  = "23456789";                  // sem 0, 1 para evitar confusão
  let pw = "";
  for (let i = 0; i < 4; i++) pw += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 4; i++) pw += digits[Math.floor(Math.random() * digits.length)];
  return pw;
}

// POST /api/students/[id]/temp-password
// Professor gera nova senha temporária para um aluno.
// Retorna a senha em texto puro UMA VEZ (nunca armazenada em texto puro).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Verifica que o aluno pertence a uma turma do professor (ou professor é master)
    if (!session.isMaster) {
      const { data: myClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("professor_id", session.id);
      const myClassIds = (myClasses ?? []).map((c: { id: string }) => c.id);

      const { data: student } = await supabase
        .from("students")
        .select("id, class_id")
        .eq("id", id)
        .maybeSingle();

      if (!student || !myClassIds.includes(student.class_id ?? "")) {
        return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
      }
    }

    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    // Passo 1: atualiza a senha (obrigatório)
    const { error } = await supabase
      .from("students")
      .update({ password_hash })
      .eq("id", id);

    if (error) {
      console.error("temp-password update error:", error);
      return NextResponse.json({ error: "Erro ao atualizar a senha. Verifique o banco de dados." }, { status: 500 });
    }

    // Passo 2: marca first_access = true (opcional — a coluna pode não existir se a migration 009 não foi executada)
    await supabase
      .from("students")
      .update({ first_access: true })
      .eq("id", id);
    // ignoramos o erro aqui intencionalmente — não bloqueia a geração da senha

    // Log de auditoria
    await supabase.from("audit_logs").insert({
      user_identifier: session.identifier,
      user_name: session.name,
      role: "teacher",
      action: "generate_temp_password",
      details: { student_id: id },
    });

    return NextResponse.json({ tempPassword });
  } catch (e) {
    console.error("temp-password error:", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
