import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

const COLORS = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-500",
  "from-indigo-500 to-violet-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-red-600",
  "from-teal-500 to-cyan-600",
];

async function resolveGroup(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createAdminClient>,
  groupName: string,
  classId: string,
  polo: string | null,
  groupCache: Map<string, number>
): Promise<number> {
  const key = `${polo ?? ""}__${groupName.trim().toLowerCase()}`;
  if (groupCache.has(key)) return groupCache.get(key)!;

  const trimmed = groupName.trim();

  // Verifica se o grupo já existe na turma
  const { data: existing } = await supabase
    .from("groups")
    .select("id")
    .eq("class_id", classId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) {
    groupCache.set(key, existing.id);
    return existing.id;
  }

  // Conta quantos grupos já existem neste polo para definir o número da região
  let regionNumber = 1;
  let colorIndex = 0;

  if (polo) {
    // Busca group_ids de alunos deste polo (já criados antes nesta importação)
    const { data: poloStudents } = await supabase
      .from("students")
      .select("group_id")
      .ilike("polo", `%${polo}%`)
      .not("group_id", "is", null)
      .eq("class_id", classId);

    const poloGroupIds = new Set(
      (poloStudents ?? [])
        .map((s: { group_id: number | null }) => s.group_id)
        .filter((id): id is number => id !== null)
    );

    // Também conta os grupos já criados por esta importação (no groupCache)
    const cachedPoloGroups = new Set(
      [...groupCache.entries()]
        .filter(([k]) => k.startsWith(`${polo}__`))
        .map(([, id]) => id)
    );

    const totalPoloGroups = new Set([...poloGroupIds, ...cachedPoloGroups]);
    regionNumber = totalPoloGroups.size + 1;
    colorIndex = totalPoloGroups.size % COLORS.length;
  } else {
    // Sem polo: sequência global da turma
    const { count } = await supabase
      .from("groups")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId);
    regionNumber = (count ?? 0) + 1;
    colorIndex = (count ?? 0) % COLORS.length;
  }

  const { data: newGroup, error } = await supabase
    .from("groups")
    .insert({
      name: trimmed,
      company_name: trimmed,
      region_name: `Região ${regionNumber}`,
      region_trait: `Região ${regionNumber} — condições padrão de mercado`,
      region_demand: 1.0,
      region_cost: 1.0,
      color: COLORS[colorIndex],
      class_id: classId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Erro ao criar grupo: ${error.message}`);
  groupCache.set(key, newGroup.id);
  return newGroup.id;
}

export interface ImportStudentRow {
  ra: string;
  name: string;
  password: string;
  email?: string;
  semestre?: number | null;
  group_name?: string;
  polo?: string;
  /** Se true, substitui o cadastro existente (nome, polo, email, semestre, grupo) */
  force_replace?: boolean;
}

// Verifica se a coluna polo existe na tabela students
async function poloColumnExists(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createAdminClient>
): Promise<boolean> {
  const { error } = await supabase
    .from("students")
    .select("polo")
    .limit(1);
  return !error || !error.message.includes("polo");
}

// Helper: lista de polos autorizados do professor (null = sem restrição)
function professorAllowedPolos(professorPolo: string | null | undefined): string[] | null {
  if (!professorPolo?.trim()) return null;
  return professorPolo.split(",").map((p) => p.trim()).filter(Boolean);
}

// POST /api/students/import
// Body: { students: ImportStudentRow[] }
// Returns: { imported: number; skipped: number; updated: number; errors: [...] }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const rows: ImportStudentRow[] = body.students || [];

  if (!rows.length) {
    return NextResponse.json({ error: "Nenhum aluno enviado" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Resolve a turma ativa do professor de forma robusta:
  // 1. Tenta usar o classId da sessão, verificando se realmente pertence ao professor
  // 2. Se não, usa a primeira turma válida do professor (evita FK violation)
  const { data: myClasses } = await supabase
    .from("classes")
    .select("id")
    .eq("professor_id", session.id)
    .order("created_at", { ascending: true });

  const myClassIds = (myClasses ?? []).map((c: { id: string }) => c.id);

  if (myClassIds.length === 0) {
    return NextResponse.json({ error: "Nenhuma turma encontrada para este professor. Crie uma turma antes de importar alunos." }, { status: 400 });
  }

  const sessionClassId = session.classId;
  const classId: string =
    sessionClassId && myClassIds.includes(sessionClassId)
      ? sessionClassId
      : myClassIds[0];

  // Verifica se a coluna polo existe antes de começar
  const hasPolo = await poloColumnExists(supabase);
  if (!hasPolo) {
    return NextResponse.json(
      {
        error: "A coluna 'polo' não existe na tabela students. Execute a migration no Supabase SQL Editor:\n\nALTER TABLE students ADD COLUMN IF NOT EXISTS polo VARCHAR(100);\nCREATE INDEX IF NOT EXISTS idx_students_polo ON students(polo);\n\nDepois recarregue o esquema: NOTIFY pgrst, 'reload schema';",
        migration_needed: true,
      },
      { status: 422 }
    );
  }

  // Polos autorizados deste professor
  const allowedPolos = professorAllowedPolos(session.polo);

  const groupCache = new Map<string, number>();
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { ra: string; error: string }[],
  };

  for (const row of rows) {
    try {
      const newPolo = row.polo?.trim() || null;

      // Validação de polo: rejeita alunos fora dos polos autorizados do professor
      if (allowedPolos && newPolo) {
        const isAllowed = allowedPolos.some((p) => p.toLowerCase() === newPolo.toLowerCase());
        if (!isAllowed) {
          results.errors.push({
            ra: row.ra,
            error: `Polo "${newPolo}" não autorizado. Polos permitidos: ${allowedPolos.join(", ")}`,
          });
          results.skipped++;
          continue;
        }
      }

      // Verifica se RA já existe
      const { data: existing } = await supabase
        .from("students")
        .select("id, polo")
        .eq("ra", row.ra)
        .maybeSingle();

      if (existing) {
        if (row.force_replace) {
          // Substituição completa solicitada pelo professor na tela de resolução de conflitos.
          // Também reatribui class_id para a turma ativa do professor, corrigindo registros
          // que estavam em outra turma/professor e por isso não apareciam na tela.
          let group_id: number | null = null;
          if (row.group_name?.trim()) {
            group_id = await resolveGroup(supabase, row.group_name, classId, newPolo, groupCache);
          }
          const password_hash = row.password ? await bcrypt.hash(row.password, 10) : undefined;
          const updatePayload: Record<string, unknown> = {
            name: row.name,
            polo: newPolo,
            email: row.email || null,
            semestre: row.semestre || null,
            group_id,
            class_id: classId, // ← corrige registro em turma errada (órfão / fora do scope)
          };
          if (password_hash) updatePayload.password_hash = password_hash;

          const { error: upErr } = await supabase
            .from("students")
            .update(updatePayload)
            .eq("id", existing.id);

          if (upErr) {
            results.errors.push({ ra: row.ra, error: `Erro ao substituir cadastro: ${upErr.message}` });
          } else {
            results.updated++;
          }
        } else if (newPolo) {
          // Comportamento padrão: atualiza apenas o polo
          const { error: upErr } = await supabase
            .from("students")
            .update({ polo: newPolo })
            .eq("id", existing.id);

          if (upErr) {
            results.errors.push({ ra: row.ra, error: `Erro ao atualizar polo: ${upErr.message}` });
          } else {
            results.updated++;
          }
        } else {
          results.skipped++;
          results.errors.push({ ra: row.ra, error: `RA ${row.ra} já cadastrado (polo não alterado)` });
        }
        continue;
      }

      // Aluno novo — cria com polo
      let group_id: number | null = null;
      if (row.group_name?.trim()) {
        group_id = await resolveGroup(supabase, row.group_name, classId, newPolo, groupCache);
      }

      const password_hash = await bcrypt.hash(row.password || "123456", 10);

      const { error: insertErr } = await supabase.from("students").insert({
        ra: row.ra,
        name: row.name,
        password_hash,
        group_id,
        class_id: classId,
        email: row.email || null,
        semestre: row.semestre || null,
        polo: newPolo,
      });

      if (insertErr) throw new Error(insertErr.message);
      results.imported++;
    } catch (e: unknown) {
      results.errors.push({
        ra: row.ra,
        error: e instanceof Error ? e.message : "Erro desconhecido",
      });
    }
  }

  return NextResponse.json(results, { status: 200 });
}
