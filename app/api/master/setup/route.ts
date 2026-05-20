import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

// POST /api/master/setup
// Cria ou atualiza a conta master a partir das variáveis de ambiente.
// Pode ser chamada a qualquer momento — é idempotente.
// Restrito ao usuário Master.
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "teacher" || !session.isMaster) {
    return NextResponse.json(
      { error: "Acesso restrito ao administrador master." },
      { status: 403 }
    );
  }

  const masterEmail    = process.env.MASTER_EMAIL;
  const masterPassword = process.env.MASTER_PASSWORD;
  const masterName     = process.env.MASTER_NAME || "Administrador Master";

  if (!masterEmail || !masterPassword) {
    return NextResponse.json(
      { error: "MASTER_EMAIL e MASTER_PASSWORD não definidos no .env.local" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Garante que a coluna is_master existe (migration idempotente)
  // Nota: em produção, rode a migration 004 antes.

  const password_hash = await bcrypt.hash(masterPassword, 10);

  const { data: existing } = await supabase
    .from("professors")
    .select("id, is_master")
    .eq("email", masterEmail)
    .maybeSingle();

  if (existing) {
    // Atualiza a conta existente para is_master = true e reseta a senha
    await supabase
      .from("professors")
      .update({ is_master: true, password_hash, name: masterName })
      .eq("id", existing.id);

    return NextResponse.json({
      success: true,
      action: "updated",
      message: `Conta master atualizada: ${masterEmail}`,
      credentials: { email: masterEmail, password: masterPassword },
    });
  }

  // Cria nova conta master
  const { data: newProf, error } = await supabase
    .from("professors")
    .insert({
      email: masterEmail,
      name: masterName,
      password_hash,
      is_master: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    action: "created",
    message: `Conta master criada: ${masterEmail}`,
    credentials: { email: masterEmail, password: masterPassword },
    id: newProf.id,
  });
}
