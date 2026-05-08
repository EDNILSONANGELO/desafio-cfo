import { NextRequest, NextResponse } from "next/server";

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  professor_id UUID REFERENCES professors(id) ON DELETE CASCADE,
  fixed_expenses DECIMAL,
  transport DECIMAL,
  maintenance DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas se já existir a tabela (upgrade)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS fixed_expenses DECIMAL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS transport DECIMAL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS maintenance DECIMAL;

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  region_name VARCHAR(100) NOT NULL,
  region_trait TEXT,
  region_demand DECIMAL DEFAULT 1.0,
  region_cost DECIMAL DEFAULT 1.0,
  color VARCHAR(100) NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ra VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Não iniciada',
  event_type VARCHAR(100) DEFAULT 'Mercado normal',
  demand_factor DECIMAL DEFAULT 1.0,
  cost_factor DECIMAL DEFAULT 1.0,
  price_min DECIMAL,
  price_max DECIMAL,
  fixed_expenses DECIMAL,
  transport DECIMAL,
  maintenance DECIMAL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

-- Add columns if upgrading existing schema
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS price_min DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS price_max DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS fixed_expenses DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS transport DECIMAL;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS maintenance DECIMAL;

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  decision JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'Rascunho',
  sent_by_ra VARCHAR(20),
  sent_by_name VARCHAR(255),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, group_id)
);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  position INTEGER,
  score DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, group_id)
);

CREATE TABLE IF NOT EXISTS medals (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_identifier VARCHAR(50),
  user_name VARCHAR(255),
  role VARCHAR(50),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_round_group ON submissions(round_id, group_id);
CREATE INDEX IF NOT EXISTS idx_results_round ON results(round_id);
CREATE INDEX IF NOT EXISTS idx_students_ra ON students(ra);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rounds_class ON rounds(class_id);
CREATE INDEX IF NOT EXISTS idx_groups_class ON groups(class_id);
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
`;

const setupHtml = (migrationSql: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DESAFIO CFO – Setup do Banco de Dados</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #e2e8f0; min-height: 100vh; padding: 2rem; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.8rem; font-weight: 700; color: #22d3ee; margin-bottom: 0.5rem; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; font-weight: 600; color: #f1f5f9; margin-bottom: 1rem; }
    .step { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .step:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .step-num { width: 28px; height: 28px; background: #22d3ee; color: #020617; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem; }
    .step-desc { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
    a { color: #22d3ee; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .sql-box { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: 0.75rem; color: #86efac; max-height: 300px; overflow-y: auto; white-space: pre; line-height: 1.6; }
    .copy-btn { background: #22d3ee; color: #020617; border: none; border-radius: 6px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; font-size: 0.85rem; margin-top: 0.75rem; }
    .copy-btn:hover { background: #06b6d4; }
    .seed-btn { background: #10b981; color: white; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-weight: 700; cursor: pointer; font-size: 0.95rem; width: 100%; }
    .seed-btn:hover { background: #059669; }
    .seed-btn:disabled { background: #374151; color: #6b7280; cursor: not-allowed; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-yellow { background: rgba(251,191,36,0.1); color: #fbbf24; }
    .badge-green { background: rgba(16,185,129,0.1); color: #10b981; }
    #status { margin-top: 1rem; padding: 1rem; border-radius: 8px; display: none; font-size: 0.9rem; }
    #status.success { background: rgba(16,185,129,0.1); border: 1px solid #10b981; color: #10b981; }
    #status.error { background: rgba(239,68,68,0.1); border: 1px solid #ef4444; color: #ef4444; }
    #status.loading { background: rgba(34,211,238,0.1); border: 1px solid #22d3ee; color: #22d3ee; }
    .creds-table { width: 100%; border-collapse: collapse; }
    .creds-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
    .creds-table td:first-child { color: #94a3b8; width: 35%; }
    .creds-table td:last-child { font-family: monospace; color: #22d3ee; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏭 DESAFIO CFO – Setup</h1>
    <p class="subtitle">Configure o banco de dados Supabase em 2 etapas</p>

    <div class="card">
      <h2>📋 Etapa 1 – Executar o SQL no Supabase</h2>
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-content">
          <div class="step-title">Abrir o SQL Editor</div>
          <div class="step-desc">
            Acesse o Supabase Dashboard e abra o SQL Editor:<br>
            <a href="https://supabase.com/dashboard/project/dfeskrjvhyfhafbwhhmz/sql/new" target="_blank">
              → https://supabase.com/dashboard/project/dfeskrjvhyfhafbwhhmz/sql/new
            </a>
          </div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-content">
          <div class="step-title">Copiar e colar o SQL abaixo</div>
          <div class="step-desc">Clique em "Copiar SQL", cole no editor e clique em <strong>Run</strong></div>
        </div>
      </div>

      <div class="sql-box" id="sqlBox">${migrationSql.trim()}</div>
      <button class="copy-btn" onclick="copySql()">📋 Copiar SQL</button>
    </div>

    <div class="card">
      <h2>🌱 Etapa 2 – Criar dados de teste</h2>
      <p class="step-desc" style="margin-bottom:1rem;color:#94a3b8;">Após executar o SQL, clique no botão abaixo para criar o professor, turmas, grupos e alunos de teste.</p>

      <button class="seed-btn" id="seedBtn" onclick="runSeed()">
        🚀 Criar Dados Iniciais (Professor + 4 Grupos + 5 Alunos)
      </button>

      <div id="status"></div>
    </div>

    <div class="card" id="credsCard" style="display:none">
      <h2>✅ Sistema pronto! Credenciais de acesso:</h2>
      <table class="creds-table">
        <tr><td>👨‍🏫 Professor</td><td>professor@desafiocfo.com / admin123</td></tr>
        <tr><td>👩‍🎓 Aluno 1</td><td>RA: 1001 / Senha: 123456 (Grupo 1 – Região 1)</td></tr>
        <tr><td>👩‍🎓 Aluno 2</td><td>RA: 1002 / Senha: 123456 (Grupo 1 – Região 1)</td></tr>
        <tr><td>👩‍🎓 Aluno 3</td><td>RA: 2001 / Senha: 123456 (Grupo 2 – Região 2)</td></tr>
        <tr><td>👩‍🎓 Aluno 4</td><td>RA: 3001 / Senha: 123456 (Grupo 3 – Região 3)</td></tr>
        <tr><td>👩‍🎓 Aluno 5</td><td>RA: 4001 / Senha: 123456 (Grupo 4 – Região 4)</td></tr>
      </table>
      <p style="margin-top:1rem;text-align:center;">
        <a href="/login" style="background:#22d3ee;color:#020617;padding:0.75rem 2rem;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block;margin-top:0.5rem;">
          → Ir para o Login
        </a>
      </p>
    </div>
  </div>

  <script>
    function copySql() {
      const sql = document.getElementById('sqlBox').textContent;
      navigator.clipboard.writeText(sql).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = '✅ Copiado!';
        setTimeout(() => btn.textContent = '📋 Copiar SQL', 2000);
      });
    }

    async function runSeed() {
      const btn = document.getElementById('seedBtn');
      const status = document.getElementById('status');

      btn.disabled = true;
      btn.textContent = '⏳ Criando dados...';
      status.className = 'loading';
      status.style.display = 'block';
      status.textContent = 'Conectando ao banco de dados...';

      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const data = await res.json();

        if (res.ok) {
          status.className = 'success';
          status.textContent = '✅ Dados criados com sucesso!';
          btn.textContent = '✅ Concluído!';
          document.getElementById('credsCard').style.display = 'block';
        } else {
          throw new Error(data.error || 'Erro desconhecido');
        }
      } catch (e) {
        status.className = 'error';
        status.style.display = 'block';
        status.textContent = '❌ Erro: ' + e.message + '. Verifique se o SQL foi executado no Supabase primeiro.';
        btn.disabled = false;
        btn.textContent = '🔄 Tentar novamente';
      }
    }
  </script>
</body>
</html>`;

export async function GET(req: NextRequest) {
  // Return setup HTML page
  const html = setupHtml(MIGRATION_SQL);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
