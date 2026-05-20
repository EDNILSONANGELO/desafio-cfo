#!/usr/bin/env node
/**
 * ARENA CONTÁBIL – Script de Migração do Banco de Dados
 *
 * Este script cria todas as tabelas necessárias no Supabase.
 *
 * COMO USAR:
 * 1. Abra o Supabase Dashboard: https://supabase.com/dashboard/project/dfeskrjvhyfhafbwhhmz/settings/database
 * 2. Copie a "Connection string" no formato URI
 * 3. Adicione no .env.local: DATABASE_URL=postgresql://postgres:[SENHA]@...
 * 4. Execute: node scripts/migrate.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Tenta carregar DATABASE_URL do .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !key.startsWith('#')) {
      const value = rest.join('=').trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(`
❌ DATABASE_URL não encontrado!

Para configurar:
1. Acesse: https://supabase.com/dashboard/project/dfeskrjvhyfhafbwhhmz/settings/database
2. Copie a "Connection string" (URI format)
3. Adicione no arquivo .env.local:
   DATABASE_URL=postgresql://postgres.dfeskrjvhyfhafbwhhmz:[SUA_SENHA]@aws-0-REGIAO.pooler.supabase.com:6543/postgres

Depois execute novamente: node scripts/migrate.js
  `);
  process.exit(1);
}

const SQL = `
-- ============================================================
-- ARENA CONTÁBIL – Simulador Empresarial Contábil
-- Migration: 001_initial_schema
-- ============================================================

-- Professores
CREATE TABLE IF NOT EXISTS professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turmas
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  professor_id UUID REFERENCES professors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grupos / Empresas
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

-- Alunos (login por RA)
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

-- Rodadas
CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Não iniciada',
  event_type VARCHAR(100) DEFAULT 'Mercado normal',
  demand_factor DECIMAL DEFAULT 1.0,
  cost_factor DECIMAL DEFAULT 1.0,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

-- Submissões (uma por grupo por rodada)
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

-- Resultados processados
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

-- Medalhas e gamificação
CREATE TABLE IF NOT EXISTS medals (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_identifier VARCHAR(50),
  user_name VARCHAR(255),
  role VARCHAR(50),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_submissions_round_group ON submissions(round_id, group_id);
CREATE INDEX IF NOT EXISTS idx_results_round ON results(round_id);
CREATE INDEX IF NOT EXISTS idx_students_ra ON students(ra);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rounds_class ON rounds(class_id);
CREATE INDEX IF NOT EXISTS idx_groups_class ON groups(class_id);
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
`;

async function migrate() {
  console.log('🔌 Conectando ao banco de dados...');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    const tables = [
      'professors', 'classes', 'groups', 'students',
      'rounds', 'submissions', 'results', 'medals', 'audit_logs'
    ];

    console.log('📊 Criando tabelas...');
    await client.query(SQL);

    for (const table of tables) {
      const res = await client.query(
        `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const exists = res.rows[0].count === '1';
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\nPróximo passo: Execute o seed para criar dados de teste:');
    console.log('  npm run dev');
    console.log('  Depois acesse: http://localhost:3000/api/seed (método POST)');
    console.log('\nOu use: node scripts/seed.js (após adicionar DATABASE_URL no .env.local)');

  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
