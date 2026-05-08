import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import ResultadosClient from "./ResultadosClient";
import type { StoredResult } from "@/types";

export default async function ResultadosPage() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const supabase = createAdminClient();

  // Get all results for this group
  const { data: groupResults } = await supabase
    .from("results")
    .select("*, round:rounds(id, name, event_type, processed_at)")
    .eq("group_id", session.groupId || 0)
    .order("created_at", { ascending: false });

  // Get latest round's full ranking (all groups)
  let fullRanking: StoredResult[] = [];
  if (groupResults?.length) {
    const latestRoundId = groupResults[0].round_id;
    const { data: allResults } = await supabase
      .from("results")
      .select("*, group:groups(id, name, company_name, region_name)")
      .eq("round_id", latestRoundId)
      .order("position");
    fullRanking = allResults || [];
  }

  // Get medals for this group
  const { data: medals } = await supabase
    .from("medals")
    .select("*")
    .eq("group_id", session.groupId || 0)
    .order("created_at", { ascending: false });

  return (
    <ResultadosClient
      groupResults={groupResults || []}
      fullRanking={fullRanking}
      medals={medals || []}
      session={session}
    />
  );
}
