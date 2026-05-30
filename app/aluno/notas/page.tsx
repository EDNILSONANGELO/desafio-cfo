import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import NotasAlunoClient from "./NotasAlunoClient";

export default async function NotasAlunoPage() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const supabase = createAdminClient();

  // Busca os resultados do grupo do aluno em todas as rodadas
  const { data: groupResults } = await supabase
    .from("results")
    .select("*, round:rounds(id, name, event_type, processed_at)")
    .eq("group_id", session.groupId || 0)
    .order("round_id", { ascending: true });

  // Busca ajustes de nota do aluno em todas as rodadas
  const { data: adjustments } = await supabase
    .from("grade_adjustments")
    .select("*")
    .eq("student_id", session.id);

  // Busca a escala de notas da turma
  const { data: classData } = await supabase
    .from("classes")
    .select("grade_scale, score_weights")
    .eq("id", session.classId || "")
    .maybeSingle();

  return (
    <NotasAlunoClient
      session={session}
      groupResults={groupResults || []}
      adjustments={adjustments || []}
      gradeScaleRaw={classData?.grade_scale || []}
    />
  );
}
