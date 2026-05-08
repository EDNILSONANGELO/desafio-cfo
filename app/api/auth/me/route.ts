import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  return NextResponse.json({
    id: session.id,
    identifier: session.identifier,
    name: session.name,
    role: session.role,
    groupId: session.groupId,
    classId: session.classId,
  });
}
