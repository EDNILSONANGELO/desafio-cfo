import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

async function requireMaster() {
  const session = await getSession();
  if (!session || session.role !== "teacher" || !session.isMaster) return null;
  return session;
}

// GET /api/master/professors
export async function GET() {
  const session = await requireMaster();
  if (!session) {
    return NextResponse.json({ error: "Acesso restrito ao administrador master" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Tenta buscar com polo + is_master. Fallback progressivo para DBs sem migrations.
  let data: Array<Record<string, unknown>> | null = null;

  // Tentativa 1: com polo e is_master (requer migrations 004 e 005)
  const { data: withBoth, error: e1 } = await supabase
    .from("professors")
    .select("id, email, name, polo, is_master, created_at")
    .order("name", { ascending: true });

  if (!e1) {
    data = withBoth ?? [];
  } else {
    // Tentativa 2: com is_master mas sem polo (requer migration 004)
    const { data: withMaster, error: e2 } = await supabase
      .from("professors")
      .select("id, email, name, is_master, created_at")
      .order("name", { ascending: true });

    if (!e2) {
      data = (withMaster ?? []).map((p) => ({ ...p, polo: null }));
    } else {
      // Tentativa 3: sem nenhuma das colunas adicionais (schema original)
      const { data: minimal, error: e3 } = await supabase
        .from("professors")
        .select("id, email, name, created_at")
        .order("name", { ascending: true });

      if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });
      data = (minimal ?? []).map((p) => ({ ...p, polo: null, is_master: false }));
    }
  }

  // Busca turmas de cada professor
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, professor_id");

  const professorsWithClass = data.map((p) => ({
    ...p,
    classes: (classes ?? []).filter((c) => c.professor_id === p.id),
  }));

  return NextResponse.json({ professors: professorsWithClass });
}

// POST /api/master/professors
export async function POST(req: NextRequest) {
  const session = await requireMaster();
  if (!session) {
    return NextResponse.json({ error: "Acesso restrito ao administrador master" }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, password, polo } = body;

  if (!email || !name || !password) {
    return NextResponse.json({ error: "E-mail, nome e senha são obrigatórios" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("professors")
    .select("id, polo")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    // Professor já existe — mescla os novos polos à lista atual (não recria)
    const currentPolos = (existing.polo as string | null)?.split(",").map((p: string) => p.trim()).filter(Boolean) ?? [];
    const incomingPolos = polo?.split(",").map((p: string) => p.trim()).filter(Boolean) ?? [];
    const mergedPolos = [...new Set([...currentPolos, ...incomingPolos])];
    const mergedPolo = mergedPolos.length > 0 ? mergedPolos.join(", ") : null;

    const { data: updated, error: updateErr } = await supabase
      .from("professors")
      .update({ polo: mergedPolo })
      .eq("id", existing.id)
      .select("id, email, name, polo, is_master, created_at")
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Busca turmas do professor existente
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .eq("professor_id", existing.id);

    return NextResponse.json({
      professor: { ...updated, classes: classes ?? [] },
      merged: true,
      message: `Professor já existia. Polo(s) atualizado(s): ${mergedPolo || "nenhum"}.`,
    }, { status: 200 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const poloValue = polo?.trim() || null;

  // Tenta inserir com polo; se falhar (coluna não existe), insere sem
  const { data, error } = await supabase
    .from("professors")
    .insert({ email, name, password_hash, polo: poloValue, is_master: false })
    .select("id, email, name, polo, is_master, created_at")
    .single();

  if (error) {
    // Fallback sem polo
    const { data: d2, error: e2 } = await supabase
      .from("professors")
      .insert({ email, name, password_hash, is_master: false })
      .select("id, email, name, is_master, created_at")
      .single();

    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    return NextResponse.json({ professor: { ...d2, polo: null } }, { status: 201 });
  }

  return NextResponse.json({ professor: data }, { status: 201 });
}
