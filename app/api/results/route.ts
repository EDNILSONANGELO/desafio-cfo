import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roundId = searchParams.get("round_id");
  const classId = searchParams.get("class_id");

  const supabase = createAdminClient();

  let query = supabase
    .from("results")
    .select("*, group:groups(id, name, company_name, region_name, color)")
    .order("position");

  if (roundId) query = query.eq("round_id", roundId);
  if (classId) {
    // join via rounds
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id")
      .eq("class_id", classId);

    if (rounds?.length) {
      const roundIds = rounds.map((r) => r.id);
      query = query.in("round_id", roundIds);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ results: data });
}
