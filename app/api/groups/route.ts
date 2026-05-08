import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

// Colors cycling for groups
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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  // Prefer explicit class_id param, fallback to session classId
  const classId = searchParams.get("class_id") || session.classId || null;

  const supabase = createAdminClient();
  let query = supabase.from("groups").select("*").order("id");
  if (classId) query = query.eq("class_id", classId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ groups: data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, class_id } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nome do grupo é obrigatório" }, { status: 400 });
  }

  const effectiveClassId = class_id || session.classId;
  if (!effectiveClassId) {
    return NextResponse.json({ error: "Turma não identificada. Configure sua turma primeiro." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Count existing groups in this class to determine next region number
  const { count } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("class_id", effectiveClassId);

  const regionNumber = (count ?? 0) + 1;
  const colorIndex = ((count ?? 0)) % COLORS.length;

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      company_name: name.trim(),
      region_name: `Região ${regionNumber}`,
      region_trait: `Região ${regionNumber} — condições padrão de mercado`,
      region_demand: 1.0,
      region_cost: 1.0,
      color: COLORS[colorIndex],
      class_id: effectiveClassId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ group: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("id");

  if (!groupId) {
    return NextResponse.json({ error: "ID do grupo é obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
