import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import StudentDashboardClient from "./StudentDashboardClient";

export default async function StudentPage() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const supabase = createAdminClient();

  // Load student with group and class
  const { data: student } = await supabase
    .from("students")
    .select("*, group:groups(*), class:classes(*)")
    .eq("id", session.id)
    .single();

  // Load rounds for the class
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("class_id", session.classId || student?.class_id || "")
    .order("id", { ascending: false });

  // Load latest result
  const { data: latestResult } = await supabase
    .from("results")
    .select("*")
    .eq("group_id", session.groupId || 0)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <StudentDashboardClient
      student={student}
      session={session}
      rounds={rounds || []}
      latestResult={latestResult}
    />
  );
}
