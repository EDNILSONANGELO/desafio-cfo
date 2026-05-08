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
  classId: string
): Promise<number> {
  const trimmed = groupName.trim();

  const { data: existing } = await supabase
    .from("groups")
    .select("id")
    .eq("class_id", classId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return existing.id;

  const { count } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);

  const regionNumber = (count ?? 0) + 1;
  const colorIndex = (count ?? 0) % COLORS.length;

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
  return newGroup.id;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, group_name, email, password } = body;

  const supabase = createAdminClient();

  // Resolve group by name if provided
  let group_id: number | null | undefined = undefined;
  if (group_name !== undefined) {
    if (group_name?.trim()) {
      const classId = session.classId;
      if (!classId) {
        return NextResponse.json({ error: "Turma não identificada" }, { status: 400 });
      }
      try {
        group_id = await resolveGroup(supabase, group_name, classId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro ao resolver grupo";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    } else {
      group_id = null; // clear group if empty string sent
    }
  }

  const updates: Record<string, unknown> = { name, email: email || null };
  if (group_id !== undefined) updates.group_id = group_id;
  if (password) updates.password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", id)
    .select("*, group:groups(id, name, company_name, region_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ student: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
