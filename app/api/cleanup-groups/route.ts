import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/cleanup-groups?secret=arena2024
// Remove grupos com nome genérico "Grupo N" que nunca foram configurados.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "arena2024") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Busca grupos cujo company_name === name (nunca renomeados) e que seguem o padrão "Grupo N"
  const { data: groups, error: fetchErr } = await supabase
    .from("groups")
    .select("id, name, company_name");

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const toDelete = (groups || []).filter((g) =>
    /^Grupo\s+\d+$/i.test((g.company_name || g.name || "").trim())
  );

  if (toDelete.length === 0) {
    return NextResponse.json({ message: "Nenhum grupo genérico encontrado.", deleted: [] });
  }

  const ids = toDelete.map((g) => g.id);
  const { error: delErr } = await supabase.from("groups").delete().in("id", ids);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `${ids.length} grupo(s) removido(s).`,
    deleted: toDelete.map((g) => ({ id: g.id, name: g.name })),
  });
}
