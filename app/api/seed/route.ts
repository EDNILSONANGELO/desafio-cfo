import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

// POST /api/seed — creates default professor, class, groups, and test students
// Restrito ao usuário Master.
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "teacher" || !session.isMaster) {
    return NextResponse.json(
      { error: "Acesso restrito ao administrador master." },
      { status: 403 }
    );
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed não disponível em produção" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    // 0. Check if tables exist first
    const { error: tableCheck } = await supabase.from("professors").select("id").limit(1);
    if (tableCheck) {
      return NextResponse.json(
        {
          error: `Tabelas não encontradas no banco. Execute o SQL de migração primeiro no Supabase SQL Editor: https://supabase.com/dashboard/project/dfeskrjvhyfhafbwhhmz/sql/new\n\nDetalhe: ${tableCheck.message}`,
          hint: "Execute o SQL em: https://supabase.com/dashboard/project/dfeskrjvhyfhafbwhhmz/sql/new",
        },
        { status: 500 }
      );
    }

    // 1. Create professor
    const profEmail = process.env.PROFESSOR_DEFAULT_EMAIL || "professor@arenacontabil.com";
    const profPassword = process.env.PROFESSOR_DEFAULT_PASSWORD || "admin123";
    const profHash = await bcrypt.hash(profPassword, 10);

    const { data: existingProf } = await supabase
      .from("professors")
      .select("id")
      .eq("email", profEmail)
      .maybeSingle();

    let professorId: string;

    if (existingProf) {
      professorId = existingProf.id;
    } else {
      const { data: prof, error: profError } = await supabase
        .from("professors")
        .insert({ email: profEmail, name: "Prof. Administrador", password_hash: profHash })
        .select()
        .single();
      if (profError) return NextResponse.json({ error: "Erro ao criar professor: " + profError.message }, { status: 500 });
      professorId = prof.id;
    }

    // 2. Create class
    const { data: existingClass } = await supabase
      .from("classes")
      .select("id")
      .eq("professor_id", professorId)
      .maybeSingle();

    let classId: string;

    if (existingClass) {
      classId = existingClass.id;
    } else {
      const { data: cls, error: clsError } = await supabase
        .from("classes")
        .insert({ name: "Ciências Contábeis 2026/1", professor_id: professorId })
        .select()
        .single();
      if (clsError) return NextResponse.json({ error: "Erro ao criar turma: " + clsError.message }, { status: 500 });
      classId = cls.id;
    }

    // 3. Create groups
    const { data: existingGroups } = await supabase
      .from("groups")
      .select("id")
      .eq("class_id", classId);

    let groupIds: number[] = [];

    if (!existingGroups?.length) {
      const colors = [
        "from-emerald-500 to-teal-600",
        "from-sky-500 to-blue-600",
        "from-violet-500 to-purple-600",
        "from-amber-500 to-orange-600",
      ];
      const groupInserts = Array.from({ length: 4 }, (_, i) => ({
        name: `Grupo ${i + 1}`,
        company_name: `Grupo ${i + 1}`,
        region_name: `Região ${i + 1}`,
        region_trait: `Região ${i + 1} — condições padrão de mercado`,
        region_demand: 1.0,
        region_cost: 1.0,
        color: colors[i],
        class_id: classId,
      }));
      const { data: groups, error: groupError } = await supabase.from("groups").insert(groupInserts).select("id");
      if (groupError) return NextResponse.json({ error: "Erro ao criar grupos: " + groupError.message }, { status: 500 });
      groupIds = groups?.map((g) => g.id) || [];
    } else {
      groupIds = existingGroups.map((g) => g.id);
    }

    // 4. Create test students
    const testStudents = [
      { ra: "1001", name: "Maria Eduarda", groupIdx: 0 },
      { ra: "1002", name: "João Pedro",    groupIdx: 0 },
      { ra: "2001", name: "Ana Clara",     groupIdx: 1 },
      { ra: "3001", name: "Lucas Gabriel", groupIdx: 2 },
      { ra: "4001", name: "Beatriz Santos",groupIdx: 3 },
    ];

    const studentPassword = "123456";
    const studentHash = await bcrypt.hash(studentPassword, 10);

    for (const s of testStudents) {
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("ra", s.ra)
        .maybeSingle();

      if (!existing) {
        const { error: stErr } = await supabase.from("students").insert({
          ra: s.ra,
          name: s.name,
          password_hash: studentHash,
          group_id: groupIds[s.groupIdx] || null,
          class_id: classId,
        });
        if (stErr) console.warn(`Aviso ao criar aluno ${s.ra}:`, stErr.message);
      }
    }

    // 5. Create initial round
    const { data: existingRound } = await supabase
      .from("rounds")
      .select("id")
      .eq("class_id", classId)
      .maybeSingle();

    if (!existingRound) {
      const { error: roundErr } = await supabase.from("rounds").insert({
        name: "Rodada 1",
        class_id: classId,
        status: "Aberta",
        event_type: "Mercado normal",
        opened_at: new Date().toISOString(),
      });
      if (roundErr) console.warn("Aviso ao criar rodada:", roundErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Dados iniciais criados com sucesso",
      credentials: {
        professor: { email: profEmail, password: profPassword },
        students: testStudents.map((s) => ({ ra: s.ra, password: studentPassword })),
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SEED ERROR]", message);
    return NextResponse.json(
      { error: "Erro interno no seed: " + message },
      { status: 500 }
    );
  }
}
