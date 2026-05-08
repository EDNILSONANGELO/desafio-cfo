-- ============================================================
-- DESAFIO CFO – Simulador Empresarial Contábil
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
