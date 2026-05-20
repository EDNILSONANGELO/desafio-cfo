import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

async function requireMaster() {
  const session = await getSession();
  if (!session || session.role !== "teacher" || !session.isMaster) {
    return null;
  }
  return session;
}

// PATCH /api/master/professors/[id]
// Ações: { action: "reset_password", newPassword } | { action: "update", name, email }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireMaster();
  if (!session) {
    return NextResponse.json({ error: "Acesso restrito ao administrador master" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const supabase = createAdminClient();

  if (action === "reset_password") {
    const { newPassword } = body;
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    // Master não tem linha no banco — verifica pelo id virtual
    if (id === "master") {
      return NextResponse.json({ error: "Não é possível alterar a senha da conta master por aqui" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from("professors")
      .update({ password_hash })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, message: "Senha redefinida com sucesso" });
  }

  if (action === "update") {
    const { name, email, polo } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
    }

    // Verifica se o novo e-mail já existe em outro professor
    if (email) {
      const { data: existing } = await supabase
        .from("professors")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "Este e-mail já está em uso por outro professor" }, { status: 400 });
      }
    }

    const updates: Record<string, string | null> = {};
    updates.name = name.trim();
    updates.email = email.trim().toLowerCase();
    // polo pode ser null (sem polo) ou string "Polo A, Polo B"
    if (polo !== undefined) updates.polo = polo;

    const { data, error } = await supabase
      .from("professors")
      .update(updates)
      .eq("id", id)
      .select("id, email, name, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ professor: data });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

// DELETE /api/master/professors/[id]
// Remove um professor (não permite remover o próprio master)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireMaster();
  if (!session) {
    return NextResponse.json({ error: "Acesso restrito ao administrador master" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.id) {
    return NextResponse.json({ error: "Não é possível excluir a própria conta master" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Master virtual (id="master") não tem linha no banco; proíbe excluir pelo id
  if (id === "master") {
    return NextResponse.json({ error: "Não é possível excluir a conta master" }, { status: 400 });
  }

  const { error } = await supabase.from("professors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
