import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// GET /api/me — returns session payload (id, name, role, classId, groupId)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  return NextResponse.json({
    id: session.id,
    name: session.name,
    identifier: session.identifier,
    role: session.role,
    classId: session.classId ?? null,
    groupId: session.groupId ?? null,
  });
}
