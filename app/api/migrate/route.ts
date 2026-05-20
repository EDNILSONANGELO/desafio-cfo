import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const MIGRATION_SQL = `
-- Migration 008: Marketing Insertions + Employee Features
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS marketing_insertion_cost DECIMAL DEFAULT NULL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS machine_min_employees INTEGER DEFAULT NULL;
`.trim();

const SUPABASE_PROJECT_ID = "dfeskrjvhyfhafbwhhmz";

/**
 * GET /api/migrate
 * Shows migration status and SQL to run.
 */
export async function GET() {
  const supabase = createAdminClient();

  // Check if columns exist by trying to select them
  const { error } = await supabase
    .from("rounds")
    .select("marketing_insertion_cost, machine_min_employees")
    .limit(1);

  const columnsExist = !error || !error.message.includes("does not exist");

  return NextResponse.json({
    status: columnsExist ? "up_to_date" : "migration_needed",
    message: columnsExist
      ? "✅ Migration 008 already applied — columns exist."
      : "⚠️  Migration 008 needed — run the SQL below in Supabase.",
    supabase_sql_editor: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`,
    sql: columnsExist ? null : MIGRATION_SQL,
    error: error?.message ?? null,
  });
}

/**
 * POST /api/migrate
 * Attempts to apply the migration (requires exec_sql function in Supabase).
 * Falls back to showing the SQL if the function doesn't exist.
 */
export async function POST() {
  const supabase = createAdminClient();

  // Try using exec_migration helper (may not exist)
  const sql1 = "ALTER TABLE rounds ADD COLUMN IF NOT EXISTS marketing_insertion_cost DECIMAL DEFAULT NULL";
  const sql2 = "ALTER TABLE rounds ADD COLUMN IF NOT EXISTS machine_min_employees INTEGER DEFAULT NULL";

  // Try rpc exec (common helper function name)
  const results = [];
  for (const sql of [sql1, sql2]) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql }).maybeSingle();
      results.push({ sql: sql.substring(0, 70), ok: !error, error: error?.message ?? null });
    } catch {
      results.push({ sql: sql.substring(0, 70), ok: false, error: "exec_sql not found" });
    }
  }

  const allOk = results.every((r) => r.ok);

  return NextResponse.json({
    success: allOk,
    results,
    note: allOk
      ? "Migration applied successfully!"
      : "Auto-migration failed. Run this SQL in Supabase SQL Editor:",
    sql: allOk ? null : `${sql1};\n${sql2};`,
    supabase_sql_editor: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`,
  });
}
