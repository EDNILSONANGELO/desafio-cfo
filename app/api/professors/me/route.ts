import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// PATCH /api/professors/me
// Permite ao professor alterar os próprios dados (nome, senha)
// Body: { action: "change_password", currentPassword, newPassword }
//     | { action: "update_name", name }
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  const supabase = createAdminClient();

  if (action === "change_password") {
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    // Busca hash atual
    const { data: prof } = await supabase
      .from("professors")
      .select("password_hash")
      .eq("id", session.id)
      .single();

    if (!prof) {
      return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, prof.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from("professors")
      .update({ password_hash })
      .eq("id", session.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, message: "Senha alterada com sucesso" });
  }

  if (action === "update_name") {
    const { name } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome não pode ser vazio" }, { status: 400 });
    }

    const { error } = await supabase
      .from("professors")
      .update({ name: name.trim() })
      .eq("id", session.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
