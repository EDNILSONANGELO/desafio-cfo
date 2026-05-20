import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signJWT, setSessionCookie } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, email, password, ra } = body;

    // ── Master login — autentica direto pelas variáveis de ambiente ─────────────
    // Não precisa de migration nem de coluna is_master no banco.
    if (role === "master") {
      const masterEmail    = process.env.MASTER_EMAIL;
      const masterPassword = process.env.MASTER_PASSWORD;
      const masterName     = process.env.MASTER_NAME || "Administrador Master";

      if (!masterEmail || !masterPassword) {
        return NextResponse.json(
          { error: "Conta master não configurada. Defina MASTER_EMAIL e MASTER_PASSWORD no .env.local" },
          { status: 500 }
        );
      }

      const emailMatch    = email?.trim().toLowerCase() === masterEmail.trim().toLowerCase();
      const passwordMatch = password === masterPassword;

      if (!emailMatch || !passwordMatch) {
        return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
      }

      const token = await signJWT({
        id: "master",
        identifier: masterEmail,
        name: masterName,
        role: "teacher",
        isMaster: true,
      });

      const response = NextResponse.json({
        success: true,
        user: { id: "master", name: masterName, role: "teacher", isMaster: true },
      });

      return setSessionCookie(response, token);
    }

    const supabase = createAdminClient();

    if (role === "teacher") {
      // Professor login
      const { data: professor, error } = await supabase
        .from("professors")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !professor) {
        return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, professor.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
      }

      // Fetch professor's first class so classId is available in session
      const { data: profClass } = await supabase
        .from("classes")
        .select("id")
        .eq("professor_id", professor.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const token = await signJWT({
        id: professor.id,
        identifier: professor.email,
        name: professor.name,
        role: "teacher",
        classId: profClass?.id ?? undefined,
        isMaster: false,
        polo: professor.polo ?? undefined,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: professor.id,
          name: professor.name,
          role: "teacher",
          classId: profClass?.id ?? null,
          isMaster: false,
          polo: professor.polo ?? null,
        },
      });

      return setSessionCookie(response, token);
    } else {
      // Student login by RA
      const { data: student, error } = await supabase
        .from("students")
        .select("*, group:groups(*), class:classes(*)")
        .eq("ra", ra)
        .single();

      if (error || !student) {
        return NextResponse.json({ error: "RA ou senha inválidos" }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, student.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "RA ou senha inválidos" }, { status: 401 });
      }

      const token = await signJWT({
        id: student.id,
        identifier: student.ra,
        name: student.name,
        role: "student",
        groupId: student.group_id,
        classId: student.class_id,
        firstAccess: student.first_access === true,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: student.id,
          name: student.name,
          ra: student.ra,
          role: "student",
          groupId: student.group_id,
          classId: student.class_id,
          group: student.group,
          class: student.class,
          firstAccess: student.first_access === true,
        },
      });

      // Audit log
      await supabase.from("audit_logs").insert({
        user_identifier: student.ra,
        user_name: student.name,
        role: "student",
        action: "login",
        details: { ra: student.ra },
      });

      return setSessionCookie(response, token);
    }
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
